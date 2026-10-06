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
import { parseOrderMemo } from "@/lib/orderMemo";

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
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  current
                    ? "border-brand-black bg-brand-black text-white"
                    : passed
                      ? "border-brand-black bg-white text-brand-black"
                      : "border-neutral-border bg-white text-neutral-border",
                )}
              >
                {passed ? <Check size={14} strokeWidth={3} /> : <Circle size={8} fill="currentColor" />}
              </span>
              {(i < ORDER_STATUS_FLOW.length - 1 || terminal) && (
                <span
                  className={cn(
                    "mt-1 min-h-[16px] w-0.5 flex-1",
                    i < reached || (terminal && i <= reached) ? "bg-brand-black" : "bg-neutral-border",
                  )}
                />
              )}
            </div>
            <div className={cn("-mt-0.5 min-w-0", !passed && "text-neutral-text2")}>
              <p className={cn("text-[0.95rem] font-bold leading-snug", current && "text-brand-black")}>
                {ORDER_STATUS_LABEL[s]}
                {current && (
                  <span className="ml-2 rounded-md bg-brand-accent px-1.5 py-0.5 align-middle text-[0.78rem] font-bold text-white">
                    현재
                  </span>
                )}
              </p>
              <p className="tabular text-[0.8rem] text-neutral-text2">
                {at
                  ? fmtDate(at, "datetime")
                  : passed
                    ? "처리됨"
                    : s === "pending"
                      ? "데모 결제 · 실제 결제 없음"
                      : "예정"}
              </p>
            </div>
          </li>
        );
      })}
      {terminal && (
        <li className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-semantic-error text-white">
              <TerminalIcon size={14} />
            </span>
          </div>
          <div className="-mt-0.5">
            <p className="text-[0.95rem] font-bold text-semantic-error">
              {ORDER_STATUS_LABEL[terminal]}
              <span className="ml-2 rounded-md bg-semantic-error px-1.5 py-0.5 align-middle text-[0.78rem] font-bold text-white">
                현재
              </span>
            </p>
            <p className="tabular text-[0.8rem] text-neutral-text2">
              {atOf(terminal) ? fmtDate(atOf(terminal)!, "datetime") : ""}
            </p>
          </div>
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
    <div className="flex items-center gap-3">
      <ProductImage
        colors={p.colors}
        variant={v ? Math.max(0, p.colors.indexOf(v.color)) : 0}
        label={p.name}
        className="w-16 shrink-0"
        ratio="aspect-[3/4]"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.95rem] font-semibold leading-snug">{p.name}</p>
        <p className="text-[0.82rem] text-neutral-text2">
          {v ? `${v.color} · ${v.size}` : "옵션 정보 없음"} · {item.qty}개
        </p>
        <p className="tabular mt-0.5 text-[0.9rem] font-bold">{krw(item.unitPrice * item.qty)}</p>
      </div>
    </div>
  );
  return linkable ? (
    <Link
      href={`/products/${p.id}`}
      className="-mx-2 block rounded-xl px-2 py-1.5 transition-colors hover:bg-brand-ivory"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** 주문 정보 행 — 배송지 · 요청사항 · 주문자 · 결제수단 · 쿠폰 (있는 것만) */
export function OrderInfoRows({ order }: { order: Order }) {
  const m = parseOrderMemo(order.memo);
  const rows: [string, string][] = [
    ["배송지", order.address],
    ["요청사항", m.request],
    ["주문자", m.orderer],
    ["결제수단", m.payment || "카드"],
    ["쿠폰", m.coupon],
  ].filter((r): r is [string, string] => !!r[1]);
  return (
    <dl className="space-y-2 text-[0.92rem]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-4">
          <dt className="w-16 shrink-0 text-neutral-text2">{k}</dt>
          <dd className="min-w-0 flex-1 break-keep text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function OrderCard({ order }: { order: Order }) {
  const first = PRODUCT_BY_ID[order.items[0]?.productId];
  const v = VARIANT_BY_ID[order.items[0]?.variantId];
  return (
    <Link
      href={`/my/orders/${order.id}`}
      className="hover-lift block rounded-cardlg border border-neutral-border bg-white p-4 active:bg-brand-ivory md:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="tabular min-w-0 text-[0.82rem] text-neutral-text2">
          {fmtDate(order.createdAt, "datetime")} · <span className="whitespace-nowrap">{order.id}</span>
        </p>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex items-center gap-3">
        {first && (
          <ProductImage
            colors={first.colors}
            variant={v ? Math.max(0, first.colors.indexOf(v.color)) : 0}
            label={first.name}
            className="w-16 shrink-0"
            ratio="aspect-[3/4]"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{orderSummary(order)}</p>
          {v && (
            <p className="text-[0.82rem] text-neutral-text2">
              {v.color} · {v.size}
              {order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ""}
            </p>
          )}
          <p className="tabular mt-1 font-bold">{krw(order.total)}</p>
        </div>
      </div>
    </Link>
  );
}

export function PriceSummary({
  subtotal,
  itemDiscount,
  coupon,
  shipping,
  total,
  couponLabel,
  className,
}: {
  subtotal: number;
  itemDiscount: number;
  coupon: number;
  shipping: number;
  total: number;
  couponLabel?: string;
  className?: string;
}) {
  return (
    <dl className={cn("space-y-2 text-[0.92rem]", className)}>
      <div className="flex justify-between gap-2">
        <dt className="text-neutral-text2">상품금액</dt>
        <dd className="tabular">{krw(subtotal + itemDiscount)}</dd>
      </div>
      {itemDiscount > 0 && (
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-text2">상품 할인</dt>
          <dd className="tabular text-semantic-error">−{krw(itemDiscount)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-2">
        <dt className="text-neutral-text2">쿠폰 할인{couponLabel ? ` (${couponLabel})` : ""}</dt>
        <dd className={cn("tabular", coupon > 0 && "text-semantic-error")}>{coupon > 0 ? `−${krw(coupon)}` : "0원"}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-neutral-text2">배송비</dt>
        <dd className="tabular">{shipping === 0 ? "무료" : krw(shipping)}</dd>
      </div>
      <div className="mt-1 flex justify-between gap-2 border-t border-neutral-border pt-3">
        <dt className="font-bold">최종 결제예정금액</dt>
        <dd className="tabular text-[1.25rem] font-black">{krw(total)}</dd>
      </div>
    </dl>
  );
}
