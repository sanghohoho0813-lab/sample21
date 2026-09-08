"use client";
/* Shared helpers for Business AX operations pages (customers / fit-returns / campaigns / brands / orders / evidence).
   Local-only helpers — foundation files (src/lib/*) are not modified. */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Info, SlidersHorizontal } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/Overlay";
import { Skeleton, SkeletonCard } from "@/components/ui/States";
import { useIsMobile } from "@/components/system/hooks";
import { useApp } from "@/lib/store";
import { canFull } from "@/lib/roles";
import type { DataSource, EvidenceType, Role } from "@/lib/types";
import { cn } from "@/lib/cn";

/** localStorage-backed state (try/catch everywhere). Resets when Demo Reset runs. */
export function useLocalJson<T>(key: string, initial: T) {
  const initialRef = useRef(initial);
  const [val, setVal] = useState<T>(() => {
    try {
      if (typeof window === "undefined") return initialRef.current;
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialRef.current;
    } catch { return initialRef.current; }
  });
  const lastResetAt = useApp((s) => s.lastResetAt);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setVal(initialRef.current);
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  }, [lastResetAt, key]);
  const set = useCallback((v: T | ((p: T) => T)) => {
    setVal((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [key]);
  return [val, set] as const;
}

/** 가상 고객 이름 마스킹 — 대표(full 권한) 외에는 가운데 글자를 가립니다. */
export function maskName(name: string) {
  if (!name) return "";
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}
export const displayName = (name: string, role: Role) => (canFull(role, "customer-personal") ? name : maskName(name));

export function PageSkeleton({ kpis = 4 }: { kpis?: number }) {
  return (
    <div className="space-y-6 animate-fadeIn" aria-busy="true" aria-label="불러오는 중">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: kpis }).map((_, i) => (
          <div key={i} className="rounded-cardlg border border-neutral-border bg-white p-5 space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
        ))}
      </div>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={6} />
    </div>
  );
}

/** Desktop: inline filter card. Mobile: "필터" button → BottomSheet (same controls, re-arranged). */
export function FilterBar({ children, activeCount = 0, className, right }: { children: ReactNode; activeCount?: number; className?: string; right?: ReactNode }) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  if (!mobile) {
    return (
      <div className={cn("rounded-cardlg border border-neutral-border bg-white p-4 flex flex-wrap gap-3 items-end", className)}>
        {children}
        {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant="outline" onClick={() => setOpen(true)} icon={<SlidersHorizontal size={16} />} className="flex-1">필터{activeCount ? ` (${activeCount})` : ""}</Button>
      {right}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="필터" footer={<Button full onClick={() => setOpen(false)}>적용</Button>}>
        <div className="space-y-4 [&>*]:w-full">{children}</div>
      </BottomSheet>
    </div>
  );
}

export function NoteCard({ children, tone = "neutral", icon, className }: { children: ReactNode; tone?: "neutral" | "warning" | "info"; icon?: ReactNode; className?: string }) {
  const tones = { neutral: "bg-neutral-canvas text-neutral-text2", warning: "bg-[#fff7d6] text-[#6b5300]", info: "bg-theme-soft text-neutral-text" };
  return (
    <div className={cn("rounded-xl px-4 py-3 text-[0.88rem] leading-relaxed flex gap-2.5 items-start", tones[tone], className)}>
      <span className="mt-0.5 shrink-0">{icon ?? <Info size={16} />}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function SourceBadge({ source, size = "sm" }: { source: DataSource; size?: "sm" | "md" }) {
  return <Badge tone={source === "LIVE" ? "live" : "demo"} size={size}>{source}</Badge>;
}

export const EVIDENCE_TYPE_LABEL: Record<EvidenceType, string> = {
  BASELINE: "기준선", ACTION: "실행", RESULT: "결과", ADOPTION: "채택", CUSTOMER: "고객",
  EFFICIENCY: "효율", REVENUE: "매출", SCALE: "확장", RISK: "위험", EXCEPTION: "예외",
};
export const EVIDENCE_TYPE_TONE: Record<EvidenceType, Tone> = {
  BASELINE: "neutral", ACTION: "info", RESULT: "success", ADOPTION: "accent", CUSTOMER: "primary",
  EFFICIENCY: "info", REVENUE: "success", SCALE: "accent", RISK: "error", EXCEPTION: "warning",
};
export const EVIDENCE_TYPES: EvidenceType[] = ["BASELINE", "ACTION", "RESULT", "ADOPTION", "CUSTOMER", "EFFICIENCY", "REVENUE", "SCALE", "RISK", "EXCEPTION"];

export function EvidenceTypeBadge({ type, size = "sm" }: { type: EvidenceType; size?: "sm" | "md" }) {
  return <Badge tone={EVIDENCE_TYPE_TONE[type]} size={size}>{type} · {EVIDENCE_TYPE_LABEL[type]}</Badge>;
}

/** Simple definition list row used inside drawers. */
export function KV({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2 border-b border-neutral-border last:border-0", className)}>
      <dt className="text-[0.88rem] text-neutral-text2 shrink-0">{label}</dt>
      <dd className="text-[0.92rem] font-semibold text-right min-w-0">{children}</dd>
    </div>
  );
}

export function SectionBlock({ title, desc, right, children, className, tour, id }: { title: ReactNode; desc?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; tour?: string; id?: string }) {
  return (
    <section className={cn("mt-8", className)} data-tour={tour} id={id}>
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-[1.2rem] md:text-[1.35rem] font-bold tracking-tight">{title}</h2>
          {desc && <p className="mt-1 text-neutral-text2 text-[0.9rem] leading-relaxed">{desc}</p>}
        </div>
        {right && <div className="shrink-0 flex items-center gap-2 flex-wrap">{right}</div>}
      </div>
      {children}
    </section>
  );
}

/** "더 보기" pagination helper */
export function useMore(total: number, step = 30) {
  const [n, setN] = useState(step);
  useEffect(() => { setN(step); }, [total, step]);
  return { limit: n, hasMore: n < total, more: () => setN((v) => v + step) };
}

export function MoreButton({ hasMore, onClick, remaining }: { hasMore: boolean; onClick: () => void; remaining: number }) {
  if (!hasMore) return null;
  return <div className="mt-3 flex justify-center"><Button variant="outline" onClick={onClick}>더 보기 ({remaining}건 남음)</Button></div>;
}
