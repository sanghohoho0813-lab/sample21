"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  Bell,
  Home,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ArrowRight,
  Play,
  Trophy,
  Tag,
  Store,
  Ruler,
  Package,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { BRANDS, CATEGORIES } from "@/lib/demo/seed";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Drawer, BottomSheet } from "@/components/ui/Overlay";
import { DevicePreviewButton } from "@/components/system/DevicePreview";
import { useHydrated, useIsPreviewFrame } from "@/components/system/hooks";
import { usePresentation } from "@/components/system/Presentation";
import { SurfaceMarker } from "@/components/system/AppProviders";
import { SampleBridgeCTA } from "@/components/system/SampleBridgeCTA";
import { Tutorial, CUSTOMER_TOUR } from "@/components/system/Tutorial";
import { LiveClock } from "@/components/system/LiveClock";
import { relTime } from "@/lib/dates";
import { NEXT_MENUS } from "@/lib/nextMenus";
import { SkipLink } from "@/components/system/SkipLink";

export { NEXT_MENUS };

/* ------------------------------------------------------------------
   고객 플랫폼 정보구조 (UI/UX 안정화 v1.0) — 햄버거 1차 메뉴 7개, 최대 2단계.
   고객은 '행동' 기준으로 찾는다: 둘러보기 · 카테고리 · 브랜드 · 스타일 찾기 · 내 쇼핑.
   향후 확장(예정) 기능은 '확장 기능 보기' 안으로 접어 시각적 중요도를 한 단계 낮춘다.
------------------------------------------------------------------- */
type DrawerLeaf = { href: string; label: string };
type DrawerEntry = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href?: string;
  children?: DrawerLeaf[];
};
const DRAWER_TREE: DrawerEntry[] = [
  { id: "home", label: "홈", icon: Home, href: "/" },
  { id: "ranking", label: "랭킹", icon: Trophy, href: "/ranking" },
  {
    id: "new",
    label: "신상품·세일",
    icon: Tag,
    children: [
      { href: "/new", label: "신상품" },
      { href: "/shop?sale=1", label: "세일" },
    ],
  },
  {
    id: "category",
    label: "카테고리",
    icon: LayoutGrid,
    children: [
      { href: "/shop?gender=men", label: "남성" },
      { href: "/shop?gender=women", label: "여성" },
      { href: "/shop", label: "전체 상품" },
    ],
  },
  { id: "brands", label: "브랜드", icon: Store, href: "/brands" },
  { id: "style", label: "스타일 찾기", icon: Ruler, href: "/style" },
  {
    id: "my",
    label: "내 쇼핑",
    icon: Package,
    children: [
      { href: "/my", label: "마이페이지" },
      { href: "/my/orders", label: "주문·배송" },
      { href: "/wishlist", label: "찜" },
      { href: "/cart", label: "장바구니" },
      { href: "/my/restock", label: "재입고 알림" },
    ],
  },
];

const NAV = [
  { href: "/ranking", label: "랭킹" },
  { href: "/new", label: "신상품" },
  { href: "/brands", label: "브랜드" },
  { href: "/shop?gender=men", label: "남성" },
  { href: "/shop?gender=women", label: "여성" },
  { href: "/style", label: "스타일 찾기" },
  { href: "/shop?sale=1", label: "세일" },
];

