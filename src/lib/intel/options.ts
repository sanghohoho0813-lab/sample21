/* ------------------------------------------------------------------
   옵션 단위 재고 판단 — 같은 상품이라도 색상·사이즈마다 상황이 다르다.
   · 색상 × 사이즈 매트릭스 (재고·남은 판매일·상태·패턴·추천 수량)
   · 사이즈 커브: 판매 비중 vs 재고 비중 — 다음 발주·재배분의 근거
   · 상품 단위 판독: 옵션 신호를 합쳐 "상품에서 지금 무슨 일이 일어나는가"
------------------------------------------------------------------- */
import type { InventoryStatus, Product, Variant } from "../types";
import { BRAND_BY_ID, variantsOf } from "../demo/seed";
import { restockPriority } from "../kpi";
import { safeDiv } from "../format";
import { classify, skuSignals, type Pattern, type SkuSignals } from "./signals";

type Delta = Parameters<typeof skuSignals>[1];

/** 재입고 추천 수량 — 판매 속도 × 시즌 잔여(kpi) 와 '대기 수요 + 5'(5개 단위) 중 큰 값.
 *  실행 센터 후보·옵션 매트릭스·재입고 과제가 같은 숫자를 쓴다. */
export const restockQty = (v: Variant, d: Delta) =>
  Math.max(restockPriority(v, d).suggestedQty, Math.ceil((v.restockRequests + 5) / 5) * 5);

export interface OptionCell {
  signals: SkuSignals;
  pattern: Pattern;
  status: InventoryStatus;
  suggestedQty: number;
}

export interface SizeCurvePoint {
  size: string;
  salesShare: number;
  stockShare: number;
  /** 판매 비중 − 재고 비중 (양수: 재고가 모자람) */
  gap: number;
}

export interface OptionMatrix {
  product: Product;
  colors: string[];
  sizes: string[];
  cells: Record<string, Record<string, OptionCell>>;
  sizeCurve: SizeCurvePoint[];
  insights: string[];
}

const SHARE_GAP = 0.12;

export function optionMatrix(p: Product, d: Delta): OptionMatrix {
  const cells: OptionMatrix["cells"] = {};
  const vs: Variant[] = variantsOf(p.id);
  for (const v0 of vs) {
    const signals = skuSignals(v0, d);
    const pattern = classify(signals);
    (cells[v0.color] ??= {})[v0.size] = {
      signals,
      pattern,
      status: signals.status,
      suggestedQty: restockQty(signals.variant, d),
    };
  }
  const all = Object.values(cells).flatMap((row) => Object.values(row));
  const totalSales = all.reduce((s, c) => s + c.signals.variant.sales30d, 0);
  const totalStock = all.reduce((s, c) => s + Math.max(0, c.signals.variant.stock), 0);
  const sizeCurve = p.sizes.map((size) => {
    const inSize = all.filter((c) => c.signals.variant.size === size);
    const salesShare = safeDiv(
      inSize.reduce((s, c) => s + c.signals.variant.sales30d, 0),
      totalSales,
    );
    const stockShare = safeDiv(
      inSize.reduce((s, c) => s + Math.max(0, c.signals.variant.stock), 0),
      totalStock,
    );
    return { size, salesShare, stockShare, gap: salesShare - stockShare };
  });

  const insights: string[] = [];
  for (const color of p.colors) {
    const row = cells[color] ?? {};
    const out = p.sizes.filter((sz) => row[sz] && row[sz].signals.variant.stock <= 0);
    if (out.length) {
      const req = out.reduce((s, sz) => s + row[sz].signals.variant.restockRequests, 0);
      insights.push(`${color} ${out.join("·")} 품절${req ? ` · 재입고 신청 ${req}건 대기` : ""}`);
    }
  }
  if (totalSales >= 6) {
    const short = sizeCurve.filter((c) => c.gap >= SHARE_GAP).sort((a, b) => b.gap - a.gap)[0];
    const heavy = sizeCurve.filter((c) => c.gap <= -SHARE_GAP).sort((a, b) => a.gap - b.gap)[0];
    if (short)
      insights.push(
        `${short.size} 판매 비중 ${Math.round(short.salesShare * 100)}% vs 재고 비중 ${Math.round(short.stockShare * 100)}% — 재고가 수요보다 얇음`,
      );
    if (heavy)
      insights.push(
        `${heavy.size} 재고 비중 ${Math.round(heavy.stockShare * 100)}% vs 판매 ${Math.round(heavy.salesShare * 100)}% — 다음 발주에서 줄이거나 재배분`,
      );
  }
  return { product: p, colors: p.colors, sizes: p.sizes, cells, sizeCurve, insights };
}

