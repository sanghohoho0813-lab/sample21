"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, MapPin, CreditCard, XCircle, RotateCcw, Repeat, PackageSearch, ExternalLink } from "lucide-react";
import type { ReturnReason } from "@/lib/types";
import { DEMO_CUSTOMER_NAME, PRODUCT_BY_ID, RETURN_REASON_LABEL, VARIANT_BY_ID } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/dates";
import { krw } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { Container } from "@/components/customer/Section";
import { Button } from "@/components/ui/Button";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { Modal, Responsive } from "@/components/ui/Overlay";
import { Select, Textarea } from "@/components/ui/Form";
import { EmptyState, SkeletonCard } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { OrderStatusBadge } from "@/components/ax/StatusBadges";
import { cn } from "@/lib/cn";
import { OrderItemRow, OrderTimeline } from "@/components/customer/conversion/OrderBits";
import { myOrders, useDocumentTitle } from "@/components/customer/conversion/shared";

const REASONS = Object.keys(RETURN_REASON_LABEL) as ReturnReason[];

function OrderDetail({ id }: { id: string }) {
  const store = useApp();
  const order = myOrders(store).find((o) => o.id === id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [pickVid, setPickVid] = useState<string>("");
  const [reason, setReason] = useState<ReturnReason>("size-small");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const seen = useRef<string | null>(null);
  const track = store.track;
  useEffect(() => { if (order && seen.current !== order.id) { seen.current = order.id; track("view_order", { orderId: order.id, status: order.status }); } }, [order, track]);

  if (!order) {
    return <EmptyState icon={<PackageSearch size={22} />} title="주문을 찾을 수 없습니다" desc={`주문번호 '${id}'가 내 주문 목록에 없습니다.`} action={<div className="flex gap-2"><Button variant="brand" href="/my/orders">주문내역으로</Button><Button variant="outline" href="/ranking">쇼핑 계속</Button></div>} />;
  }
  const canCancel = order.status === "pending" || order.status === "preparing";
  const canAfter = order.status === "delivered";
  const myReturns = store.returns.filter((r) => r.orderId === order.id);
  const openPicker = (setter: (v: boolean) => void) => { setPickVid(order.items[0]?.variantId ?? ""); setReason("size-small"); setNote(""); setErr(""); setter(true); };

  const doCancel = () => { store.updateOrderStatus(order.id, "cancelled", DEMO_CUSTOMER_NAME); setCancelOpen(false); toast("취소 요청이 접수되었습니다", "Business AX 주문 목록에 '취소' 상태로 반영됩니다", "info"); };
  const doReturn = () => {
    if (!pickVid) { setErr("반품할 상품을 선택해주세요."); return; }
    if ((reason === "other" || reason === "fit") && note.trim().length < 2) { setErr("사유를 조금 더 자세히 적어주세요."); return; }
    store.requestReturn(order.id, pickVid, reason, note.trim() || undefined);
    setReturnOpen(false);
    toast("반품 요청이 접수되었습니다", `사유 '${RETURN_REASON_LABEL[reason]}'가 Fit Risk 계산에 반영됩니다`);
  };
  const doExchange = () => {
    if (!pickVid) { setErr("교환할 상품을 선택해주세요."); return; }
    store.updateOrderStatus(order.id, "exchange-requested", DEMO_CUSTOMER_NAME);
    setExchangeOpen(false);
    toast("교환 요청이 접수되었습니다", "운영팀 확인 후 교환 상품이 발송됩니다 (DEMO)");
  };
  const ItemPicker = () => (
    <div className="space-y-2" role="radiogroup" aria-label="상품 선택">
      {order.items.map((it) => { const p = PRODUCT_BY_ID[it.productId]; const v = VARIANT_BY_ID[it.variantId]; const on = pickVid === it.variantId; return (
        <label key={it.variantId} className={cn("flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors", on ? "border-brand-black bg-brand-ivory" : "border-neutral-border hover:bg-brand-ivory")}>
          <input type="radio" name="item" value={it.variantId} checked={on} onChange={() => setPickVid(it.variantId)} className="h-5 w-5 accent-[#111111]" />
          <span className="min-w-0 flex-1"><span className="block font-semibold text-[0.92rem] leading-snug">{p?.name}</span><span className="block text-[0.8rem] text-neutral-text2">{v ? `${v.color} · ${v.size}` : ""} · {it.qty}개</span></span>
        </label>
      ); })}
    </div>
  );

  return (
    <div className="max-w-[880px] mx-auto space-y-5">
      <div className="flex items-center gap-2"><Link href="/my/orders" className="h-10 w-10 -ml-2 inline-flex items-center justify-center rounded-full hover:bg-brand-ivory" aria-label="주문내역으로"><ChevronLeft size={22} /></Link><div className="min-w-0 flex-1"><p className="text-[0.82rem] text-neutral-text2 tabular">{fmtDate(order.createdAt, "datetime")} 주문</p><h1 className="text-[1.3rem] md:text-[1.6rem] font-bold tracking-tight leading-tight tabular">주문번호 {order.id}</h1></div><OrderStatusBadge status={order.status} size="md" /></div>

      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 items-start">
        <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6 min-w-0">
          <p className="font-bold mb-4 flex items-center gap-2">배송 진행 상태 <DemoBadge /></p>
          <OrderTimeline order={order} tour="c-order-status" />
          <p className="mt-4 text-[0.8rem] text-neutral-text2 leading-relaxed">상태는 Business AX 주문·배송 화면에서 운영직원이 변경하며, 이 화면과 알림에 동시에 반영됩니다.</p>
          {store.role !== "customer" && <Link href="/ax/orders" className="mt-2 inline-flex items-center gap-1 text-[0.82rem] font-bold text-brand-accent hover:underline underline-offset-2"><ExternalLink size={13} />(대표·관리자) Business AX에서 상태 변경</Link>}
        </section>

        <div className="space-y-5 min-w-0">
          <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
            <p className="font-bold mb-3">주문 상품 {order.items.length}종</p>
            <ul className="divide-y divide-neutral-border">{order.items.map((it) => <li key={it.variantId} className="py-3 first:pt-0 last:pb-0"><OrderItemRow item={it} /></li>)}</ul>
            {myReturns.length > 0 && <div className="mt-4 rounded-xl bg-brand-ivory px-4 py-3 text-[0.85rem]"><p className="font-bold">반품 요청 {myReturns.length}건</p>{myReturns.map((r) => <p key={r.id} className="text-neutral-text2">{PRODUCT_BY_ID[r.productId]?.name} · {RETURN_REASON_LABEL[r.reason]}{r.note ? ` · ${r.note}` : ""} · {fmtDate(r.createdAt)}</p>)}</div>}
          </section>
          <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6 space-y-3 text-[0.92rem]">
            <div className="flex gap-3"><MapPin size={18} className="shrink-0 text-neutral-text2 mt-0.5" /><div><p className="text-[0.8rem] text-neutral-text2">배송지</p><p className="font-semibold">{order.address}</p></div></div>
            <div className="flex gap-3"><CreditCard size={18} className="shrink-0 text-neutral-text2 mt-0.5" /><div><p className="text-[0.8rem] text-neutral-text2">결제·요청사항</p><p className="font-semibold leading-relaxed">{order.memo ?? "결제수단(DEMO): 카드"}</p></div></div>
            <dl className="pt-3 border-t border-neutral-border space-y-1.5">
              <div className="flex justify-between"><dt className="text-neutral-text2">상품금액</dt><dd className="tabular">{krw(order.subtotal + order.items.reduce((s, i) => s + i.discount * i.qty, 0))}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-text2">할인 합계</dt><dd className="tabular">{order.discount > 0 ? `−${krw(order.discount)}` : "0원"}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-text2">배송비</dt><dd className="tabular">{order.shippingFee === 0 ? "무료" : krw(order.shippingFee)}</dd></div>
              <div className="flex justify-between pt-2 border-t border-neutral-border"><dt className="font-bold">결제금액 <Badge tone="demo" size="sm">DEMO</Badge></dt><dd className="font-black text-[1.2rem] tabular">{krw(order.total)}</dd></div>
            </dl>
          </section>
          <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
            <p className="font-bold mb-3">주문 관리</p>
            <div className="flex flex-wrap gap-2">
              {canCancel && <Button variant="outline" onClick={() => setCancelOpen(true)} icon={<XCircle size={16} />}>취소 요청</Button>}
              {canAfter && <Button variant="outline" onClick={() => openPicker(setReturnOpen)} icon={<RotateCcw size={16} />}>반품 요청</Button>}
              {canAfter && <Button variant="outline" onClick={() => openPicker(setExchangeOpen)} icon={<Repeat size={16} />}>교환 요청</Button>}
              {!canCancel && !canAfter && <p className="text-[0.88rem] text-neutral-text2">{order.status === "cancelled" ? "취소된 주문입니다." : order.status === "return-requested" ? "반품 요청이 접수되어 운영팀이 확인 중입니다." : order.status === "exchange-requested" ? "교환 요청이 접수되어 운영팀이 확인 중입니다." : "출고 이후에는 취소할 수 없습니다. 배송 완료 후 반품·교환을 요청하세요."}</p>}
            </div>
            <p className="mt-3 text-[0.8rem] text-neutral-text2">반품 사유는 구조화되어 Business AX 핏·반품(Fit Risk) 계산에 반영됩니다 — Closed Loop 3.</p>
          </section>
        </div>
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="주문을 취소할까요?" size="sm" footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setCancelOpen(false)}>돌아가기</Button><Button variant="danger" onClick={doCancel}>취소 요청</Button></div>}>
        <p className="text-[0.95rem] leading-relaxed">주문번호 <span className="font-bold tabular">{order.id}</span>의 상품 {order.items.length}종을 취소합니다. DEMO 주문이므로 환불 절차는 없으며, 취소 상태가 Business AX에 바로 반영됩니다.</p>
      </Modal>

      <Responsive open={returnOpen} onClose={() => setReturnOpen(false)} title="반품 요청" footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setReturnOpen(false)}>닫기</Button><Button variant="brand" onClick={doReturn}>반품 요청 보내기</Button></div>}>
        <div className="space-y-4">
          <div><p className="font-semibold text-[0.9rem] mb-2">반품할 상품</p><ItemPicker /></div>
          <Select label="반품 사유" name="reason" value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)}>{REASONS.map((r) => <option key={r} value={r}>{RETURN_REASON_LABEL[r]}</option>)}</Select>
          <Textarea label="상세 내용 (선택)" name="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 허리가 타이트해서 한 치수 크게 입어야 할 것 같아요" maxLength={200} />
          {err && <p className="text-[0.85rem] text-semantic-error">{err}</p>}
          <p className="text-[0.8rem] text-neutral-text2 leading-relaxed">사이즈 관련 사유는 해당 상품의 핏 안내 개선 Action(Fit Engine)의 근거가 됩니다.</p>
        </div>
      </Responsive>

      <Responsive open={exchangeOpen} onClose={() => setExchangeOpen(false)} title="교환 요청" footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setExchangeOpen(false)}>닫기</Button><Button variant="brand" onClick={doExchange}>교환 요청 보내기</Button></div>}>
        <div className="space-y-4">
          <div><p className="font-semibold text-[0.9rem] mb-2">교환할 상품</p><ItemPicker /></div>
          <Select label="교환 사유" name="exchangeReason" value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)}>{REASONS.filter((r) => r !== "change-of-mind" && r !== "delivery").map((r) => <option key={r} value={r}>{RETURN_REASON_LABEL[r]}</option>)}</Select>
          {err && <p className="text-[0.85rem] text-semantic-error">{err}</p>}
          <p className="text-[0.8rem] text-neutral-text2 leading-relaxed">운영팀이 재고를 확인한 뒤 교환 상품을 발송합니다. DEMO에서는 주문 상태만 '교환요청'으로 바뀝니다.</p>
        </div>
      </Responsive>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id ?? ""));
  useDocumentTitle(`주문 ${id}`);
  return (
    <Container className="py-6 md:py-10">
      <Hydrated fallback={<div className="max-w-[880px] mx-auto grid md:grid-cols-2 gap-5"><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div>}><OrderDetail id={id} /></Hydrated>
    </Container>
  );
}
