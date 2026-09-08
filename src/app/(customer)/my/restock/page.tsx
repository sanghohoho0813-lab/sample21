"use client";
import Link from "next/link";
import { Radar, ChevronRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle } from "@/components/customer/Section";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/States";
import { RestockList } from "@/components/customer/conversion/MyBits";
import { useDocumentTitle } from "@/components/customer/conversion/shared";

function RestockContent() {
  const store = useApp();
  const waiting = store.restockSubs.filter((s) => s.status === "waiting").length;
  const notified = store.restockSubs.filter((s) => s.status === "notified").length;
  return (
    <div className="space-y-5">
      <div className="rounded-cardlg border border-brand-accent/30 bg-brand-accent/5 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="h-11 w-11 rounded-xl bg-white text-brand-accent inline-flex items-center justify-center shrink-0 shadow-card"><Radar size={22} /></span>
        <div className="flex-1"><p className="font-bold flex flex-wrap items-center gap-2">신청 즉시 Business AX Demand Radar에 반영됩니다 <Badge tone="accent" size="sm">Closed Loop 1</Badge></p><p className="text-[0.85rem] text-neutral-text2 mt-0.5 leading-relaxed">재입고 알림 신청은 옵션 단위 수요신호가 되어 MD의 재입고 Action 판단에 쓰입니다. 입고가 완료되면 알림이 도착하고 '지금 구매' 버튼이 열립니다.</p></div>
        {store.role !== "customer" && <Link href="/ax/inventory" className="text-[0.82rem] font-bold text-brand-accent hover:underline underline-offset-2 inline-flex items-center gap-0.5 whitespace-nowrap">Demand Radar 보기<ChevronRight size={14} /></Link>}
      </div>
      <div className="flex flex-wrap gap-2 text-[0.88rem]"><Badge tone="warning">대기중 {waiting}</Badge><Badge tone="success">재입고 알림 도착 {notified}</Badge><Badge tone="neutral">전체 {store.restockSubs.length}</Badge></div>
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
