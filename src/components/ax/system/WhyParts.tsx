"use client";
/* Why AX 페이지 레이아웃 부품 — 섹션 · MORFIT이라면 콜아웃 · Before/After · Flow chips · Timeline · Data Loop · 이미지 슬롯 · 숫자 사례 */
import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, Quote } from "lucide-react";
import { GradientImage } from "@/components/ui/ProductImage";
import { Badge, type Tone } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export interface WhyIndexItem { id: string; no: string; title: string }

export function WhySection({ id, no, title, lead, children, className }: { id: string; no: string; title: ReactNode; lead?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section id={id} data-why-section={no} className={cn("scroll-mt-20 rounded-cardlg bg-white border border-neutral-border shadow-card p-5 md:p-8", className)} aria-labelledby={`${id}-h`}>
      <p className="text-[0.78rem] font-bold tracking-wider text-theme-primary tabular">{no}</p>
      <h2 id={`${id}-h`} className="mt-1 text-[1.35rem] md:text-[1.7rem] font-bold tracking-tight leading-tight">{title}</h2>
      {lead && <p className="mt-3 text-[1rem] md:text-[1.1rem] font-semibold leading-relaxed text-neutral-text max-w-3xl">{lead}</p>}
      {children && <div className="mt-5 space-y-5">{children}</div>}
    </section>
  );
}

/** 일반론 뒤에 붙는 "MORFIT이라면…" 맞춤 문장 */
export function Tailor({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-theme-soft/70 border-l-4 border-theme-primary px-4 py-3.5 md:px-5">
      <p className="text-[0.78rem] font-bold tracking-wide text-theme-primary">MORFIT이라면…</p>
      <div className="mt-1 text-[0.95rem] leading-relaxed text-neutral-text">{children}</div>
    </div>
  );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[0.95rem] leading-relaxed text-neutral-text2 max-w-3xl", className)}>{children}</p>;
}

