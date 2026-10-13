/* ------------------------------------------------------------------
   Demand Intelligence — SKU(옵션) 신호 판독.
   판매량 하나가 아니라 조회·찜·장바구니·구매전환·반품의 '조합'을 읽어
   운영자가 "왜 이 SKU를 지금 봐야 하는가"를 한 문장으로 이해하게 만든다.

   규칙 기반(설명 가능한 임계값). 숫자는 모두 코드가 계산하고, 임계값은
   THRESHOLDS 한 곳에서만 바꾼다. 금액 영향은 '추정'이며 가정을 함께 돌려준다.
------------------------------------------------------------------- */
import type { ActionType, InventoryStatus, Variant } from "../types";
import { BRAND_BY_ID, PRODUCT_BY_ID, variantsOf } from "../demo/seed";
import { dailySales, daysOfStock, effPrice, effVariant, inventoryStatus } from "../kpi";
import { safeDiv } from "../format";

type Delta = Parameters<typeof effVariant>[1];

export const THRESHOLDS = {
  /** 조회 증가로 본다 */
  viewsUp: 0.25,
  /** 찜·장바구니 증가로 본다 */
  intentUp: 0.3,
  /** 구매전환 하락으로 본다 (직전 7일 대비) */
  conversionDown: -0.25,
  /** 관심 식음 */
  viewsDown: -0.2,
  /** 증감률을 믿을 최소 물량 — 이보다 적으면 % 변화는 우연으로 본다 */
  minViews: 30,
  minIntent: 6,
  /** 반품 패턴으로 볼 최소 건수·반품률·사이즈/핏 사유 비중 */
  minReturns: 2,
  returnRate: 0.15,
  fitShare: 0.6,
  /** 장바구니 이탈: 담긴 수 대비 구매 비율 */
  minCart: 8,
  cartToOrder: 0.25,
  /** 과잉: 남은 판매일 */
  overstockDays: 45,
  /** 반품 1건 처리비(왕복 배송·검수) — 가정값 */
  returnCostKrw: 7_000,
} as const;

export interface Trend {
  now: number;
  prev: number;
  /** (now − prev) / max(1, prev) */
  delta: number;
}
const trend = (now: number, prev: number): Trend => ({ now, prev, delta: safeDiv(now - prev, Math.max(1, prev)) });

export interface SkuSignals {
  variant: Variant;
  views: Trend;
  wishlist: Trend;
  cart: Trend;
  sales: Trend;
  /** 조회 대비 구매 (7일) */
  conversion: Trend;
  /** 장바구니 대비 구매 (7일) */
  cartToOrder: number;
  returnRate: number;
  fitReturnShare: number;
  coverDays: number;
  leadTimeDays: number;
  status: InventoryStatus;
  price: number;
  cost: number;
  /** 같은 색의 다른 사이즈 중 품절인데 재입고 신청이 쌓인 사이즈 — 대체 사이즈 관심의 원인 */
  siblingSoldout: string[];
}

export function skuSignals(v0: Variant, d: Delta): SkuSignals {
  const v = effVariant(v0, d);
  const p = PRODUCT_BY_ID[v.productId];
  const conversionNow = safeDiv(v.sales7d, Math.max(1, v.views7d));
  const conversionPrev = safeDiv(v.salesPrev7d, Math.max(1, v.viewsPrev7d));
  return {
    variant: v,
    views: trend(v.views7d, v.viewsPrev7d),
    wishlist: trend(v.wishlist7d, v.wishlistPrev7d),
    cart: trend(v.cart7d, v.cartPrev7d),
    sales: trend(v.sales7d, v.salesPrev7d),
    conversion: {
      now: conversionNow,
      prev: conversionPrev,
      delta: safeDiv(conversionNow - conversionPrev, conversionPrev || 1),
    },
    cartToOrder: safeDiv(v.sales7d, Math.max(1, v.cart7d)),
    returnRate: safeDiv(v.returns30d, Math.max(1, v.sales30d)),
    fitReturnShare: safeDiv(v.fitReturns30d, Math.max(1, v.returns30d)),
    coverDays: daysOfStock(v),
    leadTimeDays: BRAND_BY_ID[p.brandId].leadTimeDays,
    status: inventoryStatus(v, d),
    price: effPrice(p, d),
    cost: p.cost,
    siblingSoldout: variantsOf(v.productId)
      .filter((x) => x.color === v.color && x.id !== v.id)
      .map((x) => effVariant(x, d))
      .filter((x) => x.stock <= 0 && x.restockRequests >= 3)
      .map((x) => x.size),
  };
}