function DemoControlBar() {
  const role = useApp((s) => s.role);
  const hydrated = useHydrated();
  const inFrame = useIsPreviewFrame();
  const start = usePresentation((s) => s.start);
  if (!hydrated || role === "customer" || inFrame) return null;
  return (
    <div className="no-print bg-brand-black text-[0.8rem] text-white" data-tour="c-demo-bar">
      <div className="mx-auto flex h-11 max-w-[1280px] items-center gap-3 px-4 md:h-9">
        <Badge tone="demo" size="sm">
          데모
        </Badge>
        <span className="hidden text-white/80 sm:inline">대표·관리자 시연용 · 일반 고객에게는 보이지 않습니다</span>
        <span className="hidden text-white/70 md:inline-flex">
          <LiveClock compact light />
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={start}
            className="inline-flex h-10 items-center gap-1 rounded-lg px-2.5 font-semibold hover:bg-white/10 md:h-7"
          >
            <Play size={12} />
            시연
          </button>
          <DevicePreviewButton light className="h-10 px-2.5 text-[0.8rem] md:h-7" />
          <Link
            href="/ax"
            className="press group inline-flex h-10 items-center gap-1 whitespace-nowrap rounded-lg bg-white px-2.5 font-bold text-brand-black transition-all duration-200 hover:bg-brand-ivory hover:shadow-raised md:h-7"
            data-tour="c-surface-switch"
          >
            AX 운영화면 보기
            <ArrowRight size={13} className="nudge-x" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DrawerNav({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const isHere = (href: string) => {
    const [path, q] = href.split("?");
    if (pathname !== path) return false;
    if (!q) return typeof window === "undefined" || !window.location.search || path !== "/shop";
    return typeof window !== "undefined" && window.location.search.includes(q);
  };
  const initial = DRAWER_TREE.find((e) => e.children?.some((c) => isHere(c.href)))?.id;
  const [open, setOpen] = useState<string | null>(initial ?? null);
  const ROW =
    "group relative flex w-full items-center gap-3 min-h-[48px] px-3 rounded-xl text-[1rem] font-semibold transition-colors";
  return (
    <nav aria-label="전체 메뉴" className="space-y-0.5">
      {DRAWER_TREE.map((e) => {
        const Icon = e.icon;
        if (e.href) {
          const active = isHere(e.href);
          return (
            <Link
              key={e.id}
              href={e.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(ROW, active ? "bg-neutral-canvas" : "hover:bg-neutral-canvas active:bg-neutral-canvas")}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-black transition-all",
                  active ? "h-5" : "h-0",
                )}
              />
              <span className="text-neutral-text2">
                <Icon size={20} />
              </span>
              {e.label}
            </Link>
          );
        }
        const isOpen = open === e.id;
        return (
          <div key={e.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : e.id)}
              aria-expanded={isOpen}
              className={cn(ROW, "hover:bg-neutral-canvas")}
            >
              <span className="text-neutral-text2">
                <Icon size={20} />
              </span>
              <span className="flex-1 text-left">{e.label}</span>
              <ChevronDown
                size={18}
                className={cn("text-neutral-text2 transition-transform duration-200", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <ul className="stagger stagger-sm mb-1 ml-[1.35rem] space-y-0.5 border-l border-neutral-border pl-4">
                {e.children!.map((c) => {
                  const active = isHere(c.href);
                  return (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex min-h-[44px] items-center rounded-lg px-3 text-[0.95rem]",
                          active
                            ? "bg-neutral-canvas font-semibold"
                            : "text-neutral-text2 hover:bg-neutral-canvas hover:text-neutral-text",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-black",
                            active ? "h-4" : "h-0",
                          )}
                        />
                        {c.label}
                      </Link>
                    </li>
                  );
                })}
                {e.id === "category" && (
                  <li className="px-1 pb-1 pt-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((c) => (
                        <Link
                          key={c.id}
                          href={`/shop?category=${c.id}`}
                          onClick={onNavigate}
                          className="press inline-flex h-10 items-center rounded-full border border-neutral-border px-3 text-[0.85rem] font-semibold hover:bg-neutral-canvas"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/** 향후 확장(예정) — 기본은 접어두고, 펼치면 한 단계 낮은 톤으로 보여준다 */
function DrawerNext() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-neutral-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-[0.9rem] font-semibold text-neutral-text2 hover:bg-neutral-canvas"
      >
        <Sparkles size={16} />
        <span className="flex-1 text-left">확장 기능 보기</span>
        <Badge tone="next" size="sm">
          예정 {NEXT_MENUS.length}
        </Badge>
        <ChevronDown size={16} className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="stagger stagger-sm mt-1 space-y-0.5">
          {NEXT_MENUS.map((n) => (
            <li key={n.slug}>
              <Link
                href={`/next/${n.slug}`}
                className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-3 text-[0.9rem] text-neutral-text2 hover:bg-neutral-canvas hover:text-neutral-text"
              >
                <span className="min-w-0 break-keep">{n.label}</span>
                <Badge tone="next" size="sm">
                  예정
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
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
      <button
        onClick={() => setOpen(true)}
        aria-label={`알림 ${unread}개`}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas"
        data-tour="c-notifications"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-accent px-1 text-[0.78rem] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="알림"
        footer={
          notifications.some((n) => !n.read) ? (
            <button
              onClick={markAllRead}
              className="tap text-[0.85rem] font-semibold text-neutral-text2 hover:text-neutral-text"
            >
              모두 읽음
            </button>
          ) : undefined
        }
      >
        {notifications.length === 0 ? (
          <p className="py-10 text-center text-neutral-text2">아직 알림이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href ?? "/my"}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block rounded-2xl border p-4 transition-colors hover:bg-neutral-canvas",
                    n.read ? "border-neutral-border" : "border-brand-accent/40 bg-brand-accent/5",
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      tone={
                        n.kind === "restock"
                          ? "success"
                          : n.kind === "order"
                            ? "info"
                            : n.kind === "recommend"
                              ? "accent"
                              : "neutral"
                      }
                      size="sm"
                    >
                      {n.kind === "restock"
                        ? "재입고"
                        : n.kind === "order"
                          ? "주문"
                          : n.kind === "recommend"
                            ? "추천"
                            : "안내"}
                    </Badge>
                    <span className="text-[0.78rem] text-neutral-text2">{relTime(n.at)}</span>
                  </div>
                  <p className="text-[0.95rem] font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-[0.85rem] text-neutral-text2">{n.body}</p>
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
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    track("search_product", { q: t });
    router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
    onDone?.();
  };
  return (
    <form onSubmit={submit} role="search" className={cn("relative", className)}>
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-text2" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="상품 · 브랜드 · 스타일 검색"
        aria-label="검색"
        className="h-11 w-full rounded-full border border-transparent bg-neutral-canvas pl-11 pr-4 text-[0.95rem] focus:border-neutral-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-black/20"
      />
    </form>
  );
}

/** 휴대폰 하위 화면의 '뒤로' 목적지 — 앱 안에서 들어왔으면 이전 화면, 링크로 바로 열었으면 이 상위 화면으로 */
function backTarget(pathname: string): string | null {
  if (pathname.startsWith("/products/")) return "/shop";
  if (pathname === "/checkout") return "/cart";
  if (pathname === "/cart") return "/";
  if (/^\/my\/orders\/.+/.test(pathname)) return "/my/orders";
  if (/^\/my\/.+/.test(pathname)) return "/my";
  if (/^\/brands\/.+/.test(pathname)) return "/brands";
  if (pathname.startsWith("/next/")) return "/";
  return null;
}

/** 화면 아래에 고정된 바(하단 탭·구매 바·결제 바)가 가리는 높이 — 푸터 아래 여백으로 줘서 마지막 줄까지 스크롤로 보이게 */
function useBottomCover(key: string) {
  const [h, setH] = useState(0);
  useEffect(() => {
    const measure = () => {
      const tops = Array.from(
        document.querySelectorAll<HTMLElement>("[data-bottom-bar],[data-buy-bar],[data-checkout-bar]"),
      )
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.height > 0)
        .map((r) => r.top);
      setH(tops.length ? Math.max(0, Math.round(window.innerHeight - Math.min(...tops))) : 0);
    };
    measure();
    // 페이지 내용이 늦게 그려지며(저장된 장바구니 등) 바가 생기거나 바뀌는 경우까지
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [key]);
  return h;
}

export function CustomerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onPdp = pathname.startsWith("/products/"); // 상품 상세: 하단 탭 대신 구매 바
  const hideTabs = onPdp || pathname === "/checkout"; // 주문서도 결제 바가 맨 아래를 쓴다
  const back = backTarget(pathname);
  // 이 탭에서 앱 안 이동이 있었는지 — 있으면 브라우저 뒤로, 없으면(바로 링크로 연 경우) 상위 화면으로
  const moves = useRef(-1);
  useEffect(() => {
    moves.current += 1;
  }, [pathname]);
  const goBack = () => {
    if (back && moves.current <= 0) router.push(back);
    else router.back();
  };
  const cover = useBottomCover(pathname);
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
  const role = useApp((s) => s.role);
  const showDemo = hydrated && role !== "customer" && !inFrame;
  const cartCount = hydrated ? cart.reduce((s, c) => s + c.qty, 0) : 0;
  const wishCount = hydrated ? wishlist.length : 0;
  useEffect(() => {
    setMenu(false);
    setCats(false);
    setSearch(false);
  }, [pathname]);
  useEffect(() => {
    if (hydrated && !customerTourDone && pathname === "/" && !inFrame) {
      const t = setTimeout(() => setTour(true), 900);
      return () => clearTimeout(t);
    }
  }, [hydrated, customerTourDone, pathname, inFrame]);

  const isActive = (href: string) =>
    pathname === href.split("?")[0] &&
    (href.includes("?") ? typeof window !== "undefined" && window.location.search.includes(href.split("?")[1]) : true);

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-text">
      <SkipLink />
      <SurfaceMarker surface="customer" />
      <DemoControlBar />
      <header className="sticky top-0 z-30 border-b border-neutral-border bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex h-[64px] items-center gap-3 md:h-[72px] md:gap-6">
            {back ? (
              <button
                onClick={goBack}
                className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas lg:hidden"
                aria-label="뒤로"
              >
                <ChevronLeft size={26} />
              </button>
            ) : (
              <button
                onClick={() => setMenu(true)}
                className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas lg:hidden"
                aria-label="전체 메뉴"
              >
                <Menu size={24} />
              </button>
            )}
            <Link
              href="/"
              className="inline-flex h-11 items-center text-[1.45rem] font-black leading-none tracking-tight transition-opacity hover:opacity-80 md:text-[1.6rem]"
              aria-label="MORFIT 홈"
            >
              MORFIT<span className="text-brand-accent">.</span>
            </Link>
            <nav className="ml-1 hidden items-center gap-0.5 lg:flex xl:ml-2 xl:gap-1" aria-label="주요 메뉴">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "inline-flex h-10 items-center whitespace-nowrap rounded-lg px-2 text-[0.9rem] font-semibold transition-colors hover:bg-neutral-canvas xl:px-3 xl:text-[0.95rem]",
                    isActive(n.href) && "bg-neutral-canvas",
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto hidden max-w-sm flex-1 xl:block">
              <SearchBox />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-0.5 xl:ml-0">
              <button
                onClick={() => setSearch(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas xl:hidden"
                aria-label="검색"
              >
                <Search size={22} />
              </button>
              <NotificationsButton />
              <Link
                href="/wishlist"
                className="relative hidden h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas md:inline-flex"
                aria-label={`찜 ${wishCount}개`}
              >
                <Heart size={22} />
                {wishCount > 0 && (
                  <span className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-black px-1 text-[0.78rem] font-bold text-white">
                    {wishCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas"
                aria-label={`장바구니 ${cartCount}개`}
                data-tour="c-cart"
              >
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-accent px-1 text-[0.78rem] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/my"
                className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-canvas md:inline-flex"
                aria-label="마이페이지"
              >
                <User size={22} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      {/* 미래AI랩 브릿지 — 모든 고객 화면 하단 공통 */}
      <div className="mx-auto mt-12 w-full max-w-[1280px] px-4 md:mt-16">
        <SampleBridgeCTA surface="customer" />
      </div>

      <footer
        className="mt-14 border-t border-neutral-border bg-brand-ivory md:mt-16"
        style={cover ? { paddingBottom: cover } : undefined}
      >
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-4 py-12 text-[0.9rem] md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-[1.4rem] font-black tracking-tight">
              MORFIT<span className="text-brand-accent">.</span>
            </p>
            <p className="mt-2 leading-relaxed text-neutral-text2">
              취향과 사이즈에 맞는 패션을 발견하는 멀티브랜드 커머스.
              <br />본 서비스는 미래AI랩 AX 시연용 가상 플랫폼입니다.
            </p>
            <div className="mt-3">
              <Badge tone="demo" size="sm">
                데모 · 실제 결제 없음
              </Badge>
            </div>
          </div>
          <div>
            <p className="mb-3 font-bold">쇼핑</p>
            <ul className="space-y-2 text-neutral-text2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-neutral-text">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 flex items-center gap-2 font-bold text-neutral-text2">
              향후 확장{" "}
              <Badge tone="next" size="sm">
                예정
              </Badge>
            </p>
            <ul className="space-y-2 text-neutral-text2">
              {NEXT_MENUS.map((n) => (
                <li key={n.slug}>
                  <Link href={`/next/${n.slug}`} className="tap inline-flex items-center gap-1 hover:text-neutral-text">
                    {n.label}
                    <ChevronRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-bold">고객 안내</p>
            <ul className="space-y-2 text-neutral-text2">
              <li>배송: 5만원 이상 무료 · 평균 1~2일</li>
              <li>교환·반품: 수령 후 7일 이내</li>
              <li>사이즈 상담: 핏 프로필 기반 추천</li>
              <li>
                <Link href="/my" className="hover:text-neutral-text">
                  주문·배송 조회
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-border">
          <div className="mx-auto flex max-w-[1280px] flex-wrap gap-x-4 gap-y-1 px-4 py-4 text-[0.82rem] text-neutral-text2">
            © MORFIT (가상 브랜드) · 미래AI랩 AX·플랫폼 표준 v3.0 · 타사 상표·UI 미사용
          </div>
        </div>
      </footer>

      {/* Mobile bottom navigation: 홈 / 카테고리 / 검색 / 찜 / 마이 */}
      <nav
        data-bottom-bar
        className={cn(
          "safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-neutral-border bg-white md:hidden",
          hideTabs && "hidden",
        )}
        aria-label="하단 메뉴"
      >
        <ul className="grid h-[64px] grid-cols-5">
          {(
            [
              { key: "home", label: "홈", icon: Home, href: "/", active: pathname === "/" },
              {
                key: "cat",
                label: "카테고리",
                icon: LayoutGrid,
                onClick: () => setCats(true),
                active: pathname === "/shop",
              },
              {
                key: "search",
                label: "검색",
                icon: Search,
                onClick: () => setSearch(true),
                active: pathname === "/search",
              },
              {
                key: "wish",
                label: "찜",
                icon: Heart,
                href: "/wishlist",
                active: pathname === "/wishlist",
                dot: wishCount > 0,
              },
              { key: "my", label: "마이", icon: User, href: "/my", active: pathname.startsWith("/my") },
            ] as {
              key: string;
              label: string;
              icon: React.ComponentType<{ size?: number }>;
              href?: string;
              onClick?: () => void;
              active: boolean;
              dot?: boolean;
            }[]
          ).map((t) => {
            const cls = cn(
              "relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[0.78rem] font-semibold transition-colors active:bg-neutral-canvas",
              t.active ? "text-brand-black" : "text-neutral-text2",
            );
            const inner = (
              <>
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 h-[3px] rounded-b-full bg-brand-black transition-all duration-200",
                    t.active ? "w-8 opacity-100" : "w-0 opacity-0",
                  )}
                />
                <t.icon size={22} />
                {t.label}
                {t.dot && <span className="absolute right-[22%] top-2 h-2 w-2 rounded-full bg-brand-accent" />}
              </>
            );
            return (
              <li key={t.key}>
                {t.href ? (
                  <Link href={t.href} aria-current={t.active ? "page" : undefined} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={t.onClick} className={cls}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <Drawer
        open={menu}
        onClose={() => setMenu(false)}
        side="left"
        title={
          <span className="text-[1.35rem] font-black tracking-tight">
            MORFIT<span className="text-brand-accent">.</span>
          </span>
        }
        footer={
          showDemo ? (
            <Link
              href="/ax"
              onClick={() => setMenu(false)}
              className="press flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-black text-[0.95rem] font-bold text-white transition-colors hover:bg-[#2a2a2a]"
              data-tour="c-drawer-ax-cta"
            >
              AX 운영화면 보기
              <ArrowRight size={18} />
            </Link>
          ) : undefined
        }
      >
        <SearchBox className="mb-4" onDone={() => setMenu(false)} />
        <DrawerNav pathname={pathname} onNavigate={() => setMenu(false)} />
        <DrawerNext />
        {showDemo && (
          <div className="mt-5 flex items-center gap-2 border-t border-neutral-border pt-4">
            <span className="text-[0.82rem] font-semibold text-neutral-text2">데모 도구</span>
            <DevicePreviewButton labelAlways />
          </div>
        )}
      </Drawer>

      <BottomSheet open={cats} onClose={() => setCats(false)} title="카테고리">
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            ["/shop?gender=men", "남성"],
            ["/shop?gender=women", "여성"],
            ["/shop", "전체 상품"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="press inline-flex h-12 items-center justify-center rounded-xl border border-neutral-border font-semibold hover:bg-neutral-canvas"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.id}`}
              className="rounded-2xl p-4 font-semibold transition-transform active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${c.gradient[0]}22, ${c.gradient[1]}55)` }}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <p className="mb-2 mt-5 text-[0.8rem] font-bold text-neutral-text2">브랜드</p>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map((b) => (
            <Link
              key={b.id}
              href={`/brands/${b.slug}`}
              className="inline-flex h-10 items-center rounded-full border border-neutral-border px-3 text-[0.85rem] font-semibold"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={search} onClose={() => setSearch(false)} title="검색">
        <SearchBox autoFocus onDone={() => setSearch(false)} />
        <p className="mb-2 mt-4 text-[0.8rem] font-bold text-neutral-text2">추천 검색어</p>
        <div className="flex flex-wrap gap-2">
          {["오버핏 셔츠", "와이드 데님", "울 코트", "첼시 부츠", "크롭 가디건"].map((k) => (
            <Link
              key={k}
              href={`/search?q=${encodeURIComponent(k)}`}
              className="inline-flex h-10 items-center rounded-full bg-neutral-canvas px-3 text-[0.85rem] font-semibold"
            >
              {k}
            </Link>
          ))}
        </div>
      </BottomSheet>

      <Tutorial
        steps={CUSTOMER_TOUR}
        open={tour}
        onClose={() => {
          setTour(false);
          setCustomerTourDone(true);
        }}
      />
    </div>
  );
}
