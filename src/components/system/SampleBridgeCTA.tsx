/* ------------------------------------------------------------------
   SampleBridgeCTA — 샘플을 다 본 사용자를 미래AI랩으로 연결하는 공통 브릿지.
   고객 화면(CustomerShell)과 Business AX(AxShell) 양쪽 하단에 같은 구조로 들어간다.
   · 링크·문구 수정: src/lib/mirae.ts (MIRAE_LINKS / MIRAE_COPY)
   · 메인 CTA에만 아주 약한 light sweep(6초 간격) — 모션 줄이기·인쇄에서 자동 정지
   · 로고는 화면에 이미 있으므로 반복하지 않고 브랜드명·배지만 쓴다
------------------------------------------------------------------- */
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { MIRAE_ARIA, MIRAE_COPY, MIRAE_LINKS } from "@/lib/mirae";
import { cn } from "@/lib/cn";

export interface SampleBridgeProps {
  /** 팔레트: 고객 화면(잉크·아이보리) / AX(테마 컬러) */
  surface?: "customer" | "ax";
  consultHref?: string;
  samplesHref?: string;
  homeHref?: string;
  className?: string;
}

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

export function SampleBridgeCTA({
  surface = "ax",
  consultHref = MIRAE_LINKS.consult,
  samplesHref = MIRAE_LINKS.samples,
  homeHref = MIRAE_LINKS.home,
  className,
}: SampleBridgeProps) {
  const isCustomer = surface === "customer";
  const skin = isCustomer
    ? {
        card: "bg-gradient-to-br from-brand-ivory via-white to-brand-ivory/50",
        badge: "bg-brand-black text-white",
        cta: "bg-brand-black text-white hover:bg-[#2a2a2a]",
        outline: "border-brand-black/20 text-brand-black hover:border-brand-black/45 hover:bg-brand-ivory",
        link: "text-neutral-text2 hover:text-brand-black",
        mark: "text-brand-accent",
        glow: "color-mix(in srgb, var(--brand-black) 26%, transparent)",
        wash: "color-mix(in srgb, var(--brand-accent) 12%, transparent)",
      }
    : {
        card: "bg-gradient-to-br from-theme-soft/70 via-white to-theme-soft/25",
        badge: "bg-theme-primary text-white",
        cta: "bg-theme-primary text-white hover:brightness-110",
        outline: "border-neutral-border text-neutral-text hover:border-theme-primary/50 hover:bg-theme-soft/60",
        link: "text-neutral-text2 hover:text-theme-primary",
        mark: "text-theme-primary",
        glow: "color-mix(in srgb, var(--theme-primary) 30%, transparent)",
        wash: "color-mix(in srgb, var(--theme-primary) 14%, transparent)",
      };

  return (
    <section aria-labelledby="mirae-bridge-title" className={cn("no-print", className)} data-tour="mirae-bridge">
      <div className={cn("relative overflow-hidden rounded-cardlg border border-neutral-border shadow-card p-6 md:p-9", skin.card)}>
        {/* 아주 옅은 코너 광원 — 장식이지만 움직이지 않는다 */}
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: skin.wash }} />

        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[0.72rem] font-bold tracking-[0.12em]", skin.badge)}>
                <Sparkles size={12} />{MIRAE_COPY.badge}
              </span>
              <span className="text-[0.88rem] font-semibold text-neutral-text2">{MIRAE_COPY.madeBy}</span>
            </div>

            <h2 id="mirae-bridge-title" className="mt-4 text-[1.35rem] md:text-[1.75rem] font-bold tracking-tight leading-snug break-keep max-w-[34ch]">
              {MIRAE_COPY.headline}
            </h2>
            <p className="mt-3 text-[0.95rem] md:text-[1rem] text-neutral-text2 leading-relaxed break-keep max-w-[56ch]">
              {MIRAE_COPY.desc}
            </p>
            <p className="mt-1.5 text-[0.86rem] text-neutral-text2/80 leading-relaxed break-keep max-w-[56ch]">
              {MIRAE_COPY.sub}
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end shrink-0">
            <a
              href={consultHref}
              {...EXTERNAL}
              aria-label={MIRAE_ARIA.consult}
              style={{ ["--cta-glow" as string]: skin.glow }}
              className={cn(
                "sheen-idle group inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-xl font-bold text-[1rem] whitespace-nowrap",
                "transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-[0_14px_34px_var(--cta-glow)] active:translate-y-0 active:scale-[0.99]",
                skin.cta,
              )}
            >
              {MIRAE_COPY.consult}
              <ArrowRight size={18} className="nudge-x" />
            </a>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <a href={samplesHref} {...EXTERNAL} aria-label={MIRAE_ARIA.samples}
                className={cn("press inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border bg-white/70 text-[0.9rem] font-semibold transition-all duration-200", skin.outline)}>
                {MIRAE_COPY.samples}<ExternalLink size={14} className="opacity-60" />
              </a>
              <a href={homeHref} {...EXTERNAL} aria-label={MIRAE_ARIA.home}
                className={cn("tap inline-flex items-center gap-1.5 h-11 px-2 text-[0.9rem] font-semibold transition-colors duration-200", skin.link)}>
                <span className="link-line">{MIRAE_COPY.home}</span><ExternalLink size={14} className="opacity-60" />
              </a>
            </div>

            <p className="text-[0.78rem] text-neutral-text2/75 lg:text-right">{MIRAE_COPY.newTab} · 이 샘플의 데이터는 모두 가상입니다</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   SampleBridgeMini — AX 사이드바 왼쪽 아래(어두운 셸)용 축소판.
   같은 3개 링크를 작게 노출한다. 내비게이션보다 튀지 않게.
------------------------------------------------------------------- */
export function SampleBridgeMini({
  consultHref = MIRAE_LINKS.consult,
  samplesHref = MIRAE_LINKS.samples,
  homeHref = MIRAE_LINKS.home,
  className,
}: Omit<SampleBridgeProps, "surface">) {
  return (
    <div className={cn("no-print", className)}>
      <p className="px-1 text-[0.68rem] font-bold tracking-[0.14em]" style={{ color: "var(--sidebar-label)" }}>{MIRAE_COPY.badge}</p>
      <a href={consultHref} {...EXTERNAL} aria-label={MIRAE_ARIA.consult}
        className="sheen-idle group mt-1.5 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-white/[0.14] border border-white/[0.16] text-white text-[0.82rem] font-bold transition-all duration-200 hover:bg-white/[0.22] hover:border-white/[0.3] active:scale-[0.98]">
        {MIRAE_COPY.consult}<ArrowRight size={14} className="nudge-x" />
      </a>
      <div className="mt-1.5 flex items-center gap-1">
        <a href={samplesHref} {...EXTERNAL} aria-label={MIRAE_ARIA.samples}
          className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-lg text-[0.75rem] font-semibold whitespace-nowrap transition-colors duration-200 hover:bg-white/[0.1]" style={{ color: "var(--sidebar-muted)" }}>
          다른 샘플<ExternalLink size={11} className="opacity-60" />
        </a>
        <a href={homeHref} {...EXTERNAL} aria-label={MIRAE_ARIA.home}
          className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-lg text-[0.75rem] font-semibold whitespace-nowrap transition-colors duration-200 hover:bg-white/[0.1]" style={{ color: "var(--sidebar-muted)" }}>
          홈페이지<ExternalLink size={11} className="opacity-60" />
        </a>
      </div>
    </div>
  );
}
