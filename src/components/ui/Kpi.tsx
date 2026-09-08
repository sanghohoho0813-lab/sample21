"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function KpiCard({ label, value, delta, deltaLabel = "직전 기간 대비", href, icon, accent, sub, size = "md", tour, invert }: {
  label: string; value: ReactNode; delta?: number; deltaLabel?: string; href?: string; icon?: ReactNode; accent?: string; sub?: ReactNode; size?: "md" | "lg"; tour?: string; invert?: boolean;
}) {
  const good = delta === undefined ? null : invert ? delta <= 0 : delta >= 0;
  const inner = (
    <div className={cn("group h-full rounded-cardlg bg-white border border-neutral-border shadow-card p-5 flex flex-col gap-3 transition-all duration-fast", href && "hover:-translate-y-0.5 hover:shadow-raised hover:border-neutral-text2/40")} data-tour={tour}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.9rem] font-semibold text-neutral-text2">{label}</span>
        {icon && <span className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${accent ?? "#5B8DEF"}1f`, color: accent ?? "#5B8DEF" }}>{icon}</span>}
      </div>
      <div className={cn("font-bold tracking-tight tabular leading-none", size === "lg" ? "text-[2.3rem] md:text-[2.6rem]" : "text-[1.8rem] md:text-[2rem]")}>{value}</div>
      <div className="flex items-center justify-between gap-2 min-h-[22px]">
        {delta !== undefined ? (
          <span className={cn("inline-flex items-center gap-1 text-[0.85rem] font-semibold", good ? "text-semantic-success" : "text-semantic-error")}>
            {delta >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}{Math.abs(delta * 100).toFixed(1)}%<span className="text-neutral-text2 font-normal ml-1">{deltaLabel}</span>
          </span>
        ) : <span className="text-[0.85rem] text-neutral-text2">{sub}</span>}
        {href && <ChevronRight size={18} className="text-neutral-text2 group-hover:text-theme-primary transition-colors" />}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl bg-neutral-canvas px-4 py-3", className)}>
      <p className="text-[0.8rem] text-neutral-text2 font-semibold">{label}</p>
      <p className="text-[1.25rem] font-bold tabular leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-[0.8rem] text-neutral-text2 mt-0.5">{sub}</p>}
    </div>
  );
}
