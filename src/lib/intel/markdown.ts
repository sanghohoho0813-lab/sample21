/* ------------------------------------------------------------------
   프로모션·할인 판단 — "재고가 많으니 할인"이 아니라 근거로 결정한다.
   근거: 남은 판매일 vs 시즌 잔여일 · 판매 속도 · 수요 추세(조회·찜) · 마진 여유 · 옵션 공백
   가드: 수요가 오르는 상품, 인기 옵션이 품절인 상품, 출시 30일 미만 상품은 할인을 권하지 않는다.
   시뮬레이터: 할인율에 따른 판매·마진 변화 — 가격탄력성은 가정값(화면에 표시)이다.
------------------------------------------------------------------- */
import type { Product } from "../types";
import { daysBetween } from "../dates";
import { effPrice, effVariants, markdownReview } from "../kpi";
import { safeDiv } from "../format";

type Delta = Parameters<typeof markdownReview>[1];

/** 마진 하한 — 할인 후에도 지켜야 하는 매출총이익률 */
export const MARGIN_FLOOR = 0.25;
/** 가격탄력성 가정 — 가격 1% 인하 시 판매 수량 2% 증가 (실증에서 보정) */
export const ELASTICITY = 2.0;
export const MAX_RATE = 0.3;
/** 시즌 종료 때 이만큼 이상 남을 때만 할인을 검토한다 */
export const LEFTOVER_SHARE = 0.25;
/** 관심 상승으로 보는 조회·찜 증가율 */
const INTEREST_UP = { views: 0.1, wish: 0.2 };
const MIN_STOCK = 8;
/** 할인 판단에 필요한 최소 시즌 손익 개선 */
const MIN_GAIN_KRW = 300_000;

/** 지금 적용 중인 할인율(정상가 대비) */
export const currentRate = (p: Product, d: Delta) => Math.max(0, 1 - effPrice(p, d) / p.price);

export type Verdict = "markdown" | "hold" | "not-needed";

export interface MarkdownCheck {
  ok: boolean;
  label: string;
  detail: string;
}

export interface MarkdownDecision {
  product: Product;
  verdict: Verdict;
  verdictLabel: string;
  /** 판단 근거 — 통과/불통과 체크리스트 */
  checks: MarkdownCheck[];
  /** 할인을 막는 이유 (있으면 hold) */
  guards: string[];
  suggestedRate: number;
  /** 마진 하한을 지키는 최대 할인율 */
  maxRateByMargin: number;
  stock: number;
  coverDays: number;
  seasonDaysLeft: number;
  margin: number;
}