/* ------------------------------ 상품 단위 판독 ------------------------------ */
export interface ProductReading {
  product: Product;
  views: { now: number; prev: number; delta: number };
  wishlist: { now: number; prev: number; delta: number };
  cart: { now: number; prev: number; delta: number };
  conversion: { now: number; prev: number; delta: number };
  /** 관심이 높은데 품절인 옵션 */
  blockedOptions: { label: string; restockRequests: number }[];
  /** 옵션 패턴 중 가장 심각한 것 */
  top: OptionCell | null;
  headline: string;
}

const trend = (now: number, prev: number) => ({ now, prev, delta: safeDiv(now - prev, Math.max(1, prev)) });

export function productReading(p: Product, d: Delta, matrix = optionMatrix(p, d)): ProductReading {
  const all = Object.values(matrix.cells).flatMap((row) => Object.values(row));
  const sum = (f: (v: Variant) => number) => all.reduce((s, c) => s + f(c.signals.variant), 0);
  const views = trend(
    sum((v) => v.views7d),
    sum((v) => v.viewsPrev7d),
  );
  const wishlist = trend(
    sum((v) => v.wishlist7d),
    sum((v) => v.wishlistPrev7d),
  );
  const cart = trend(
    sum((v) => v.cart7d),
    sum((v) => v.cartPrev7d),
  );
  const cNow = safeDiv(
    sum((v) => v.sales7d),
    Math.max(1, views.now),
  );
  const cPrev = safeDiv(
    sum((v) => v.salesPrev7d),
    Math.max(1, views.prev),
  );
  const conversion = { now: cNow, prev: cPrev, delta: safeDiv(cNow - cPrev, cPrev || 1) };
  const blockedOptions = all
    .filter(
      (c) => c.signals.variant.stock <= 0 && (c.signals.variant.restockRequests >= 3 || c.signals.wishlist.now >= 6),
    )
    .map((c) => ({
      label: `${c.signals.variant.color} ${c.signals.variant.size}`,
      restockRequests: c.signals.variant.restockRequests,
    }));
  const top = [...all].sort((a, b) => b.pattern.severity - a.pattern.severity)[0] ?? null;
  const pct = (x: number) => `${x >= 0 ? "+" : "−"}${Math.round(Math.abs(x) * 100)}%`;

  let headline =
    top && top.pattern.severity >= 30
      ? `${top.signals.variant.color} ${top.signals.variant.size}: ${top.pattern.label}`
      : "특이 신호 없음";
  if (views.delta >= 0.25 && conversion.delta <= -0.2 && blockedOptions.length)
    headline = `관심 ${pct(views.delta)}인데 구매전환 ${pct(conversion.delta)} — 인기 옵션(${blockedOptions.map((b) => b.label).join("·")}) 품절이 원인`;
  else if (views.delta >= 0.25 && conversion.delta <= -0.2)
    headline = `관심 ${pct(views.delta)}인데 구매전환 ${pct(conversion.delta)} — 가격·사이즈 장벽 점검`;
  return { product: p, views, wishlist, cart, conversion, blockedOptions, top, headline };
}

export const leadTimeOf = (p: Product) => BRAND_BY_ID[p.brandId].leadTimeDays;
