"use client";
/* /brands/[slug] — 브랜드 숍. 모르는 slug는 404 대신 친절한 EmptyState. */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronRight, Store } from "lucide-react";
import type { CategoryId } from "@/lib/types";
import { BRANDS, CATEGORIES, CATEGORY_NAME, PRODUCTS } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { allProductAgg } from "@/lib/kpi";
import { num } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GradientImage } from "@/components/ui/ProductImage";
import { SkeletonGrid, EmptyState, Skeleton } from "@/components/ui/States";
import { Container, SectionHead } from "@/components/customer/Section";
import { ProductGrid } from "@/components/customer/ProductCard";
import { FilterChip } from "@/components/customer/discovery/FilterChip";
import { BRAND_ASSET, BRAND_MOOD, MOOD_LABEL, FollowButton, isNewBrand } from "@/components/customer/discovery/BrandCard";
import { useBrandFollow } from "@/components/customer/discovery/useBrandFollow";
import { isNewProduct } from "@/components/customer/discovery/filters";

function BrandBody({ slug }: { slug: string }) {
  const brand = BRANDS.find((b) => b.slug === slug);
  const store = useApp();
  const { isFollowing, toggle, ready } = useBrandFollow();
  const [cat, setCat] = useState<CategoryId | "all">("all");
  useEffect(() => { setCat("all"); }, [slug]);
  useEffect(() => { document.title = brand ? `${brand.name} | MORFIT` : "브랜드를 찾을 수 없음 | MORFIT"; }, [brand]);

  const products = useMemo(() => (brand ? PRODUCTS.filter((p) => p.brandId === brand.id) : []), [brand]);
  const aggs = useMemo(() => (brand ? allProductAgg(store).filter((a) => a.product.brandId === brand.id) : []), [store, brand]);
  const popular = useMemo(() => [...aggs].sort((a, b) => b.rankScore - a.rankScore).slice(0, 4).map((a) => a.product), [aggs]);
  const fresh = useMemo(() => products.filter((p) => isNewProduct(p)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4), [products]);
  const cats = useMemo(() => CATEGORIES.filter((c) => products.some((p) => p.categoryId === c.id)), [products]);
  const filtered = useMemo(() => (cat === "all" ? products : products.filter((p) => p.categoryId === cat)), [products, cat]);
  const related = useMemo(() => {
    if (!brand) return [];
    const mix = new Set(products.map((p) => p.gender));
    return BRANDS.filter((b) => b.id !== brand.id)
      .map((b) => { const g = new Set(PRODUCTS.filter((p) => p.brandId === b.id).map((p) => p.gender)); const overlap = [...mix].filter((x) => g.has(x)).length; const sameMood = (BRAND_MOOD[b.id] ?? []).some((m) => (BRAND_MOOD[brand.id] ?? []).includes(m)) ? 1 : 0; return { b, score: overlap * 2 + sameMood }; })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.b.followers - a.b.followers)
      .slice(0, 3)
      .map((x) => x.b);
  }, [brand, products]);

  if (!brand) {
    return (
      <Container className="py-16">
        <EmptyState icon={<Store size={22} />} title="찾으시는 브랜드가 없습니다" desc="주소가 바뀌었거나 아직 입점하지 않은 브랜드예요. 전체 브랜드에서 다시 찾아보세요." action={<div className="flex gap-2"><Button variant="brand" href="/brands">브랜드 전체 보기</Button><Button variant="outline" href="/">홈으로</Button></div>} />
      </Container>
    );
  }

  const following = ready && isFollowing(brand.id);
  const followers = brand.followers + (following ? 1 : 0);
  const moods = (BRAND_MOOD[brand.id] ?? []).map((m) => MOOD_LABEL[m]);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <GradientImage gradient={brand.gradient} ratio="aspect-[16/8] sm:aspect-[21/8] md:aspect-[21/6]" asset={BRAND_ASSET[brand.slug]} overlay label={`${brand.name} 커버 이미지`} className="rounded-none">
        <Container className="absolute inset-0 flex flex-col justify-end pb-5 md:pb-8">
          <div className="flex items-center gap-2 mb-2">
            {moods.map((m) => <Badge key={m} tone="dark" size="sm" className="bg-white/15 backdrop-blur border border-white/25">{m}</Badge>)}
            {isNewBrand(brand) && <Badge tone="dark" size="sm">NEW 입점</Badge>}
          </div>
          <h1 className="text-white font-black text-[2rem] md:text-[3rem] tracking-tight leading-none drop-shadow-sm">{brand.name}</h1>
        </Container>
      </GradientImage>
      <Container className="py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-8">
          <div className="min-w-0 max-w-[44rem]">
            <p className="text-[1.15rem] md:text-[1.3rem] font-bold">{brand.tagline}</p>
            <p className="mt-2 text-neutral-text2 leading-relaxed">{brand.description}</p>
            <p className="mt-3 text-[0.85rem] text-neutral-text2 tabular">팔로워 {num(followers)} · 상품 {products.length}개</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FollowButton brand={brand} following={following} onToggle={toggle} />
            <Button variant="outline" href={`/shop?brand=${brand.id}`}>필터로 보기<ChevronRight size={16} /></Button>
          </div>
        </div>

        <div className="mt-10 md:mt-14 space-y-12 md:space-y-16">
          <section>
            <SectionHead title="인기상품" desc="판매·찜·조회를 합친 점수가 높은 순" />
            {popular.length ? <ProductGrid products={popular} ranked /> : <EmptyState title="아직 상품이 없습니다" />}
          </section>

          <section>
            <SectionHead title="신상품" desc="최근 30일 안에 등록된 상품" />
            {fresh.length ? <ProductGrid products={fresh} /> : (
              <div className="rounded-2xl border border-dashed border-neutral-border px-5 py-6 text-center">
                <p className="font-semibold">아직 이번 시즌 신상품이 없어요</p>
                <p className="mt-1 text-[0.88rem] text-neutral-text2">팔로우하면 {brand.name}의 신상품이 들어올 때 먼저 알려드릴게요.</p>
              </div>
            )}
          </section>

          <section>
            <SectionHead title="전체 상품" desc={`${filtered.length}개`} />
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-4" role="group" aria-label="카테고리 필터">
              <FilterChip size="sm" active={cat === "all"} onClick={() => setCat("all")}>전체 {products.length}</FilterChip>
              {cats.map((c) => <FilterChip key={c.id} size="sm" active={cat === c.id} onClick={() => setCat(cat === c.id ? "all" : c.id)}>{c.name} {products.filter((p) => p.categoryId === c.id).length}</FilterChip>)}
            </div>
            {filtered.length ? <ProductGrid products={filtered} /> : <EmptyState title={`${cat !== "all" ? CATEGORY_NAME[cat] : ""} 상품이 없습니다`} action={<Button variant="outline" onClick={() => setCat("all")}>전체 보기</Button>} />}
          </section>

          {related.length > 0 && (
            <section>
              <SectionHead title="관련 브랜드" desc="비슷한 고객층과 무드의 브랜드" more="/brands" moreLabel="브랜드 전체" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {related.map((b) => (
                  <Link key={b.id} href={`/brands/${b.slug}`} className="group flex items-center gap-3 rounded-cardlg border border-neutral-border bg-white p-3 hover-lift">
                    <GradientImage gradient={b.gradient} ratio="aspect-square" asset={BRAND_ASSET[b.slug]} label={`${b.name} 이미지`} className="h-16 w-16 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-black tracking-tight group-hover:underline underline-offset-4">{b.name}</span>
                      <span className="block text-[0.85rem] text-neutral-text2 line-clamp-1">{b.tagline}</span>
                      <span className="block text-[0.75rem] text-neutral-text2 tabular mt-0.5">팔로워 {num(b.followers)}</span>
                    </span>
                    <ChevronRight size={18} className="text-neutral-text2 group-hover:text-neutral-text shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function BrandPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  return (
    <Hydrated fallback={<div><Skeleton className="aspect-[16/8] md:aspect-[21/6] rounded-none w-full" /><Container className="py-8"><SkeletonGrid n={4} /></Container></div>}>
      <BrandBody slug={slug} />
    </Hydrated>
  );
}
