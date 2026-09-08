"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { Menu, ExternalLink, Play, BellRing, MoreHorizontal, ChevronDown, GraduationCap } from "lucide-react";
import { useApp, ROLE_LABEL, ROLE_NAME } from "@/lib/store";
import { navFor, AX_NAV } from "@/lib/roles";
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

function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const I = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <I size={size} />;
}

function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navFor(role);
  const groups = useMemo(() => Array.from(new Set(items.map((i) => i.group))), [items]);
  return (
    <nav className="space-y-5" aria-label="Business AX 메뉴">
      {groups.map((g) => (
        <div key={g}>
          <p className="px-3 mb-1.5 text-[0.72rem] font-bold tracking-wider" style={{ color: "var(--sidebar-label)" }}>{g}</p>
          <ul className="space-y-0.5">
            {items.filter((i) => i.group === g).map((i) => {
              const active = i.href === "/ax" ? pathname === "/ax" : pathname.startsWith(i.href);
              return (
                <li key={i.key}>
                  <Link href={i.href} onClick={onNavigate} data-tour={i.tour} aria-current={active ? "page" : undefined}
                    className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-fast", active ? "bg-white/12" : "hover:bg-white/8")}>
                    <span className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: `${i.accent}${active ? "44" : "26"}`, color: i.accent }}><NavIcon name={i.icon} /></span>
                    <span className={cn("text-[0.95rem] font-semibold truncate", active ? "text-white" : "text-[color:var(--sidebar-muted)] group-hover:text-white")}>{i.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-theme-highlight" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/ax" className="block px-3 py-1">
      <span className="block text-[1.35rem] font-black tracking-tight text-white leading-none">MORFIT</span>
      <span className="block mt-1 text-[0.85rem] font-bold tracking-wide" style={{ color: "var(--theme-highlight)" }}>Business AX</span>
    </Link>
  );
}

function SidebarFooter() {
  const role = useApp((s) => s.role);
  return (
    <div className="px-3 pt-4 mt-4 border-t border-white/10 space-y-2">
      <div className="flex items-center gap-2"><Badge tone="demo" size="sm">DEMO DATA</Badge><span className="text-[0.75rem]" style={{ color: "var(--sidebar-label)" }}>가상 데이터 · 실제 성과 아님</span></div>
      <p className="text-[0.78rem]" style={{ color: "var(--sidebar-label)" }}>TECH ASSET · 해당없음 (Demo 프로젝트)</p>
      <p className="text-[0.78rem]" style={{ color: "var(--sidebar-muted)" }}>현재 역할: <span className="text-white font-semibold">{ROLE_NAME[role]}</span></p>
      <p className="text-[0.72rem]" style={{ color: "var(--sidebar-label)" }}>제작 · 미래AI랩 AX Standard v3.0</p>
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
        <button key={r} role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={cn("h-8 rounded-lg font-semibold whitespace-nowrap transition-all duration-fast", compact ? "px-2.5 text-[0.8rem]" : "px-3 text-[0.85rem]", role === r ? "bg-brand-black text-white shadow-card" : "text-neutral-text2 hover:text-neutral-text")}>{ROLE_LABEL[r]}</button>
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
      <aside className="ax-sidebar hidden lg:flex w-[280px] shrink-0 flex-col fixed inset-y-0 left-0 z-30 overflow-y-auto px-3 py-5">
        <Wordmark />
        <div className="mt-6 flex-1"><NavList role={effectiveRole} /></div>
        <SidebarFooter />
      </aside>

      <div className="flex-1 min-w-0 lg:pl-[280px] flex flex-col">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-border">
          <div className="h-[64px] px-4 md:px-6 flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="lg:hidden h-10 w-10 -ml-2 inline-flex items-center justify-center rounded-xl hover:bg-neutral-canvas" aria-label="메뉴 열기"><Menu size={22} /></button>
            <Link href="/ax" className="lg:hidden font-black tracking-tight text-[1.1rem]">MORFIT <span className="text-theme-primary">AX</span></Link>
            <div className="hidden md:block"><LiveClock /></div>
            <div className="md:hidden ml-auto"><LiveClock compact /></div>
            <div className="ml-auto hidden md:flex items-center gap-2">
              <RoleSwitcher compact />
              <button onClick={() => setTour(true)} className="h-10 px-3 rounded-xl border border-neutral-border bg-white text-[0.85rem] font-semibold hover:bg-neutral-canvas inline-flex items-center gap-1.5" data-tour="tutorial-btn"><GraduationCap size={18} /><span className="hidden xl:inline">튜토리얼</span></button>
              <button onClick={start} className="h-10 px-3 rounded-xl border border-neutral-border bg-white text-[0.85rem] font-semibold hover:bg-neutral-canvas inline-flex items-center gap-1.5" data-tour="present-btn"><Play size={16} /><span className="hidden xl:inline">시연</span></button>
              <DevicePreviewButton />
              <Link href="/" className="h-10 px-3 rounded-xl bg-brand-black text-white text-[0.85rem] font-semibold inline-flex items-center gap-1.5 hover:bg-[#2a2a2a]" data-tour="surface-switch"><ExternalLink size={16} />고객 화면 보기</Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 xl:px-8 py-5 md:py-7 pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-10 max-w-[1720px] w-full mx-auto">{children}</main>
      </div>

      {/* Mobile bottom nav (AX) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-border safe-bottom" aria-label="AX 하단 메뉴">
        <ul className="grid grid-cols-5 h-[64px]">
          {[AX_NAV[0], AX_NAV[1], AX_NAV[4], AX_NAV[9]].map((i) => {
            const active = i.href === "/ax" ? pathname === "/ax" : pathname.startsWith(i.href);
            return (
              <li key={i.key}><Link href={i.href} className={cn("h-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold active:bg-neutral-canvas", active ? "text-theme-primary" : "text-neutral-text2")}><NavIcon name={i.icon} size={22} />{i.label.split(" ")[0].replace("·", "·")}</Link></li>
            );
          })}
          <li><button onClick={() => setDrawer(true)} className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-neutral-text2 active:bg-neutral-canvas"><MoreHorizontal size={22} />더보기</button></li>
        </ul>
      </nav>

      <Drawer open={drawer} onClose={() => setDrawer(false)} side="left" title="Business AX 메뉴" width="max-w-[320px]" className="ax-sidebar [&_h3]:text-white [&_button]:text-white">
        <div className="-mx-2">
          <div className="px-2 pb-4 space-y-3">
            <RoleSwitcher compact />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setDrawer(false); setTour(true); }} className="h-9 px-3 rounded-lg bg-white/10 text-white text-[0.82rem] font-semibold inline-flex items-center gap-1"><GraduationCap size={16} />튜토리얼</button>
              <button onClick={() => { setDrawer(false); start(); }} className="h-9 px-3 rounded-lg bg-white/10 text-white text-[0.82rem] font-semibold inline-flex items-center gap-1"><Play size={14} />시연</button>
              <DevicePreviewButton light />
              <Link href="/" className="h-9 px-3 rounded-lg bg-white text-brand-black text-[0.82rem] font-semibold inline-flex items-center gap-1"><ExternalLink size={14} />고객 화면</Link>
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
    <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3" data-tour={tour}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><h1 className="text-[1.6rem] md:text-[1.9rem] font-bold tracking-tight leading-tight">{title}</h1>{badge}</div>
        {desc && <p className="mt-1 text-neutral-text2 text-[0.95rem] leading-relaxed max-w-3xl">{desc}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2 flex-wrap">{right}</div>}
    </div>
  );
}
