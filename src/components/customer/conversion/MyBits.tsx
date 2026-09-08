"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, Sparkles, Ticket, Ruler, User, Package, Heart, BellRing, X } from "lucide-react";
import type { Order } from "@/lib/types";
import { CAMPAIGNS, CUSTOMER_BY_ID, DEMO_CUSTOMER_ID, DEMO_CUSTOMER_NAME, PRODUCTS, PRODUCT_BY_ID, VARIANT_BY_ID } from "@/lib/demo/seed";
import { useApp, campaignStatus } from "@/lib/store";
import { recommendForCustomer } from "@/lib/engine";
import { fmtDate, relTime } from "@/lib/dates";
import { ProductCard, ProductGrid, HScroll } from "@/components/customer/ProductCard";
import { SectionHead } from "@/components/customer/Section";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toggle, Chip } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/cn";
import { OrderCard } from "./OrderBits";
import { DEFAULT_NOTIFY, NOTIFY_KEY, ORDER_FILTERS, filterOrders, productHref, stockState, useLocalPref, type NotifyPrefs } from "./shared";

export const ME = CUSTOMER_BY_ID[DEMO_CUSTOMER_ID];

/* ------------------------------ Recommendations (Loop 4) ------------------------------ */
export function RecommendSection({ limit = 8, tour, title = "추천 상품", showHead = true }: { limit?: number; tour?: string; title?: string; showHead?: boolean }) {
  const store = useApp();
  const recs = useMemo(() => recommendForCustomer({ favoriteBrandId: ME?.favoriteBrandId, recentlyViewed: store.recentlyViewed, wishlist: store.wishlist.map((w) => w.productId), gender: ME?.gender, limit }), [store.recentlyViewed, store.wishlist, limit]);
  const running = campaignStatus("cp-06", store.campaignStatusOverride) === "running";
  const cp06 = CAMPAIGNS.find((c) => c.id === "cp-06");
  const aerno = (cp06?.productIds ?? []).map((id) => PRODUCT_BY_ID[id]).filter(Boolean);
  const track = store.track;
  const tracked = useRef(false);
  useEffect(() => { if (!tracked.current) { tracked.current = true; track("view_recommendation", { count: recs.length, campaign: running ? "cp-06" : "" }); } }, [track, recs.length, running]);
  const reasons = Object.fromEntries(recs.map((r) => [r.product.id, r.reason]));
  return (
    <section data-tour={tour} className="space-y-4">
      {showHead && <SectionHead title={title} desc="자주 구매한 브랜드 · 최근 본 카테고리 · 신상품을 기준으로 규칙 계산했습니다." />}
      {running && cp06 && (
        <div className="rounded-cardlg border border-brand-accent/40 bg-brand-accent/5 p-5 animate-fadeIn" onClickCapture={(e) => { const a = (e.target as HTMLElement).closest("a[href^='/products/']"); if (a) track("click_recommendation", { productId: a.getAttribute("href")?.split("/")[2]?.split("?")[0] ?? "", campaign: "cp-06" }); }}>
          <div className="flex flex-wrap items-center gap-2 mb-1"><Badge tone="accent" size="sm">Closed Loop 4</Badge><Badge tone="live" size="sm">캠페인 진행중</Badge></div>
          <p className="font-bold text-[1.15rem] flex items-center gap-2"><Ticket size={20} className="text-brand-accent" />AERNO 재구매 감사 쿠폰 7%</p>
          <p className="text-[0.88rem] text-neutral-text2 mt-1 leading-relaxed">지난 AERNO 구매 후 {ME?.avgCycleDays ?? 45}일이 지났어요. 장바구니에서 <span className="font-bold text-neutral-text">AERNO7</span> 쿠폰을 선택하면 7% 할인이 적용됩니다 (DEMO · {fmtDate(cp06.endAt)}까지).</p>
          <div className="mt-4 grid grid-cols-3 gap-3">{aerno.map((p) => <ProductCard key={p.id} product={p} compact reason="재구매 추천" />)}</div>
        </div>
      )}
      {recs.length === 0 ? <EmptyState title="추천할 상품이 아직 없습니다" desc="상품을 둘러보면 취향에 맞춰 추천해드립니다." action={<Button variant="brand" href="/ranking">상품 둘러보기</Button>} /> : (
        <div onClickCapture={(e) => { const a = (e.target as HTMLElement).closest("a[href^='/products/']"); if (a) track("click_recommendation", { productId: a.getAttribute("href")?.split("/")[2]?.split("?")[0] ?? "" }); }}>
          <ProductGrid products={recs.map((r) => r.product)} reasons={reasons} />
        </div>
      )}
      <p className="text-[0.78rem] text-neutral-text2">추천 근거는 각 상품 아래에 표시됩니다 · 규칙 기반 (Repeat Engine) · <Badge tone="ready" size="sm">AI Ready</Badge></p>
    </section>
  );
}

