/* ------------------------------------------------------------------
   추천 후보 — 신호 엔진이 지금 데이터에서 '새로' 찾아낸 과제.
   이미 진행 중이거나 끝난 과제와 겹치면 만들지 않는다. 운영자가 '과제로 등록'해야
   실행 센터로 들어간다(자동 실행 없음 · 사람이 검토·승인).
------------------------------------------------------------------- */
import type { ActionType, AXAction, Urgency } from "../types";
import { BRAND_BY_ID, PRODUCTS, PRODUCT_BY_ID, VARIANTS, VARIANT_BY_ID } from "../demo/seed";
import { restockQty } from "./options";
import { classify, readAll, skuSignals, type PatternCode, type SkuReading } from "./signals";
import { returnIntel } from "./returns";
import { markdownDecision, type MarkdownDecision } from "./markdown";

type State = Parameters<typeof readAll>[1] & Parameters<typeof returnIntel>[0] & Parameters<typeof markdownDecision>[1];

export interface Candidate {
  key: string;
  type: ActionType;
  engine: AXAction["engine"];
  pattern: PatternCode | "return-pattern" | "markdown-decision";
  title: string;
  why: string;
  reasons: string[];
  urgency: Urgency;
  productId?: string;
  variantId?: string;
  quantity?: number;
  discountRate?: number;
  impactKrw: number;
  impactLabel: string;
  severity: number;
}

const OPEN = (a: AXAction) => a.status !== "dismissed" && a.status !== "done";

/** 등록된 과제가 어떤 후보에서 왔는지 — 같은 후보를 두 번 등록하지 않기 위한 키 */
export const candidateKey = (a: Pick<AXAction, "type" | "productId" | "variantId">) =>
  a.type === "restock"
    ? `restock:${a.variantId}`
    : a.type === "fit-guide"
      ? `fit:${a.productId}`
      : `${a.type}:${a.productId}`;
const won = (n: number) => `${Math.round(n / 10_000).toLocaleString("ko-KR")}만 원`;

export function engineCandidates(state: State, actions: AXAction[]): Candidate[] {
  const out: Candidate[] = [];
  const covered = (type: ActionType, productId?: string, variantId?: string) =>
    actions.some(
      (a) =>
        OPEN(a) &&
        (a.type === type || (type === "restock" && a.type === "rebalance")) &&
        (variantId ? a.variantId === variantId : a.productId === productId),
    );

  // 1) SKU 신호 — 재입고 (수요 급등·품절로 전환 하락)
  for (const r of readAll(VARIANTS, state)) {
    const { pattern: pt, signals: s } = r;
    if (pt.action !== "restock" || pt.severity < 50) continue;
    if (covered("restock", s.variant.productId, s.variant.id)) continue;
    out.push(restockCandidate(r, state));
  }

  // 2) 반품 패턴 — 사이즈 집중 → 핏 안내 개선
  for (const f of returnIntel(state).findings) {
    if (f.kind !== "size" || !f.productId || covered("fit-guide", f.productId)) continue;
    const p = PRODUCT_BY_ID[f.productId];
    out.push({
      key: `fit:${p.id}`,
      type: "fit-guide",
      engine: "fit",
      pattern: "return-pattern",
      title: `${p.name} '${f.direction === "small" ? "작게 나옴" : "크게 나옴"}' 핏 안내 개선`,
      why: f.title,
      reasons: [f.evidence, f.recommendation],
      urgency: f.lift >= 2 ? "high" : "mid",
      productId: p.id,
      impactKrw: f.support * 7_000,
      impactLabel: `사이즈 반품 ${f.support}건 · 처리비 약 ${won(f.support * 7_000)}`,
      severity: Math.min(100, 40 + f.lift * 15),
    });
  }

  // 3) 할인 판단 — 근거를 통과한 상품만
  for (const p of PRODUCTS) {
    const md = markdownDecision(p, state);
    if (md.verdict !== "markdown" || covered("markdown", p.id)) continue;
    out.push(markdownCandidate(md));
  }

  return out.sort((a, b) => b.severity - a.severity || b.impactKrw - a.impactKrw);
}

