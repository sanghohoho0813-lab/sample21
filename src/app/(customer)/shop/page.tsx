"use client";
/* /shop — 카테고리·검색 목록. URL 파라미터가 곧 필터 상태 (공유 가능한 링크). */
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Hydrated } from "@/components/system/Hydrated";
import { SkeletonGrid } from "@/components/ui/States";
import { Container, PageTitle } from "@/components/customer/Section";
import { ProductListing } from "@/components/customer/discovery/ProductListing";
import { CategoryRail } from "@/components/customer/discovery/CategoryRail";
import {
  parseFilters,
  toQueryString,
  listingTitle,
  type ListingFilters,
} from "@/components/customer/discovery/filters";

function ShopInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const track = useApp((s) => s.track);
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);
  const setFilters = useCallback(
    (next: ListingFilters) => {
      const qs = toQueryString(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const { title, desc } = listingTitle(filters);

  // select_category tracking (once per category change)
  const lastCat = useRef<string | null>(null);
  useEffect(() => {
    const key = `${filters.gender ?? ""}/${filters.category ?? ""}`;
    if (filters.category && lastCat.current !== key) {
      lastCat.current = key;
      track("select_category", { category: filters.category, gender: filters.gender ?? "all" });
    }
  }, [filters.category, filters.gender, track]);

  return (
    <Container className="animate-fadeIn py-6 md:py-10">
      <PageTitle title={title} desc={desc} />
      {/* 카테고리 바로가기 (휴대폰 — PC는 왼쪽 필터에 전체 목록) */}
      <CategoryRail
        className="pb-5 md:hidden"
        value={filters.category}
        onSelect={(category) => setFilters({ ...filters, category })}
      />
      <Hydrated fallback={<SkeletonGrid n={8} />}>
        <ProductListing filters={filters} onChange={setFilters} />
      </Hydrated>
    </Container>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-10">
          <SkeletonGrid n={8} />
        </Container>
      }
    >
      <ShopInner />
    </Suspense>
  );
}