/* ------------------------------ Notification prefs ------------------------------ */
export function NotifyPrefsCard({ className }: { className?: string }) {
  const [prefs, setPrefs, loaded] = useLocalPref<NotifyPrefs>(NOTIFY_KEY, DEFAULT_NOTIFY);
  const set = (k: keyof NotifyPrefs, label: string) => (v: boolean) => { setPrefs({ ...prefs, [k]: v }); toast(`${label} 알림을 ${v ? "켰습니다" : "껐습니다"}`, "이 기기에만 저장됩니다 (DEMO)", v ? "success" : "info"); };
  return (
    <div className={cn("rounded-cardlg border border-neutral-border bg-white p-5", className)}>
      <p className="font-bold flex items-center gap-2 mb-2"><BellRing size={16} />알림 설정</p>
      <div className={cn("divide-y divide-neutral-border", !loaded && "opacity-60")}>
        <Toggle checked={prefs.restock} onChange={set("restock", "재입고")} label="재입고 알림" desc="신청한 품절 옵션이 입고되면 알려드립니다" />
        <Toggle checked={prefs.order} onChange={set("order", "주문·배송")} label="주문·배송 알림" desc="주문 상태가 바뀔 때 알려드립니다" />
        <Toggle checked={prefs.recommend} onChange={set("recommend", "추천")} label="추천·혜택 알림" desc="취향에 맞는 상품과 쿠폰 소식" />
      </div>
    </div>
  );
}

