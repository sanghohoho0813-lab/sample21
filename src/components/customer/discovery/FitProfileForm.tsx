"use client";
/* 핏 프로필 입력 폼 + 실시간 미리보기. 저장 시에만 store.updateFitProfile 호출(이벤트 중복 방지). */
import { useEffect, useMemo, useState } from "react";
import { Save, RotateCcw, Ruler, CheckCircle2, Info } from "lucide-react";
import type { Fit, FitProfile, Product } from "@/lib/types";
import { PRODUCT_BY_ID, PRODUCTS, BRAND_BY_ID } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { effFitNote } from "@/lib/kpi";
import { recommendFit } from "@/lib/engine";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Misc";
import { ProductImage } from "@/components/ui/ProductImage";
import { toast } from "@/components/ui/Toast";
import { FilterChip } from "./FilterChip";
import { FITS, FIT_LABEL } from "./filters";

const SIZES = ["XS", "S", "M", "L", "XL"];
const BODY_TYPES: { value: NonNullable<FitProfile["bodyType"]>; label: string; desc: string }[] = [
  { value: "straight", label: "일자형", desc: "어깨·허리·엉덩이 폭이 비슷" },
  { value: "hourglass", label: "모래시계형", desc: "허리가 잘록한 편" },
  { value: "inverted", label: "역삼각형", desc: "어깨가 넓은 편" },
  { value: "pear", label: "하체 볼륨형", desc: "엉덩이·허벅지가 발달" },
];
const FIT_DESC: Record<Fit, string> = { slim: "몸에 붙게", regular: "표준", relaxed: "여유 있게", oversized: "크게" };

export const isProfileComplete = (p: FitProfile) => !!(p.height && p.weight && p.topSize && p.bottomSize);

type Draft = { height: string; weight: string; topSize: string | null; bottomSize: string | null; preferredFit: Fit | null; bodyType: FitProfile["bodyType"] };
const toDraft = (p: FitProfile): Draft => ({ height: p.height ? String(p.height) : "", weight: p.weight ? String(p.weight) : "", topSize: p.topSize, bottomSize: p.bottomSize, preferredFit: p.preferredFit, bodyType: p.bodyType });
const toProfile = (d: Draft): FitProfile => {
  const h = Number(d.height), w = Number(d.weight);
  return { height: Number.isFinite(h) && h >= 120 && h <= 220 ? h : null, weight: Number.isFinite(w) && w >= 30 && w <= 200 ? w : null, topSize: d.topSize, bottomSize: d.bottomSize, preferredFit: d.preferredFit, bodyType: d.bodyType };
};

