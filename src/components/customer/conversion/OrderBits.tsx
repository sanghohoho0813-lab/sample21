"use client";
import Link from "next/link";
import { Check, Circle, XCircle, RotateCcw, Repeat } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { PRODUCT_BY_ID, VARIANT_BY_ID } from "@/lib/demo/seed";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/kpi";
import { fmtDate } from "@/lib/dates";
import { krw } from "@/lib/format";
import { ProductImage } from "@/components/ui/ProductImage";
import { OrderStatusBadge } from "@/components/ax/StatusBadges";
import { cn } from "@/lib/cn";
import { orderSummary } from "./shared";

/** 주문 상태 타임라인 — ORDER_STATUS_FLOW + statusHistory. 현재 단계 강조. */
export function OrderTimeline({ order, tour }: { order: Order; tour?: string }) {
  const history = order.statusHistory;
  const flowIdxOf = (s: OrderStatus) => ORDER_STATUS_FLOW.indexOf(s);
  const reached = Math.max(-1, ...history.map((h) => flowIdxOf(h.status)), flowIdxOf(order.status));
  const terminal = !ORDER_STATUS_FLOW.includes(order.status) ? order.status : null;
  const atOf = (s: OrderStatus) => [...history].reverse().find((h) => h.status === s)?.at;
  const TerminalIcon = terminal === "cancelled" ? XCircle : terminal === "return-requested" ? RotateCcw : Repeat;
  return (
    <ol className="relative" data-tour={tour} aria-label="주문 진행 상태">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const done = i <= reached && !terminal;
        const current = !terminal && i === reached;
        const passed = terminal ? i <= reached : done;
        const at = atOf(s);
        return (
          <li key={s} className="flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span className={cn("h-7 w-7 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors", current ? "bg-brand-black border-brand-black text-white" : passed ? "bg-white border-brand-black text-brand-black" : "bg-white border-neutral-border text-neutral-border")}>{passed ? <Check size={14} strokeWidth={3} /> : <Circle size={8} fill="currentColor" />}</span>
              {(i < ORDER_STATUS_FLOW.length - 1 || terminal) && <span className={cn("w-0.5 flex-1 min-h-[16px] mt-1", i < reached || (terminal && i <= reached) ? "bg-brand-black" : "bg-neutral-border")} />}
            </div>
            <div className={cn("min-w-0 -mt-0.5", !passed && "text-neutral-text2")}>
              <p className={cn("font-bold text-[0.95rem] leading-snug", current && "text-brand-black")}>{ORDER_STATUS_LABEL[s]}{current && <span className="ml-2 text-[0.72rem] font-bold text-white bg-brand-accent rounded-md px-1.5 py-0.5 align-middle">현재</span>}</p>
              <p className="text-[0.8rem] text-neutral-text2 tabular">{at ? fmtDate(at, "datetime") : passed ? "처리됨" : s === "pending" ? "DEMO 결제 · 실제 결제 없음" : "예정"}</p>
            </div>
          </li>
        );
      })}
      {terminal && (
        <li className="flex gap-3">
          <div className="flex flex-col items-center"><span className="h-7 w-7 rounded-full flex items-center justify-center bg-semantic-error text-white shrink-0"><TerminalIcon size={14} /></span></div>
          <div className="-mt-0.5"><p className="font-bold text-[0.95rem] text-semantic-error">{ORDER_STATUS_LABEL[terminal]}<span className="ml-2 text-[0.72rem] font-bold text-white bg-semantic-error rounded-md px-1.5 py-0.5 align-middle">현재</span></p><p className="text-[0.8rem] text-neutral-text2 tabular">{atOf(terminal) ? fmtDate(atOf(terminal)!, "datetime") : ""}</p></div>
        </li>
      )}
    </ol>
  );
}

export function OrderItemRow({ item, linkable = true }: { item: Order["items"][number]; linkable?: boolean }) {
  const p = PRODUCT_BY_ID[item.productId];
  const v = VARIANT_BY_ID[item.variantId];
  if (!p) return null;
  const inner = (
    <div className="flex gap-3 items-center">
      <ProductImage colors={p.colors} variant={v ? Math.max(0, p.colors.indexOf(v.color)) : 0} label={p.name} className="w-16 shrink-0" ratio="aspect-[3/4]" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[0.95rem] leading-snug">{p.name}</p>
        <p className="text-[0.82rem] text-neutral-text2">{v ? `${v.color} · ${v.size}` : "옵션 정보 없음"} · {item.qty}개</p>
        <p className="text-[0.9rem] font-bold tabular mt-0.5">{krw(item.unitPrice * item.qty)}</p>
      </div>
    </div>
  );
  return linkable ? <Link href={`/products/${p.id}`} className="block rounded-xl -mx-2 px-2 py-1.5 hover:bg-brand-ivory transition-colors">{inner}</Link> : inner;
}

export function OrderCard({ order }: { order: Order }) {
  const first = PRODUCT_BY_ID[order.items[0]?.productId];
  const v = VARIANT_BY_ID[order.items[0]?.variantId];
  return (
    <Link href={`/my/orders/${order.id}`} className="block rounded-cardlg border border-neutral-border bg-white p-4 md:p-5 hover-lift active:bg-brand-ivory">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[0.82rem] text-neutral-text2 tabular">{fmtDate(order.createdAt, "datetime")} · 주문번호 {order.id}</p>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex gap-3 items-center">
        {first && <ProductImage colors={first.colors} variant={v ? Math.max(0, first.colors.indexOf(v.color)) : 0} label={first.name} className="w-16 shrink-0" ratio="aspect-[3/4]" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{orderSummary(order)}</p>
          {v && <p className="text-[0.82rem] text-neutral-text2">{v.color} · {v.size}{order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ""}</p>}
          <p className="font-bold tabular mt-1">{krw(order.total)}</p>
        </div>
      </div>
    </Link>
  );
}

export function PriceSummary({ subtotal, itemDiscount, coupon, shipping, total, couponLabel, className }: { subtotal: number; itemDiscount: number; coupon: number; shipping: number; total: number; couponLabel?: string; className?: string }) {
  return (
    <dl className={cn("space-y-2 text-[0.92rem]", className)}>
      <div className="flex justify-between gap-2"><dt className="text-neutral-text2">상품금액</dt><dd className="tabular">{krw(subtotal + itemDiscount)}</dd></div>
      {itemDiscount > 0 && <div className="flex justify-between gap-2"><dt className="text-neutral-text2">상품 할인</dt><dd className="tabular text-semantic-error">−{krw(itemDiscount)}</dd></div>}
      <div className="flex justify-between gap-2"><dt className="text-neutral-text2">쿠폰 할인{couponLabel ? ` (${couponLabel})` : ""}</dt><dd className={cn("tabular", coupon > 0 && "text-semantic-error")}>{coupon > 0 ? `−${krw(coupon)}` : "0원"}</dd></div>
      <div className="flex justify-between gap-2"><dt className="text-neutral-text2">배송비</dt><dd className="tabular">{shipping === 0 ? "무료" : krw(shipping)}</dd></div>
      <div className="flex justify-between gap-2 border-t border-neutral-border pt-3 mt-1"><dt className="font-bold">최종 결제예정금액</dt><dd className="font-black text-[1.25rem] tabular">{krw(total)}</dd></div>
    </dl>
  );
}
