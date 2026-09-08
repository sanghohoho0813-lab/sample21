"use client";
/* ------------------------------------------------------------------
   ProductListing — shared filter / sort / results UI for /shop and /search.
   Desktop: left sidebar filters. Mobile: 필터 button → BottomSheet with draft
   filters and a sticky "N개 상품 보기" apply button.
------------------------------------------------------------------- */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SlidersHorizontal, X, RotateCcw, SearchX } from "lucide-react";
import type { Fit } from "@/lib/types";
import { BRANDS, BRAND_BY_ID, CATEGORIES, CATEGORY_NAME, colorHex } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { allProductAgg } from "@/lib/kpi";
import { krw } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Form";
import { BottomSheet } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { ProductGrid } from "@/components/customer/ProductCard";
import { FilterChip } from "./FilterChip";
import {
  ALL_COLORS, APPAREL_SIZES, SHOE_SIZES, PRICE_RANGES, FITS, FIT_LABEL, SORT_OPTIONS, SORT_LABEL, FREE_SHIPPING_MIN,
  applyFilters, sortAggs, countActiveFilters, clearFilters, type ListingFilters, type SortKey,
} from "./filters";

/* ------------------------------ Filter panel ------------------------------ */
function Group({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 flex items-baseline gap-2"><span className="text-[0.9rem] font-bold">{title}</span>{hint && <span className="text-[0.78rem] text-neutral-text2">{hint}</span>}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function FilterPanel({ value, onChange, showCategory = true, showBrand = true, className }: { value: ListingFilters; onChange: (f: ListingFilters) => void; showCategory?: boolean; showBrand?: boolean; className?: string }) {
  const set = (patch: Partial<ListingFilters>) => onChange({ ...value, ...patch });
  const toggleIn = (key: "brands" | "colors" | "sizes", id: string) => {
    const cur = value[key];
    set({ [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } as Partial<ListingFilters>);
  };
  const priceActive = (min: number | null, max: number | null) => value.min === min && value.max === max;
  return (
    <div className={cn("space-y-6", className)}>
      {showCategory && (
        <Group title="카테고리">
          <FilterChip size="sm" active={!value.category} onClick={() => set({ category: null })}>전체</FilterChip>
          {CATEGORIES.map((c) => <FilterChip key={c.id} size="sm" active={value.category === c.id} onClick={() => set({ category: value.category === c.id ? null : c.id })}>{c.name}</FilterChip>)}
        </Group>
      )}
      {showBrand && (
        <Group title="브랜드" hint="여러 개 선택 가능">
          {BRANDS.map((b) => <FilterChip key={b.id} size="sm" active={value.brands.includes(b.id)} onClick={() => toggleIn("brands", b.id)}>{b.name}</FilterChip>)}
        </Group>
      )}
      <Group title="가격">
        {PRICE_RANGES.map((r) => <FilterChip key={r.label} size="sm" active={priceActive(r.min, r.max)} onClick={() => (priceActive(r.min, r.max) ? set({ min: null, max: null }) : set({ min: r.min, max: r.max }))}>{r.label}</FilterChip>)}
      </Group>
      <Group title="색상" hint="여러 개 선택 가능">
        {ALL_COLORS.map((c) => <FilterChip key={c} size="sm" swatch={colorHex(c)} active={value.colors.includes(c)} onClick={() => toggleIn("colors", c)}>{c}</FilterChip>)}
      </Group>
      <Group title="사이즈" hint="의류 · 신발(mm)">
        {APPAREL_SIZES.map((s) => <FilterChip key={s} size="sm" active={value.sizes.includes(s)} onClick={() => toggleIn("sizes", s)}>{s}</FilterChip>)}
        {SHOE_SIZES.map((s) => <FilterChip key={s} size="sm" active={value.sizes.includes(s)} onClick={() => toggleIn("sizes", s)}>{s}</FilterChip>)}
      </Group>
      <Group title="핏">
        {FITS.map((f: Fit) => <FilterChip key={f} size="sm" active={value.fit === f} onClick={() => set({ fit: value.fit === f ? null : f })}>{FIT_LABEL[f]}</FilterChip>)}
      </Group>
      <div className="rounded-2xl border border-neutral-border p-2">
        <Toggle checked={value.sale} onChange={(v) => set({ sale: v })} label="할인 상품만" desc="지금 세일 중인 상품" />
        <Toggle checked={value.free} onChange={(v) => set({ free: v })} label="무료배송만" desc={`${krw(FREE_SHIPPING_MIN)} 이상 무료배송`} />
      </div>
    </div>
  );
}

/* ------------------------------ Active filter chips ------------------------------ */
function ActiveFilters({ value, onChange }: { value: ListingFilters; onChange: (f: ListingFilters) => void }) {
  const items: { key: string; label: string; remove: () => void }[] = [];
  if (value.category) items.push({ key: "cat", label: CATEGORY_NAME[value.category], remove: () => onChange({ ...value, category: null }) });
  for (const b of value.brands) items.push({ key: `b-${b}`, label: BRAND_BY_ID[b]?.name ?? b, remove: () => onChange({ ...value, brands: value.brands.filter((x) => x !== b) }) });
  if (value.min !== null || value.max !== null) items.push({ key: "price", label: PRICE_RANGES.find((r) => r.min === value.min && r.max === value.max)?.label ?? `${value.min ? krw(value.min) : "0원"} ~ ${value.max ? krw(value.max) : ""}`, remove: () => onChange({ ...value, min: null, max: null }) });
  for (const c of value.colors) items.push({ key: `c-${c}`, label: c, remove: () => onChange({ ...value, colors: value.colors.filter((x) => x !== c) }) });
  for (const s of value.sizes) items.push({ key: `s-${s}`, label: `사이즈 ${s}`, remove: () => onChange({ ...value, sizes: value.sizes.filter((x) => x !== s) }) });
  if (value.fit) items.push({ key: "fit", label: `${FIT_LABEL[value.fit]} 핏`, remove: () => onChange({ ...value, fit: null }) });
  if (value.sale) items.push({ key: "sale", label: "할인 상품만", remove: () => onChange({ ...value, sale: false }) });
  if (value.free) items.push({ key: "free", label: "무료배송만", remove: () => onChange({ ...value, free: false }) });
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="적용된 필터">
      {items.map((it) => (
        <button key={it.key} type="button" onClick={it.remove} className="inline-flex items-center gap-1 h-9 pl-3 pr-2 rounded-full bg-neutral-canvas border border-neutral-border text-[0.85rem] font-semibold hover:border-neutral-text2 transition-colors" aria-label={`${it.label} 필터 제거`}>
          {it.label}<X size={14} />
        </button>
      ))}
      <button type="button" onClick={() => onChange(clearFilters(value))} className="inline-flex items-center gap-1 h-9 px-2 text-[0.85rem] font-semibold text-neutral-text2 hover:text-neutral-text"><RotateCcw size={14} />필터 초기화</button>
    </div>
  );
}

/* ------------------------------ Listing ------------------------------ */
export function ProductListing({ filters, onChange, showCategory = true, showBrand = true, emptyTitle, emptyDesc, emptyExtra, headerLeft }: {
  filters: ListingFilters;
  onChange: (f: ListingFilters) => void;
  showCategory?: boolean;
  showBrand?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;
  emptyExtra?: ReactNode;
  headerLeft?: ReactNode;
}) {
  const store = useApp();
  const aggs = useMemo(() => allProductAgg(store), [store]);
  const results = useMemo(() => sortAggs(applyFilters(aggs, filters), filters.sort), [aggs, filters]);
  const products = useMemo(() => results.map((a) => a.product), [results]);
  const activeCount = countActiveFilters(filters);

  // Mobile sheet with draft filters
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<ListingFilters>(filters);
  useEffect(() => { if (sheet) setDraft(filters); }, [sheet, filters]);
  const draftCount = useMemo(() => (sheet ? applyFilters(aggs, draft).length : 0), [sheet, aggs, draft]);

  const sortSelect = (id: string) => (
    <label className="inline-flex items-center gap-2 text-[0.85rem] text-neutral-text2">
      <span className="sr-only" id={`${id}-label`}>정렬</span>
      <select aria-labelledby={`${id}-label`} value={filters.sort} onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })} className="h-11 md:h-10 rounded-xl border border-neutral-border bg-white pl-3 pr-8 text-[0.9rem] font-semibold text-neutral-text focus:outline-none focus:ring-2 focus:ring-brand-black/20">
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)] md:gap-10 lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:block" aria-label="상품 필터">
        <div className="sticky top-[88px] max-h-[calc(100vh-104px)] overflow-y-auto pr-1 hide-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-[1.05rem] inline-flex items-center gap-1.5"><SlidersHorizontal size={16} />필터{activeCount > 0 && <span className="ml-1 h-5 min-w-[20px] px-1.5 rounded-full bg-brand-black text-white text-[0.72rem] font-bold inline-flex items-center justify-center">{activeCount}</span>}</p>
            {activeCount > 0 && <button type="button" onClick={() => onChange(clearFilters(filters))} className="text-[0.82rem] font-semibold text-neutral-text2 hover:text-neutral-text inline-flex items-center gap-1"><RotateCcw size={13} />초기화</button>}
          </div>
          <FilterPanel value={filters} onChange={onChange} showCategory={showCategory} showBrand={showBrand} />
        </div>
      </aside>

      <div className="min-w-0">
        {/* Results header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            {headerLeft}
            <p className="text-[0.95rem] font-semibold tabular">총 <span className="text-brand-accent">{products.length}</span>개</p>
            <span className="hidden md:inline text-[0.8rem] text-neutral-text2">· {SORT_OPTIONS.find((s) => s.value === filters.sort)?.desc}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => setSheet(true)} className="md:hidden h-11 px-3.5 rounded-xl border border-neutral-border bg-white text-[0.9rem] font-semibold inline-flex items-center gap-1.5 active:bg-neutral-canvas" aria-haspopup="dialog">
              <SlidersHorizontal size={16} />필터{activeCount > 0 && <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-brand-black text-white text-[0.72rem] font-bold inline-flex items-center justify-center">{activeCount}</span>}
            </button>
            {sortSelect("sort")}
          </div>
        </div>
        <div className="mb-5"><ActiveFilters value={filters} onChange={onChange} /></div>

        {products.length === 0 ? (
          <EmptyState
            icon={<SearchX size={22} />}
            title={emptyTitle ?? "조건에 맞는 상품이 없습니다"}
            desc={emptyDesc ?? "필터를 줄이거나 다른 조건으로 다시 찾아보세요."}
            action={
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="brand" onClick={() => onChange(clearFilters(filters))} icon={<RotateCcw size={16} />}>필터 초기화</Button>
                  <Button variant="outline" href="/ranking">랭킹 보기</Button>
                </div>
                {emptyExtra}
              </div>
            }
          />
        ) : (
          <ProductGrid products={products} cols="grid-cols-2 md:grid-cols-3 xl:grid-cols-4" />
        )}
      </div>

      {/* Mobile filter sheet */}
      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={`필터 · ${SORT_LABEL[draft.sort]}`}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={() => setDraft(clearFilters(draft))} icon={<RotateCcw size={16} />} className="shrink-0">초기화</Button>
            <Button variant="brand" size="md" full onClick={() => { onChange(draft); setSheet(false); }}>{draftCount}개 상품 보기</Button>
          </div>
        }
      >
        <div className="mb-4">
          <p className="text-[0.9rem] font-bold mb-2">정렬</p>
          <div className="flex flex-wrap gap-2">{SORT_OPTIONS.map((o) => <FilterChip key={o.value} size="sm" active={draft.sort === o.value} onClick={() => setDraft({ ...draft, sort: o.value })}>{o.label}</FilterChip>)}</div>
        </div>
        <FilterPanel value={draft} onChange={setDraft} showCategory={showCategory} showBrand={showBrand} />
        <div className="h-2" />
      </BottomSheet>
    </div>
  );
}
