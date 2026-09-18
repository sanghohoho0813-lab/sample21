"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { Menu, ExternalLink, Play, BellRing, MoreHorizontal, ChevronDown, GraduationCap } from "lucide-react";
import { useApp, ROLE_LABEL, ROLE_NAME } from "@/lib/store";
import { navFor, navGroupsFor, navByKey, type NavKey } from "@/lib/roles";
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

function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navFor(role);
  const groups = useMemo(() => navGroupsFor(role), [role]);
  const isActive = (href: string) => (href === "/ax" ? pathname === "/ax" : pathname.startsWith(href));
  return (
    <nav className="space-y-4" aria-label="Business AX 메뉴">
      {groups.map((g, gi) => {
        const rows = items.filter((i) => i.group === g.id);
        const groupActive = rows.some((i) => isActive(i.href));
        return (
          <div key={g.id} className={cn(gi > 0 && "pt-4 border-t border-white/[0.09]")}>
            <p className="px-3 mb-2 flex items-center gap-2 text-[0.72rem] font-bold tracking-wider" style={{ color: groupActive ? "var(--sidebar-muted)" : "var(--sidebar-label)" }} title={g.desc}>
              <span className="h-1.5 w-1.5 rounded-full transition-transform duration-200" style={{ background: onDark(`var(--icon-${g.tone})`, 55), transform: groupActive ? "scale(1.6)" : undefined }} />
              {g.label}
              <span className="ml-auto tabular font-semibold opacity-60">{rows.length}</span>
            </p>
            <ul className="space-y-0.5 stagger stagger-sm">
              {rows.map((i) => {
                const active = isActive(i.href);
                const color = `var(--icon-${i.tone})`;
                return (
                  <li key={i.key}>
                    <Link href={i.href} onClick={onNavigate} data-tour={i.tour} aria-current={active ? "page" : undefined}
                      className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ease-out",
                        active ? "bg-white/[0.12]" : "hover:bg-white/[0.08] hover:translate-x-[3px]")}>
                      <span aria-hidden className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-theme-highlight transition-all duration-200 ease-out", active ? "h-5" : "h-0 group-hover:h-4")} />
                      <span className="tile h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                        style={{ background: tint(color, active ? 34 : 20), color: onDark(color, active ? 48 : 60), boxShadow: active ? `inset 0 0 0 1px ${tint(color, 55)}` : undefined }}>
                        <NavIcon name={i.icon} />
                      </span>
                      <span className={cn("text-[0.95rem] font-semibold leading-snug transition-colors duration-200", active ? "text-white" : "text-[color:var(--sidebar-muted)] group-hover:text-white")}>{i.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-theme-highlight animate-pop" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/ax" className="group block px-3 py-1 rounded-xl hover:bg-white/[0.06] transition-colors duration-200" aria-label="Business AX 홈">
      <span className="block text-[1.35rem] font-black tracking-tight text-white leading-none transition-transform duration-200 group-hover:translate-x-0.5">MORFIT</span>
      <span className="block mt-1 text-[0.85rem] font-bold tracking-wide" style={{ color: "var(--theme-highlight)" }}>Business AX</span>
    </Link>
  );
}

function SidebarFooter() {
  const role = useApp((s) => s.role);
  return (
    <div className="px-3 pt-4 mt-4 border-t border-white/10 space-y-2">
      <div className="flex items-center gap-2"><Badge tone="demo" size="sm">DEMO DATA</Badge><span className="text-[0.75rem]" style={{ color: "var(--sidebar-label)" }}>가상 데이터 · 실제 성과 아님</span></div>
      <p className="text-[0.78rem]" style={{ color: "var(--sidebar-muted)" }}>현재 역할: <span className="text-white font-semibold">{ROLE_NAME[role]}</span></p>
      {/* 미래AI랩 브릿지 축소판 — 왼쪽 아래에 3개 링크만 작게 */}
      <SampleBridgeMini className="pt-3 mt-3 border-t border-white/[0.09]" />
    </div>
  );
}

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
  const roles: Role[] = ["owner", "md", "ops"];
  return (
    <div className="inline-flex rounded-xl bg-neutral-canvas border border-neutral-border p-1" role="radiogroup" aria-label="역할 전환" data-tour="role-switch">
      {roles.map((r) => (
        <button key={r} role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={cn("h-10 md:h-8 rounded-lg font-semibold whitespace-nowrap transition-all duration-fast", compact ? "px-2.5 text-[0.8rem]" : "px-3 text-[0.85rem]", role === r ? "bg-brand-black text-white shadow-card" : "text-neutral-text2 hover:text-neutral-text")}>{ROLE_LABEL[r]}</button>
      ))}
    </div>
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

  // customer role cannot access Business AX
  useEffect(() => { if (hydrated && role === "customer") router.replace("/"); }, [hydrated, role, router]);
  // first-visit tutorial (once)
  useEffect(() => { if (hydrated && !tutorialDone && pathname === "/ax" && !inFrame) { const t = setTimeout(() => setTour(true), 600); return () => clearTimeout(t); } }, [hydrated, tutorialDone, pathname, inFrame]);
  useEffect(() => { setDrawer(false); }, [pathname]);

  const effectiveRole: Role = role === "customer" ? "owner" : role;

  return (
    <div className="min-h-screen flex bg-neutral-canvas">
      <SurfaceMarker surface="ax" />
      <aside className="ax-sidebar hidden lg:flex print:hidden w-[280px] shrink-0 flex-col fixed inset-y-0 left-0 z-30 overflow-y-auto px-3 py-5">
        <Wordmark />
        <div className="mt-6 flex-1"><NavList role={effectiveRole} /></div>
        <SidebarFooter />
      </aside>

      <div className="flex-1 min-w-0 lg:pl-[280px] print:pl-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-border print:hidden">
          <div className="h-[64px] px-4 md:px-6 flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="press lg:hidden h-10 w-10 -ml-2 inline-flex items-center justify-center rounded-xl hover:bg-neutral-canvas active:bg-neutral-border/60" aria-label="메뉴 열기"><Menu size={22} /></button>
            <Link href="/ax" className="lg:hidden inline-flex items-center h-10 font-black tracking-tight text-[1.1rem]" aria-label="Business AX 홈">MORFIT <span className="text-theme-primary">AX</span></Link>
            <div className="hidden xl:block"><LiveClock /></div>
            <div className="xl:hidden ml-auto md:ml-2"><LiveClock compact /></div>
            <div className="ml-auto hidden md:flex items-center gap-2">
              <RoleSwitcher compact />
              <button onClick={() => setTour(true)} className="group press hidden lg:inline-flex h-10 px-3 rounded-xl border border-neutral-border bg-white text-[0.85rem] font-semibold hover:bg-neutral-canvas hover:border-neutral-text2/50 items-center gap-1.5 whitespace-nowrap" data-tour="tutorial-btn" title="튜토리얼" aria-label="튜토리얼"><GraduationCap size={18} className="transition-transform duration-200 group-hover:-translate-y-0.5" /><span className="hidden 2xl:inline">튜토리얼</span></button>
              <button onClick={start} className="group press hidden lg:inline-flex h-10 px-3 rounded-xl border border-neutral-border bg-white text-[0.85rem] font-semibold hover:bg-neutral-canvas hover:border-neutral-text2/50 items-center gap-1.5 whitespace-nowrap" data-tour="present-btn" title="시연 모드" aria-label="시연 모드"><Play size={16} className="transition-transform duration-200 group-hover:scale-110" /><span className="hidden 2xl:inline">시연</span></button>
              <DevicePreviewButton />
              <Link href="/" className="group press sheen h-10 px-3 rounded-xl bg-brand-black text-white text-[0.85rem] font-semibold inline-flex items-center gap-1.5 hover:bg-[#2a2a2a] whitespace-nowrap" data-tour="surface-switch" aria-label="고객 화면 보기" title="고객 화면 보기"><ExternalLink size={16} className="nudge-x" /><span className="hidden xl:inline">고객 화면 보기</span></Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 xl:px-8 py-5 md:py-7 pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-10 max-w-[1720px] w-full mx-auto">
          <div key={pathname} className="animate-rise">{children}</div>
          {/* 미래AI랩 브릿지 — 모든 AX 화면 하단 공통 (인쇄 시 제외) */}
          <SampleBridgeCTA surface="ax" className="mt-10 md:mt-12" />
        </main>
      </div>

      {/* Mobile bottom nav (AX) */}
      <nav className="lg:hidden print:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-border safe-bottom" aria-label="AX 하단 메뉴">
        <ul className="grid grid-cols-5 h-[64px] [&>li]:relative [&>li>a]:relative">
          {([["dashboard", "대시보드"], ["actions", "Action"], ["inventory", "재고"], ["orders", "주문"]] as [NavKey, string][]).map(([key, label]) => {
            const i = navByKey(key);
            const active = i.href === "/ax" ? pathname === "/ax" : pathname.startsWith(i.href);
            return (
              <li key={i.key}>
                <Link href={i.href} className={cn("group h-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold transition-colors duration-200 active:bg-neutral-canvas", active ? "text-theme-primary" : "text-neutral-text2")}>
                  <span className={cn("transition-transform duration-200 ease-out group-active:scale-90", active && "-translate-y-0.5 scale-110")}><NavIcon name={i.icon} size={22} /></span>
                  {label}
                  <span aria-hidden className={cn("absolute top-0 h-[3px] rounded-b-full bg-theme-primary transition-all duration-200", active ? "w-8 opacity-100" : "w-0 opacity-0")} />
                </Link>
              </li>
            );
          })}
          <li><button onClick={() => setDrawer(true)} className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-neutral-text2 active:bg-neutral-canvas" aria-label="더보기 메뉴 열기"><MoreHorizontal size={22} />더보기</button></li>
        </ul>
      </nav>

      <Drawer open={drawer} onClose={() => setDrawer(false)} side="left" title="Business AX 메뉴" width="max-w-[320px]" className="ax-sidebar [&_h3]:text-white [&_button]:text-white">
        <div className="-mx-2">
          <div className="px-2 pb-4 space-y-3">
            <RoleSwitcher compact />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setDrawer(false); setTour(true); }} className="press h-10 px-3 rounded-lg bg-white/10 text-white text-[0.82rem] font-semibold inline-flex items-center gap-1 hover:bg-white/20 transition-colors"><GraduationCap size={16} />튜토리얼</button>
              <button onClick={() => { setDrawer(false); start(); }} className="press h-10 px-3 rounded-lg bg-white/10 text-white text-[0.82rem] font-semibold inline-flex items-center gap-1 hover:bg-white/20 transition-colors"><Play size={14} />시연</button>
              <DevicePreviewButton light />
              <Link href="/" className="h-10 px-3 rounded-lg bg-white text-brand-black text-[0.82rem] font-semibold inline-flex items-center gap-1 hover:bg-neutral-canvas"><ExternalLink size={14} />고객 화면</Link>
            </div>
          </div>
          <NavList role={effectiveRole} onNavigate={() => setDrawer(false)} />
          <SidebarFooter />
        </div>
      </Drawer>

      <Tutorial steps={AX_TOUR} open={tour} onClose={() => { setTour(false); setTutorialDone(true); }} />
      <span className="hidden"><BellRing /><ChevronDown /></span>
    </div>
  );
}

export function PageHeader({ title, desc, right, badge, tour }: { title: ReactNode; desc?: ReactNode; right?: ReactNode; badge?: ReactNode; tour?: string }) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3 animate-rise" data-tour={tour}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><h1 className="text-[1.6rem] md:text-[1.9rem] font-bold tracking-tight leading-tight">{title}</h1>{badge}</div>
        {desc && <p className="mt-1 text-neutral-text2 text-[0.95rem] leading-relaxed max-w-3xl">{desc}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2 flex-wrap">{right}</div>}
    </div>
  );
}
