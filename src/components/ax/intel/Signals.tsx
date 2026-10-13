"use client";
/* ------------------------------------------------------------------
   Commerce Intelligence — 공통 표현 요소 (AX 전용 · 고밀도)
   고객 화면과 다른 시각 언어: 작은 글자·표·숫자 정렬·신호 색만 강조.
   · SignalChips: 조회↑ 찜↑ 장바구니↑ 구매전환↓ 반품↑ 재고 — 조합을 한 줄로
   · PatternTag: 신호 조합의 판독 결과
   · Panel: 고밀도 패널(제목 줄 + 본문)
------------------------------------------------------------------- */
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { PATTERN_META, type PatternCode, type SignalChip } from "@/lib/intel/signals";

const TONE_TEXT = {
  error: "text-semantic-error",
  warning: "text-[#b45309]",
  accent: "text-theme-primary",
  info: "text-[#1d4ed8]",
  neutral: "text-neutral-text2",
} as const;
const TONE_DOT = {
  error: "bg-semantic-error",
  warning: "bg-semantic-warning",
  accent: "bg-theme-primary",
  info: "bg-semantic-info",
  neutral: "bg-neutral-text2/50",
} as const;

/** 신호 방향 + 좋고 나쁨 → 색. 오르는 게 늘 좋은 건 아니다(반품·재고 과잉) */
function chipTone(c: SignalChip) {
  if (c.dir === "flat") return "text-neutral-text2";
  return c.good ? "text-semantic-success" : "text-semantic-error";
}

export function SignalChips({
  chips,
  only,
  className,
}: {
  chips: SignalChip[];
  /** 표시할 신호만 (기본: 전부) */
  only?: SignalChip["key"][];
  className?: string;
}) {
  const list = only ? chips.filter((c) => only.includes(c.key)) : chips;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[0.78rem]", className)}>
      {list.map((c) => {
        const Icon = c.dir === "up" ? ArrowUpRight : c.dir === "down" ? ArrowDownRight : Minus;
        return (
          <span key={c.key} className="tabular inline-flex items-center gap-0.5 whitespace-nowrap">
            <span className="text-neutral-text2">{c.label}</span>
            <Icon size={12} className={chipTone(c)} aria-hidden />
            <span className={cn("font-semibold", chipTone(c))}>{c.text}</span>
            <span className="sr-only">{c.dir === "up" ? "상승" : c.dir === "down" ? "하락" : "변화 작음"}</span>
          </span>
        );
      })}
    </span>
  );
}

export function PatternTag({ code, className }: { code: PatternCode; className?: string }) {
  const m = PATTERN_META[code];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-[0.8rem] font-semibold",
        TONE_TEXT[m.tone],
        className,
      )}
      title={m.desc}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[m.tone])} aria-hidden />
      {m.label}
    </span>
  );
}

/** 0~100 막대 — 심각도·우선순위 */
export function ScoreBar({
  value,
  tone = "accent",
  label,
}: {
  value: number;
  tone?: "error" | "warning" | "accent";
  label?: string;
}) {
  const bg = tone === "error" ? "bg-semantic-error" : tone === "warning" ? "bg-semantic-warning" : "bg-theme-primary";
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={label ?? `점수 ${Math.round(value)}`}>
      <span className="tabular w-6 text-right text-[0.8rem] font-bold">{Math.round(value)}</span>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-neutral-border/70" aria-hidden>
        <span
          className={cn("block h-full rounded-full", bg)}
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </span>
    </span>
  );
}

export const scoreTone = (v: number): "error" | "warning" | "accent" =>
  v >= 70 ? "error" : v >= 45 ? "warning" : "accent";

/** 고밀도 패널 — 제목 줄(제목 · 부제 · 오른쪽 도구) + 본문 */
export function Panel({
  title,
  sub,
  right,
  children,
  className,
  bodyClassName,
  tour,
  id,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  tour?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      data-tour={tour}
      className={cn("min-w-0 overflow-hidden rounded-xl border border-neutral-border bg-white", className)}
    >
      <header className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-neutral-border bg-neutral-canvas/60 px-4 py-2.5">
        <h2 className="text-[0.92rem] font-bold tracking-tight">{title}</h2>
        {sub && <p className="min-w-0 text-[0.78rem] text-neutral-text2">{sub}</p>}
        {right && <div className="ml-auto flex shrink-0 items-center gap-2">{right}</div>}
      </header>
      <div className={cn("min-w-0", bodyClassName)}>{children}</div>
    </section>
  );
}

/** 가정·한계 각주 — 숫자 옆에 항상 붙는다 */
export function Assumption({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[0.75rem] leading-snug text-neutral-text2", className)}>※ {children}</p>;
}

/** 표 셀 기본 클래스 */
export const TH = "whitespace-nowrap px-3 py-2 text-left text-[0.75rem] font-semibold text-neutral-text2";
export const TD = "px-3 py-2 align-top text-[0.84rem]";