export function markdownDecision(p: Product, d: Delta): MarkdownDecision {
  const m = markdownReview(p, d);
  const vs = effVariants(p.id, d);
  const views = vs.reduce((s, v) => s + v.views7d, 0);
  const viewsPrev = vs.reduce((s, v) => s + v.viewsPrev7d, 0);
  const wish = vs.reduce((s, v) => s + v.wishlist7d, 0);
  const wishPrev = vs.reduce((s, v) => s + v.wishlistPrev7d, 0);
  const viewsDelta = safeDiv(views - viewsPrev, Math.max(1, viewsPrev));
  const wishDelta = safeDiv(wish - wishPrev, Math.max(1, wishPrev));
  const ageDays = daysBetween(p.createdAt, new Date());
  const soldoutCore = vs.filter(
    (v) => v.stock <= 0 && (v.size === "M" || v.size === "L" || v.size === "S") && v.restockRequests >= 3,
  );
  // 원가를 지키며 내릴 수 있는 최대 할인율 (정상가 기준)
  const maxRateByMargin = Math.max(0, Math.min(MAX_RATE, 1 - p.cost / (1 - MARGIN_FLOOR) / p.price));

  const now = simulateMarkdown(p, d, currentRate(p, d));
  const leftoverShare = safeDiv(now.leftover, Math.max(1, m.stock));
  const interestRising = viewsDelta > INTEREST_UP.views || wishDelta > INTEREST_UP.wish;
  const checks: MarkdownCheck[] = [
    {
      ok: leftoverShare >= LEFTOVER_SHARE,
      label: `지금 속도면 시즌 종료 때 재고 ${Math.round(LEFTOVER_SHARE * 100)}% 이상이 남음`,
      detail:
        m.stock <= 0
          ? "재고 없음"
          : `예상 잔여 ${now.leftover}개(${Math.round(leftoverShare * 100)}%) · 시즌 잔여 ${p.seasonEndsInDays}일`,
    },
    { ok: m.s7 <= m.p7, label: "판매 속도 정체·하락", detail: `최근 7일 ${m.s7}개 · 직전 7일 ${m.p7}개` },
    {
      ok: !interestRising,
      label: "관심이 오르는 중이 아님",
      detail: `조회 ${viewsDelta >= 0 ? "+" : ""}${Math.round(viewsDelta * 100)}% · 찜 ${wishDelta >= 0 ? "+" : ""}${Math.round(wishDelta * 100)}%`,
    },
    {
      ok: maxRateByMargin >= 0.05,
      label: `할인 후 마진 ${Math.round(MARGIN_FLOOR * 100)}% 이상 유지 가능`,
      detail: `현재 마진 ${Math.round(m.margin * 100)}% · 최대 ${Math.round(maxRateByMargin * 100)}%까지`,
    },
    {
      ok: soldoutCore.length === 0,
      label: "인기 옵션 품절이 원인이 아님",
      detail: soldoutCore.length
        ? `${soldoutCore.map((v) => `${v.color} ${v.size}`).join("·")} 품절 · 재입고 신청 있음`
        : "핵심 사이즈 재고 있음",
    },
  ];

  const guards: string[] = [];
  if (interestRising)
    guards.push(
      `관심이 오르는 중(조회 ${viewsDelta >= 0 ? "+" : ""}${Math.round(viewsDelta * 100)}% · 찜 ${wishDelta >= 0 ? "+" : ""}${Math.round(wishDelta * 100)}%) — 할인하면 마진만 잃습니다.`,
    );
  if (soldoutCore.length) guards.push("인기 옵션이 품절이라 안 팔리는 것 — 할인보다 재입고가 먼저입니다.");
  if (ageDays < 30) guards.push(`출시 ${ageDays}일 — 신상품은 30일 판매 데이터가 쌓인 뒤 판단합니다.`);
  if (maxRateByMargin < 0.05) guards.push(`마진 하한(${Math.round(MARGIN_FLOOR * 100)}%) 때문에 할인 여력이 없습니다.`);

  const needed = checks[0].ok && checks[1].ok && m.stock >= MIN_STOCK;
  // 할인으로 얻는 시즌 손익 개선이 작으면 할인하지 않는다 — 이월·기획전 노출이 낫다
  const opt = bestRate(p, d, maxRateByMargin);
  const gain = opt.best ? opt.best.net - opt.rows[0].net : 0;
  const minGain = Math.max(MIN_GAIN_KRW, m.stock * p.cost * 0.03);
  if (needed && gain < minGain && maxRateByMargin >= 0.05)
    guards.push(
      `할인해도 시즌 손익 개선이 약 ${Math.round(Math.max(0, gain) / 10_000)}만 원뿐 — 할인보다 이월·기획전 노출을 검토합니다.`,
    );
  const verdict: Verdict = !needed ? "not-needed" : guards.length ? "hold" : "markdown";
  // 효과의 90%를 내는 가장 작은 할인율 — 마진을 필요 이상 내주지 않는다
  const enough = opt.rows.find((r) => r.net >= opt.rows[0].net + gain * 0.9);
  const suggestedRate = verdict === "markdown" ? (enough?.rate ?? opt.rate) : 0;
  return {
    product: p,
    verdict,
    verdictLabel:
      verdict === "markdown"
        ? `할인 권장 ${Math.round(suggestedRate * 100)}%`
        : verdict === "hold"
          ? "할인 보류"
          : "할인 불필요",
    checks,
    guards,
    suggestedRate,
    maxRateByMargin,
    stock: m.stock,
    coverDays: m.dos,
    seasonDaysLeft: p.seasonEndsInDays,
    margin: m.margin,
  };
}

