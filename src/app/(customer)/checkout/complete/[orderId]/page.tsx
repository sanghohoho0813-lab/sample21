"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ExternalLink, PackageSearch, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/dates";
import { krw } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { Container } from "@/components/customer/Section";
import { Button } from "@/components/ui/Button";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { EmptyState, SkeletonCard } from "@/components/ui/States";
import { OrderStatusBadge } from "@/components/ax/StatusBadges";
import { OrderItemRow } from "@/components/customer/conversion/OrderBits";
import { useDocumentTitle } from "@/components/customer/conversion/shared";

function CompleteContent({ orderId }: { orderId: string }) {
  const store = useApp();
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) {
    return <EmptyState icon={<PackageSearch size={22} />} title="주문 정보를 찾을 수 없습니다" desc={`주문번호 '${orderId}'는 이 기기의 DEMO 주문 목록에 없습니다. 데모를 초기화했거나 다른 기기에서 주문했을 수 있습니다.`} action={<div className="flex gap-2"><Button variant="brand" href="/my/orders">주문내역 보기</Button><Button variant="outline" href="/ranking">쇼핑 계속</Button></div>} />;
  }
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
  return (
    <div className="max-w-[720px] mx-auto space-y-5">
      <div className="rounded-cardlg border border-neutral-border bg-white p-6 md:p-8 text-center shadow-card">
        <span className="mx-auto h-16 w-16 rounded-full bg-semantic-success/10 text-semantic-success inline-flex items-center justify-center animate-scaleIn"><CheckCircle2 size={36} /></span>
        <h1 className="mt-4 text-[1.6rem] md:text-[1.9rem] font-bold tracking-tight">DEMO 주문이 완료되었습니다</h1>
        <p className="mt-1 text-neutral-text2">{order.customerName}님, 주문해 주셔서 감사합니다. 실제 결제는 이루어지지 않았습니다.</p>
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-brand-ivory px-4 py-2.5 text-[0.9rem]"><span className="text-neutral-text2">주문번호</span><span className="font-black tabular text-[1.05rem]">{order.id}</span><OrderStatusBadge status={order.status} /><DemoBadge /></div>
        <p className="mt-2 text-[0.82rem] text-neutral-text2 tabular">{fmtDate(order.createdAt, "datetime")} · {order.channel === "mobile" ? "모바일" : "웹"} 주문</p>
      </div>

      <div className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
        <p className="font-bold mb-3">주문 상품 {order.items.length}종 · {itemCount}개</p>
        <ul className="divide-y divide-neutral-border">{order.items.map((it) => <li key={it.variantId} className="py-3 first:pt-0 last:pb-0"><OrderItemRow item={it} /></li>)}</ul>
        <dl className="mt-4 pt-4 border-t border-neutral-border space-y-1.5 text-[0.92rem]">
          <div className="flex justify-between"><dt className="text-neutral-text2">배송지</dt><dd className="text-right">{order.address}</dd></div>
          {order.memo && <div className="flex justify-between gap-4"><dt className="text-neutral-text2 shrink-0">요청·결제</dt><dd className="text-right">{order.memo}</dd></div>}
          <div className="flex justify-between"><dt className="text-neutral-text2">할인</dt><dd className="tabular">{order.discount > 0 ? `−${krw(order.discount)}` : "0원"}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-text2">배송비</dt><dd className="tabular">{order.shippingFee === 0 ? "무료" : krw(order.shippingFee)}</dd></div>
          <div className="flex justify-between pt-2 border-t border-neutral-border"><dt className="font-bold">결제예정금액</dt><dd className="font-black text-[1.2rem] tabular">{krw(order.total)}</dd></div>
        </dl>
      </div>

      <div className="rounded-cardlg border border-brand-accent/30 bg-brand-accent/5 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1"><p className="font-bold flex items-center gap-2"><Badge tone="accent" size="sm">Closed Loop 2</Badge>이 주문은 Business AX 주문·매출·재고에 즉시 반영되었습니다</p><p className="text-[0.85rem] text-neutral-text2 mt-1">운영팀이 상품준비 → 출고 → 배송 상태로 바꾸면 My Page 주문상태와 알림에 그대로 나타납니다.</p></div>
        {store.role !== "customer" && <Link href="/ax/orders" className="inline-flex items-center gap-1 text-[0.85rem] font-bold text-brand-accent hover:underline underline-offset-2 whitespace-nowrap"><ExternalLink size={14} />(대표·관리자) Business AX에서 보기</Link>}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="brand" size="lg" href={`/my/orders/${order.id}`} className="flex-1" icon={<PackageSearch size={18} />}>주문내역 보기</Button>
        <Button variant="outline" size="lg" href="/ranking" className="flex-1" icon={<ArrowRight size={18} />}>쇼핑 계속</Button>
      </div>
    </div>
  );
}

export default function CompletePage() {
  const params = useParams<{ orderId: string }>();
  const orderId = decodeURIComponent(String(params?.orderId ?? ""));
  useDocumentTitle("주문 완료 (DEMO)");
  return (
    <Container className="py-8 md:py-12">
      <Hydrated fallback={<div className="max-w-[720px] mx-auto space-y-5"><SkeletonCard lines={3} /><SkeletonCard lines={5} /></div>}><CompleteContent orderId={orderId} /></Hydrated>
    </Container>
  );
}
