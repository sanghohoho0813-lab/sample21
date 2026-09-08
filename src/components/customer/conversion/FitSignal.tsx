"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Ruler, Sparkles, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import type { Fit, FitProfile, Product } from "@/lib/types";
import { useApp } from "@/lib/store";
import { effFitNote } from "@/lib/kpi";
import { recommendFit } from "@/lib/engine";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Segmented } from "@/components/ui/Form";
import { Progress } from "@/components/ui/Misc";
import { toast } from "@/components/ui/Toast";
import { AIReadyBadge } from "@/components/ax/AIReady";
import { cn } from "@/lib/cn";
import { PREFERRED_FIT_OPTIONS, SIZE_OPTIONS } from "./shared";

const CONF_LABEL = { high: "높음", mid: "보통", low: "낮음" } as const;
const CONF_TONE = { high: "success", mid: "primary", low: "warning" } as const;

/** 핏 프로필 인라인 폼 — 상품 상세와 My Profile에서 공용 */
export function FitProfileForm({ compact, onSaved, submitLabel = "저장하고 추천 보기" }: { compact?: boolean; onSaved?: () => void; submitLabel?: string }) {
  const profile = useApp((s) => s.fitProfile);
  const updateFitProfile = useApp((s) => s.updateFitProfile);
  const [height, setHeight] = useState(profile.height ? String(profile.height) : "");
  const [weight, setWeight] = useState(profile.weight ? String(profile.weight) : "");
  const [topSize, setTopSize] = useState(profile.topSize ?? "");
  const [bottomSize, setBottomSize] = useState(profile.bottomSize ?? "");
  const [preferredFit, setPreferredFit] = useState<Fit | "">(profile.preferredFit ?? "");
  const [bodyType, setBodyType] = useState<NonNullable<FitProfile["bodyType"]> | "">(profile.bodyType ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const h = Number(height), w = Number(weight);
    if (height && (h < 130 || h > 210)) err.height = "키는 130~210cm 사이로 입력해주세요.";
    if (weight && (w < 30 || w > 150)) err.weight = "몸무게는 30~150kg 사이로 입력해주세요.";
    if (!height && !weight && !topSize && !bottomSize) err.form = "키·몸무게 또는 평소 사이즈 중 하나는 입력해주세요.";
    setErrors(err);
    if (Object.keys(err).length) return;
    updateFitProfile({ height: height ? h : null, weight: weight ? w : null, topSize: topSize || null, bottomSize: bottomSize || null, preferredFit: preferredFit || null, bodyType: bodyType || null });
    toast("핏 프로필을 저장했습니다", "상품마다 추천 사이즈와 이유를 보여드립니다");
    onSaved?.();
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Input label="키" name="height" inputMode="numeric" placeholder="예: 165" suffix="cm" value={height} onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ""))} />
        <Input label="몸무게" name="weight" inputMode="numeric" placeholder="예: 55" suffix="kg" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, ""))} />
      </div>
      {(errors.height || errors.weight) && <p className="text-[0.85rem] text-semantic-error">{errors.height ?? errors.weight}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Select label="평소 상의" name="topSize" value={topSize} onChange={(e) => setTopSize(e.target.value)}><option value="">선택</option>{SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</Select>
        <Select label="평소 하의" name="bottomSize" value={bottomSize} onChange={(e) => setBottomSize(e.target.value)}><option value="">선택</option>{SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</Select>
      </div>
      <div>
        <p className="mb-1.5 text-[0.9rem] font-semibold">선호 핏</p>
        <Segmented<Fit | ""> value={preferredFit} onChange={setPreferredFit} options={[{ value: "", label: "상관없음" }, ...PREFERRED_FIT_OPTIONS]} size={compact ? "sm" : "md"} className="w-full" />
      </div>
      {!compact && (
        <Select label="체형 (선택)" name="bodyType" value={bodyType} onChange={(e) => setBodyType(e.target.value as typeof bodyType)}>
          <option value="">선택 안 함</option><option value="straight">일자 체형</option><option value="hourglass">허리가 잘록한 체형</option><option value="inverted">어깨가 넓은 체형</option><option value="pear">골반이 넓은 체형</option>
        </Select>
      )}
      {errors.form && <p className="text-[0.85rem] text-semantic-error">{errors.form}</p>}
      <Button type="submit" variant="brand" full icon={<Ruler size={16} />}>{submitLabel}</Button>
      <p className="text-[0.78rem] text-neutral-text2 leading-relaxed">입력한 정보는 이 기기의 DEMO 저장소에만 보관되며 개인화 추천에 사용됩니다. 실제 개인정보는 저장하지 않습니다.</p>
    </form>
  );
}

/** Fit Signal — PROJECT SIGNATURE ②. 규칙 기반 핏 추천 카드 (AI Ready). */
export function FitSignal({ product, selectedSize, onPickSize }: { product: Product; selectedSize: string | null; onPickSize: (size: string) => void }) {
  const store = useApp();
  const profile = store.fitProfile;
  const override = store.fitNoteOverride[product.id];
  const result = useMemo(() => recommendFit(product, profile, override), [product, profile, override]);
  const fitNote = effFitNote(product, store);
  const [editing, setEditing] = useState(false);
  const track = store.track;
  useEffect(() => { if (result.ready) track("view_fit_recommendation", { productId: product.id, size: result.size ?? "", confidence: result.confidence }); }, [product.id, result.ready, result.size, result.confidence, track]);
  const profileSummary = [profile.height && `${profile.height}cm`, profile.weight && `${profile.weight}kg`, profile.topSize && `상의 ${profile.topSize}`, profile.bottomSize && `하의 ${profile.bottomSize}`].filter(Boolean).join(" · ");
  const sizeSelectable = !!result.size && product.sizes.includes(result.size);

  return (
    <section id="fit-signal" data-tour="c-fit-signal" className="rounded-cardlg border border-neutral-border bg-white shadow-card overflow-hidden scroll-mt-24">
      <div className="px-5 pt-5 pb-3 flex flex-wrap items-center gap-2">
        <span className="h-9 w-9 rounded-xl bg-brand-accent/10 text-brand-accent inline-flex items-center justify-center"><Ruler size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[1.05rem] leading-tight">핏 추천 Preview <span className="text-neutral-text2 font-semibold text-[0.85rem]">· 규칙 기반</span></p>
          <p className="text-[0.82rem] text-neutral-text2">키·몸무게·평소 사이즈·상품 실측·반품 데이터로 계산</p>
        </div>
        <AIReadyBadge kind="fit" />
      </div>

      {!result.ready ? (
        <div className="px-5 pb-5">
          <div className="rounded-xl bg-brand-ivory px-4 py-3 mb-4 text-[0.9rem] leading-relaxed"><span className="font-bold">30초면 충분해요.</span> 키·몸무게 또는 평소 사이즈만 입력하면 이 상품의 추천 사이즈와 이유를 바로 보여드립니다.</div>
          <FitProfileForm compact />
        </div>
      ) : (
        <div className="px-5 pb-5 space-y-4">
          <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-stretch">
            <div className="rounded-2xl bg-brand-black text-white px-6 py-5 flex flex-col items-center justify-center min-w-[150px]">
              <p className="text-[0.78rem] font-semibold text-white/70">추천 사이즈</p>
              <p className="text-[2.6rem] font-black leading-none mt-1 tabular">{result.size ?? "—"}</p>
              {!result.size && <p className="text-[0.75rem] text-white/70 mt-1 text-center">평소 mm 기준</p>}
            </div>
            <div className="rounded-2xl border border-neutral-border p-4 flex flex-col justify-center gap-2">
              <div className="flex items-center justify-between gap-2 text-[0.9rem]"><span className="font-bold">신뢰도</span><Badge tone={CONF_TONE[result.confidence] === "primary" ? "accent" : CONF_TONE[result.confidence]} size="sm">{CONF_LABEL[result.confidence]} · {Math.round(result.confidenceScore * 100)}%</Badge></div>
              <Progress value={result.confidenceScore} tone={CONF_TONE[result.confidence]} />
              <p className="text-[0.8rem] text-neutral-text2">{result.confidence === "high" ? "프로필과 실측이 잘 맞습니다." : result.confidence === "mid" ? "평소 사이즈나 선호 핏을 더 입력하면 정확해집니다." : "참고용으로만 활용하세요. 실측 확인을 권장합니다."}</p>
              {sizeSelectable && (
                <Button size="sm" variant={selectedSize === result.size ? "secondary" : "brand"} onClick={() => { onPickSize(result.size!); toast(`추천 사이즈 ${result.size}을(를) 선택했습니다`); }} icon={selectedSize === result.size ? <CheckCircle2 size={14} /> : <Sparkles size={14} />} className="mt-1 self-start">{selectedSize === result.size ? "추천 사이즈 선택됨" : "추천 사이즈 선택"}</Button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-[0.9rem] mb-1.5">추천 이유</p>
              {result.reasons.length ? <ul className="space-y-1.5 text-[0.9rem]">{result.reasons.map((r) => <li key={r} className="flex gap-2"><CheckCircle2 size={16} className="text-semantic-success mt-0.5 shrink-0" /><span>{r}</span></li>)}</ul> : <p className="text-[0.88rem] text-neutral-text2">단일 사이즈 상품입니다.</p>}
            </div>
            <div>
              <p className="font-bold text-[0.9rem] mb-1.5">주의할 점</p>
              {result.cautions.length ? <ul className="space-y-1.5 text-[0.9rem]">{result.cautions.map((c) => <li key={c} className="flex gap-2"><AlertTriangle size={16} className="text-semantic-warning mt-0.5 shrink-0" /><span>{c}</span></li>)}</ul> : <p className="text-[0.88rem] text-neutral-text2">특별한 주의사항이 없습니다.</p>}
            </div>
          </div>

          {result.peerNote && (
            <div className="rounded-xl bg-brand-ivory px-4 py-3 flex gap-2 text-[0.9rem]"><Users size={16} className="mt-0.5 shrink-0 text-neutral-text2" /><div><p className="font-bold">비슷한 체형의 선택</p><p className="text-neutral-text2">{result.peerNote}</p></div></div>
          )}
          <div className={cn("rounded-xl px-4 py-3 text-[0.9rem] border", override ? "border-brand-accent/40 bg-brand-accent/5" : "border-neutral-border")}>
            <p className="font-bold flex items-center gap-2">상품별 핏 특성 {override && <Badge tone="accent" size="sm">핏 안내 개선 반영</Badge>}</p>
            <p className="text-neutral-text2 mt-0.5 leading-relaxed">{fitNote}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[0.82rem] text-neutral-text2">내 프로필: {profileSummary || "체형 정보 없음"}{profile.preferredFit && ` · ${PREFERRED_FIT_OPTIONS.find((f) => f.value === profile.preferredFit)?.label} 선호`}</p>
            <button type="button" onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-1 text-[0.85rem] font-semibold text-neutral-text hover:text-brand-accent">{editing ? <>접기<ChevronUp size={14} /></> : <>프로필 수정<ChevronDown size={14} /></>}</button>
          </div>
          {editing && <div className="rounded-2xl border border-neutral-border p-4 animate-fadeIn"><FitProfileForm compact onSaved={() => setEditing(false)} submitLabel="저장" /></div>}
          <p className="text-[0.78rem] text-neutral-text2 leading-relaxed border-t border-neutral-border pt-3">이 추천은 규칙 기반 계산 결과이며 참고용입니다. 최종 사이즈 선택의 책임은 고객에게 있으며, 정확한 착용감을 보장하지 않습니다. 실측표와 리뷰를 함께 확인하세요.</p>
        </div>
      )}
    </section>
  );
}