export type PatternCode =
  | "surge-shortage"
  | "interest-no-conversion"
  | "sold-but-returned"
  | "cart-abandon"
  | "cooling-overstock"
  | "steady"
  | "quiet";

export interface Pattern {
  code: PatternCode;
  /** 운영자용 한 줄 이름 */
  label: string;
  /** 왜 이 SKU를 봐야 하는가 — 숫자가 들어간 한 문장 */
  why: string;
  /** 추천 과제 유형 (없으면 관찰만) */
  action: ActionType | null;
  actionLabel: string;
  /** 0~100 — 신호 강도 × 금액 영향 */
  severity: number;
  /** 금액 영향 추정(원) — 놓치는 매출·묶인 재고·반품 비용 */
  impactKrw: number;
  impactLabel: string;
  /** 신호 칩: 화면에 ↑↓로 표시 */
  chips: SignalChip[];
}

export interface SignalChip {
  key: "views" | "wishlist" | "cart" | "conversion" | "returns" | "stock";
  label: string;
  dir: "up" | "down" | "flat";
  /** 이 방향이 운영상 좋은 신호인가 */
  good: boolean;
  text: string;
}

const pctText = (x: number) => `${x >= 0 ? "+" : "−"}${Math.round(Math.abs(x) * 100)}%`;
const dir = (x: number, eps = 0.1): SignalChip["dir"] => (x > eps ? "up" : x < -eps ? "down" : "flat");

function chips(s: SkuSignals): SignalChip[] {
  return [
    { key: "views", label: "조회", dir: dir(s.views.delta), good: s.views.delta >= 0, text: pctText(s.views.delta) },
    {
      key: "wishlist",
      label: "찜",
      dir: dir(s.wishlist.delta),
      good: s.wishlist.delta >= 0,
      text: pctText(s.wishlist.delta),
    },
    { key: "cart", label: "장바구니", dir: dir(s.cart.delta), good: s.cart.delta >= 0, text: pctText(s.cart.delta) },
    {
      key: "conversion",
      label: "구매전환",
      dir: dir(s.conversion.delta),
      good: s.conversion.delta >= 0,
      text: `${(s.conversion.now * 100).toFixed(1)}%`,
    },
    {
      key: "returns",
      label: "반품",
      dir: s.returnRate >= THRESHOLDS.returnRate ? "up" : "flat",
      good: s.returnRate < THRESHOLDS.returnRate,
      text: `${Math.round(s.returnRate * 100)}%`,
    },
    {
      key: "stock",
      label: "재고",
      dir:
        s.variant.stock <= 0 || s.coverDays <= s.leadTimeDays
          ? "down"
          : s.coverDays >= THRESHOLDS.overstockDays
            ? "up"
            : "flat",
      good: s.variant.stock > 0 && s.coverDays > s.leadTimeDays && s.coverDays < THRESHOLDS.overstockDays,
      text: s.variant.stock <= 0 ? "품절" : `${s.coverDays}일분`,
    },
  ];
}

const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const krwShort = (n: number) =>
  n >= 10_000 ? `${Math.round(n / 10_000).toLocaleString("ko-KR")}만 원` : `${Math.round(n).toLocaleString("ko-KR")}원`;

/**
 * 신호 조합을 하나의 패턴으로 판독한다. 위에서부터 먼저 맞는 규칙이 이긴다
 * (재고가 비는 문제 → 반품 문제 → 전환 문제 → 이탈 → 과잉 순으로 손실이 크다고 본다).
 */
