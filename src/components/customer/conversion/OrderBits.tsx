"use client";
import Link from "next/link";
import { Check, ChevronRight, Circle, XCircle, RotateCcw, Repeat } from "lucide-react";
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

/** 지금 상태를 고객 말로 — 상태 이름보다 '무슨 일이 일어나고 있는지'를 먼저 */
const STATUS_MESSAGE: Record<OrderStatus, { title: string; desc: string }> = {
  pending: { title: "주문이 접수되었어요", desc: "확인되면 바로 상품 준비를 시작해요." },
  preparing: { title: "상품을 준비하고 있어요", desc: "준비가 끝나면 출고하고 알림으로 알려드려요." },
  shipped: { title: "상품이 출고되었어요", desc: "택배사로 전달되었어요. 곧 배송이 시작돼요." },
  "in-transit": { title: "배송 중이에요", desc: "도착하면 알림으로 알려드려요." },
  delivered: { title: "배송이 완료되었어요", desc: "사이즈가 맞지 않으면 수령 후 7일 이내 교환할 수 있어요." },
  cancelled: { title: "주문이 취소되었어요", desc: "다시 주문하려면 상품 화면에서 담아주세요." },
  "return-requested": { title: "반품 요청을 접수했어요", desc: "회수 일정이 정해지면 알려드려요." },
  "exchange-requested": { title: "교환 요청을 접수했어요", desc: "교환 상품 준비가 시작되면 알려드려요." },
};

/** 진행 바 아래 짧은 이름 — 좁은 화면에서 다섯 단계가 붙지 않게 (전체 이름은 처리 이력에) */
const STEP_SHORT: Partial<Record<OrderStatus, string>> = {
  pending: "결제대기",
  preparing: "상품준비",
  shipped: "출고",
  "in-transit": "배송중",
  delivered: "배송완료",
};

