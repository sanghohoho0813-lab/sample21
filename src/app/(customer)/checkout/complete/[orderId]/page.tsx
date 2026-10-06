"use client";
import { useParams } from "next/navigation";
import { CheckCircle2, PackageSearch, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/dates";
import { krw } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { Container } from "@/components/customer/Section";
import { Button } from "@/components/ui/Button";

import { EmptyState, SkeletonCard } from "@/components/ui/States";
import { OrderStatusBadge } from "@/components/ax/StatusBadges";
import { OrderInfoRows, OrderItemRow } from "@/components/customer/conversion/OrderBits";
import { LoopHint } from "@/components/customer/LoopHint";

function CompleteContent({ orderId }: { orderId: string }) {
  const store = useApp();
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) {
    return (
      <EmptyState
        icon={<PackageSearch size={22} />}
        title="주문 정보를 찾을 수 없습니다"
        desc={`주문번호 '${orderId}'는 이 기기의 데모 주문 목록에 없습니다. 데모를 초기화했거나 다른 기기에서 주문했을 수 있습니다.`}
        action={
          <div className="flex gap-2">
            <Button variant="brand" href="/my/orders">
              주문내역 보기
            </Button>
            <Button variant="outline" href="/ranking">
              쇼핑 계속
            </Button>
          </div>
        }
      />
    );
  }
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      <div className="rounded-cardlg border border-neutral-border bg-white p-6 text-center shadow-card md:p-8">
        <span className="mx-auto inline-flex h-16 w-16 animate-scaleIn items-center justify-center rounded-full bg-semantic-success/10 text-semantic-success">
          <CheckCircle2 size={36} />
        </span>
        <h1 className="mt-4 text-[1.6rem] font-bold tracking-tight md:text-[1.9rem]">주문이 완료되었습니다</h1>
        <p className="mt-1 text-neutral-text2">
          {order.customerName}님, 주문해 주셔서 감사합니다.
          <br />
          <span className="text-[0.88rem]">실제 결제는 이루어지지 않은 데모 주문이에요.</span>
        </p>
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-brand-ivory px-4 py-2.5 text-[0.9rem]">
          <span className="text-neutral-text2">주문번호</span>
          <span className="tabular text-[1.05rem] font-black">{order.id}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="tabular mt-2 text-[0.82rem] text-neutral-text2">
          {fmtDate(order.createdAt, "datetime")} · {order.channel === "mobile" ? "모바일" : "웹"} 주문
        </p>
      </div>

      <div className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
        <p className="mb-3 font-bold">
          주문 상품 {order.items.length}종 · {itemCount}개
        </p>
        <ul className="divide-y divide-neutral-border">
          {order.items.map((it) => (
            <li key={it.variantId} className="py-3 first:pt-0 last:pb-0">
              <OrderItemRow item={it} />
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-neutral-border pt-4">
          <OrderInfoRows order={order} />
        </div>
        <dl className="mt-4 space-y-1.5 border-t border-neutral-border pt-4 text-[0.92rem]">
          <div className="flex justify-between">
            <dt className="text-neutral-text2">할인</dt>
            <dd className="tabular">{order.discount > 0 ? `−${krw(order.discount)}` : "0원"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-text2">배송비</dt>
            <dd className="tabular">{order.shippingFee === 0 ? "무료" : krw(order.shippingFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-border pt-2">
            <dt className="font-bold">결제예정금액</dt>
            <dd className="tabular text-[1.2rem] font-black">{krw(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-1.5">
        <p className="text-[0.92rem] leading-relaxed text-neutral-text2">
          상품이 준비·출고되면 주문내역과 알림에서 바로 확인할 수 있어요.
        </p>
        <LoopHint href="/ax/orders">이 주문은 AX 주문·매출·재고에 즉시 반영되었습니다</LoopHint>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="brand"
          size="lg"
          href={`/my/orders/${order.id}`}
          className="sm:flex-1"
          icon={<PackageSearch size={18} />}
        >
          주문 상세 보기
        </Button>
        <Button variant="outline" size="lg" href="/ranking" className="sm:flex-1" icon={<ArrowRight size={18} />}>
          쇼핑 계속하기
        </Button>
      </div>
    </div>
  );
}

export default function CompletePage() {
  const params = useParams<{ orderId: string }>();
  const orderId = decodeURIComponent(String(params?.orderId ?? ""));
  return (
    <Container className="py-8 md:py-12">
      <Hydrated
        fallback={
          <div className="mx-auto max-w-[720px] space-y-5">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={5} />
          </div>
        }
      >
        <CompleteContent orderId={orderId} />
      </Hydrated>
    </Container>
  );
}
