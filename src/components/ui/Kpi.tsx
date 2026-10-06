"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { ICON_TONE, tint } from "@/lib/theme";
import { AutoFit } from "./AutoFit";

export function KpiCard({
  label,
  value,
  delta,
  deltaLabel = "직전 대비",
  href,
  icon,
  accent,
  sub,
  size = "md",
  tour,
  invert,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  deltaLabel?: string;
  href?: string;
  icon?: ReactNode;
  accent?: string;
  sub?: ReactNode;
  size?: "md" | "lg";
  tour?: string;
  invert?: boolean;
}) {
  const good = delta === undefined ? null : invert ? delta <= 0 : delta >= 0;
  /* 모바일은 2열로 놓이므로 여백·숫자를 줄이고 '직전 기간 대비' 같은 보조 문구는 숨긴다 — 숫자와 증감이 먼저 */
  const inner = (
    <div
      className={cn(
        "group flex h-full flex-col gap-2 rounded-cardlg border border-neutral-border bg-white p-4 shadow-card md:gap-3 md:p-5",
        href
          ? "hover-lift hover:border-neutral-text2/40"
          : "transition-colors duration-200 hover:border-neutral-text2/25",
      )}
      data-tour={tour}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-keep text-[0.85rem] font-semibold leading-snug text-neutral-text2 md:text-[0.9rem]">
          {label}
        </span>
        {icon && (
          <span
            className="tile -my-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl md:flex"
            style={{ background: tint(accent ?? ICON_TONE.t3, 14), color: accent ?? ICON_TONE.t3 }}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className={cn(
          "tabular mt-auto font-bold leading-none tracking-tight transition-transform duration-200 group-hover:-translate-y-[1px]",
          size === "lg"
            ? "text-[1.6rem] sm:text-[2rem] 2xl:text-[2.5rem]"
            : "text-[1.45rem] sm:text-[1.75rem] 2xl:text-[2rem]",
        )}
      >
        <AutoFit>{value}</AutoFit>
      </div>
      <div className="flex min-h-[20px] items-center justify-between gap-2">
        {delta !== undefined ? (
          <span
            className={cn(
              "inline-flex min-w-0 items-center gap-x-1 text-[0.85rem] font-semibold",
              good ? "text-semantic-success" : "text-semantic-error",
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRight size={16} className="shrink-0" />
            ) : (
              <ArrowDownRight size={16} className="shrink-0" />
            )}
            <span className="whitespace-nowrap">{Math.abs(delta * 100).toFixed(1)}%</span>
            <span className="ml-1 hidden truncate font-normal text-neutral-text2 sm:inline">{deltaLabel}</span>
          </span>
        ) : (
          <span className="line-clamp-2 min-w-0 break-keep text-[0.82rem] leading-snug text-neutral-text2 md:text-[0.85rem]">
            {sub}
          </span>
        )}
        {href && (
          <ChevronRight
            size={18}
            className="nudge-x hidden shrink-0 text-neutral-text2 group-hover:text-theme-primary sm:block"
          />
        )}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** 보조 지표 — 주요 KPI 아래에 촘촘하게 놓는 작은 칸. 아이콘·그림자 없이 숫자와 한 줄 설명만. */
export function KpiTile({
  label,
  value,
  sub,
  href,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  href?: string;
  tone?: "warning" | "error";
}) {
  const inner = (
    <div
      className={cn(
        "group flex h-full flex-col gap-1 rounded-2xl border bg-white px-4 py-3.5",
        href
          ? "transition-[border-color,transform] duration-200 hover:-translate-y-[1px] hover:border-neutral-text2/40"
          : "",
        "border-neutral-border",
      )}
    >
      <span className="flex items-center justify-between gap-2 break-keep text-[0.85rem] font-semibold leading-snug text-neutral-text2">
        <span className="min-w-0">{label}</span>
        {href && (
          <ChevronRight size={16} className="nudge-x shrink-0 text-neutral-text2/60 group-hover:text-theme-primary" />
        )}
      </span>
      <span
        className={cn(
          "tabular text-[1.3rem] font-bold leading-tight tracking-tight md:text-[1.45rem]",
          tone === "error" ? "text-semantic-error" : tone === "warning" ? "text-semantic-warning" : "",
        )}
      >
        <AutoFit>{value}</AutoFit>
      </span>
      {sub && <span className="line-clamp-2 break-keep text-[0.8rem] leading-snug text-neutral-text2">{sub}</span>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl bg-neutral-canvas px-4 py-3 transition-colors duration-200 hover:bg-theme-soft/70",
        className,
      )}
    >
      <p className="break-keep text-[0.8rem] font-semibold leading-snug text-neutral-text2">{label}</p>
      <p className="tabular mt-0.5 text-[1.25rem] font-bold leading-tight">
        <AutoFit>{value}</AutoFit>
      </p>
      {sub && <p className="mt-0.5 break-keep text-[0.8rem] leading-snug text-neutral-text2">{sub}</p>}
    </div>
  );
}