export function BeforeAfter({ before, after, beforeTitle = "지금 (Before)", afterTitle = "AX 적용 후 (After)" }: { before: ReactNode[]; after: ReactNode[]; beforeTitle?: string; afterTitle?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-2xl border border-neutral-border bg-neutral-canvas p-4">
        <p className="font-bold text-neutral-text2">{beforeTitle}</p>
        <ul className="mt-2 space-y-2">{before.map((b, i) => <li key={i} className="flex gap-2 text-[0.92rem] leading-relaxed"><span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-text2/50" /><span>{b}</span></li>)}</ul>
      </div>
      <div className="rounded-2xl border border-theme-primary/30 bg-white p-4">
        <p className="font-bold text-theme-primary">{afterTitle}</p>
        <ul className="mt-2 space-y-2">{after.map((a, i) => <li key={i} className="flex gap-2 text-[0.92rem] leading-relaxed"><span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-theme-primary" /><span>{a}</span></li>)}</ul>
      </div>
    </div>
  );
}

export function FlowChips({ steps, tone = "neutral" }: { steps: { label: string; sub?: string }[]; tone?: "neutral" | "primary" }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2 gap-x-1.5">
      {steps.map((s, i) => (
        <li key={`${s.label}-${i}`} className="flex items-center gap-1.5">
          <span className={cn("inline-flex flex-col items-start rounded-full border px-3.5 py-1.5 text-[0.88rem] font-semibold leading-tight", tone === "primary" ? "border-theme-primary/30 bg-theme-soft text-neutral-text" : "border-neutral-border bg-white")}>
            {s.label}
            {s.sub && <span className="text-[0.7rem] font-medium text-neutral-text2">{s.sub}</span>}
          </span>
          {i < steps.length - 1 && <ArrowRight size={16} className="text-neutral-text2/70 shrink-0" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

export function Timeline({ items }: { items: { tag: string; title: string; desc: ReactNode; tone?: Tone }[] }) {
  return (
    <ol className="relative border-l-2 border-neutral-border ml-2 space-y-5">
      {items.map((it, i) => (
        <li key={i} className="pl-5">
          <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-theme-primary ring-4 ring-white" aria-hidden />
          <div className="flex flex-wrap items-center gap-2"><Badge tone={it.tone ?? "accent"} size="sm">{it.tag}</Badge><span className="font-bold">{it.title}</span></div>
          <div className="mt-1 text-[0.9rem] leading-relaxed text-neutral-text2">{it.desc}</div>
        </li>
      ))}
    </ol>
  );
}

/** Closed Loop — 고객 행동 → AX 신호 → Action → 결과 → 고객 환류 (flex boxes, 모바일은 세로) */
export function DataLoop({ nodes }: { nodes: { title: string; desc: string; tag: string }[] }) {
  return (
    <div className="rounded-2xl bg-neutral-canvas p-4 md:p-5">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-0 md:items-stretch">
        {nodes.map((n, i) => (
          <div key={n.title} className="contents">
            <div className={cn("rounded-2xl border bg-white p-3.5 flex flex-col", i === 0 || i === nodes.length - 1 ? "border-theme-primary/40" : "border-neutral-border")}>
              <Badge tone={i === 0 || i === nodes.length - 1 ? "accent" : "neutral"} size="sm" className="self-start">{n.tag}</Badge>
              <p className="mt-2 font-bold text-[0.95rem] leading-snug">{n.title}</p>
              <p className="mt-1 text-[0.82rem] text-neutral-text2 leading-snug">{n.desc}</p>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex items-center justify-center md:px-1 text-theme-primary" aria-hidden>
                <ArrowDown size={18} className="md:hidden" /><ArrowRight size={18} className="hidden md:block" />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[0.82rem] text-neutral-text2">마지막 칸의 고객 반응이 다시 첫 칸의 행동 데이터가 됩니다 — 한 바퀴가 돌 때마다 데이터가 한 층 쌓입니다.</p>
    </div>
  );
}

export function ImageSlot({ asset, label, gradient, caption }: { asset: string; label: string; gradient: [string, string]; caption: string }) {
  return (
    <figure className="space-y-2">
      <GradientImage gradient={gradient} asset={asset} label={label} ratio="aspect-[21/9]" overlay className="rounded-2xl">
        <div className="absolute inset-0 flex items-end p-4 md:p-5">
          <div>
            <p className="text-[0.7rem] font-bold tracking-wider text-white/75 uppercase">{asset.replace(".jpg", "")}</p>
            <p className="text-white font-bold text-[1rem] md:text-[1.15rem] leading-snug">{label}</p>
          </div>
        </div>
      </GradientImage>
      <figcaption className="text-[0.8rem] text-neutral-text2">{caption} · 사진은 추후 적용 (placeholder)</figcaption>
    </figure>
  );
}

export function NumberCase({ title, badge, rows, note, tone = "neutral" }: { title: ReactNode; badge?: ReactNode; rows: { k: string; v: ReactNode }[]; note?: ReactNode; tone?: "neutral" | "risk" | "primary" }) {
  return (
    <div className={cn("rounded-2xl border bg-white p-4", tone === "risk" ? "border-semantic-error/30" : tone === "primary" ? "border-theme-primary/30" : "border-neutral-border")}>
      <div className="flex flex-wrap items-center gap-2"><p className="font-bold leading-snug">{title}</p>{badge}</div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {rows.map((r) => <div key={r.k} className="min-w-0"><dt className="text-[0.75rem] text-neutral-text2">{r.k}</dt><dd className="font-bold tabular text-[1rem] leading-tight">{r.v}</dd></div>)}
      </dl>
      {note && <p className="mt-3 text-[0.82rem] text-neutral-text2 leading-relaxed">{note}</p>}
    </div>
  );
}

export function QuoteLine({ children }: { children: ReactNode }) {
  return (
    <blockquote className="flex gap-3 rounded-2xl bg-brand-black text-white px-5 py-4">
      <Quote size={20} className="shrink-0 text-theme-highlight" aria-hidden />
      <p className="text-[1rem] md:text-[1.1rem] font-semibold leading-relaxed">{children}</p>
    </blockquote>
  );
}
