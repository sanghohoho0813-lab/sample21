import { Badge, type Tone } from "@/components/ui/Badge";
import type { ActionStatus, InventoryStatus, OrderStatus, Urgency } from "@/lib/types";
import { INVENTORY_STATUS_LABEL, INVENTORY_STATUS_TONE, ORDER_STATUS_LABEL } from "@/lib/kpi";

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = { recommended: "추천됨", confirmed: "확인", "in-progress": "실행중", done: "완료", hold: "보류", dismissed: "무시" };
const actionTone: Record<ActionStatus, Tone> = { recommended: "accent", confirmed: "info", "in-progress": "warning", done: "success", hold: "neutral", dismissed: "neutral" };
export function ActionStatusBadge({ status, size }: { status: ActionStatus; size?: "sm" | "md" }) { return <Badge tone={actionTone[status]} size={size}>{ACTION_STATUS_LABEL[status]}</Badge>; }

export const URGENCY_LABEL: Record<Urgency, string> = { high: "긴급", mid: "보통", low: "낮음" };
const urgencyTone: Record<Urgency, Tone> = { high: "error", mid: "warning", low: "neutral" };
export function UrgencyBadge({ urgency, size = "sm" }: { urgency: Urgency; size?: "sm" | "md" }) { return <Badge tone={urgencyTone[urgency]} size={size}>{URGENCY_LABEL[urgency]}</Badge>; }

export function InventoryStatusBadge({ status, size = "sm" }: { status: InventoryStatus; size?: "sm" | "md" }) { return <Badge tone={INVENTORY_STATUS_TONE[status]} size={size}>{INVENTORY_STATUS_LABEL[status]}</Badge>; }

const orderTone: Record<OrderStatus, Tone> = { pending: "demo", preparing: "info", shipped: "accent", "in-transit": "warning", delivered: "success", cancelled: "neutral", "return-requested": "error", "exchange-requested": "error" };
export function OrderStatusBadge({ status, size = "sm" }: { status: OrderStatus; size?: "sm" | "md" }) { return <Badge tone={orderTone[status]} size={size}>{ORDER_STATUS_LABEL[status]}</Badge>; }
