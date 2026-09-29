"use client";
/* ------------------------------------------------------------------
   AX 운영화면 셸 — UI/UX 안정화 v1.0
   · 1차 메뉴 8개(최대 2단계). 여러 화면을 묶은 메뉴는 아코디언, 현재 화면이 속한 메뉴만 자동으로 펼친다.
   · 같은 묶음 안의 화면끼리는 본문 위 '섹션 탭'으로도 오간다 (모바일에서 메뉴를 다시 열 필요 없음).
   · 현재 위치 강조는 한 가지 방식: 옅은 배경 + 왼쪽 막대.
   · 모바일 헤더는 2층: [데모 툴바: 역할·시각] + [메인: ☰ · 로고 · 고객 플랫폼 보기].
   · 햄버거는 항상 왼쪽, Drawer는 왼쪽에서 86vw(최대 380px), 하단에 '고객 플랫폼 보기' 고정.
------------------------------------------------------------------- */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { Menu, Play, MoreHorizontal, ChevronDown, GraduationCap, ArrowRight } from "lucide-react";
import { useApp, ROLE_LABEL, ROLE_NAME } from "@/lib/store";
import { entryOf, navByKey, navKeyForPath, navTreeFor, type NavKey } from "@/lib/roles";
import { onDark, tint } from "@/lib/theme";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";
import { LiveClock } from "@/components/system/LiveClock";
import { DevicePreviewButton } from "@/components/system/DevicePreview";
import { Drawer } from "@/components/ui/Overlay";
import { Badge } from "@/components/ui/Badge";
import { usePresentation } from "@/components/system/Presentation";
import { Tutorial, AX_TOUR } from "@/components/system/Tutorial";
import { useIsPreviewFrame } from "@/components/system/hooks";
import { SurfaceMarker } from "@/components/system/AppProviders";
import { SampleBridgeCTA, SampleBridgeMini } from "@/components/system/SampleBridgeCTA";

function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const I = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <I size={size} />;
}

/** 1차 메뉴 한 줄 (단일 화면 링크 또는 묶음 토글) — 어두운 셸 위 */
const ROW = "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ease-out";
const ActiveBar = ({ on }: { on: boolean }) => <span aria-hidden className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-theme-highlight transition-all duration-200 ease-out", on ? "h-5" : "h-0 group-hover:h-4")} />;

