"use client";
import { useNow } from "./hooks";
import { cn } from "@/lib/cn";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** 실시간 날짜·요일·시각 — 하드코딩 금지. Mobile은 압축, 삭제 아님. */
export function LiveClock({ compact, className, light }: { compact?: boolean; className?: string; light?: boolean }) {
  const now = useNow();
  if (!now) return <span className={cn("inline-block h-5 w-32 skeleton", className)} />;
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, "0"), d = String(now.getDate()).padStart(2, "0");
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular whitespace-nowrap", light ? "text-white" : "text-neutral-text", className)} aria-live="off">
      {compact ? <span className="text-[0.8rem] font-semibold">{m}.{d} {DOW[now.getDay()]}</span> : <span className="text-[0.9rem] font-semibold">{y}.{m}.{d} ({DOW[now.getDay()]})</span>}
      <span className={cn("font-bold", compact ? "text-[0.9rem]" : "text-[1rem]")}>{time}</span>
    </span>
  );
}
