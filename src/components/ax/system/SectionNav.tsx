"use client";
/* Why AX 섹션 인덱스 — 데스크톱: 우측 sticky scrollspy · 모바일: 하단 이전/다음 바 (시연 컨트롤러와 겹치지 않도록 시연 중 숨김) */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePresentation } from "@/components/system/Presentation";
import { cn } from "@/lib/cn";
import type { WhyIndexItem } from "./WhyParts";

export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top); else visible.delete(e.target.id); }
      if (visible.size) {
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
        setActive(top);
      }
    }, { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.2, 0.5] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (history.replaceState) history.replaceState(null, "", `#${id}`);
}

export function DesktopSectionNav({ items, active }: { items: WhyIndexItem[]; active: string }) {
  return (
    <nav aria-label="섹션 인덱스" className="hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto hide-scrollbar rounded-cardlg bg-white border border-neutral-border shadow-card p-2">
      <p className="px-3 pt-2 pb-1 text-[0.72rem] font-bold tracking-wider text-neutral-text2">목차 · {items.length} 섹션</p>
      <ol className="space-y-0.5">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id}>
              <button type="button" onClick={() => scrollToSection(it.id)} aria-current={on ? "location" : undefined}
                className={cn("w-full text-left flex items-start gap-2 rounded-xl px-3 py-1.5 text-[0.82rem] transition-colors duration-fast", on ? "bg-theme-soft text-theme-primary font-bold" : "text-neutral-text2 hover:bg-neutral-canvas hover:text-neutral-text")}>
                <span className="tabular shrink-0 w-5 text-[0.75rem] font-bold">{it.no}</span>
                <span className="leading-snug">{it.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function MobileSectionNav({ items, active }: { items: WhyIndexItem[]; active: string }) {
  const presenting = usePresentation((s) => s.active);
  const idx = Math.max(0, items.findIndex((i) => i.id === active));
  const prev = items[idx - 1], next = items[idx + 1], cur = items[idx];
  if (presenting) return null;
  return (
    <div className="lg:hidden fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[45] rounded-2xl bg-brand-black text-white shadow-lift px-2 py-2 flex items-center gap-2 no-print">
      <button type="button" onClick={() => prev && scrollToSection(prev.id)} disabled={!prev} aria-label="이전 섹션" className="h-11 w-11 shrink-0 rounded-xl inline-flex items-center justify-center hover:bg-white/10 active:bg-white/20 disabled:opacity-30"><ChevronLeft size={22} /></button>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-[0.68rem] font-bold text-theme-highlight tabular">{cur?.no} / {items.length}</p>
        <p className="text-[0.85rem] font-semibold leading-tight">{cur?.title}</p>
      </div>
      <button type="button" onClick={() => next && scrollToSection(next.id)} disabled={!next} aria-label="다음 섹션" className="h-11 w-11 shrink-0 rounded-xl inline-flex items-center justify-center bg-white text-brand-black hover:brightness-95 active:scale-95 disabled:opacity-30 transition-all duration-fast"><ChevronRight size={22} /></button>
    </div>
  );
}
