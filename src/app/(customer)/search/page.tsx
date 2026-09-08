"use client";
/* /search — 검색. ?q= 없으면 최근 검색어·추천 검색어·인기 브랜드, 있으면 /shop과 같은 필터·정렬 UI로 결과 표시. */
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { BRANDS, PRODUCTS } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { num } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { SkeletonGrid } from "@/components/ui/States";
import { GradientImage } from "@/components/ui/ProductImage";
import { Container, PageTitle, SectionHead } from "@/components/customer/Section";
import { ProductGrid } from "@/components/customer/ProductCard";
import { ProductListing } from "@/components/customer/discovery/ProductListing";
import { ChipLink } from "@/components/customer/discovery/FilterChip";
import { BRAND_ASSET } from "@/components/customer/discovery/BrandCard";
import { parseFilters, toQueryString, matchesQuery, type ListingFilters } from "@/components/customer/discovery/filters";
import { readRecentSearches, pushRecentSearch, removeRecentSearch, clearRecentSearches, SUGGESTED_SEARCHES } from "@/components/customer/discovery/recentSearch";

const searchHref = (q: string) => `/search?q=${encodeURIComponent(q)}`;

function SearchForm({ initial, onSubmit }: { initial: string; onSubmit: (q: string) => void }) {
  const [v, setV] = useState(initial);
  useEffect(() => { setV(initial); }, [initial]);
  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(v.trim()); };
  return (
    <form onSubmit={submit} role="search" className="relative">
      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-text2" />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="상품, 브랜드, 스타일을 검색해보세요" aria-label="검색어" autoComplete="off" className="h-[52px] w-full rounded-2xl bg-neutral-canvas md:bg-white border border-neutral-border pl-12 pr-24 text-[1rem] focus:outline-none focus:ring-2 focus:ring-brand-black/20 focus:border-neutral-text2" />
      {v && <button type="button" onClick={() => setV("")} aria-label="입력 지우기" className="absolute right-[76px] top-1/2 -translate-y-1/2 h-9 w-9 rounded-full inline-flex items-center justify-center text-neutral-text2 hover:bg-neutral-canvas"><X size={16} /></button>}
      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-brand-black text-white text-[0.9rem] font-semibold hover:bg-[#2a2a2a] active:scale-[0.98] transition-all">검색</button>
    </form>
  );
}

