"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PackageCheck, Clock, Truck, Undo2, Search, Smartphone, Monitor, MapPin, MessageSquare, ChevronRight, XCircle, ExternalLink, Zap } from "lucide-react";
import { PageHeader } from "@/components/ax/AxShell";
import { Hydrated } from "@/components/system/Hydrated";
import { useIsMobile } from "@/components/system/hooks";
import { useApp, ROLE_NAME } from "@/lib/store";
import { DEMO_CUSTOMER_ID, PRODUCT_BY_ID, VARIANT_BY_ID } from "@/lib/demo/seed";
import { allOrders, ORDER_STATUS_LABEL } from "@/lib/kpi";
import type { Order, OrderStatus } from "@/lib/types";
import { krw, num } from "@/lib/format";
import { fmtDate, relTime, todayKey } from "@/lib/dates";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input, Segmented } from "@/components/ui/Form";
import { KpiCard, Stat } from "@/components/ui/Kpi";
import { Drawer } from "@/components/ui/Overlay";
import { ProductImage } from "@/components/ui/ProductImage";
import { EmptyState } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { OrderStatusBadge } from "@/components/ax/StatusBadges";
import { displayName, LiveFreshness, MoreButton, NoteCard, PageSkeleton, useMore } from "./shared";
import { cn } from "@/lib/cn";

type Tab = "all" | OrderStatus;
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" }, { key: "pending", label: "신규주문" }, { key: "preparing", label: "상품준비" }, { key: "shipped", label: "출고완료" },
  { key: "in-transit", label: "배송중" }, { key: "delivered", label: "배송완료" }, { key: "cancelled", label: "취소" }, { key: "return-requested", label: "반품요청" }, { key: "exchange-requested", label: "교환요청" },
];
/* Next step per ORDER_STATUS_FLOW: pending→preparing→shipped→in-transit→delivered (labels fixed by acceptance contract) */
const NEXT_STEP: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "preparing", label: "상품준비" },
  preparing: { status: "shipped", label: "출고완료" },
  shipped: { status: "in-transit", label: "배송중" },
  "in-transit": { status: "delivered", label: "배송완료" },
};

export function OrdersPage() {
  return (
    <>
      <PageHeader title="주문·배송" desc="고객 화면에서 접수된 DEMO 주문이 이 목록에 바로 나타나고, 여기서 바꾼 배송 상태는 고객 My Page에 그대로 반영됩니다 (Loop 2)."
        badge={<Badge tone="demo">DEMO</Badge>} right={<LiveFreshness />} />
      <Hydrated fallback={<PageSkeleton kpis={4} />}><OrdersBody /></Hydrated>
    </>
  );
}

