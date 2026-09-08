"use client";
/* ------------------------------------------------------------------
   Business AX — core page helpers (dashboard / actions / sales /
   products / inventory). Presentation-only; all numbers come from
   src/lib/kpi.ts selectors. Colors are tokens only.
------------------------------------------------------------------- */
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { BRAND_BY_ID, PRODUCT_BY_ID, SEGMENT_LABEL, VARIANT_BY_ID } from "@/lib/demo/seed";
import { ICON_ACCENTS } from "@/lib/theme";
import type { ActionType, AXAction, Role, Urgency } from "@/lib/types";

/* ------------------------------ Chart tokens ------------------------------ */
export const CHART = {
  primary: "var(--theme-primary)",
  secondary: "var(--theme-secondary)",
  accent: "var(--theme-accent)",
  highlight: "var(--theme-highlight)",
  soft: "var(--theme-soft)",
  text2: "var(--neutral-text-secondary)",
  border: "var(--neutral-border)",
  success: "var(--semantic-success)",
  warning: "var(--semantic-warning)",
  error: "var(--semantic-error)",
};
/** Categorical palette: theme colors first, then icon accents (allowed inline accents). */
export const CHART_SERIES = [CHART.primary, CHART.secondary, CHART.accent, CHART.highlight, ICON_ACCENTS.customer, ICON_ACCENTS.sales, ICON_ACCENTS.settings, ICON_ACCENTS.risk];

