"use client";
import { useApp } from "@/lib/store";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle } from "@/components/customer/Section";
import { SkeletonCard } from "@/components/ui/States";
import { RestockList } from "@/components/customer/conversion/MyBits";
import { useDocumentTitle } from "@/components/customer/conversion/shared";
import { LoopHint } from "@/components/customer/LoopHint";

function RestockContent() {
  const store = useApp();
  const waiting = store.restockSubs.filter((s) => s.status === "waiting").length;
  const notified = store.restockSubs.filter((s) => s.status === "notified").length;
  const purchased = store.restockSubs.filter((s) => s.status === "purchased").length;
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-[0.95rem] text-neutral-text2 leading-relaxed">품절된 색상·사이즈가 입고되면 알림으로 알려드리고, 바로 구매할 수 있게 열어드려요.</p>
        <LoopHint href="/ax/inventory">신청하면 AX 수요 레이더에 옵션별 수요로 바로 반영됩니다</LoopHint>
      </div>
      <p className="text-[0.9rem] text-neutral-text2 tabular">전체 <b className="text-neutral-text">{store.restockSubs.length}</b> · 대기 <b className="text-neutral-text">{waiting}</b> · 알림 도착 <b className="text-semantic-success">{notified}</b> · 구매 완료 <b className="text-neutral-text">{purchased}</b></p>
      <div data-tour="c-restock-list"><RestockList /></div>
    </div>
  );
}

export default function RestockPage() {
  useDocumentTitle("재입고 알림");
  return (
    <Container className="py-6 md:py-10 max-w-[960px]">
      <PageTitle title="재입고 알림" desc="품절 옵션의 재입고 알림 신청 현황입니다." />
      <Hydrated fallback={<div className="space-y-3"><SkeletonCard lines={2} /><SkeletonCard lines={3} /></div>}><RestockContent /></Hydrated>
    </Container>
  );
}
