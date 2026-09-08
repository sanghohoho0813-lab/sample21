"use client";
import { ShieldCheck, Ruler, LayoutGrid, RotateCcw } from "lucide-react";
import { CATEGORIES } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/dates";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle } from "@/components/customer/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Form";
import { SkeletonCard } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { FitProfileForm } from "@/components/customer/conversion/FitSignal";
import { NotifyPrefsCard } from "@/components/customer/conversion/MyBits";
import { INTERESTS_KEY, useDocumentTitle, useLocalPref } from "@/components/customer/conversion/shared";

function InterestsCard() {
  const [prefs, setPrefs] = useLocalPref<{ ids: string[] }>(INTERESTS_KEY, { ids: [] });
  const toggle = (id: string) => { const on = prefs.ids.includes(id); const ids = on ? prefs.ids.filter((x) => x !== id) : [...prefs.ids, id]; setPrefs({ ids }); toast(on ? "관심 카테고리에서 제외했습니다" : "관심 카테고리에 추가했습니다", "추천 상품에 반영됩니다 (DEMO)", on ? "info" : "success"); };
  return (
    <div className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
      <p className="font-bold flex items-center gap-2 mb-1"><LayoutGrid size={16} />관심 카테고리</p>
      <p className="text-[0.85rem] text-neutral-text2 mb-3">선택한 카테고리는 이 기기에 저장되어 추천에 활용됩니다.</p>
      <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c.id} active={prefs.ids.includes(c.id)} onClick={() => toggle(c.id)}>{c.name}</Chip>)}</div>
      <p className="mt-3 text-[0.8rem] text-neutral-text2">{prefs.ids.length ? `${prefs.ids.length}개 선택` : "아직 선택한 카테고리가 없습니다."}</p>
    </div>
  );
}

function ProfileContent() {
  const store = useApp();
  const fp = store.fitProfile;
  const complete = !!(fp.height && fp.weight && fp.topSize && fp.bottomSize);
  const reset = () => { store.updateFitProfile({ height: null, weight: null, topSize: null, bottomSize: null, preferredFit: null, bodyType: null }); toast("핏 프로필을 초기화했습니다", undefined, "info"); };
  return (
    <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4"><p className="font-bold text-[1.05rem] flex items-center gap-2"><Ruler size={18} />핏 프로필 {complete ? <Badge tone="success" size="sm">완성</Badge> : <Badge tone="warning" size="sm">미완성</Badge>}</p>{fp.updatedAt && <span className="text-[0.8rem] text-neutral-text2 tabular">마지막 수정 {fmtDate(fp.updatedAt, "datetime")}</span>}</div>
          <FitProfileForm key={fp.updatedAt ?? "init"} submitLabel="프로필 저장" />
          {(fp.height || fp.weight || fp.topSize || fp.bottomSize) && <Button variant="ghost" size="sm" onClick={reset} icon={<RotateCcw size={14} />} className="mt-3 text-neutral-text2">프로필 초기화</Button>}
        </section>
        <InterestsCard />
      </div>
      <div className="space-y-6 min-w-0">
        <NotifyPrefsCard />
        <div className="rounded-cardlg bg-brand-ivory p-5 md:p-6 text-[0.9rem] space-y-2">
          <p className="font-bold flex items-center gap-2"><ShieldCheck size={16} />데이터 사용 안내</p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-text2 leading-relaxed">
            <li>키·몸무게·평소 사이즈·선호 핏은 <span className="font-semibold text-neutral-text">개인화 추천(핏 추천·추천상품)</span>에만 사용됩니다.</li>
            <li>실제 개인정보는 저장하지 않으며, 입력값은 이 브라우저의 DEMO 저장소에만 남습니다.</li>
            <li>Business AX에는 개인을 식별할 수 없는 집계값(체형대별 선택 비율 등)만 반영됩니다.</li>
            <li>데모 초기화(Business AX 설정)를 하면 모든 값이 지워집니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  useDocumentTitle("사이즈·취향 프로필");
  return (
    <Container className="py-6 md:py-10">
      <PageTitle title="사이즈·취향 프로필" desc="입력할수록 추천 사이즈의 신뢰도가 올라갑니다." />
      <Hydrated fallback={<div className="grid lg:grid-cols-2 gap-6"><SkeletonCard lines={8} /><SkeletonCard lines={4} /></div>}><ProfileContent /></Hydrated>
    </Container>
  );
}