export function classify(s: SkuSignals): Pattern {
  const T = THRESHOLDS;
  const v = s.variant;
  const daily = dailySales(v);
  const viewsUp = s.views.delta >= T.viewsUp && v.views7d >= T.minViews;
  const intentUp =
    (s.wishlist.delta >= T.intentUp && v.wishlist7d >= T.minIntent) ||
    (s.cart.delta >= T.intentUp && v.cart7d >= T.minIntent);
  const shortage = v.stock <= 0 || s.coverDays <= s.leadTimeDays;
  const c = chips(s);

  // 1) 수요는 오르는데 리드타임 안에 재고가 바닥난다
  if (shortage && (viewsUp || intentUp || v.restockRequests >= 5)) {
    const lostDays = Math.max(0, s.leadTimeDays - s.coverDays);
    const lost = Math.round(lostDays * daily * (1 + Math.max(0, s.views.delta) * 0.5)) + v.restockRequests;
    const impact = lost * s.price;
    // 실제로 오른 신호만 문장에 넣는다 (내려간 지표를 '급등' 근거로 쓰지 않게)
    const rising = [
      viewsUp && `조회 ${pctText(s.views.delta)}`,
      s.wishlist.delta >= T.intentUp && v.wishlist7d >= T.minIntent && `찜 ${pctText(s.wishlist.delta)}`,
      s.cart.delta >= T.intentUp && v.cart7d >= T.minIntent && `장바구니 ${pctText(s.cart.delta)}`,
      v.restockRequests >= 5 && `재입고 신청 ${v.restockRequests}건`,
    ].filter(Boolean);
    const lead = `${rising.join("·")}인데`;
    return {
      code: "surge-shortage",
      label: "수요 급등 · 재고 부족",
      why:
        v.stock <= 0
          ? `${lead} 이미 품절 — 입고까지 ${s.leadTimeDays}일, 그동안 들어오는 수요를 놓칩니다.`
          : `${lead} 재고는 ${s.coverDays}일분 — 입고 리드타임 ${s.leadTimeDays}일보다 먼저 품절됩니다.`,
      action: "restock",
      actionLabel: "긴급 재입고",
      severity: clamp(55 + s.views.delta * 40 + v.restockRequests * 1.5 + (v.stock <= 0 ? 15 : 0)),
      impactKrw: impact,
      impactLabel: `놓칠 매출 약 ${krwShort(impact)}`,
      chips: c,
    };
  }
  // 2) 팔리지만 사이즈·핏 이유로 돌아온다
  if (v.returns30d >= T.minReturns && s.returnRate >= T.returnRate && s.fitReturnShare >= T.fitShare) {
    const impact = v.fitReturns30d * (T.returnCostKrw + s.price * 0.08);
    return {
      code: "sold-but-returned",
      label: "팔리지만 돌아옴 · 핏 문제",
      why: `30일 판매 ${v.sales30d}개 중 ${v.returns30d}개 반품(${Math.round(s.returnRate * 100)}%) — 이 중 ${Math.round(s.fitReturnShare * 100)}%가 사이즈·핏 사유입니다.`,
      action: "fit-guide",
      actionLabel: "핏 안내 개선",
      severity: clamp(45 + s.returnRate * 120 + v.fitReturns30d * 2),
      impactKrw: impact,
      impactLabel: `반품 비용·손실 약 ${krwShort(impact)}/30일`,
      chips: c,
    };
  }
  // 3) 관심은 오르는데 사지 않는다
  if (viewsUp && intentUp && s.conversion.delta <= T.conversionDown) {
    const lostUnits = Math.max(1, Math.round(s.views.now * s.conversion.prev - v.sales7d));
    const impact = lostUnits * s.price;
    // 같은 색의 인기 사이즈가 품절이면, 이 사이즈의 관심은 '대체 탐색'이다 — 해결책은 이 옵션이 아니라 품절 사이즈 재입고
    const substitute = v.stock > 0 && s.siblingSoldout.length > 0;
    return {
      code: "interest-no-conversion",
      label: "관심 ↑ · 구매 ↓",
      why:
        v.stock <= 0
          ? `조회 ${pctText(s.views.delta)}·장바구니 ${pctText(s.cart.delta)}인데 이 옵션이 품절이라 살 수 없습니다 — 구매전환 ${pctText(s.conversion.delta)}.`
          : substitute
            ? `같은 색 ${s.siblingSoldout.join("·")} 품절로 넘어온 관심 — 조회 ${pctText(s.views.delta)}·장바구니 ${pctText(s.cart.delta)}인데 구매전환 ${pctText(s.conversion.delta)}. 대체 사이즈로는 팔리지 않습니다.`
            : `조회 ${pctText(s.views.delta)}·장바구니 ${pctText(s.cart.delta)}인데 구매전환은 ${pctText(s.conversion.delta)} — 가격·사이즈·배송 장벽을 점검하세요.`,
      action: v.stock <= 0 ? "restock" : substitute ? null : "cart-reminder",
      actionLabel:
        v.stock <= 0 ? "옵션 재입고" : substitute ? `${s.siblingSoldout.join("·")} 재입고로 해결` : "구매 장벽 점검",
      // 대체 탐색은 원인(품절 사이즈)이 따로 있으므로 그 원인보다 앞서지 않게 상한을 둔다
      severity: Math.min(
        substitute ? 70 : 100,
        clamp(40 + s.views.delta * 30 + Math.abs(s.conversion.delta) * 30 + (v.stock <= 0 ? 10 : 0)),
      ),
      impactKrw: impact,
      impactLabel: `전환 회복 시 매출 약 ${krwShort(impact)}/주`,
      chips: c,
    };
  }
  // 4) 장바구니에 담고 사지 않는다
  if (v.cart7d >= T.minCart && s.cartToOrder < T.cartToOrder && v.stock > 0) {
    const impact = Math.round((v.cart7d - v.sales7d) * 0.15) * s.price;
    return {
      code: "cart-abandon",
      label: "장바구니 이탈",
      why: `7일간 ${v.cart7d}번 담겼지만 구매는 ${v.sales7d}건(${Math.round(s.cartToOrder * 100)}%) — 재고는 있어 리마인드로 회수할 수 있습니다.`,
      action: "cart-reminder",
      actionLabel: "장바구니 리마인드",
      severity: clamp(30 + v.cart7d * 1.5),
      impactKrw: impact,
      impactLabel: `회수 가능 매출 약 ${krwShort(impact)} (15% 회수 가정)`,
      chips: c,
    };
  }
  // 5) 관심이 식고 재고는 쌓인다
  if (
    v.stock > 0 &&
    (s.coverDays >= T.overstockDays || s.status === "overstock" || s.status === "slow") &&
    s.views.delta <= T.viewsDown &&
    s.sales.delta <= 0
  ) {
    const excess = Math.max(0, v.stock - Math.round(daily * 30));
    const impact = excess * s.cost;
    return {
      code: "cooling-overstock",
      label: "관심 식음 · 재고 과잉",
      why: `조회 ${pctText(s.views.delta)}·${s.sales.now === 0 ? "7일 판매 0건" : `판매 ${pctText(s.sales.delta)}`}인데 재고는 ${s.coverDays}일분 — 30일 판매량을 넘는 ${excess}개가 묶여 있습니다.`,
      action: "markdown",
      actionLabel: "저회전 대응 · 할인 검토",
      severity: clamp(25 + Math.min(40, s.coverDays / 4) + Math.abs(s.views.delta) * 20),
      impactKrw: impact,
      impactLabel: `묶인 재고 원가 약 ${krwShort(impact)}`,
      chips: c,
    };
  }
  if (v.sales7d > 0) {
    return {
      code: "steady",
      label: "안정 판매",
      why: `7일 판매 ${v.sales7d}개 · 재고 ${s.coverDays}일분 — 특이 신호 없음.`,
      action: null,
      actionLabel: "관찰",
      severity: 5,
      impactKrw: 0,
      impactLabel: "",
      chips: c,
    };
  }
  return {
    code: "quiet",
    label: "신호 적음",
    why: "최근 7일 판매·관심 변화가 작습니다.",
    action: null,
    actionLabel: "관찰",
    severity: 0,
    impactKrw: 0,
    impactLabel: "",
    chips: c,
  };
}

