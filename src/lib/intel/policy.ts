/* ------------------------------------------------------------------
   과제 운영 정책 — 누가, 언제까지, 누구의 승인으로 실행하는가.
   · 승인: 돈이 크게 움직이는 실행(대량 재입고·큰 할인)은 대표 승인 후에만 '실행 시작'
   · 기한: 긴급도별 SLA (긴급 1일 · 보통 3일 · 낮음 7일)
   · 우선순위: 긴급도 + 대상 SKU/상품의 신호 강도 + 기한 경과
   정책 숫자는 이 파일 한 곳에서만 바꾼다(실증 계약 시 고객사 결재 규정으로 교체).
------------------------------------------------------------------- */
import type { ActionApproval, AXAction, Role, Urgency } from "../types";
import { PRODUCT_BY_ID, VARIANT_BY_ID } from "../demo/seed";
import { readAll } from "./signals";

export const POLICY = {
  /** 재입고 발주 금액(원가 기준)이 이 이상이면 대표 승인 */
  restockApprovalKrw: 3_000_000,
  /** 할인율이 이 이상이면 대표 승인 */
  markdownApprovalRate: 0.2,
  /** 캠페인 대상이 이 인원 이상이면 대표 승인 */
  campaignApprovalTargets: 100,
  slaDays: { high: 1, mid: 3, low: 7 } as Record<Urgency, number>,
} as const;

const won = (n: number) => `${Math.round(n / 10_000).toLocaleString("ko-KR")}만 원`;

/** 과제 내용(유형·수량·할인율)에 따른 승인 필요 여부 — 파라미터가 바뀌면 다시 계산한다 */
export function approvalPolicy(a: AXAction): Omit<ActionApproval, "approvedBy" | "approvedAt"> {
  if ((a.type === "restock" || a.type === "rebalance") && a.variantId && VARIANT_BY_ID[a.variantId]) {
    const p = PRODUCT_BY_ID[VARIANT_BY_ID[a.variantId].productId];
    const cost = (a.quantity ?? 0) * p.cost;
    if (a.type === "restock" && cost >= POLICY.restockApprovalKrw)
      return {
        required: true,
        approverRole: "owner",
        reason: `발주 금액 ${won(cost)} — ${won(POLICY.restockApprovalKrw)} 이상은 대표 승인`,
      };
    return {
      required: false,
      approverRole: "md",
      reason: a.type === "rebalance" ? "옵션 간 재배분 — MD 전결" : `발주 금액 ${won(cost)} — MD 전결`,
    };
  }
  if (a.type === "markdown") {
    const rate = a.discountRate ?? 0;
    if (rate >= POLICY.markdownApprovalRate)
      return {
        required: true,
        approverRole: "owner",
        reason: `할인 ${Math.round(rate * 100)}% — ${Math.round(POLICY.markdownApprovalRate * 100)}% 이상은 대표 승인(마진 영향)`,
      };
    return { required: false, approverRole: "md", reason: `할인 ${Math.round(rate * 100)}% — MD 전결` };
  }
  if (a.type === "segment-campaign") {
    const n = Number(/(\d+)명/.exec(a.title)?.[1] ?? 0);
    if (n >= POLICY.campaignApprovalTargets)
      return {
        required: true,
        approverRole: "owner",
        reason: `대상 ${n}명 — ${POLICY.campaignApprovalTargets}명 이상 발송은 대표 승인`,
      };
    return { required: false, approverRole: "md", reason: `대상 ${n || "소수"}명 — MD 전결` };
  }
  if (a.type === "fit-guide")
    return { required: false, approverRole: "md", reason: "상품 안내 문구 수정 — MD 전결(되돌리기 쉬움)" };
  return { required: false, approverRole: "md", reason: "안내 메시지 — 운영 전결" };
}

/** 저장된 승인 기록 + 현재 파라미터 기준 정책을 합친 '지금의' 승인 상태 */
export function approvalOf(a: AXAction): ActionApproval {
  const policy = approvalPolicy(a);
  const stored = a.approval;
  // 승인 뒤 파라미터가 바뀌어 정책이 달라지면(예: 수량 증가) 승인을 다시 받아야 한다
  const stillValid = stored?.approvedBy && stored.reason === policy.reason;
  return {
    ...policy,
    approvedBy: stillValid ? stored?.approvedBy : undefined,
    approvedAt: stillValid ? stored?.approvedAt : undefined,
  };
}

export const needsApproval = (a: AXAction) => {
  const ap = approvalOf(a);
  return ap.required && !ap.approvedBy;
};

export const canApprove = (role: Role, a: AXAction) => {
  const ap = approvalOf(a);
  return ap.approverRole === "owner" ? role === "owner" : role === "owner" || role === "md";
};

export function dueOf(a: AXAction): Date {
  if (a.dueAt) return new Date(a.dueAt);
  const d = new Date(a.recommendedAt);
  d.setDate(d.getDate() + POLICY.slaDays[a.urgency]);
  return d;
}

/** 남은 일수(음수면 지남) — 완료·보류·무시는 기한 개념 없음 */
export function dueInDays(a: AXAction, now = new Date()): number | null {
  if (a.status === "done" || a.status === "dismissed" || a.status === "hold") return null;
  return Math.ceil((dueOf(a).getTime() - now.getTime()) / 86_400_000);
}

export const assigneeOf = (a: AXAction) => a.assigneeName ?? a.ownerName;

const URGENCY_BASE: Record<Urgency, number> = { high: 45, mid: 28, low: 12 };

/** 우선순위 0~100 — 긴급도 + 대상의 신호 강도 + 기한 경과 */
export function priorityOf(a: AXAction, readings: ReturnType<typeof readAll>, now = new Date()) {
  const target = readings.filter((r) =>
    a.variantId
      ? r.signals.variant.id === a.variantId
      : a.productId
        ? r.signals.variant.productId === a.productId
        : false,
  );
  const severity = target.length ? Math.max(...target.map((r) => r.pattern.severity)) : 0;
  const impactKrw = target.reduce((s, r) => s + r.pattern.impactKrw, 0);
  const left = dueInDays(a, now);
  const overdue = left !== null && left < 0 ? Math.min(20, -left * 5) : 0;
  return {
    score: Math.round(Math.min(100, URGENCY_BASE[a.urgency] + severity * 0.4 + overdue)),
    severity,
    impactKrw,
    overdue: left !== null && left < 0,
  };
}