/* ------------------------------ Orders ------------------------------ */
export function OrderList({ orders, filterable = true, limit }: { orders: Order[]; filterable?: boolean; limit?: number }) {
  const [filter, setFilter] = useState<(typeof ORDER_FILTERS)[number]["key"]>("all");
  const list = filterOrders(orders, filter).slice(0, limit ?? Infinity);
  return (
    <div className="space-y-3">
      {filterable && <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">{ORDER_FILTERS.map((f) => <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}<span className="tabular text-[0.78rem] opacity-70">{filterOrders(orders, f.key).length}</span></Chip>)}</div>}
      {list.length === 0 ? <EmptyState icon={<Package size={22} />} title={filter === "all" ? "아직 주문이 없습니다" : "해당 상태의 주문이 없습니다"} desc={filter === "all" ? "DEMO 주문을 완료하면 이곳에서 배송 상태를 확인할 수 있습니다." : "다른 상태를 선택해보세요."} action={filter === "all" ? <Button variant="brand" href="/ranking">상품 둘러보기</Button> : <Button variant="outline" onClick={() => setFilter("all")}>전체 보기</Button>} /> : <ul className="space-y-3">{list.map((o) => <li key={o.id}><OrderCard order={o} /></li>)}</ul>}
    </div>
  );
}

/* ------------------------------ Restock subscriptions ------------------------------ */
const RS_LABEL = { waiting: "대기중", notified: "재입고 알림 도착", purchased: "구매 완료" } as const;
const RS_TONE = { waiting: "warning", notified: "success", purchased: "neutral" } as const;

export function RestockList({ limit, tour, compact }: { limit?: number; tour?: string; compact?: boolean }) {
  const store = useApp();
  const subs = store.restockSubs.slice(0, limit ?? Infinity);
  if (subs.length === 0) {
    return compact ? <p className="text-[0.88rem] text-neutral-text2">신청한 재입고 알림이 없습니다. 품절 옵션에서 <span className="font-semibold text-neutral-text">재입고 알림 신청</span>을 눌러보세요.</p>
      : <EmptyState icon={<Bell size={22} />} title="신청한 재입고 알림이 없습니다" desc="품절된 색상·사이즈에서 '재입고 알림 신청'을 누르면 이곳에 표시되고, Business AX Demand Radar 수요신호에 즉시 반영됩니다." action={<Button variant="brand" href="/products/p-nove-oxford?color=블랙&size=M">품절 임박 상품 보기</Button>} />;
  }
  return (
    <ul className="space-y-3" data-tour={tour}>
      {subs.map((s) => {
        const v = VARIANT_BY_ID[s.variantId]; const p = v ? PRODUCT_BY_ID[v.productId] : null;
        if (!v || !p) return null;
        const st = stockState(v, store);
        const href = productHref(s.variantId);
        return (
          <li key={s.id} className={cn("rounded-cardlg border bg-white p-4 md:p-5 transition-shadow hover:shadow-raised", s.status === "notified" ? "border-semantic-success/40" : "border-neutral-border")}>
            <div className="flex gap-4">
              <Link href={href} className="shrink-0 w-20"><ProductImage colors={p.colors} variant={Math.max(0, p.colors.indexOf(v.color))} label={p.name} ratio="aspect-[3/4]" /></Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><Link href={href} className="font-semibold leading-snug hover:underline underline-offset-2">{p.name}</Link><p className="text-[0.85rem] text-neutral-text2">{v.color} · {v.size}</p></div>
                  <Badge tone={RS_TONE[s.status]} size="sm">{RS_LABEL[s.status]}</Badge>
                </div>
                <p className="text-[0.8rem] text-neutral-text2 mt-1 tabular">신청일 {fmtDate(s.createdAt, "datetime")} ({relTime(s.createdAt)}){s.notifiedAt && ` · 입고 알림 ${relTime(s.notifiedAt)}`}</p>
                <div className="mt-1.5"><Badge tone={st.tone} size="sm">현재 {st.label}</Badge></div>
                {!compact && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.status === "notified" && <Button size="sm" variant="brand" href={href} icon={<Sparkles size={14} />}>지금 구매</Button>}
                    {s.status === "waiting" && <Button size="sm" variant="outline" href={href}>상품 보기</Button>}
                    {s.status !== "purchased" && <Button size="sm" variant="ghost" onClick={() => { store.cancelRestock(s.id); toast("재입고 알림을 취소했습니다", "Demand Radar 수요신호에서 제외됩니다", "info"); }} icon={<X size={14} />}>취소</Button>}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------ Profile / stats / recently viewed ------------------------------ */
export function ProfileCard() {
  const fp = useApp((s) => s.fitProfile);
  const parts = [fp.height && `${fp.height}cm`, fp.weight && `${fp.weight}kg`, fp.topSize && `상의 ${fp.topSize}`, fp.bottomSize && `하의 ${fp.bottomSize}`, fp.preferredFit && ({ slim: "슬림", regular: "레귤러", relaxed: "릴랙스", oversized: "오버핏" } as const)[fp.preferredFit] + " 선호"].filter(Boolean);
  const complete = !!(fp.height && fp.weight && fp.topSize && fp.bottomSize);
  return (
    <div className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="h-16 w-16 rounded-2xl bg-brand-black text-white inline-flex items-center justify-center text-[1.4rem] font-black shrink-0">{DEMO_CUSTOMER_NAME.slice(0, 1)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[1.25rem] font-bold leading-tight">{DEMO_CUSTOMER_NAME}님 <Badge tone="demo" size="sm">DEMO 회원</Badge></p>
        <p className="text-[0.85rem] text-neutral-text2 mt-0.5 tabular">{ME ? `${fmtDate(ME.joinedAt)} 가입 · ${ME.favoriteBrandId ? "AERNO 애호가" : "취향 탐색중"}` : "회원 정보"}</p>
        <p className="text-[0.9rem] mt-2 flex flex-wrap items-center gap-x-2 gap-y-1"><Ruler size={14} className="text-neutral-text2" />{parts.length ? parts.join(" · ") : <span className="text-neutral-text2">사이즈·취향 정보가 아직 없습니다</span>}{complete ? <Badge tone="success" size="sm">핏 프로필 완성</Badge> : <Badge tone="warning" size="sm">프로필 {parts.length ? "일부" : "미"}입력</Badge>}</p>
      </div>
      <Button variant={complete ? "outline" : "brand"} href="/my/profile" icon={<User size={16} />} className="shrink-0">{complete ? "프로필 수정" : "사이즈·취향 입력"}</Button>
    </div>
  );
}

export function QuickStats({ orders }: { orders: Order[] }) {
  const store = useApp();
  const unread = store.notifications.filter((n) => !n.read).length;
  const items = [
    { label: "주문", value: orders.length, href: "/my?tab=orders", icon: Package },
    { label: "찜", value: store.wishlist.length, href: "/wishlist", icon: Heart },
    { label: "재입고 알림", value: store.restockSubs.filter((s) => s.status !== "purchased").length, href: "/my/restock", icon: Bell },
    { label: "읽지 않은 알림", value: unread, href: "/my?tab=overview#notify", icon: BellRing },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => { const Icon = it.icon; return (
        <Link key={it.label} href={it.href} className="rounded-cardlg border border-neutral-border bg-white p-4 hover-lift active:bg-brand-ivory">
          <p className="text-[0.82rem] text-neutral-text2 font-semibold flex items-center gap-1.5"><Icon size={14} />{it.label}</p>
          <p className="text-[1.6rem] font-black tabular leading-tight mt-1">{it.value}<span className="text-[0.85rem] font-semibold text-neutral-text2 ml-0.5">건</span></p>
        </Link>
      ); })}
    </div>
  );
}

export function RecentlyViewed() {
  const ids = useApp((s) => s.recentlyViewed);
  const products = ids.map((id) => PRODUCT_BY_ID[id]).filter(Boolean);
  if (products.length === 0) return <p className="text-[0.88rem] text-neutral-text2">최근 본 상품이 없습니다. <Link href="/ranking" className="font-semibold text-neutral-text underline underline-offset-2">랭킹</Link>에서 둘러보세요.</p>;
  return <HScroll>{products.map((p) => <div key={p.id} className="w-[150px] md:w-[180px] shrink-0 snap-start"><ProductCard product={p} compact /></div>)}</HScroll>;
}

export function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} role="tab" aria-selected={active} className={cn("h-11 px-4 inline-flex items-center rounded-xl font-semibold whitespace-nowrap transition-colors", active ? "bg-brand-black text-white" : "text-neutral-text2 hover:bg-brand-ivory hover:text-neutral-text")}>{children}<ChevronRight size={14} className={cn("ml-0.5", active ? "opacity-70" : "opacity-0")} /></Link>;
}

export const ALL_PRODUCT_COUNT = PRODUCTS.length;