export interface SkuReading {
  signals: SkuSignals;
  pattern: Pattern;
}

/** 전체 옵션을 판독하고 '봐야 할 순서'(심각도 → 금액 영향)로 정렬한다 */
export function readAll(variants: Variant[], d: Delta): SkuReading[] {
  return variants
    .map((v) => {
      const signals = skuSignals(v, d);
      return { signals, pattern: classify(signals) };
    })
    .sort((a, b) => b.pattern.severity - a.pattern.severity || b.pattern.impactKrw - a.pattern.impactKrw);
}

export const ATTENTION_CODES: PatternCode[] = [
  "surge-shortage",
  "sold-but-returned",
  "interest-no-conversion",
  "cart-abandon",
  "cooling-overstock",
];

export const PATTERN_META: Record<
  PatternCode,
  { label: string; tone: "error" | "warning" | "accent" | "info" | "neutral"; desc: string }
> = {
  "surge-shortage": {
    label: "수요 급등 · 재고 부족",
    tone: "error",
    desc: "조회·찜·장바구니가 오르는데 리드타임 안에 품절",
  },
  "sold-but-returned": { label: "팔리지만 돌아옴", tone: "warning", desc: "판매는 되지만 사이즈·핏 사유 반품 집중" },
  "interest-no-conversion": {
    label: "관심 ↑ · 구매 ↓",
    tone: "accent",
    desc: "조회·장바구니는 오르는데 구매전환 하락",
  },
  "cart-abandon": { label: "장바구니 이탈", tone: "info", desc: "담기만 하고 사지 않음 — 재고는 있음" },
  "cooling-overstock": { label: "관심 식음 · 재고 과잉", tone: "neutral", desc: "조회·판매가 줄고 재고가 쌓임" },
  steady: { label: "안정 판매", tone: "neutral", desc: "특이 신호 없음" },
  quiet: { label: "신호 적음", tone: "neutral", desc: "판매·관심 변화가 작음" },
};
