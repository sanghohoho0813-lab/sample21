"use client";
import { useApp } from "@/lib/store";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle } from "@/components/customer/Section";
import { SkeletonCard } from "@/components/ui/States";
import { Freshness } from "@/components/ui/Misc";
import { OrderList } from "@/components/customer/conversion/MyBits";
import { myOrders, useDocumentTitle } from "@/components/customer/conversion/shared";

function OrdersContent() {
  const store = useApp();
  const orders = myOrders(store);
  return <OrderList orders={orders} />;
}

export default function MyOrdersPage() {
  useDocumentTitle("주문내역");
  return (
    <Container className="py-6 md:py-10 max-w-[960px]">
      <PageTitle title="주문내역" desc="운영팀이 상태를 바꾸면 이곳과 알림에 즉시 반영됩니다." right={<Freshness source="DEMO" />} />
      <Hydrated fallback={<div className="space-y-3"><SkeletonCard lines={3} /><SkeletonCard lines={3} /><SkeletonCard lines={3} /></div>}><OrdersContent /></Hydrated>
    </Container>
  );
}
