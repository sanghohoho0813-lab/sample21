"use client";
/* [화면] 9 Canonical Theme picker + 글자크기 + 모션 + 실시간 미리보기.
   Theme는 shell/primary/secondary/accent/highlight/soft 6색만 바꾸고, 본문·표·폼 Neutral은 고정된다. */
import { ArrowUpRight, Check } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/theme";
import { useApp, type FontScale } from "@/lib/store";
import { Segmented, Toggle } from "@/components/ui/Form";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

const DOT_KEYS = ["shell", "primary", "secondary", "accent", "highlight", "soft"] as const;
const DOT_LABEL: Record<(typeof DOT_KEYS)[number], string> = { shell: "Shell(사이드바)", primary: "Primary", secondary: "Secondary", accent: "Accent", highlight: "Highlight", soft: "Soft" };
const FONT_LABEL: Record<FontScale, string> = { small: "작게", default: "기본", large: "크게" };

export function ThemePicker() {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const choose = (id: ThemeId) => {
    if (id === theme) return;
    setTheme(id);
    const t = THEMES.find((x) => x.id === id);
    if (t) toast(`테마 ${t.no} ${t.name} 적용`, "사이드바·버튼·강조색이 바뀌었습니다. 본문 Neutral은 그대로입니다.");
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" role="radiogroup" aria-label="테마 선택">
      {THEMES.map((t) => {
        const sel = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={sel}
            data-theme-id={t.id}
            onClick={() => choose(t.id)}
            className={cn(
              "text-left rounded-2xl border bg-white p-4 transition-all duration-fast hover:-translate-y-0.5 hover:shadow-raised active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-theme-primary",
              sel ? "border-theme-primary ring-2 ring-theme-primary/30" : "border-neutral-border hover:border-neutral-text2/50",
            )}
          >
            <div className="flex items-center gap-1.5">
              {DOT_KEYS.map((k) => (
                <span key={k} title={DOT_LABEL[k]} aria-label={DOT_LABEL[k]} className="h-6 w-6 rounded-full border border-black/10" style={{ background: t[k] }} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="text-[0.8rem] font-bold text-neutral-text2 tabular">{t.no}</span>{" "}
                <span className="font-bold text-[0.95rem]">{t.name}</span>
              </span>
              {sel ? <Badge tone="primary" size="sm"><Check size={12} />사용 중</Badge> : <span className="text-[0.78rem] text-neutral-text2">선택</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** 테마 변경이 즉시 보이는 미리보기 — KPI 카드 · Primary 버튼 · 배지 · 사이드바 pill */
export function PreviewStrip() {
  const theme = useApp((s) => s.theme);
  const t = THEMES.find((x) => x.id === theme) ?? THEMES[0];
  return (
    <div className="rounded-2xl border border-neutral-border bg-neutral-canvas p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.82rem] font-bold text-neutral-text2">실시간 미리보기 · 테마 {t.no} {t.name}</p>
        <Badge tone="neutral" size="sm">본문·표·폼 Neutral 고정</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-cardlg bg-white border border-neutral-border shadow-card p-4">
          <p className="text-[0.8rem] font-semibold text-neutral-text2">KPI 카드 (샘플)</p>
          <p className="mt-1 text-[1.5rem] font-bold tabular leading-none">4,120만원</p>
          <p className="mt-2 inline-flex items-center gap-1 text-[0.8rem] font-semibold text-semantic-success"><ArrowUpRight size={14} />12.4% <span className="text-neutral-text2 font-normal">샘플</span></p>
        </div>
        <div className="rounded-cardlg bg-white border border-neutral-border shadow-card p-4 flex flex-col justify-center gap-2">
          <button type="button" onClick={() => toast("미리보기 버튼", "Primary 색이 테마를 따릅니다.", "info")} className="h-11 rounded-xl bg-theme-primary text-white font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-fast">Primary 버튼</button>
          <div className="flex flex-wrap gap-2"><Badge tone="accent">관심 상승</Badge><Badge tone="primary">Primary</Badge></div>
        </div>
        <div className="rounded-cardlg bg-theme-shell p-4 flex flex-col justify-center gap-2">
          <div className="rounded-xl bg-white/12 px-3 py-2.5 flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg bg-white/20 shrink-0" />
            <span className="text-white font-semibold text-[0.9rem]">경영 대시보드</span>
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-theme-highlight" />
          </div>
          <p className="text-[0.75rem] font-bold text-theme-highlight">사이드바 pill · Highlight</p>
        </div>
        <div className="rounded-cardlg bg-theme-soft p-4">
          <p className="text-[0.8rem] font-bold text-theme-primary">Soft 배경 · Insight</p>
          <p className="mt-1 text-[0.9rem] text-neutral-text leading-snug">품절 위험 옵션 <span className="font-bold text-theme-primary">7개</span>를 먼저 확인하세요. (샘플)</p>
          <div className="mt-2 flex gap-1.5"><span className="h-2 w-12 rounded-full bg-theme-secondary" /><span className="h-2 w-8 rounded-full bg-theme-accent" /></div>
        </div>
      </div>
    </div>
  );
}

export function DisplaySettings() {
  const fontScale = useApp((s) => s.fontScale);
  const setFontScale = useApp((s) => s.setFontScale);
  const reducedMotion = useApp((s) => s.reducedMotion);
  const setReducedMotion = useApp((s) => s.setReducedMotion);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-neutral-border bg-white p-4">
        <p className="font-bold">글자 크기</p>
        <p className="text-[0.82rem] text-neutral-text2">Root 글자 크기가 바뀌어 전체 화면이 함께 커지거나 작아집니다.</p>
        <Segmented
          className="mt-3"
          value={fontScale}
          onChange={(v) => { setFontScale(v); toast(`글자 크기: ${FONT_LABEL[v]}`, "전체 화면에 즉시 적용되었습니다."); }}
          options={[{ value: "small", label: "작게" }, { value: "default", label: "기본" }, { value: "large", label: "크게" }]}
        />
      </div>
      <div className="rounded-2xl border border-neutral-border bg-white p-4">
        <Toggle
          checked={reducedMotion}
          onChange={(v) => { setReducedMotion(v); toast(v ? "모션 줄이기 켜짐" : "모션 줄이기 꺼짐", v ? "애니메이션·전환 효과를 최소화합니다." : "기본 전환 효과로 돌아갑니다."); }}
          label="모션 줄이기"
          desc="애니메이션과 전환 효과를 최소화합니다. OS의 '동작 줄이기' 설정도 자동 반영됩니다."
        />
      </div>
    </div>
  );
}