function NavTree({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const tree = useMemo(() => navTreeFor(role), [role]);
  const activeKey = navKeyForPath(pathname);
  const activeEntry = activeKey ? entryOf(activeKey).id : null;
  const [open, setOpen] = useState<Record<string, boolean>>(() => (activeEntry ? { [activeEntry]: true } : {}));
  useEffect(() => { if (activeEntry) setOpen((o) => (o[activeEntry] ? o : { ...o, [activeEntry]: true })); }, [activeEntry]);

  return (
    <nav className="space-y-0.5" aria-label="AX 메뉴">
      {tree.map(({ entry, items }) => {
        const color = `var(--icon-${entry.tone})`;
        const tile = (on: boolean) => (
          <span className="tile h-8 w-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: tint(color, on ? 34 : 20), color: onDark(color, on ? 48 : 60) }}>
            <NavIcon name={entry.icon} />
          </span>
        );
        if (entry.key) {
          const it = items[0];
          const active = activeKey === it.key;
          return (
            <Link key={entry.id} href={it.href} onClick={onNavigate} data-tour={it.tour} aria-current={active ? "page" : undefined}
              className={cn(ROW, active ? "bg-white/[0.12]" : "hover:bg-white/[0.08] hover:translate-x-[3px]")}>
              <ActiveBar on={active} />
              {tile(active)}
              <span className={cn("text-[0.95rem] font-semibold leading-snug break-keep", active ? "text-white" : "text-[color:var(--sidebar-muted)] group-hover:text-white")}>{entry.label}</span>
            </Link>
          );
        }
        const isOpen = !!open[entry.id];
        const containsActive = items.some((i) => i.key === activeKey);
        return (
          <div key={entry.id}>
            <button type="button" onClick={() => setOpen((o) => ({ ...o, [entry.id]: !o[entry.id] }))} aria-expanded={isOpen} aria-controls={`nav-${entry.id}`} data-tour={entry.tour}
              className={cn(ROW, "hover:bg-white/[0.08]")}>
              {tile(false)}
              <span className={cn("flex-1 text-[0.95rem] font-semibold leading-snug break-keep", containsActive ? "text-white" : "text-[color:var(--sidebar-muted)] group-hover:text-white")}>{entry.label}</span>
              <span className="tabular text-[0.78rem] font-semibold" style={{ color: "var(--sidebar-label)" }}>{items.length}</span>
              <ChevronDown size={16} className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")} style={{ color: "var(--sidebar-label)" }} />
            </button>
            {isOpen && (
              <ul id={`nav-${entry.id}`} className="mt-0.5 mb-1.5 ml-[1.6rem] pl-3 border-l border-white/[0.12] space-y-0.5 stagger stagger-sm">
                {items.map((it) => {
                  const active = activeKey === it.key;
                  return (
                    <li key={it.key}>
                      <Link href={it.href} onClick={onNavigate} data-tour={it.tour} aria-current={active ? "page" : undefined}
                        className={cn("group relative flex items-center min-h-[42px] rounded-lg px-3 text-[0.92rem] font-semibold leading-snug break-keep transition-all duration-200",
                          active ? "bg-white/[0.12] text-white" : "text-[color:var(--sidebar-muted)] hover:text-white hover:bg-white/[0.08] hover:translate-x-[2px]")}>
                        <ActiveBar on={active} />
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/** 묶음 안 형제 화면 탭 — 본문 맨 위. 한 화면짜리 메뉴에서는 나오지 않는다. */
function SectionTabs({ role }: { role: Role }) {
  const pathname = usePathname();
  const key = navKeyForPath(pathname);
  if (!key) return null;
  const entry = entryOf(key);
  if (!entry.children) return null;
  const items = entry.children.map(navByKey).filter((n) => n.roles.includes(role));
  if (items.length < 2) return null;
  return (
    <nav aria-label={`${entry.label} 하위 메뉴`} className="mb-5 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto hide-scrollbar print:hidden" data-tour="section-tabs">
      <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-border bg-white p-1 shadow-card">
        <span className="hidden sm:inline-flex items-center gap-1.5 pl-2.5 pr-1.5 text-[0.82rem] font-bold text-neutral-text2 whitespace-nowrap">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--icon-${entry.tone})` }} />{entry.label}
        </span>
        {items.map((it) => {
          const active = it.key === key;
          return (
            <Link key={it.key} href={it.href} aria-current={active ? "page" : undefined}
              className={cn("press h-10 md:h-9 px-3.5 rounded-lg inline-flex items-center text-[0.88rem] font-semibold whitespace-nowrap transition-colors duration-200",
                active ? "bg-theme-soft text-theme-primary" : "text-neutral-text2 hover:text-neutral-text hover:bg-neutral-canvas")}>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/ax" className="group block px-3 py-1 rounded-xl hover:bg-white/[0.06] transition-colors duration-200" aria-label="AX 운영화면 홈">
      <span className="block text-[1.35rem] font-black tracking-tight text-white leading-none transition-transform duration-200 group-hover:translate-x-0.5">MORFIT</span>
      <span className="block mt-1 text-[0.85rem] font-bold tracking-wide" style={{ color: "var(--theme-highlight)" }}>AX 운영화면</span>
    </Link>
  );
}

function SidebarFooter() {
  const role = useApp((s) => s.role);
  return (
    <div className="px-3 pt-4 mt-4 border-t border-white/10 space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><Badge tone="demo" size="sm">데모 데이터</Badge><span className="text-[0.78rem]" style={{ color: "var(--sidebar-label)" }}>가상 데이터 · 실제 성과 아님</span></div>
      <p className="text-[0.82rem]" style={{ color: "var(--sidebar-muted)" }}>현재 역할: <span className="text-white font-semibold">{ROLE_NAME[role === "customer" ? "owner" : role]}</span></p>
      {/* 미래AI랩 브릿지 축소판 — 왼쪽 아래에 3개 링크만 작게 */}
      <SampleBridgeMini className="pt-3 mt-3 border-t border-white/[0.09]" />
    </div>
  );
}

export function RoleSwitcher({ compact, dark }: { compact?: boolean; dark?: boolean }) {
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
  const roles: Role[] = ["owner", "md", "ops"];
  return (
    <div className={cn("inline-flex rounded-xl p-1", dark ? "bg-white/[0.08] border border-white/[0.12]" : "bg-neutral-canvas border border-neutral-border")} role="radiogroup" aria-label="역할 전환" data-tour="role-switch">
      {roles.map((r) => (
        <button key={r} role="radio" aria-checked={role === r} onClick={() => setRole(r)}
          className={cn("h-10 md:h-8 rounded-lg font-semibold whitespace-nowrap transition-all duration-fast", compact ? "px-2.5 text-[0.82rem]" : "px-3 text-[0.85rem]",
            dark ? (role === r ? "bg-white text-brand-black shadow-card" : "text-white/80 hover:text-white hover:bg-white/[0.08]")
                 : (role === r ? "bg-brand-black text-white shadow-card" : "text-neutral-text2 hover:text-neutral-text"))}>
          {ROLE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

/** AX → 고객 플랫폼 전환 (명칭 통일: "고객 플랫폼 보기") */
function CustomerPlatformLink({ className }: { className?: string }) {
  return (
    <Link href="/" data-tour="surface-switch" className={cn("group press sheen h-10 px-3 rounded-xl bg-brand-black text-white text-[0.85rem] font-semibold inline-flex items-center gap-1.5 hover:bg-[#2a2a2a] whitespace-nowrap shrink-0", className)}>
      고객 플랫폼 보기<ArrowRight size={16} className="nudge-x" />
    </Link>
  );
}

export function AxShell({ children }: { children: ReactNode }) {
  const role = useApp((s) => s.role);
  const tutorialDone = useApp((s) => s.tutorialDone);
  const setTutorialDone = useApp((s) => s.setTutorialDone);
  const hydrated = useApp((s) => s.hydrated);
  const [drawer, setDrawer] = useState(false);
  const [tour, setTour] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const inFrame = useIsPreviewFrame();
  const start = usePresentation((s) => s.start);

  // 고객 역할은 AX 운영화면에 들어올 수 없다
  useEffect(() => { if (hydrated && role === "customer") router.replace("/"); }, [hydrated, role, router]);
  // 첫 방문 튜토리얼 (1회)
  useEffect(() => { if (hydrated && !tutorialDone && pathname === "/ax" && !inFrame) { const t = setTimeout(() => setTour(true), 600); return () => clearTimeout(t); } }, [hydrated, tutorialDone, pathname, inFrame]);
  useEffect(() => { setDrawer(false); }, [pathname]);

  const effectiveRole: Role = role === "customer" ? "owner" : role;
  const bottom: [NavKey, string][] = [["dashboard", "대시보드"], ["actions", "실행"], ["inventory", "재고"], ["orders", "주문"]];

  return (
    <div className="min-h-screen flex bg-neutral-canvas">
      <SurfaceMarker surface="ax" />
      <aside className="ax-sidebar hidden xl:flex print:hidden w-[280px] shrink-0 flex-col fixed inset-y-0 left-0 z-30 overflow-y-auto overscroll-contain px-3 py-5">
        <Wordmark />
        <div className="mt-6 flex-1"><NavTree role={effectiveRole} /></div>
        <SidebarFooter />
      </aside>

      <div className="flex-1 min-w-0 xl:pl-[280px] print:pl-0 flex flex-col">
        <header className="sticky top-0 z-30 print:hidden">
          {/* 1층 — 데모 툴바 (모바일·태블릿): 지금 누구로 보는지 · 실시간 시각 */}
          <div className="xl:hidden ax-sidebar h-9 px-4 md:px-6 flex items-center gap-2 text-[0.8rem]" data-tour="ax-demo-bar">
            <Badge tone="demo" size="sm">데모</Badge>
            <span className="min-w-0 truncate" style={{ color: "var(--sidebar-muted)" }}>{ROLE_NAME[effectiveRole]} 화면</span>
            <span className="ml-auto shrink-0"><LiveClock compact light /></span>
          </div>
          {/* 2층 — 메인 헤더: [☰] [로고] ····· [고객 플랫폼 보기] */}
          <div className="bg-white/95 backdrop-blur border-b border-neutral-border">
            <div className="h-14 xl:h-[64px] px-4 md:px-6 flex items-center gap-2 md:gap-3">
              <button onClick={() => setDrawer(true)} className="press xl:hidden h-11 w-11 -ml-2.5 shrink-0 inline-flex items-center justify-center rounded-xl hover:bg-neutral-canvas active:bg-neutral-border/60" aria-label="메뉴 열기"><Menu size={22} /></button>
              <Link href="/ax" className="xl:hidden inline-flex items-center h-11 min-w-0 font-black tracking-tight text-[1.1rem] whitespace-nowrap" aria-label="AX 운영화면 홈">MORFIT <span className="ml-1 text-theme-primary">AX</span></Link>
              {/* 고정 사이드바는 1280px(xl)부터 — 1024px에서 사이드바 280px를 빼면 본문이 744px뿐이라 lg 그리드가 깨진다(D-32) */}
              <div className="hidden xl:block"><LiveClock /></div>
              <div className="ml-auto flex items-center gap-2 min-w-0">
                <div className="hidden xl:flex items-center gap-2">
                  <RoleSwitcher compact />
                  <button onClick={() => setTour(true)} className="group press h-10 px-3 rounded-xl border border-neutral-border bg-white text-[0.85rem] font-semibold hover:bg-neutral-canvas hover:border-neutral-text2/50 inline-flex items-center gap-1.5 whitespace-nowrap" data-tour="tutorial-btn" title="튜토리얼" aria-label="튜토리얼"><GraduationCap size={18} className="transition-transform duration-200 group-hover:-translate-y-0.5" /><span className="hidden 2xl:inline">튜토리얼</span></button>
                  <button onClick={start} className="group press h-10 px-3 rounded-xl border border-neutral-border bg-white text-[0.85rem] font-semibold hover:bg-neutral-canvas hover:border-neutral-text2/50 inline-flex items-center gap-1.5 whitespace-nowrap" data-tour="present-btn" title="시연 모드" aria-label="시연 모드"><Play size={16} className="transition-transform duration-200 group-hover:scale-110" /><span className="hidden 2xl:inline">시연</span></button>
                  <DevicePreviewButton />
                </div>
                <CustomerPlatformLink />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 xl:px-8 py-5 md:py-7 pb-[calc(84px+env(safe-area-inset-bottom))] xl:pb-10 max-w-[1720px] w-full mx-auto">
          <SectionTabs role={effectiveRole} />
          <div key={pathname} className="animate-rise">{children}</div>
          {/* 미래AI랩 브릿지 — 모든 AX 화면 하단 공통 (인쇄 시 제외) */}
          <SampleBridgeCTA surface="ax" className="mt-10 md:mt-12" />
        </main>
      </div>

      {/* 모바일 하단 탭 — 자주 쓰는 4개 + 더보기(전체 메뉴) */}
      <nav className="xl:hidden print:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-border pb-[env(safe-area-inset-bottom)]" aria-label="AX 하단 메뉴">
        <ul className="grid grid-cols-5 h-[64px]">
          {bottom.map(([key, label]) => {
            const i = navByKey(key);
            const active = navKeyForPath(pathname) === key;
            return (
              <li key={i.key} className="relative">
                <Link href={i.href} aria-current={active ? "page" : undefined} className={cn("group relative h-full flex flex-col items-center justify-center gap-0.5 text-[0.78rem] font-semibold transition-colors duration-200 active:bg-neutral-canvas", active ? "text-theme-primary" : "text-neutral-text2")}>
                  <span aria-hidden className={cn("absolute top-0 h-[3px] rounded-b-full bg-theme-primary transition-all duration-200", active ? "w-8 opacity-100" : "w-0 opacity-0")} />
                  <span className="transition-transform duration-200 ease-out group-active:scale-90"><NavIcon name={i.icon} size={22} /></span>
                  {label}
                </Link>
              </li>
            );
          })}
          <li><button onClick={() => setDrawer(true)} className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[0.78rem] font-semibold text-neutral-text2 active:bg-neutral-canvas" aria-label="전체 메뉴 열기"><MoreHorizontal size={22} />더보기</button></li>
        </ul>
      </nav>

      {/* 모바일 Drawer — 상단(로고·닫기) / 중단(역할·메뉴·데모 도구) / 하단 고정(고객 플랫폼 보기) */}
      <Drawer open={drawer} onClose={() => setDrawer(false)} side="left"
        title={<span className="block leading-none"><span className="block text-[1.2rem] font-black tracking-tight text-white">MORFIT</span><span className="block mt-1 text-[0.82rem] font-bold" style={{ color: "var(--theme-highlight)" }}>AX 운영화면</span></span>}
        className="ax-sidebar" headerClassName="border-white/10" bodyClassName="px-3" footerClassName="border-white/10" closeClassName="text-white/80 hover:bg-white/10"
        footer={<Link href="/" onClick={() => setDrawer(false)} className="press flex w-full items-center justify-center gap-2 h-12 rounded-xl bg-white text-brand-black text-[0.95rem] font-bold hover:bg-brand-ivory transition-colors" data-tour="drawer-customer-cta">고객 플랫폼 보기<ArrowRight size={18} /></Link>}>
        <div className="px-2 pb-4">
          <p className="mb-2 text-[0.78rem] font-bold tracking-wide" style={{ color: "var(--sidebar-label)" }}>보는 사람</p>
          <RoleSwitcher compact dark />
        </div>
        <NavTree role={effectiveRole} onNavigate={() => setDrawer(false)} />
        <div className="mt-4 pt-4 border-t border-white/10 px-2">
          <p className="mb-2 text-[0.78rem] font-bold tracking-wide" style={{ color: "var(--sidebar-label)" }}>데모 도구</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { setDrawer(false); setTour(true); }} className="press h-11 rounded-lg bg-white/10 text-white text-[0.82rem] font-semibold inline-flex items-center justify-center gap-1 hover:bg-white/20 transition-colors"><GraduationCap size={16} />튜토리얼</button>
            <button onClick={() => { setDrawer(false); start(); }} className="press h-11 rounded-lg bg-white/10 text-white text-[0.82rem] font-semibold inline-flex items-center justify-center gap-1 hover:bg-white/20 transition-colors"><Play size={14} />시연</button>
            <DevicePreviewButton light labelAlways className="h-11 justify-center bg-white/10 hover:bg-white/20 rounded-lg px-2 text-[0.82rem]" />
          </div>
        </div>
        <SidebarFooter />
      </Drawer>

      <Tutorial steps={AX_TOUR} open={tour} onClose={() => { setTour(false); setTutorialDone(true); }} />
    </div>
  );
}

export function PageHeader({ title, desc, right, badge, tour }: { title: ReactNode; desc?: ReactNode; right?: ReactNode; badge?: ReactNode; tour?: string }) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3 animate-rise" data-tour={tour}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><h1 className="text-[1.6rem] md:text-[1.9rem] font-bold tracking-tight leading-tight break-keep">{title}</h1>{badge}</div>
        {desc && <p className="mt-1.5 text-neutral-text2 text-[0.95rem] leading-relaxed max-w-3xl break-keep">{desc}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2 flex-wrap max-w-full">{right}</div>}
    </div>
  );
}