function OrdersBody() {
  const store = useApp();
  const role = store.role;
  const mobile = useIsMobile();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [range, setRange] = useState<"all" | "today" | "7d" | "30d">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => { const v = params.get("q"); if (v) setQ(v); }, [params]);

  const orders = useMemo(() => allOrders(store), [store]);
  const isCustomerCreated = (id: string) => store.orders.some((o) => o.id === id);
  const today = todayKey();
  const counts = useMemo(() => { const c: Record<string, number> = { all: orders.length }; for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1; return c; }, [orders]);
  const summary = {
    today: orders.filter((o) => o.createdAt.slice(0, 10) === today).length,
    waiting: orders.filter((o) => o.status === "pending" || o.status === "preparing").length,
    shipping: orders.filter((o) => o.status === "shipped" || o.status === "in-transit").length,
    returns: orders.filter((o) => o.status === "return-requested" || o.status === "exchange-requested").length,
  };

  const filtered = useMemo(() => {
    const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 0;
    const since = days ? Date.now() - days * 86400000 : 0;
    const term = q.trim().toLowerCase();
    const list = orders.filter((o) => (tab === "all" || o.status === tab) && (!since || new Date(o.createdAt).getTime() >= since || (range === "today" && o.createdAt.slice(0, 10) === today)) && (!term || o.id.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term)));
    // customer-created (store.orders) always on top, then newest first
    return [...list].sort((a, b) => Number(isCustomerCreated(b.id)) - Number(isCustomerCreated(a.id)) || b.createdAt.localeCompare(a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, tab, q, range, store.orders]);
  const { limit, hasMore, more } = useMore(filtered.length, 40);
  const newOrders = orders.filter((o) => isCustomerCreated(o.id));

  const change = (o: Order, status: OrderStatus) => {
    store.updateOrderStatus(o.id, status, ROLE_NAME[role]);
    toast("고객 My Page 주문상태에 반영되었습니다", `${o.id} → ${ORDER_STATUS_LABEL[status]} · 처리자 ${ROLE_NAME[role]}`, "success");
  };
  const demoReturn = (o: Order) => toast(`${o.status === "exchange-requested" ? "교환" : "반품"} 처리 (Demo)`, `${o.id} · 회수·환불은 택배·PG 연동 후 처리됩니다 (READY). 핏·반품 화면에서 승인·완료를 기록할 수 있습니다.`, "info");

  const ActionButtons = ({ o }: { o: Order }) => {
    const next = NEXT_STEP[o.status];
    return (
      <div className="flex flex-wrap gap-1.5">
        {next && <Button size="sm" onClick={(e) => { e.stopPropagation(); change(o, next.status); }}>{next.label}</Button>}
        {(o.status === "pending" || o.status === "preparing") && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); change(o, "cancelled"); }} icon={<XCircle size={14} />}>취소</Button>}
        {(o.status === "return-requested" || o.status === "exchange-requested") && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); demoReturn(o); }} icon={<Undo2 size={14} />}>{o.status === "exchange-requested" ? "교환 처리(Demo)" : "반품 처리(Demo)"}</Button>}
        {!next && o.status !== "pending" && o.status !== "preparing" && o.status !== "return-requested" && o.status !== "exchange-requested" && <span className="text-[0.82rem] text-neutral-text2">처리 완료</span>}
      </div>
    );
  };

  const summarize = (o: Order) => { const first = PRODUCT_BY_ID[o.items[0]?.productId]; const v = VARIANT_BY_ID[o.items[0]?.variantId]; const rest = o.items.length - 1; return `${first?.name ?? "-"}${v ? ` (${v.color}/${v.size})` : ""}${rest > 0 ? ` 외 ${rest}` : ""}`; };

  const columns: Column<Order>[] = [
    { key: "id", header: "주문번호", primary: true, cell: (o) => (
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold tabular">{o.id}</span>{isCustomerCreated(o.id) && <Badge tone="primary" size="sm"><Zap size={11} />고객 화면에서 접수</Badge>}{mobile && <OrderStatusBadge status={o.status} />}</div>
        {mobile && <div className="mt-2"><ActionButtons o={o} /></div>}
      </div>
    ) },
    { key: "time", header: "시간", cell: (o) => <span title={fmtDate(o.createdAt, "datetime")}>{relTime(o.createdAt)}</span> },
    { key: "customer", header: "고객", cell: (o) => displayName(o.customerName, role) },
    { key: "items", header: "상품", cell: (o) => summarize(o) },
    { key: "total", header: "금액", align: "right", cell: (o) => krw(o.total) },
    { key: "channel", header: "채널", cell: (o) => <span className="inline-flex items-center gap-1 text-neutral-text2">{o.channel === "mobile" ? <Smartphone size={14} /> : <Monitor size={14} />}{o.channel === "mobile" ? "모바일" : "웹"}</span> },
    { key: "status", header: "상태", hideOnMobile: true, cell: (o) => <OrderStatusBadge status={o.status} /> },
    { key: "act", header: "처리", hideOnMobile: true, cell: (o) => <ActionButtons o={o} /> },
  ];

  const open = openId ? orders.find((o) => o.id === openId) ?? null : null;

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="오늘 주문" value={num(summary.today)} icon={<PackageCheck size={18} />} accent="#5B8DEF" sub={`고객 화면 DEMO 주문 ${newOrders.length}건 포함`} />
        <KpiCard label="처리 대기" value={num(summary.waiting)} icon={<Clock size={18} />} accent="#D79A43" sub="신규주문 + 상품준비" />
        <KpiCard label="배송중" value={num(summary.shipping)} icon={<Truck size={18} />} accent="#3AAFA9" sub="출고완료 + 배송중" />
        <KpiCard label="반품·교환 요청" value={num(summary.returns)} icon={<Undo2 size={18} />} accent="#D66A5E" sub="핏·반품 화면에서 처리" href="/ax/fit-returns" />
      </div>

      {/* Customer-created orders (Loop 2) */}
      <Card className={cn("mt-6", newOrders.length ? "border-theme-primary/40" : "")} pad="md" data-tour="orders-new">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <span className="h-11 w-11 rounded-2xl bg-theme-soft text-theme-primary flex items-center justify-center shrink-0"><Zap size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">고객 화면에서 접수된 DEMO 주문 {newOrders.length ? `${newOrders.length}건` : "없음"}</p>
            <p className="text-[0.88rem] text-neutral-text2 mt-0.5 leading-relaxed">{newOrders.length ? "목록 맨 위에 '고객 화면에서 접수' 표시로 나타납니다. 상태를 바꾸면 고객 My Page와 알림에 즉시 반영됩니다." : "고객 화면에서 장바구니 → 주문하면 이 목록 맨 위에 바로 나타납니다. 시연 시 '고객 화면 보기'로 주문해 보세요."}</p>
          </div>
          {newOrders.length ? <Button variant="outline" onClick={() => setOpenId(newOrders[0].id)} icon={<ChevronRight size={16} />}>최근 주문 {newOrders[0].id}</Button> : <Button variant="outline" href="/cart" icon={<ExternalLink size={16} />}>고객 화면에서 주문하기</Button>}
        </div>
      </Card>

      {/* Tabs */}
      <div className="mt-6 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto hide-scrollbar">
        <div className="inline-flex gap-1.5 min-w-max" role="tablist" aria-label="주문 상태">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cn("h-10 px-3.5 rounded-full border text-[0.88rem] font-semibold whitespace-nowrap transition-all duration-fast active:scale-[0.98]", tab === t.key ? "bg-brand-black text-white border-brand-black" : "bg-white border-neutral-border text-neutral-text hover:border-neutral-text2")}>{t.label}<span className={cn("ml-1.5 tabular", tab === t.key ? "text-white/70" : "text-neutral-text2")}>{counts[t.key] ?? 0}</span></button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1 md:max-w-sm"><Input name="order-q" placeholder="주문번호 또는 고객명 검색" value={q} onChange={(e) => setQ(e.target.value)} aria-label="주문 검색" /></div>
        <Segmented value={range} onChange={setRange} options={[{ value: "all", label: "전체 기간" }, { value: "today", label: "오늘" }, { value: "7d", label: "7일" }, { value: "30d", label: "30일" }]} />
        <span className="text-[0.85rem] text-neutral-text2 md:ml-auto">{num(filtered.length)}건</span>
      </div>

      <div className="mt-4">
        <DataTable rows={filtered.slice(0, limit)} columns={columns} rowKey={(o) => o.id} onRowClick={(o) => setOpenId(o.id)} dense
          empty={<EmptyState title="조건에 맞는 주문이 없습니다" desc="상태 탭·기간·검색어를 바꿔 보세요." icon={<Search size={22} />} action={<Button variant="outline" onClick={() => { setTab("all"); setQ(""); setRange("all"); }}>필터 초기화</Button>} />} />
        <MoreButton hasMore={hasMore} onClick={more} remaining={filtered.length - limit} />
      </div>
      <NoteCard className="mt-4">상태 흐름: 결제대기(DEMO) → 상품준비 → 출고완료 → 배송중 → 배송완료. 취소는 상품준비 전까지 가능합니다. 실제 결제·택배 API는 연동 예정(READY)이며 Demo에서는 상태만 바뀝니다.</NoteCard>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `주문 ${open.id}` : ""} width="max-w-lg" footer={open ? <ActionButtons o={open} /> : undefined}>
        {open && <OrderDetail o={open} role={role} customerCreated={isCustomerCreated(open.id)} />}
      </Drawer>
    </div>
  );
}