/** 배송 진행 — 가로 진행 바 + 지금 상태 문구. 상세 이력(시각)은 OrderTimeline */
export function DeliveryProgress({ order, compact }: { order: Order; compact?: boolean }) {
  const reachedIdx = Math.max(
    -1,
    ...order.statusHistory.map((h) => ORDER_STATUS_FLOW.indexOf(h.status)),
    ORDER_STATUS_FLOW.indexOf(order.status),
  );
  const terminal = !ORDER_STATUS_FLOW.includes(order.status);
  const msg = STATUS_MESSAGE[order.status];
  const pct = reachedIdx <= 0 ? 0 : (reachedIdx / (ORDER_STATUS_FLOW.length - 1)) * 100;
  return (
    <div data-delivery-progress>
      {!compact && (
        <div className="mb-4">
          <p className={cn("text-[1.15rem] font-bold leading-snug", terminal && "text-semantic-error")}>{msg.title}</p>
          <p className="mt-0.5 text-[0.88rem] text-neutral-text2">{msg.desc}</p>
        </div>
      )}
      <div className="relative" role="img" aria-label={`배송 진행: ${ORDER_STATUS_LABEL[order.status]}`}>
        {/* 선: 점 중심을 잇는다 (양 끝 10% 안쪽) */}
        <div className="absolute left-[10%] right-[10%] top-[11px] h-[3px] rounded-full bg-neutral-border" aria-hidden>
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700 ease-out",
              terminal ? "bg-neutral-text2" : "bg-brand-black",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <ol className="relative grid grid-cols-5" aria-hidden>
          {ORDER_STATUS_FLOW.map((st, i) => {
            const done = i <= reachedIdx;
            const current = !terminal && i === reachedIdx;
            return (
              <li key={st} className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-[25px] w-[25px] items-center justify-center rounded-full border-2",
                    current
                      ? "border-brand-black bg-brand-black text-white ring-4 ring-brand-black/10"
                      : done
                        ? "border-brand-black bg-white text-brand-black"
                        : "border-neutral-border bg-white text-neutral-border",
                  )}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : <Circle size={6} fill="currentColor" />}
                </span>
                <span
                  className={cn(
                    "mt-1.5 whitespace-nowrap text-[0.78rem] leading-tight",
                    current ? "font-bold text-neutral-text" : done ? "text-neutral-text" : "text-neutral-text2",
                  )}
                >
                  {STEP_SHORT[st]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

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

const FLOW: OrderStatus[] = ["pending", "preparing", "shipped", "in-transit", "delivered"];
const AFTER: OrderStatus[] = ["cancelled", "return-requested", "exchange-requested"];

/** 마이 — 주문·배송 현황 한 줄. 상태별 건수를 누르면 그 상태의 주문 목록으로 간다 */
export function OrderStatusStrip({ orders }: { orders: Order[] }) {
  const count = (st: OrderStatus) => orders.filter((o) => o.status === st).length;
  const after = orders.filter((o) => AFTER.includes(o.status)).length;
  return (
    <section
      className="rounded-cardlg border border-neutral-border bg-white"
      aria-labelledby="order-strip-title"
      data-order-strip
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-4 md:px-6">
        <h2 id="order-strip-title" className="text-[1.05rem] font-bold">
          주문·배송 현황
        </h2>
        <Link
          href="/my?tab=orders"
          className="tap inline-flex items-center gap-0.5 text-[0.85rem] font-semibold text-neutral-text2 hover:text-neutral-text"
        >
          전체 주문
          <ChevronRight size={15} aria-hidden />
        </Link>
      </div>
      <ol className="grid grid-cols-5 px-1.5 py-3 md:px-4">
        {FLOW.map((st, i) => {
          const n = count(st);
          return (
            <li key={st} className="relative min-w-0">
              <Link
                href={`/my?tab=orders&status=${st === "delivered" ? "delivered" : "active"}`}
                aria-label={`${STEP_SHORT[st]} ${n}건`}
                className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors hover:bg-neutral-canvas active:bg-neutral-canvas"
              >
                <span
                  className={cn(
                    "tabular text-[1.4rem] font-black leading-none",
                    n ? "text-neutral-text" : "text-neutral-border",
                  )}
                >
                  {n}
                </span>
                <span className="whitespace-nowrap text-[0.78rem] font-medium text-neutral-text2">
                  {STEP_SHORT[st]}
                </span>
              </Link>
              {i < FLOW.length - 1 && (
                <ChevronRight
                  size={13}
                  aria-hidden
                  className="pointer-events-none absolute -right-[6.5px] top-[17px] text-neutral-border"
                />
              )}
            </li>
          );
        })}
      </ol>
      <Link
        href="/my?tab=orders&status=after"
        className="flex min-h-12 items-center justify-between gap-3 rounded-b-cardlg border-t border-neutral-border px-5 text-[0.88rem] transition-colors hover:bg-neutral-canvas/60 md:px-6"
      >
        <span className="text-neutral-text2">취소·반품·교환</span>
        <span className="tabular inline-flex items-center gap-0.5 font-bold">
          {after}건
          <ChevronRight size={15} className="text-neutral-text2" aria-hidden />
        </span>
      </Link>
    </section>
  );
}

/** 마이 — 최근 주문을 한 카드 안의 짧은 줄로. 상태는 이름 대신 '지금 무슨 일인지' 문장으로 */
export function OrderMiniList({ orders }: { orders: Order[] }) {
  return (
    <ul className="divide-y divide-neutral-border overflow-hidden rounded-cardlg border border-neutral-border bg-white">
      {orders.map((o) => {
        const first = PRODUCT_BY_ID[o.items[0]?.productId];
        const v = VARIANT_BY_ID[o.items[0]?.variantId];
        const tone = AFTER.includes(o.status)
          ? "text-semantic-warning"
          : o.status === "delivered"
            ? "text-neutral-text2"
            : "text-brand-accent";
        return (
          <li key={o.id}>
            <Link
              href={`/my/orders/${o.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-canvas/60 active:bg-neutral-canvas md:px-5"
            >
              {first && (
                <ProductImage
                  colors={first.colors}
                  variant={v ? Math.max(0, first.colors.indexOf(v.color)) : 0}
                  label={first.name}
                  name={first.name}
                  category={first.categoryId}
                  className="w-14 shrink-0 rounded-lg"
                  ratio="aspect-[3/4]"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("text-[0.82rem] font-bold", tone)}>{STATUS_MESSAGE[o.status].title}</p>
                <p className="truncate font-semibold leading-snug">{orderSummary(o)}</p>
                <p className="tabular text-[0.8rem] text-neutral-text2">
                  {fmtDate(o.createdAt)} · {krw(o.total)}
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-neutral-text2" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
