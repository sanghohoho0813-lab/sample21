"use client";
/* 랭킹 — 탭(전체·남성·여성·신발·가방) × 기간(오늘/7일/30일) × 기준(판매/조회/찜). 모든 숫자는 Demo 데이터 계산값. */
import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { Product } from "@/lib/types";
import { useApp } from "@/lib/store";
import { allProductAgg, productSeries, type ProductAgg } from "@/lib/kpi";
import { num } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { Segmented } from "@/components/ui/Form";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Freshness } from "@/components/ui/Misc";
import { SkeletonGrid, EmptyState } from "@/components/ui/States";
import { Container, PageTitle } from "@/components/customer/Section";
import { ProductCard } from "@/components/customer/ProductCard";
import { RankChange } from "@/components/customer/discovery/RankChange";

type Tab = "all" | "men" | "women" | "shoes" | "bag";
type Period = "today" | "7d" | "30d";
type Basis = "sales" | "views" | "wish";

const TABS: { value: Tab; label: string }[] = [{ value: "all", label: "전체" }, { value: "men", label: "남성" }, { value: "women", label: "여성" }, { value: "shoes", label: "신발" }, { value: "bag", label: "가방" }];
const PERIODS: { value: Period; label: string }[] = [{ value: "today", label: "오늘" }, { value: "7d", label: "7일" }, { value: "30d", label: "30일" }];
const BASES: { value: Basis; label: string; unit: string; desc: string }[] = [
  { value: "sales", label: "판매", unit: "개", desc: "선택한 기간에 실제로 판매된 수량이 많은 순서입니다." },
  { value: "views", label: "조회", unit: "회", desc: "선택한 기간에 상품 상세를 본 횟수가 많은 순서입니다." },
  { value: "wish", label: "찜", unit: "명", desc: "선택한 기간에 찜(관심 등록)이 많은 순서입니다." },
];

const inTab = (p: Product, t: Tab) => t === "all" ? true : t === "men" ? p.gender === "men" || p.gender === "unisex" : t === "women" ? p.gender === "women" || p.gender === "unisex" : t === "shoes" ? p.categoryId === "shoes" : p.categoryId === "bag";

function metricOf(a: ProductAgg, period: Period, basis: Basis, viewDelta: Record<string, number>, wishlistDelta: Record<string, number>) {
  const id = a.product.id;
  const series = productSeries(id);
  const vDelta = viewDelta[id] ?? 0;
  const wDelta = Math.max(0, wishlistDelta[id] ?? 0);
  if (period === "7d") return basis === "sales" ? a.sales7d : basis === "views" ? a.views7d : a.wishlist7d;
  if (period === "today") {
    const last = series[series.length - 1];
    return basis === "sales" ? (last?.units ?? 0) : basis === "views" ? (last?.views ?? 0) + vDelta : (last?.wishlist ?? 0) + wDelta;
  }
  if (basis === "sales") return a.sales30d;
  const sum = series.reduce((s, x) => s + (basis === "views" ? x.views : x.wishlist), 0);
  return sum + (basis === "views" ? vDelta : wDelta);
}

function RankingBody({ tab, period, basis }: { tab: Tab; period: Period; basis: Basis }) {
  const store = useApp();
  const [showAll, setShowAll] = useState(false);
  const ranked = useMemo(() => {
    const aggs = allProductAgg(store).filter((a) => inTab(a.product, tab));
    return aggs
      .map((a) => ({ agg: a, metric: metricOf(a, period, basis, store.viewDelta, store.wishlistDelta) }))
      .sort((x, y) => y.metric - x.metric || y.agg.rankScore - x.agg.rankScore);
  }, [store, tab, period, basis]);
  useEffect(() => { setShowAll(false); }, [tab, period, basis]);
  const b = BASES.find((x) => x.value === basis)!;
  const list = showAll ? ranked : ranked.slice(0, 20);
  if (!ranked.length) return <EmptyState title="해당 조건의 상품이 없습니다" desc="다른 탭이나 기간을 선택해보세요." />;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-7">
        {list.map(({ agg, metric }, i) => (
          <div key={agg.product.id} className="min-w-0">
            <ProductCard product={agg.product} rank={i + 1} reason={`${b.label} ${num(metric)}${b.unit}`} />
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[0.75rem] text-neutral-text2">
              <span className="tabular">직전 7일 대비</span>
              <RankChange velocity={agg.velocity} />
            </div>
          </div>
        ))}
      </div>
      {ranked.length > 20 && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" size="lg" onClick={() => setShowAll((v) => !v)}>{showAll ? "상위 20개만 보기" : `${ranked.length - 20}개 더 보기`}</Button>
        </div>
      )}
    </>
  );
}

export default function RankingPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [period, setPeriod] = useState<Period>("7d");
  const [basis, setBasis] = useState<Basis>("sales");
  useEffect(() => { document.title = "랭킹 | MORFIT"; }, []);
  const b = BASES.find((x) => x.value === basis)!;

  return (
    <Container className="py-6 md:py-10 animate-fadeIn">
      <PageTitle title="랭킹" desc="브랜드를 넘어, 지금 가장 반응이 좋은 상품" right={<Freshness source="DEMO" />} />

      <div className="space-y-3 md:space-y-4">
        <Segmented value={tab} onChange={setTab} options={TABS} className="w-full md:w-auto" />
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[0.82rem] font-bold text-neutral-text2">기간</span>
            <Segmented value={period} onChange={setPeriod} options={PERIODS} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.82rem] font-bold text-neutral-text2">기준</span>
            <Segmented value={basis} onChange={setBasis} options={BASES.map((x) => ({ value: x.value, label: x.label }))} size="sm" />
          </div>
        </div>
        <p className="flex items-start gap-1.5 text-[0.85rem] text-neutral-text2"><Info size={15} className="mt-0.5 shrink-0" /><span><strong className="text-neutral-text">{b.label} 기준</strong> · {b.desc} 순위 변화(▲▼)는 직전 7일 대비 판매 변화로 계산합니다.</span></p>
        <p className="text-[0.8rem] text-neutral-text2 inline-flex items-center gap-2"><Badge tone="demo" size="sm">DEMO</Badge>이 랭킹은 시연용 Demo 데이터로 계산된 값이며 실제 판매 실적이 아닙니다.</p>
      </div>

      <div data-tour="c-ranking" className="mt-6 md:mt-8">
        <Hydrated fallback={<SkeletonGrid n={8} />}>
          <RankingBody tab={tab} period={period} basis={basis} />
        </Hydrated>
      </div>
    </Container>
  );
}
