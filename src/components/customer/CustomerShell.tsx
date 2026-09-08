"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Search, Heart, ShoppingBag, User, Menu, Bell, Home, LayoutGrid, ChevronRight, Sparkles, ExternalLink, Play, Smartphone } from "lucide-react";
import { useApp } from "@/lib/store";
import { BRANDS, CATEGORIES } from "@/lib/demo/seed";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Drawer, BottomSheet } from "@/components/ui/Overlay";
import { DevicePreviewButton } from "@/components/system/DevicePreview";
import { useHydrated, useIsPreviewFrame } from "@/components/system/hooks";
import { usePresentation } from "@/components/system/Presentation";
import { SurfaceMarker } from "@/components/system/AppProviders";
import { Tutorial, CUSTOMER_TOUR } from "@/components/system/Tutorial";
import { LiveClock } from "@/components/system/LiveClock";
import { relTime } from "@/lib/dates";

export const NEXT_MENUS = [
  { slug: "membership", label: "멤버십", desc: "등급별 적립·무료배송·선공개" },
  { slug: "partner-center", label: "브랜드 파트너센터", desc: "브랜드 직접 상품등록·재고연동·정산" },
  { slug: "ads", label: "광고·기획전 상품", desc: "브랜드 노출 상품과 기획전 신청" },
  { slug: "style-content", label: "스타일 콘텐츠", desc: "룩북·매거진·스타일링 가이드" },
  { slug: "b2b", label: "B2B 단체구매", desc: "기업·단체 유니폼·단체복 견적" },
];

const NAV = [
  { href: "/ranking", label: "랭킹" }, { href: "/new", label: "신상품" }, { href: "/brands", label: "브랜드" },
  { href: "/shop?gender=men", label: "남성" }, { href: "/shop?gender=women", label: "여성" }, { href: "/style", label: "스타일 찾기" }, { href: "/shop?sale=1", label: "세일" },
];

function DemoControlBar() {
  const role = useApp((s) => s.role);
  const hydrated = useHydrated();
  const inFrame = useIsPreviewFrame();
  const start = usePresentation((s) => s.start);
  if (!hydrated || role === "customer" || inFrame) return null;
  return (
    <div className="bg-brand-black text-white text-[0.8rem] no-print" data-tour="c-demo-bar">
      <div className="mx-auto max-w-[1280px] px-4 h-9 flex items-center gap-3">
        <Badge tone="demo" size="sm">DEMO</Badge>
        <span className="hidden sm:inline text-white/80">대표·관리자 시연 모드 · 일반 고객에게는 보이지 않습니다</span>
        <span className="hidden md:inline-flex text-white/70"><LiveClock compact light /></span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={start} className="h-7 px-2.5 rounded-lg hover:bg-white/10 inline-flex items-center gap-1 font-semibold"><Play size={12} />시연</button>
          <DevicePreviewButton light className="h-7 px-2.5 text-[0.8rem]" />
          <Link href="/ax" className="h-7 px-2.5 rounded-lg bg-white text-brand-black inline-flex items-center gap-1 font-bold hover:bg-neutral-canvas" data-tour="c-surface-switch"><ExternalLink size={12} />Business AX 보기</Link>
        </div>
      </div>
    </div>
  );
}

