"use client";
/* /shop — 카테고리·검색 목록. URL 파라미터가 곧 필터 상태 (공유 가능한 링크). */
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { Hydrated } from "@/components/system/Hydrated";
import { SkeletonGrid } from "@/components/ui/States";
import { Freshness } from "@/components/ui/Misc";
import { Container, PageTitle } from "@/components/customer/Section";
import { ProductListing } from "@/components/customer/discovery/ProductListing";
import { FilterChip } from "@/components/customer/discovery/FilterChip";
import { parseFilters, toQueryString, listingTitle, type ListingFilters } from "@/components/customer/discovery/filters";

function ShopInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const track = useApp((s) => s.track);
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);
  const setFilters = useCallback((next: ListingFilters) => {
    const qs = toQueryString(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname]);

  const { title, desc } = listingTitle(filters);
  useEffect(() => { document.title = `${title} | MORFIT`; }, [title]);

  // select_category tracking (once per category change)
  const lastCat = useRef<string | null>(null);
  useEffect(() => {
    const key = `${filters.gender ?? ""}/${filters.category ?? ""}`;
    if (filters.category && lastCat.current !== key) { lastCat.current = key; track("select_category", { category: filters.category, gender: filters.gender ?? "all" }); }
  }, [filters.category, filters.gender, track]);

  return (
    <Container className="py-6 md:py-10 animate-fadeIn">
      <PageTitle title={title} desc={desc} right={<Freshness source="DEMO" />} />
      {/* Quick category strip (mobile-first; sidebar has the full set on desktop) */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-4 md:hidden" role="tablist" aria-label="카테고리 빠른 선택">
        <FilterChip size="sm" active={!filters.category} onClick={() => setFilters({ ...filters, category: null })}>전체</FilterChip>
        {CATEGORIES.map((c) => <FilterChip key={c.id} size="sm" active={filters.category === c.id} onClick={() => setFilters({ ...filters, category: filters.category === c.id ? null : c.id })}>{c.name}</FilterChip>)}
      </div>
      <Hydrated fallback={<SkeletonGrid n={8} />}>
        <ProductListing filters={filters} onChange={setFilters} />
      </Hydrated>
    </Container>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<Container className="py-10"><SkeletonGrid n={8} /></Container>}>
      <ShopInner />
    </Suspense>
  );
}