function RecentAndSuggested({ onPick }: { onPick: (q: string) => void }) {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => { setRecent(readRecentSearches()); }, []);
  const popularBrands = useMemo(() => [...BRANDS].sort((a, b) => b.followers - a.followers).slice(0, 6), []);
  return (
    <div className="space-y-10 md:space-y-12">
      <section>
        <div className="flex items-end justify-between gap-3 mb-3">
          <h2 className="text-[1.1rem] font-bold inline-flex items-center gap-2"><Clock size={18} className="text-neutral-text2" />최근 검색어</h2>
          {recent.length > 0 && <button type="button" onClick={() => setRecent(clearRecentSearches())} className="text-[0.82rem] font-semibold text-neutral-text2 hover:text-neutral-text">전체 삭제</button>}
        </div>
        {recent.length === 0 ? (
          <p className="text-[0.9rem] text-neutral-text2 rounded-2xl border border-dashed border-neutral-border px-4 py-5 text-center">아직 검색 기록이 없어요. 아래 추천 검색어로 시작해보세요.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <li key={r} className="inline-flex items-center rounded-full border border-neutral-border bg-white overflow-hidden hover:border-neutral-text2 transition-colors">
                <button type="button" onClick={() => onPick(r)} className="h-11 md:h-10 pl-4 pr-2 text-[0.9rem] font-semibold">{r}</button>
                <button type="button" onClick={() => setRecent(removeRecentSearch(r))} aria-label={`${r} 삭제`} className="h-11 md:h-10 w-9 inline-flex items-center justify-center text-neutral-text2 hover:text-neutral-text"><X size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-[1.1rem] font-bold inline-flex items-center gap-2 mb-3"><TrendingUp size={18} className="text-neutral-text2" />추천 검색어</h2>
        <div className="flex flex-wrap gap-2">{SUGGESTED_SEARCHES.map((s, i) => <ChipLink key={s} href={searchHref(s)}><span className="text-brand-accent tabular mr-0.5">{i + 1}</span>{s}</ChipLink>)}</div>
      </section>
      <section>
        <SectionHead title="인기 브랜드" desc="팔로워가 많은 순" more="/brands" moreLabel="브랜드 전체" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {popularBrands.map((b) => (
            <Link key={b.id} href={`/brands/${b.slug}`} className="group block rounded-2xl overflow-hidden border border-neutral-border bg-white hover-lift">
              <GradientImage gradient={b.gradient} ratio="aspect-[16/10]" asset={BRAND_ASSET[b.slug]} overlay label={`${b.name} 이미지`} className="rounded-none">
                <span className="absolute bottom-2.5 left-3 text-white font-black text-[0.95rem] tracking-tight">{b.name}</span>
              </GradientImage>
              <div className="px-3 py-2.5 flex items-center justify-between gap-2"><span className="text-[0.78rem] text-neutral-text2 tabular">팔로워 {num(b.followers)}</span><ChevronRight size={14} className="text-neutral-text2 group-hover:text-neutral-text" /></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function NoResultSuggestions({ q }: { q: string }) {
  const popular = useMemo(() => [...PRODUCTS].filter((p) => p.tags.includes("베스트")).slice(0, 4), []);
  const nearby = useMemo(() => SUGGESTED_SEARCHES.filter((s) => s !== q).slice(0, 5), [q]);
  return (
    <div className="w-full max-w-3xl text-left">
      <p className="text-[0.85rem] font-bold text-neutral-text2 mb-2 text-center">이런 검색어는 어떠세요?</p>
      <div className="flex flex-wrap justify-center gap-2 mb-8">{nearby.map((s) => <ChipLink key={s} href={searchHref(s)}>{s}</ChipLink>)}</div>
      <p className="font-bold mb-3">지금 인기 있는 상품</p>
      <ProductGrid products={popular} cols="grid-cols-2 md:grid-cols-4" />
    </div>
  );
}

function SearchInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const track = useApp((s) => s.track);
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);
  const q = filters.q;

  useEffect(() => { document.title = q ? `‘${q}’ 검색 | MORFIT` : "검색 | MORFIT"; }, [q]);
  useEffect(() => { if (q) pushRecentSearch(q); }, [q]);

  const go = useCallback((next: string) => {
    if (next) track("search_product", { q: next });
    router.push(next ? searchHref(next) : "/search");
  }, [router, track]);

  const setFilters = useCallback((next: ListingFilters) => {
    const qs = toQueryString({ ...next, q });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, q]);

  const matchCount = useMemo(() => (q ? PRODUCTS.filter((p) => matchesQuery(p, q)).length : 0), [q]);

  return (
    <Container className="py-6 md:py-10 animate-fadeIn">
      <PageTitle title={q ? <>‘<span className="text-brand-accent">{q}</span>’ 검색 결과</> : "검색"} desc={q ? `상품명·브랜드·카테고리·태그에서 ${matchCount}개를 찾았습니다` : "상품, 브랜드, 스타일을 찾아보세요"} />
      <div className="mb-8 max-w-2xl"><SearchForm initial={q} onSubmit={go} /></div>
      {q ? (
        <Hydrated fallback={<SkeletonGrid n={8} />}>
          <ProductListing
            filters={filters}
            onChange={setFilters}
            emptyTitle={`‘${q}’에 맞는 상품이 없습니다`}
            emptyDesc="맞춤법을 확인하거나 더 짧은 단어로 검색해보세요. 필터가 적용되어 있다면 초기화해보세요."
            emptyExtra={<NoResultSuggestions q={q} />}
          />
        </Hydrated>
      ) : (
        <RecentAndSuggested onPick={go} />
      )}
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Container className="py-10"><SkeletonGrid n={8} /></Container>}>
      <SearchInner />
    </Suspense>
  );
}