/** SKU 판독 → 재입고 후보 (엔진이 찾았거나 운영자가 검토를 요청한 경우) */
function restockCandidate({ pattern: pt, signals: s }: SkuReading, state: State, requestedBy?: string): Candidate {
  const v = s.variant;
  const p = PRODUCT_BY_ID[v.productId];
  const qty = restockQty(v, state);
  const why =
    pt.action === "restock" ? pt.why : `${requestedBy ?? "운영자"} 검토 요청 — 엔진 판독: ${pt.label}. ${pt.why}`;
  return {
    key: `restock:${v.id}`,
    type: "restock",
    engine: "demand",
    pattern: pt.code,
    title: `${p.name} · ${v.color} · ${v.size} 재입고`,
    why,
    reasons: [
      why,
      `재입고 신청 ${v.restockRequests}건 · 7일 판매 ${v.sales7d}개 · 리드타임 ${BRAND_BY_ID[p.brandId].leadTimeDays}일`,
      `추천 수량 ${qty}개 (판매 속도 × 시즌 잔여 + 대기 수요 기준)`,
    ],
    urgency: v.stock <= 0 || pt.severity >= 80 ? "high" : pt.action === "restock" ? "mid" : "low",
    productId: p.id,
    variantId: v.id,
    quantity: qty,
    impactKrw: pt.impactKrw,
    impactLabel: pt.impactLabel,
    severity: pt.severity,
  };
}

/** 할인 판단 → 할인 후보. 엔진이 보류한 상품을 운영자가 요청하면 근거 미통과가 그대로 적힌다 */
function markdownCandidate(md: MarkdownDecision, requestedBy?: string): Candidate {
  const p = md.product;
  const rate = md.verdict === "markdown" ? md.suggestedRate : Math.min(0.15, Math.floor(md.maxRateByMargin * 20) / 20);
  const why =
    md.verdict === "markdown"
      ? `지금 속도면 시즌 종료 때 재고가 남고(남은 판매일 ${md.coverDays}일 · 시즌 ${md.seasonDaysLeft}일), 할인 근거 5개를 모두 통과했습니다.`
      : `${requestedBy ?? "운영자"} 검토 요청 — 할인 판단 엔진은 '${md.verdictLabel}'입니다. ${md.guards[0] ?? "근거 체크를 확인하세요."}`;
  return {
    key: `markdown:${p.id}`,
    type: "markdown",
    engine: "markdown",
    pattern: "markdown-decision",
    title: `${p.name} 할인 ${Math.round(rate * 100)}% 검토`,
    why,
    reasons: [why, ...md.checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.label} — ${c.detail}`)],
    urgency: md.verdict === "markdown" ? "mid" : "low",
    productId: p.id,
    discountRate: rate,
    impactKrw: md.stock * p.cost,
    impactLabel: `재고 원가 약 ${won(md.stock * p.cost)}`,
    severity: md.verdict === "markdown" ? 45 : 20,
  };
}

/** 운영자가 특정 옵션의 재입고 검토를 요청할 때 — 엔진 판독을 근거로 붙인다 */
export function restockRequestFor(variantId: string, state: State, requestedBy?: string): Candidate | null {
  const v = VARIANT_BY_ID[variantId];
  if (!v) return null;
  const signals = skuSignals(v, state);
  return restockCandidate({ signals, pattern: classify(signals) }, state, requestedBy);
}

/** 운영자가 특정 상품의 할인 검토를 요청할 때 — 엔진이 보류하면 그 이유가 근거 첫 줄이 된다 */
export function markdownRequestFor(productId: string, state: State, requestedBy?: string): Candidate | null {
  const p = PRODUCT_BY_ID[productId];
  return p ? markdownCandidate(markdownDecision(p, state), requestedBy) : null;
}
