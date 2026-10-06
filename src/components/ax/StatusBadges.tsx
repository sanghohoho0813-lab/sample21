import { Badge, type Tone } from "@/components/ui/Badge";
import type { ActionStatus, InventoryStatus, OrderStatus, Urgency } from "@/lib/types";
import { INVENTORY_STATUS_LABEL, INVENTORY_STATUS_TONE, ORDER_STATUS_LABEL } from "@/lib/kpi";

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = { recommended: "추천됨", confirmed: "확인", "in-progress": "실행중", done: "완료", hold: "보류", dismissed: "무시" };
const actionTone: Record<ActionStatus, Tone> = { recommended: "accent", confirmed: "info", "in-progress": "warning", done: "success", hold: "neutral", dismissed: "neutral" };
export function ActionStatusBadge({ status, size }: { status: ActionStatus; size?: "sm" | "md" }) { return <Badge tone={actionTone[status]} size={size}>{ACTION_STATUS_LABEL[status]}</Badge>; }

export const URGENCY_LABEL: Record<Urgency, string> = { high: "긴급", mid: "보통", low: "낮음" };
const urgencyTone: Record<Urgency, Tone> = { high: "error", mid: "warning", low: "neutral" };
export function UrgencyBadge({ urgency, size = "sm" }: { urgency: Urgency; size?: "sm" | "md" }) {
  return <Badge tone={urgencyTone[urgency]} size={size}>{urgency === "high" && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current animate-breathe" />}{URGENCY_LABEL[urgency]}</Badge>;
}

/** 배지 대신 점 + 글자 — 카드 머리에 배지가 겹겹이 쌓이지 않게 긴급도는 글자로만 표시 */
export function UrgencyLabel({ urgency }: { urgency: Urgency }) {
  const color = urgency === "high" ? "text-semantic-error" : urgency === "mid" ? "text-semantic-warning" : "text-neutral-text2";
  return <span className={`inline-flex items-center gap-1.5 font-bold ${color}`}><span aria-hidden className={`h-2 w-2 rounded-full bg-current ${urgency === "high" ? "animate-breathe" : ""}`} />{URGENCY_LABEL[urgency]}</span>;
}

export function InventoryStatusBadge({ status, size = "sm" }: { status: InventoryStatus; size?: "sm" | "md" }) { return <Badge tone={INVENTORY_STATUS_TONE[status]} size={size}>{INVENTORY_STATUS_LABEL[status]}</Badge>; }

const orderTone: Record<OrderStatus, Tone> = { pending: "demo", preparing: "info", shipped: "accent", "in-transit": "warning", delivered: "success", cancelled: "neutral", "return-requested": "error", "exchange-requested": "error" };
export function OrderStatusBadge({ status, size = "sm" }: { status: OrderStatus; size?: "sm" | "md" }) { return <Badge tone={orderTone[status]} size={size}>{ORDER_STATUS_LABEL[status]}</Badge>; }