function PreviewCard({ product, profile }: { product: Product; profile: FitProfile }) {
  const store = useApp();
  const res = recommendFit(product, profile, store.fitNoteOverride[product.id]);
  const brand = BRAND_BY_ID[product.brandId];
  return (
    <div className="rounded-cardlg border border-neutral-border bg-white p-4 md:p-5">
      <p className="text-[0.78rem] font-bold text-neutral-text2 tracking-wide mb-3 inline-flex items-center gap-1.5"><Ruler size={14} />미리보기 · 입력하면 상품마다 추천 사이즈가 표시됩니다</p>
      <div className="flex gap-4">
        <ProductImage colors={product.colors} label={product.name} className="w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.78rem] font-bold text-neutral-text2">{brand.name}</p>
          <p className="font-semibold leading-snug">{product.name}</p>
          <p className="text-[0.8rem] text-neutral-text2 mt-0.5">{effFitNote(product, store)}</p>
          <div className="mt-3">
            {res.ready && res.size ? (
              <>
                <p className="font-bold text-[1.05rem]">추천 사이즈 <span className="text-brand-accent text-[1.3rem]">{res.size}</span> <Badge tone={res.confidence === "high" ? "success" : res.confidence === "mid" ? "info" : "warning"} size="sm" className="ml-1 align-middle">{res.confidence === "high" ? "신뢰도 높음" : res.confidence === "mid" ? "신뢰도 보통" : "신뢰도 낮음"}</Badge></p>
                <ul className="mt-2 space-y-1 text-[0.82rem] text-neutral-text2">
                  {res.reasons.slice(0, 3).map((r) => <li key={r} className="flex items-start gap-1.5"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-semantic-success" />{r}</li>)}
                  {res.cautions.slice(0, 1).map((c) => <li key={c} className="flex items-start gap-1.5"><Info size={14} className="mt-0.5 shrink-0 text-semantic-warning" />{c}</li>)}
                </ul>
              </>
            ) : (
              <p className="min-w-0 rounded-xl bg-neutral-canvas md:bg-brand-ivory px-3 py-2.5 text-[0.88rem] text-neutral-text2">키·몸무게 또는 평소 사이즈를 입력하면 이 자리에 추천 사이즈와 이유가 나타납니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FitProfileForm({ onSaved }: { onSaved?: (p: FitProfile) => void }) {
  const stored = useApp((s) => s.fitProfile);
  const updateFitProfile = useApp((s) => s.updateFitProfile);
  const wishlist = useApp((s) => s.wishlist);
  const [draft, setDraft] = useState<Draft>(() => toDraft(stored));
  useEffect(() => { setDraft(toDraft(stored)); }, [stored]);
  const live = useMemo(() => toProfile(draft), [draft]);
  const filled = [live.height, live.weight, live.topSize, live.bottomSize, live.preferredFit, live.bodyType].filter(Boolean).length;
  const complete = isProfileComplete(live);
  const dirty = JSON.stringify(toDraft(stored)) !== JSON.stringify(draft);

  const previewProduct = useMemo(() => {
    const fromWish = wishlist.map((w) => PRODUCT_BY_ID[w.productId]).find((p) => p && p.categoryId !== "bag" && p.categoryId !== "acc" && p.categoryId !== "shoes");
    return fromWish ?? PRODUCT_BY_ID["p-nove-oxford"] ?? PRODUCTS[0];
  }, [wishlist]);

  const save = () => {
    if (!live.height && !live.weight && !live.topSize && !live.bottomSize) { toast("입력한 정보가 없어요", "키·몸무게 또는 평소 사이즈부터 입력해주세요.", "warning"); return; }
    updateFitProfile(live);
    toast(isProfileComplete(live) ? "핏 프로필을 완성했어요" : "핏 프로필을 저장했어요", isProfileComplete(live) ? "이제 상품마다 추천 사이즈가 표시됩니다." : "키·몸무게·상의·하의 4가지를 채우면 추천이 더 정확해져요.", "success");
    onSaved?.(live);
  };
  const reset = () => { setDraft({ height: "", weight: "", topSize: null, bottomSize: null, preferredFit: null, bodyType: null }); };

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
      <div className="lg:col-span-7 rounded-cardlg border border-neutral-border bg-white p-4 md:p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2"><p className="font-bold">프로필 완성도</p><span className="text-[0.85rem] text-neutral-text2 tabular">{filled}/6 · {complete ? "추천 가능" : "4개 필수"}</span></div>
          <Progress value={filled / 6} tone={complete ? "success" : "primary"} />
          <p className="mt-1.5 text-[0.8rem] text-neutral-text2">필수: 키 · 몸무게 · 평소 상의 · 평소 하의 (선호 핏·체형은 선택)</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="키" name="height" type="number" inputMode="numeric" min={120} max={220} placeholder="170" suffix="cm" value={draft.height} onChange={(e) => set({ height: e.target.value })} />
          <Input label="몸무게" name="weight" type="number" inputMode="numeric" min={30} max={200} placeholder="62" suffix="kg" value={draft.weight} onChange={(e) => set({ weight: e.target.value })} />
        </div>
        <fieldset>
          <legend className="mb-2 text-[0.9rem] font-semibold">평소 상의 사이즈</legend>
          <div className="flex flex-wrap gap-2">{SIZES.map((s) => <FilterChip key={s} size="sm" active={draft.topSize === s} onClick={() => set({ topSize: draft.topSize === s ? null : s })}>{s}</FilterChip>)}</div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-[0.9rem] font-semibold">평소 하의 사이즈</legend>
          <div className="flex flex-wrap gap-2">{SIZES.map((s) => <FilterChip key={s} size="sm" active={draft.bottomSize === s} onClick={() => set({ bottomSize: draft.bottomSize === s ? null : s })}>{s}</FilterChip>)}</div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-[0.9rem] font-semibold">선호 핏 <span className="text-neutral-text2 font-normal text-[0.82rem]">(선택)</span></legend>
          <div className="flex flex-wrap gap-2">{FITS.map((f) => <FilterChip key={f} size="sm" active={draft.preferredFit === f} onClick={() => set({ preferredFit: draft.preferredFit === f ? null : f })}>{FIT_LABEL[f]} · {FIT_DESC[f]}</FilterChip>)}</div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-[0.9rem] font-semibold">체형 <span className="text-neutral-text2 font-normal text-[0.82rem]">(선택)</span></legend>
          <div className="grid grid-cols-2 gap-2">
            {BODY_TYPES.map((b) => (
              <button key={b.value} type="button" aria-pressed={draft.bodyType === b.value} onClick={() => set({ bodyType: draft.bodyType === b.value ? null : b.value })} className={cn("rounded-xl border px-3 py-2.5 text-left transition-all duration-fast active:scale-[0.98] min-h-[56px]", draft.bodyType === b.value ? "border-brand-black bg-brand-black text-white" : "border-neutral-border bg-white hover:border-neutral-text2")}>
                <span className="block font-semibold text-[0.9rem]">{b.label}</span><span className={cn("block text-[0.75rem]", draft.bodyType === b.value ? "text-white/75" : "text-neutral-text2")}>{b.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
          <Button variant="outline" onClick={reset} icon={<RotateCcw size={16} />}>초기화</Button>
          <Button variant="brand" onClick={save} icon={<Save size={16} />} disabled={!dirty && isProfileComplete(stored)}>{isProfileComplete(stored) && !dirty ? "저장됨" : "프로필 저장"}</Button>
        </div>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <PreviewCard product={previewProduct} profile={live} />
        <div className="rounded-2xl bg-brand-ivory border border-neutral-border p-4 text-[0.85rem] text-neutral-text2 leading-relaxed">
          <p className="font-bold text-neutral-text mb-1">무엇이 달라지나요?</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>상품 상세마다 <strong className="text-neutral-text">추천 사이즈와 이유</strong>가 표시됩니다.</li>
            <li>작게·크게 나온 상품은 한 치수 보정해 알려드립니다.</li>
            <li>홈과 마이페이지 추천이 취향·핏 기준으로 바뀝니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
