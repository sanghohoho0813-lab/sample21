"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle } from "@/components/customer/Section";
import { SkeletonCard } from "@/components/ui/States";
import { OrderList } from "@/components/customer/conversion/MyBits";
import { ORDER_FILTERS, myOrders } from "@/components/customer/conversion/shared";

function OrdersContent() {
  const store = useApp();
  const raw = useSearchParams().get("status");
  const orders = myOrders(store);
  return <OrderList orders={orders} initialFilter={ORDER_FILTERS.find((f) => f.key === raw)?.key ?? "all"} />;
}

export default function MyOrdersPage() {
  return (
    <Container className="max-w-[960px] py-6 md:py-10">
      <PageTitle title="주문내역" desc="운영팀이 상태를 바꾸면 이곳과 알림에 즉시 반영됩니다." />
      <Hydrated
        fallback={
          <div className="space-y-3">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        }
      >
        <Suspense fallback={<SkeletonCard lines={3} />}>
          <OrdersContent />
        </Suspense>
      </Hydrated>
    </Container>
  );
}
