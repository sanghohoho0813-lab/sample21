"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, ChevronRight, Clock, Package, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { relTime } from "@/lib/dates";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle, SectionHead } from "@/components/customer/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { NotifyPrefsCard, OrderList, ProfileCard, QuickStats, RecentlyViewed, RecommendSection, RestockList, TabLink } from "@/components/customer/conversion/MyBits";
import { OrderCard } from "@/components/customer/conversion/OrderBits";
import { myOrders, useDocumentTitle } from "@/components/customer/conversion/shared";

type Tab = "overview" | "orders" | "recommend";
const TABS: { key: Tab; label: string }[] = [{ key: "overview", label: "한눈에 보기" }, { key: "orders", label: "주문내역" }, { key: "recommend", label: "추천상품" }];

function NotificationsCard() {
  const store = useApp();
  const list = store.notifications.slice(0, 4);
  return (
    <div id="notify" className="rounded-cardlg border border-neutral-border bg-white p-5 scroll-mt-24">
      <p className="font-bold flex items-center gap-2 mb-3"><Bell size={16} />최근 알림 {store.notifications.some((n) => !n.read) && <Badge tone="accent" size="sm">{store.notifications.filter((n) => !n.read).length} 새 알림</Badge>}</p>
      {list.length === 0 ? <p className="text-[0.88rem] text-neutral-text2">아직 알림이 없습니다.</p> : (
        <ul className="space-y-1.5">{list.map((n) => (
          <li key={n.id}><Link href={n.href ?? "/my"} onClick={() => store.markRead(n.id)} className={cn("block rounded-xl px-3 py-2.5 transition-colors hover:bg-brand-ivory", !n.read && "bg-brand-accent/5")}><p className="text-[0.9rem] font-semibold leading-snug flex items-start gap-2">{!n.read && <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0" />}<span>{n.title}</span></p><p className="text-[0.78rem] text-neutral-text2 mt-0.5">{relTime(n.at)} · {n.body}</p></Link></li>
        ))}</ul>
      )}
      {store.notifications.some((n) => !n.read) && <button type="button" onClick={store.markAllRead} className="mt-3 text-[0.85rem] font-semibold text-neutral-text2 hover:text-neutral-text">모두 읽음 처리</button>}
    </div>
  );
}

function MyContent() {
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = raw === "orders" || raw === "recommend" ? raw : "overview";
  const store = useApp();
  const orders = myOrders(store);
  return (
    <>
      <div className="flex gap-1 overflow-x-auto hide-scrollbar -mx-4 px-4 mb-6" role="tablist" aria-label="마이페이지 탭">{TABS.map((t) => <TabLink key={t.key} href={`/my?tab=${t.key}`} active={tab === t.key}>{t.label}</TabLink>)}</div>

      {tab === "overview" && (
        <div className="space-y-8">
          <ProfileCard />
          <QuickStats orders={orders} />
          <div className="grid lg:grid-cols-2 gap-6">
            <section className="min-w-0">
              <SectionHead title="최근 주문" desc="운영팀의 상태 변경이 즉시 반영됩니다." more="/my/orders" moreLabel="전체 주문" />
              {orders.length === 0 ? <div className="rounded-cardlg border border-dashed border-neutral-border bg-white p-6 text-center text-[0.9rem] text-neutral-text2">아직 주문이 없습니다. <Link href="/ranking" className="font-semibold text-neutral-text underline underline-offset-2">상품 둘러보기</Link></div> : <ul className="space-y-3">{orders.slice(0, 3).map((o) => <li key={o.id}><OrderCard order={o} /></li>)}</ul>}
            </section>
            <section className="min-w-0">
              <SectionHead title="재입고 알림" desc="신청 즉시 Business AX Demand Radar에 반영됩니다." more="/my/restock" moreLabel="전체 보기" />
              <RestockList limit={2} compact />
              {store.restockSubs.length > 2 && <Link href="/my/restock" className="mt-3 inline-flex items-center gap-0.5 text-[0.88rem] font-semibold hover:underline underline-offset-2">재입고 알림 {store.restockSubs.length}건 모두 보기<ChevronRight size={14} /></Link>}
              <div className="mt-6"><NotificationsCard /></div>
            </section>
          </div>
          <section>
            <SectionHead title="최근 본 상품" desc="조회 데이터는 관심 신호로 집계됩니다." />
            <RecentlyViewed />
          </section>
          <RecommendSection limit={4} tour="c-recommend" title="추천 상품" />
          <div className="grid lg:grid-cols-2 gap-6">
            <NotifyPrefsCard />
            <div className="rounded-cardlg bg-brand-ivory p-5 flex flex-col justify-center gap-2 text-[0.9rem]"><p className="font-bold flex items-center gap-2"><Sparkles size={16} />내 데이터가 어떻게 쓰이나요?</p><p className="text-neutral-text2 leading-relaxed">조회·찜·재입고 신청·사이즈 선택은 Business AX의 Demand Radar와 핏 추천 규칙에 반영됩니다. 실제 개인정보는 저장하지 않으며, DEMO 데이터는 이 기기에만 남습니다.</p><Link href="/my/profile" className="inline-flex items-center gap-0.5 font-semibold hover:underline underline-offset-2">프로필·알림 설정<ChevronRight size={14} /></Link></div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          <SectionHead title="주문내역" desc={`전체 ${orders.length}건 · 상태를 눌러 상세를 확인하세요.`} more="/my/orders" moreLabel="주문 페이지" />
          <OrderList orders={orders} />
        </div>
      )}

      {tab === "recommend" && (
        <div className="space-y-6">
          <RecommendSection limit={8} tour="c-recommend" title="추천 상품" />
          <div className="rounded-cardlg border border-neutral-border bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-3"><div className="flex-1"><p className="font-bold flex items-center gap-2"><Clock size={16} />최근 본 상품</p><p className="text-[0.85rem] text-neutral-text2">추천은 최근 본 카테고리를 반영합니다.</p></div><Button variant="outline" href="/my?tab=overview" icon={<Package size={16} />}>한눈에 보기로</Button></div>
        </div>
      )}
    </>
  );
}

export default function MyPage() {
  useDocumentTitle("마이페이지");
  return (
    <Container className="py-6 md:py-10">
      <PageTitle title="마이페이지" desc="주문·찜·재입고 알림·추천을 한곳에서 확인하세요." />
      <Suspense fallback={<SkeletonCard lines={4} />}>
        <Hydrated fallback={<div className="space-y-4"><SkeletonCard lines={2} /><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><SkeletonCard lines={1} /><SkeletonCard lines={1} /><SkeletonCard lines={1} /><SkeletonCard lines={1} /></div><SkeletonCard lines={4} /></div>}><MyContent /></Hydrated>
      </Suspense>
    </Container>
  );
}