export const axisKrw = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString("ko-KR")}만`;
  return `${Math.round(n).toLocaleString("ko-KR")}`;
};
export const dayLabel = (key: string) => key.slice(5).replace("-", ".");

/** Custom recharts tooltip — tokens only. */
export function ChartTip({ active, payload, label, formatter }: {
  active?: boolean; payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string | number; fill?: string; stroke?: string }>; label?: string | number;
  formatter?: (key: string, value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-brand-black text-white px-3 py-2 shadow-lift text-[0.82rem] min-w-[140px]">
      {label !== undefined && <p className="font-bold mb-1">{label}</p>}
      {payload.map((p, i) => {
        const key = String(p.dataKey ?? p.name ?? i);
        const v = typeof p.value === "number" ? p.value : Number(p.value ?? 0);
        return (
          <p key={key + i} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill ?? p.stroke ?? "#fff" }} />{p.name ?? key}</span>
            <span className="tabular font-semibold">{formatter ? formatter(key, v) : v.toLocaleString("ko-KR")}</span>
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------ Action labels ------------------------------ */
export const ACTION_TYPE_LABEL: Record<ActionType, string> = { restock: "재입고", rebalance: "재배분", markdown: "할인", "fit-guide": "핏 안내", "segment-campaign": "세그먼트 캠페인", "cart-reminder": "장바구니 리마인드" };
export const ACTION_TYPES: ActionType[] = ["restock", "rebalance", "markdown", "fit-guide", "segment-campaign", "cart-reminder"];
export const ENGINE_LABEL: Record<AXAction["engine"], string> = { demand: "Demand & Restock Engine", fit: "Fit Engine", markdown: "Markdown Engine", repeat: "Repeat Engine" };
export const ENGINE_SHORT: Record<AXAction["engine"], string> = { demand: "Demand", fit: "Fit", markdown: "Markdown", repeat: "Repeat" };
export const ERROR_COST_LABEL: Record<AXAction["errorCost"], string> = { LOW: "오류 비용 낮음", MID: "오류 비용 중간", HIGH: "오류 비용 높음" };
export const URGENCY_ORDER: Record<Urgency, number> = { high: 0, mid: 1, low: 2 };
export const OPEN_STATUSES = new Set(["recommended", "confirmed", "in-progress"]);

/** Role visibility: ops sees own Actions + restock Actions; md/owner see all. */
export function visibleActions(role: Role, actions: AXAction[]) {
  if (role === "ops") return actions.filter((a) => a.owner === "ops" || a.type === "restock");
  return actions;
}
export function sortByUrgency(actions: AXAction[]) {
  return [...actions].sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || (a.recommendedAt < b.recommendedAt ? 1 : -1));
}
export const variantLabel = (variantId: string) => {
  const v = VARIANT_BY_ID[variantId];
  if (!v) return variantId;
  return `${PRODUCT_BY_ID[v.productId]?.name ?? v.productId} · ${v.color} · ${v.size}`;
};

/* ------------------------------ Small presentational parts ------------------------------ */
export function SectionCard({ title, desc, right, children, tour, className, pad, as }: { title?: ReactNode; desc?: ReactNode; right?: ReactNode; children: ReactNode; tour?: string; className?: string; pad?: "none" | "sm" | "md" | "lg"; as?: "h2" | "h3" }) {
  return (
    <Card className={cn("bg-white", className)} data-tour={tour} pad={pad}>
      {title && <SectionTitle title={title} desc={desc} right={right} as={as ?? "h2"} className="mb-4" />}
      {children}
    </Card>
  );
}

/** KPI value wrapper for md KpiCards in `grid-cols-2 lg:grid-cols-4` rows: scales the number to the column width
 *  (360px 2-col → 1.25rem · 1024px 4-col with 280px sidebar → 1.35rem · 1280px → 1.7rem · ≥1536px → full size). */
export function Big({ children }: { children: ReactNode }) {
  return <span className="text-[1.25rem] sm:text-[length:inherit] lg:text-[1.35rem] xl:text-[1.7rem] 2xl:text-[length:inherit] break-keep">{children}</span>;
}
/** Same for size="lg" KpiCards in `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` rows (only the 1280px 4-col band is tight). */
export function BigLg({ children }: { children: ReactNode }) {
  return <span className="xl:text-[2rem] 2xl:text-[length:inherit] break-keep">{children}</span>;
}

export function DeltaText({ value, invert, label = "직전 대비", className, digits = 1 }: { value: number; invert?: boolean; label?: string; className?: string; digits?: number }) {
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[0.82rem] font-semibold tabular", good ? "text-semantic-success" : "text-semantic-error", className)}>
      {value >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(value * 100).toFixed(digits)}%
      {label && <span className="text-neutral-text2 font-normal ml-1">{label}</span>}
    </span>
  );
}

/** Signed unit delta e.g. "+8" / "−3" (for 판매/찜 대비). */
export function UnitDelta({ cur, prev, className }: { cur: number; prev: number; className?: string }) {
  const d = cur - prev;
  return <span className={cn("tabular text-[0.8rem] font-semibold", d > 0 ? "text-semantic-success" : d < 0 ? "text-semantic-error" : "text-neutral-text2", className)}>{d > 0 ? "+" : ""}{d}</span>;
}

export function MiniBar({ value, tone = "primary", className, showValue = true }: { value: number; tone?: "primary" | "warning" | "error" | "success" | "accent"; className?: string; showValue?: boolean }) {
  const colors = { primary: "bg-theme-primary", warning: "bg-semantic-warning", error: "bg-semantic-error", success: "bg-semantic-success", accent: "bg-theme-accent" };
  const v = Math.max(0, Math.min(100, value));
  return (
    <span className={cn("inline-flex items-center gap-2 min-w-[96px]", className)}>
      <span className="h-2 flex-1 rounded-full bg-neutral-canvas overflow-hidden border border-neutral-border/60"><span className={cn("block h-full rounded-full", colors[tone])} style={{ width: `${Math.max(3, v)}%` }} /></span>
      {showValue && <span className="tabular font-bold text-[0.9rem] w-7 text-right">{Math.round(v)}</span>}
    </span>
  );
}
export const demandTone = (score: number): "error" | "warning" | "primary" | "success" => (score >= 70 ? "error" : score >= 45 ? "warning" : score >= 25 ? "primary" : "success");

export function EntityChip({ href, children, tone = "neutral" }: { href?: string; children: ReactNode; tone?: "neutral" | "accent" | "info" }) {
  const cls = cn("inline-flex items-center gap-1 rounded-full px-2.5 h-7 text-[0.78rem] font-semibold border transition-colors duration-fast whitespace-nowrap max-w-full", tone === "accent" ? "bg-theme-soft border-transparent text-theme-primary hover:brightness-95" : tone === "info" ? "bg-[#e8f0fe] border-transparent text-[#1d4ed8]" : "bg-neutral-canvas border-neutral-border text-neutral-text hover:border-neutral-text2");
  if (href) return <Link href={href} className={cls} onClick={(e) => e.stopPropagation()}>{children}<ChevronRight size={12} className="opacity-60" /></Link>;
  return <span className={cls}>{children}</span>;
}

/** Related product / option / brand / segment chips for an Action. */
export function ActionEntityChips({ action }: { action: AXAction }) {
  const p = action.productId ? PRODUCT_BY_ID[action.productId] : null;
  const v = action.variantId ? VARIANT_BY_ID[action.variantId] : null;
  const b = action.brandId ? BRAND_BY_ID[action.brandId] : null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {p && <EntityChip href={`/ax/products/${p.id}`} tone="accent">{p.name}</EntityChip>}
      {v && <EntityChip href={`/ax/products/${v.productId}?tab=options`}>옵션 {v.color} · {v.size}</EntityChip>}
      {b && <EntityChip href={`/ax/brands`}>{b.name}</EntityChip>}
      {action.segment && <EntityChip href={`/ax/customers?segment=${action.segment}`} tone="info">세그먼트 · {SEGMENT_LABEL[action.segment]}</EntityChip>}
    </div>
  );
}

export function AxLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <Link href={href} className={cn("inline-flex items-center gap-0.5 text-[0.9rem] font-semibold text-theme-primary hover:underline underline-offset-4", className)}>{children}<ChevronRight size={16} /></Link>;
}

export function InfoNote({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "warning"; className?: string }) {
  return (
    <div className={cn("rounded-xl px-4 py-3 text-[0.88rem] leading-relaxed", tone === "accent" ? "bg-theme-soft text-neutral-text" : tone === "warning" ? "bg-[#fff1e6] text-[#b45309]" : "bg-neutral-canvas text-neutral-text2", className)}>{children}</div>
  );
}

export function StatPill({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "neutral" | "warning" | "error" | "success" | "accent" }) {
  return (
    <div className="rounded-xl bg-neutral-canvas px-3.5 py-2.5 min-w-0">
      <p className="text-[0.75rem] font-semibold text-neutral-text2">{label}</p>
      <p className={cn("text-[1.1rem] font-bold tabular leading-tight mt-0.5", tone === "warning" && "text-semantic-warning", tone === "error" && "text-semantic-error", tone === "success" && "text-semantic-success", tone === "accent" && "text-theme-primary")}>{value}</p>
      {sub && <p className="text-[0.75rem] text-neutral-text2 mt-0.5">{sub}</p>}
    </div>
  );
}

export function RoleNote({ children }: { children: ReactNode }) {
  return <div className="inline-flex items-center gap-2 text-[0.82rem] text-neutral-text2"><Badge tone="neutral" size="sm">역할별 화면</Badge>{children}</div>;
}

/* ------------------------------ Skeletons ------------------------------ */
export function KpiSkeleton({ n = 4, lg }: { n?: number; lg?: boolean }) {
  return (
    <div className={cn("grid gap-4", n >= 4 ? "grid-cols-2 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-3")}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-cardlg bg-white border border-neutral-border p-5 space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className={lg ? "h-10 w-3/4" : "h-8 w-2/3"} /><Skeleton className="h-4 w-1/3" /></div>
      ))}
    </div>
  );
}
export function PageSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-end justify-between gap-3"><div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-80 max-w-full" /></div><Skeleton className="h-10 w-64 max-w-[40%]" /></div>
      <KpiSkeleton n={4} lg />
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="rounded-cardlg bg-white border border-neutral-border p-5 space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-40 w-full" /></div>)}
    </div>
  );
}