export interface MarkdownSimulation {
  rate: number;
  price: number;
  /** 시즌 종료까지 예상 판매 수량 */
  units: number;
  /** 시즌 종료 시 남는 재고 */
  leftover: number;
  sellThrough: number;
  revenue: number;
  grossProfit: number;
  marginRate: number;
  /** 남은 재고 원가(시즌 후 묶이는 돈) */
  leftoverCost: number;
}

/** 할인율별 시즌 종료까지의 결과 — 기준 판매 속도 × (1 + 탄력성 × 할인 폭) */
export function simulateMarkdown(p: Product, d: Delta, rate: number): MarkdownSimulation {
  const m = markdownReview(p, d);
  const base = Math.max(0.1, m.s30 / 30);
  const listPrice = p.price;
  const price = Math.round((listPrice * (1 - rate)) / 1000) * 1000;
  const current = effPrice(p, d);
  // 지금 판매가 대비 가격 변화 — 현재보다 높은 할인율만 판매를 늘리고, 낮추면(가격 인상) 판매가 준다
  const change = (current - price) / current;
  const daily = Math.max(0, base * (1 + ELASTICITY * change));
  const units = Math.min(m.stock, Math.round(daily * p.seasonEndsInDays));
  const revenue = units * price;
  const grossProfit = units * (price - p.cost);
  const leftover = Math.max(0, m.stock - units);
  return {
    rate,
    price,
    units,
    leftover,
    sellThrough: safeDiv(units, Math.max(1, m.stock)),
    revenue,
    grossProfit,
    marginRate: safeDiv(price - p.cost, price),
    leftoverCost: leftover * p.cost,
  };
}

export const SIM_ASSUMPTIONS = [
  `가격탄력성 ${ELASTICITY} — 가격을 1% 내리면 판매가 ${ELASTICITY}% 는다고 가정 (실증에서 브랜드별로 보정)`,
  "기준 판매 속도 = 최근 30일 평균, 시즌 종료일까지 같은 속도로 판매",
  "시즌 후 남은 재고는 이월·아울렛 처분으로 원가의 30% 회수 가정",
  `마진 하한 ${Math.round(MARGIN_FLOOR * 100)}% · 최대 할인 ${Math.round(MAX_RATE * 100)}%`,
];

/** 시즌 후 남은 재고를 이월·아울렛으로 처분할 때 원가 대비 회수율 — 가정값 */
export const SALVAGE = 0.3;

/** 시즌 손익 = 시즌 안 매출총이익 − 남은 재고 손실(원가 × (1 − 회수율)) */
export const seasonNet = (sim: MarkdownSimulation, cost: number) =>
  sim.grossProfit - sim.leftover * cost * (1 - SALVAGE);

/** 지금 할인율부터 마진 하한까지 5%p 단위로 시뮬레이션해 시즌 손익이 가장 큰 할인율을 고른다 */
export function bestRate(p: Product, d: Delta, maxRate = MAX_RATE) {
  const start = Math.round(currentRate(p, d) * 20) / 20;
  const rows: { rate: number; sim: MarkdownSimulation; net: number }[] = [];
  for (let r = start; r <= maxRate + 1e-9; r = Math.round((r + 0.05) * 100) / 100) {
    const sim = simulateMarkdown(p, d, r);
    rows.push({ rate: r, sim, net: seasonNet(sim, p.cost) });
  }
  const best = rows.reduce((a, b) => (b.net > a.net ? b : a), rows[0]);
  return { rate: best.rate, rows, best };
}