function NotificationsButton() {
  const notifications = useApp((s) => s.notifications);
  const markRead = useApp((s) => s.markRead);
  const markAllRead = useApp((s) => s.markAllRead);
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const unread = hydrated ? notifications.filter((n) => !n.read).length : 0;
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label={`알림 ${unread}개`} className="relative h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-neutral-canvas" data-tour="c-notifications">
        <Bell size={22} />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-accent text-white text-[0.68rem] font-bold flex items-center justify-center">{unread}</span>}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="알림" footer={notifications.some((n) => !n.read) ? <button onClick={markAllRead} className="text-[0.85rem] font-semibold text-neutral-text2 hover:text-neutral-text">모두 읽음</button> : undefined}>
        {notifications.length === 0 ? <p className="text-neutral-text2 py-10 text-center">아직 알림이 없습니다.</p> : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link href={n.href ?? "/my"} onClick={() => { markRead(n.id); setOpen(false); }} className={cn("block rounded-2xl border p-4 transition-colors hover:bg-neutral-canvas", n.read ? "border-neutral-border" : "border-brand-accent/40 bg-brand-accent/5")}>
                  <div className="flex items-center gap-2 mb-1"><Badge tone={n.kind === "restock" ? "success" : n.kind === "order" ? "info" : n.kind === "recommend" ? "accent" : "neutral"} size="sm">{n.kind === "restock" ? "재입고" : n.kind === "order" ? "주문" : n.kind === "recommend" ? "추천" : "안내"}</Badge><span className="text-[0.78rem] text-neutral-text2">{relTime(n.at)}</span></div>
                  <p className="font-semibold text-[0.95rem]">{n.title}</p>
                  <p className="text-[0.85rem] text-neutral-text2 mt-0.5">{n.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </>
  );
}

function SearchBox({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const track = useApp((s) => s.track);
  const submit = (e: FormEvent) => { e.preventDefault(); const t = q.trim(); track("search_product", { q: t }); router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search"); onDone?.(); };
  return (
    <form onSubmit={submit} role="search" className={cn("relative", className)}>
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-text2" />
      <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus={autoFocus} placeholder="상품, 브랜드, 스타일을 검색해보세요" aria-label="검색" className="h-11 w-full rounded-full bg-neutral-canvas pl-11 pr-4 text-[0.95rem] focus:outline-none focus:ring-2 focus:ring-brand-black/20 focus:bg-white border border-transparent focus:border-neutral-border" />
    </form>
  );
}

export function CustomerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const cart = useApp((s) => s.cart);
  const wishlist = useApp((s) => s.wishlist);
  const hydrated = useHydrated();
  const [menu, setMenu] = useState(false);
  const [cats, setCats] = useState(false);
  const [search, setSearch] = useState(false);
  const [tour, setTour] = useState(false);
  const customerTourDone = useApp((s) => s.customerTourDone);
  const setCustomerTourDone = useApp((s) => s.setCustomerTourDone);
  const inFrame = useIsPreviewFrame();
  const cartCount = hydrated ? cart.reduce((s, c) => s + c.qty, 0) : 0;
  const wishCount = hydrated ? wishlist.length : 0;
  useEffect(() => { setMenu(false); setCats(false); setSearch(false); }, [pathname]);
  useEffect(() => { if (hydrated && !customerTourDone && pathname === "/" && !inFrame) { const t = setTimeout(() => setTour(true), 900); return () => clearTimeout(t); } }, [hydrated, customerTourDone, pathname, inFrame]);

  const isActive = (href: string) => pathname === href.split("?")[0] && (href.includes("?") ? (typeof window !== "undefined" && window.location.search.includes(href.split("?")[1])) : true);

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-text">
      <SurfaceMarker surface="customer" />
      <DemoControlBar />
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-border">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="h-[64px] md:h-[72px] flex items-center gap-3 md:gap-6">
            <button onClick={() => setMenu(true)} className="lg:hidden h-11 w-11 -ml-2 inline-flex items-center justify-center rounded-full hover:bg-neutral-canvas" aria-label="전체 메뉴"><Menu size={24} /></button>
            <Link href="/" className="font-black tracking-tight text-[1.45rem] md:text-[1.6rem] leading-none" aria-label="MORFIT 홈">MORFIT<span className="text-brand-accent">.</span></Link>
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 ml-1 xl:ml-2" aria-label="주요 메뉴">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={cn("h-10 px-2 xl:px-3 rounded-lg text-[0.9rem] xl:text-[0.95rem] font-semibold whitespace-nowrap hover:bg-neutral-canvas transition-colors", isActive(n.href) && "bg-neutral-canvas")}>{n.label}</Link>
              ))}
            </nav>
            <div className="hidden xl:block flex-1 max-w-sm ml-auto"><SearchBox /></div>
            <div className="ml-auto xl:ml-0 flex items-center gap-0.5 shrink-0">
              <button onClick={() => setSearch(true)} className="xl:hidden h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-neutral-canvas" aria-label="검색"><Search size={22} /></button>
              <NotificationsButton />
              <Link href="/wishlist" className="hidden md:inline-flex relative h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas" aria-label={`찜 ${wishCount}개`}><Heart size={22} />{wishCount > 0 && <span className="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-black text-white text-[0.68rem] font-bold flex items-center justify-center">{wishCount}</span>}</Link>
              <Link href="/cart" className="relative h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-neutral-canvas" aria-label={`장바구니 ${cartCount}개`} data-tour="c-cart"><ShoppingBag size={22} />{cartCount > 0 && <span className="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-accent text-white text-[0.68rem] font-bold flex items-center justify-center">{cartCount}</span>}</Link>
              <Link href="/my" className="hidden md:inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas" aria-label="마이페이지"><User size={22} /></Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">{children}</main>

      <footer className="bg-brand-ivory border-t border-neutral-border mt-16">
        <div className="mx-auto max-w-[1280px] px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-[0.9rem]">
          <div className="col-span-2 md:col-span-1">
            <p className="font-black text-[1.4rem] tracking-tight">MORFIT<span className="text-brand-accent">.</span></p>
            <p className="mt-2 text-neutral-text2 leading-relaxed">취향과 사이즈에 맞는 패션을 발견하는 멀티브랜드 커머스.<br />본 서비스는 미래AI랩 AX 시연용 가상 플랫폼입니다.</p>
            <div className="mt-3"><Badge tone="demo" size="sm">DEMO · 실제 결제 없음</Badge></div>
          </div>
          <div>
            <p className="font-bold mb-3">쇼핑</p>
            <ul className="space-y-2 text-neutral-text2">{NAV.map((n) => <li key={n.href}><Link href={n.href} className="hover:text-neutral-text">{n.label}</Link></li>)}</ul>
          </div>
          <div>
            <p className="font-bold mb-3 flex items-center gap-2">향후 확장 <Badge tone="next" size="sm">NEXT</Badge></p>
            <ul className="space-y-2 text-neutral-text2">{NEXT_MENUS.map((n) => <li key={n.slug}><Link href={`/next/${n.slug}`} className="hover:text-neutral-text inline-flex items-center gap-1">{n.label}<ChevronRight size={14} /></Link></li>)}</ul>
          </div>
          <div>
            <p className="font-bold mb-3">고객 안내</p>
            <ul className="space-y-2 text-neutral-text2">
              <li>배송: 5만원 이상 무료 · 평균 1~2일</li><li>교환·반품: 수령 후 7일 이내</li><li>사이즈 상담: 핏 프로필 기반 추천</li><li><Link href="/my" className="hover:text-neutral-text">주문·배송 조회</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-border"><div className="mx-auto max-w-[1280px] px-4 py-4 text-[0.8rem] text-neutral-text2 flex flex-wrap gap-x-4 gap-y-1">© MORFIT (가상 브랜드) · 미래AI랩 AX + Platform Unified v3.0 · 타사 상표·UI 미사용</div></div>
      </footer>

      {/* Mobile bottom navigation: 홈 / 카테고리 / 검색 / 찜 / 마이 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-border safe-bottom" aria-label="하단 메뉴">
        <ul className="grid grid-cols-5 h-[64px]">
          <li><Link href="/" className={cn("h-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold active:bg-neutral-canvas", pathname === "/" ? "text-brand-black" : "text-neutral-text2")}><Home size={22} />홈</Link></li>
          <li><button onClick={() => setCats(true)} className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-neutral-text2 active:bg-neutral-canvas"><LayoutGrid size={22} />카테고리</button></li>
          <li><button onClick={() => setSearch(true)} className={cn("h-full w-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold active:bg-neutral-canvas", pathname === "/search" ? "text-brand-black" : "text-neutral-text2")}><Search size={22} />검색</button></li>
          <li><Link href="/wishlist" className={cn("h-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold active:bg-neutral-canvas relative", pathname === "/wishlist" ? "text-brand-black" : "text-neutral-text2")}><Heart size={22} />찜{wishCount > 0 && <span className="absolute top-2 right-[22%] h-2 w-2 rounded-full bg-brand-accent" />}</Link></li>
          <li><Link href="/my" className={cn("h-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold active:bg-neutral-canvas", pathname.startsWith("/my") ? "text-brand-black" : "text-neutral-text2")}><User size={22} />마이</Link></li>
        </ul>
      </nav>

      <Drawer open={menu} onClose={() => setMenu(false)} side="left" title="전체 메뉴" width="max-w-[320px]">
        <SearchBox className="mb-5" onDone={() => setMenu(false)} />
        <ul className="space-y-1">
          {NAV.map((n) => <li key={n.href}><Link href={n.href} className="flex items-center justify-between h-12 px-2 rounded-xl font-semibold hover:bg-neutral-canvas active:bg-neutral-canvas">{n.label}<ChevronRight size={18} className="text-neutral-text2" /></Link></li>)}
        </ul>
        <p className="mt-6 mb-2 text-[0.8rem] font-bold text-neutral-text2 tracking-wide">카테고리</p>
        <ul className="grid grid-cols-2 gap-1">{CATEGORIES.map((c) => <li key={c.id}><Link href={`/shop?category=${c.id}`} className="block h-11 leading-[44px] px-2 rounded-xl hover:bg-neutral-canvas">{c.name}</Link></li>)}</ul>
        <p className="mt-6 mb-2 text-[0.8rem] font-bold text-neutral-text2 tracking-wide flex items-center gap-2">향후 확장 <Badge tone="next" size="sm">NEXT</Badge></p>
        <ul className="space-y-1">{NEXT_MENUS.map((n) => <li key={n.slug}><Link href={`/next/${n.slug}`} className="flex items-center justify-between h-11 px-2 rounded-xl text-neutral-text2 hover:bg-neutral-canvas">{n.label}<Sparkles size={14} /></Link></li>)}</ul>
        <div className="mt-6 flex items-center gap-2"><Smartphone size={14} className="text-neutral-text2" /><DevicePreviewButton /></div>
      </Drawer>

      <BottomSheet open={cats} onClose={() => setCats(false)} title="카테고리">
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => <Link key={c.id} href={`/shop?category=${c.id}`} className="rounded-2xl p-4 font-semibold active:scale-[0.98] transition-transform" style={{ background: `linear-gradient(135deg, ${c.gradient[0]}22, ${c.gradient[1]}55)` }}>{c.name}</Link>)}
        </div>
        <p className="mt-5 mb-2 text-[0.8rem] font-bold text-neutral-text2">브랜드</p>
        <div className="flex flex-wrap gap-2">{BRANDS.map((b) => <Link key={b.id} href={`/brands/${b.slug}`} className="h-10 px-3 rounded-full border border-neutral-border text-[0.85rem] font-semibold inline-flex items-center">{b.name}</Link>)}</div>
      </BottomSheet>

      <BottomSheet open={search} onClose={() => setSearch(false)} title="검색">
        <SearchBox autoFocus onDone={() => setSearch(false)} />
        <p className="mt-4 mb-2 text-[0.8rem] font-bold text-neutral-text2">추천 검색어</p>
        <div className="flex flex-wrap gap-2">{["오버핏 셔츠", "와이드 데님", "울 코트", "첼시 부츠", "크롭 가디건"].map((k) => <Link key={k} href={`/search?q=${encodeURIComponent(k)}`} className="h-10 px-3 rounded-full bg-neutral-canvas text-[0.85rem] font-semibold inline-flex items-center">{k}</Link>)}</div>
      </BottomSheet>

      <Tutorial steps={CUSTOMER_TOUR} open={tour} onClose={() => { setTour(false); setCustomerTourDone(true); }} />
    </div>
  );
}