function OrderDetail({ o, role, customerCreated }: { o: Order; role: "owner" | "md" | "ops" | "customer"; customerCreated: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap"><OrderStatusBadge status={o.status} size="md" />{customerCreated && <Badge tone="primary"><Zap size={12} />고객 화면에서 접수</Badge>}<Badge tone="demo" size="sm">{o.source}</Badge></div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="주문 시각" value={<span className="text-[0.95rem]">{fmtDate(o.createdAt, "datetime")}</span>} />
        <Stat label="채널" value={o.channel === "mobile" ? "모바일" : "웹"} />
        <Stat label="고객" value={<span className="text-[1rem]">{displayName(o.customerName, role)}</span>} sub={<Link href={`/ax/customers?customer=${o.customerId}`} className="underline inline-flex items-center gap-0.5">고객 상세<ChevronRight size={12} /></Link>} />
        <Stat label="결제 금액" value={krw(o.total)} sub={`할인 ${krw(o.discount)} · 배송비 ${krw(o.shippingFee)}`} />
      </div>
      <div>
        <p className="font-bold mb-2">상품 {o.items.length}개</p>
        <ul className="space-y-2">
          {o.items.map((it) => { const p = PRODUCT_BY_ID[it.productId]; const v = VARIANT_BY_ID[it.variantId]; return (
            <li key={it.variantId} className="flex items-center gap-3 rounded-xl border border-neutral-border p-2.5">
              <ProductImage colors={p?.colors ?? ["블랙"]} label={p?.name} ratio="aspect-square" className="w-14 shrink-0" variant={v ? p.colors.indexOf(v.color) : 0} />
              <div className="min-w-0 flex-1">
                <Link href={`/ax/products/${it.productId}`} className="font-semibold text-[0.92rem] hover:text-theme-primary">{p?.name ?? it.productId}</Link>
                <p className="text-[0.82rem] text-neutral-text2">{v ? `${v.color} / ${v.size}` : it.variantId} · {it.qty}개</p>
              </div>
              <span className="tabular font-semibold text-[0.92rem] shrink-0">{krw(it.unitPrice * it.qty)}</span>
            </li>
          ); })}
        </ul>
      </div>
      <dl className="rounded-xl border border-neutral-border px-4">
        <div className="flex items-start gap-2 py-2.5 border-b border-neutral-border"><MapPin size={16} className="mt-0.5 text-neutral-text2 shrink-0" /><div><dt className="text-[0.8rem] text-neutral-text2">배송지 (가상)</dt><dd className="text-[0.92rem] font-semibold">{o.address}</dd></div></div>
        <div className="flex items-start gap-2 py-2.5"><MessageSquare size={16} className="mt-0.5 text-neutral-text2 shrink-0" /><div><dt className="text-[0.8rem] text-neutral-text2">메모</dt><dd className="text-[0.92rem]">{o.memo ?? "없음"}</dd></div></div>
      </dl>
      <div>
        <p className="font-bold mb-2">상태 이력</p>
        <ol className="relative border-l border-neutral-border ml-2 space-y-3">
          {o.statusHistory.map((h, i) => (
            <li key={`${h.status}-${i}`} className="pl-4">
              <span className={cn("absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full", i === o.statusHistory.length - 1 ? "bg-theme-primary" : "bg-neutral-border")} />
              <div className="flex items-center gap-2 flex-wrap"><OrderStatusBadge status={h.status} /><span className="text-[0.82rem] text-neutral-text2 tabular">{fmtDate(h.at, "datetime")}</span></div>
              <p className="text-[0.85rem] text-neutral-text2 mt-0.5">처리: {h.actor}</p>
            </li>
          ))}
        </ol>
      </div>
      {o.customerId === DEMO_CUSTOMER_ID && <NoteCard tone="info">이 주문은 시연 고객(김하늘)의 주문입니다. 상태를 바꾸면 <Link href={`/my/orders/${o.id}`} className="underline font-semibold">고객 My Page</Link>와 알림에 바로 반영됩니다.</NoteCard>}
    </div>
  );
}
