"use client";
/* ------------------------------------------------------------------
   MORFIT Home — Editorial multi-brand fashion home.
   3초 안에: 멀티브랜드 패션 플랫폼 · 탐색 CTA · 브랜드/스타일 차별점 · 개인화 진입.
   Sections: Hero → 오늘의 랭킹 → 핏 프로필(대표 기능) → 맞춤 추천 → 반응 빠른 상품
             → 새 브랜드 → 시즌 스타일 편집 → 신뢰·배송·교환
------------------------------------------------------------------- */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Ruler, TrendingUp, Truck, RefreshCcw, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { BRANDS, BRAND_BY_ID, PRODUCTS, DEMO_CUSTOMER_NAME, colorHex } from "@/lib/demo/seed";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";
import { allProductAgg } from "@/lib/kpi";
import { recommendForCustomer } from "@/lib/engine";
import { num, signed } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { useHydrated } from "@/components/system/hooks";
import { Hydrated } from "@/components/system/Hydrated";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GradientImage } from "@/components/ui/ProductImage";
import { Garment, type GarmentKind } from "@/components/ui/Garment";
import { SkeletonGrid, Skeleton } from "@/components/ui/States";
import { Container, SectionHead } from "@/components/customer/Section";
import { ProductCard, ProductGrid, HScroll } from "@/components/customer/ProductCard";
import { BRAND_ASSET, isNewBrand, brandProductCount } from "@/components/customer/discovery/BrandCard";
import { CategoryLinks } from "@/components/customer/discovery/CategoryRail";
import { BrandGarment } from "@/components/customer/discovery/BrandGarment";

const VARIANT_COUNT = PRODUCTS.reduce((s, p) => s + p.colors.length * p.sizes.length, 0);
/** 휴대폰에서는 목록을 4개(2줄)까지만 — 나머지는 '전체 보기'로. 홈이 끝없이 길어지지 않게 */
const MOBILE_FOUR = "[&>*:nth-child(n+5)]:hidden md:[&>*:nth-child(n+5)]:block";

/* ------------------------------ Hero ------------------------------ */
type Slide = {
  key: string;
  href: string;
  eyebrow: string;
  title: [string, string];
  cta: string;
  gradient: [string, string];
  asset: string;
  garments: { kind: GarmentKind; color: string; className: string }[];
};
const SLIDES: Slide[] = [
  {
    key: "fw",
    href: "/shop?category=outer",
    eyebrow: "FW EDITORIAL · 아우터",
    title: ["오늘의 취향을", "브랜드 너머로"],
    cta: "아우터 보기",
    gradient: ["#111111", "#3d3d3d"],
    asset: "hero_main.jpg",
    garments: [
      { kind: "jacket", color: "차콜", className: "left-[2%] top-[12%] h-[56%] w-[54%] opacity-90" },
      { kind: "coat", color: "베이지", className: "right-[2%] top-[4%] h-[68%] w-[62%]" },
    ],
  },
  {
    key: "mellow",
    href: "/brands/mellow-code",
    eyebrow: "BRAND · MELLOW CODE",
    title: [BRAND_BY_ID["b-mellow"].tagline, "니트 원피스 컬렉션"],
    cta: "브랜드 보기",
    gradient: BRAND_BY_ID["b-mellow"].gradient,
    asset: "fashion_editorial_01.jpg",
    garments: [{ kind: "dress", color: "크림", className: "inset-x-0 top-[4%] mx-auto h-[68%] w-[70%]" }],
  },
  {
    key: "current",
    href: "/brands/current-type",
    eyebrow: "BRAND · CURRENT TYPE",
    title: [BRAND_BY_ID["b-current"].tagline, "쉘 자켓과 후디"],
    cta: "브랜드 보기",
    gradient: BRAND_BY_ID["b-current"].gradient,
    asset: "fashion_editorial_02.jpg",
    garments: [{ kind: "jacket", color: "올리브", className: "inset-x-0 top-[6%] mx-auto h-[64%] w-[76%]" }],
  },
];

/** 휴대폰 첫 화면 — 글보다 옷이 먼저 보이게. 가로로 넘겨 보는 풀블리드 에디토리얼 */
function HeroCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const onScroll = () => {
    const el = ref.current;
    if (el) setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };
  return (
    <div className="relative md:hidden">
      <div
        ref={ref}
        onScroll={onScroll}
        className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        aria-roledescription="carousel"
        aria-label="에디토리얼"
      >
        {SLIDES.map((sl, i) => {
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <Link
              key={sl.key}
              href={sl.href}
              className="group block w-full shrink-0 snap-center"
              aria-label={`${sl.title.join(" ")} — ${sl.cta}`}
            >
              <GradientImage
                gradient={sl.gradient}
                ratio="aspect-[4/5]"
                asset={sl.asset}
                overlay
                label={sl.eyebrow}
                className="!rounded-none"
              >
                {!assetUrl(sl.asset) &&
                  sl.garments.map((g) => (
                    <EditorialGarment key={g.kind + g.color} kind={g.kind} color={g.color} className={g.className} />
                  ))}
                <div className="absolute inset-x-5 bottom-7 text-white">
                  <p className="text-[0.78rem] font-bold tracking-[0.18em] text-white/75">{sl.eyebrow}</p>
                  <Heading className="mt-2 text-[2rem] font-black leading-[1.12] tracking-tight">
                    {sl.title[0]}
                    <br />
                    {sl.title[1]}
                  </Heading>
                  <span className="mt-3 inline-flex items-center gap-1 text-[0.9rem] font-semibold">
                    {sl.cta}
                    <ArrowRight size={15} />
                  </span>
                </div>
              </GradientImage>
            </Link>
          );
        })}
      </div>
      <span
        className="tabular pointer-events-none absolute bottom-7 right-5 rounded-full bg-black/45 px-2.5 py-1 text-[0.78rem] font-semibold text-white backdrop-blur-sm"
        aria-live="polite"
      >
        {index + 1} / {SLIDES.length}
      </span>
    </div>
  );
}

function Hero() {
  return (
    <section data-tour="c-hero" className="bg-brand-ivory md:border-b md:border-neutral-border">
      <HeroCarousel />
      <Container className="hidden items-center gap-10 py-14 md:grid md:grid-cols-12 lg:py-16">
        <div className="md:col-span-6">
          <p className="text-[0.8rem] font-bold tracking-[0.2em] text-neutral-text2">MULTI-BRAND FASHION PLATFORM</p>
          <h1 className="mt-3 text-[3.2rem] font-black leading-[1.05] tracking-tight lg:text-[3.6rem]">
            오늘의 취향을
            <br />
            브랜드 너머로
          </h1>
          <p className="mt-5 max-w-[34rem] text-[1.1rem] leading-relaxed text-neutral-text2">
            {BRANDS.length}개 브랜드의 옷과 신발을 한곳에서 비교하고,
            <br /> <strong className="text-neutral-text">내 사이즈에 맞는 상품</strong>까지 찾아드려요.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button variant="brand" size="lg" href="/ranking" icon={<TrendingUp size={18} />}>
              랭킹 보기
            </Button>
            <Button variant="outline" size="lg" href="/style" icon={<Ruler size={18} />}>
              스타일 찾기
            </Button>
          </div>
          <p className="tabular mt-8 text-[0.85rem] text-neutral-text2">
            입점 브랜드 <b className="text-neutral-text">{BRANDS.length}</b>
            <span className="mx-2 text-neutral-border">|</span>
            색상·사이즈 옵션 <b className="text-neutral-text">{num(VARIANT_COUNT)}</b>
            <span className="mx-2 text-neutral-border">|</span>
            상품마다 <b className="text-neutral-text">내 사이즈 추천</b>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 md:col-span-6">
          {SLIDES.map((sl, i) => (
            <Link
              key={sl.key}
              href={sl.href}
              className={cn("group block", i === 0 && "col-span-2 row-span-2")}
              aria-label={`${i === 0 ? "FW 에디토리얼" : sl.eyebrow} — ${sl.cta}`}
            >
              <GradientImage
                gradient={sl.gradient}
                ratio="aspect-[3/4]"
                asset={sl.asset}
                overlay
                label={sl.eyebrow}
                className={cn(
                  "h-full transition-shadow group-hover:shadow-raised",
                  i === 0 ? "rounded-cardlg" : "rounded-2xl",
                )}
              >
                {!assetUrl(sl.asset) &&
                  sl.garments.map((g) => (
                    <EditorialGarment key={g.kind + g.color} kind={g.kind} color={g.color} className={g.className} />
                  ))}
                {i === 0 ? (
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-[0.78rem] font-bold tracking-[0.18em] text-white/75">FW EDITORIAL</p>
                    <p className="mt-1 text-[1.25rem] font-bold leading-tight">
                      구조적인 미니멀리즘,
                      <br />
                      오늘의 아우터
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[0.85rem] font-semibold underline-offset-4 group-hover:underline">
                      {sl.cta}
                      <ArrowRight size={14} />
                    </span>
                  </div>
                ) : (
                  <span className="absolute bottom-3 left-3 text-[0.78rem] font-bold tracking-wide text-white">
                    {sl.eyebrow.replace("BRAND · ", "")}
                  </span>
                )}
              </GradientImage>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** 카테고리 바로가기 + 브랜드 줄 — 히어로 바로 아래, 첫 화면에서 바로 고를 수 있게 */
function QuickEntry() {
  return (
    <section aria-label="빠른 탐색" className="border-b border-neutral-border bg-white">
      <Container className="pb-3 pt-5 md:pb-4 md:pt-7">
        <CategoryLinks />
      </Container>
      <div className="border-t border-neutral-border/70">
        <Container className="py-3">
          <HScroll className="items-center gap-2">
            <span className="shrink-0 pr-1 text-[0.78rem] font-bold tracking-widest text-neutral-text2">BRANDS</span>
            {BRANDS.map((b) => (
              <Link
                key={b.id}
                href={`/brands/${b.slug}`}
                className="inline-flex h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border border-neutral-border bg-white px-3 text-[0.82rem] font-bold transition-colors hover:border-neutral-text2 hover:bg-neutral-canvas md:h-9"
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${b.gradient[0]}, ${b.gradient[1]})` }}
                />
                {b.name}
              </Link>
            ))}
            <Link
              href="/brands"
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-brand-black px-3 text-[0.82rem] font-bold text-white transition-colors hover:bg-[#2a2a2a] md:h-9"
            >
              전체 브랜드
              <ChevronRight size={14} />
            </Link>
          </HScroll>
        </Container>
      </div>
    </section>
  );
}

/* ------------------------------ Store-driven sections ------------------------------ */
function RankingSection() {
  const store = useApp();
  const top = useMemo(() => [...allProductAgg(store)].sort((a, b) => b.rankScore - a.rankScore).slice(0, 8), [store]);
  return (
    <section>
      <SectionHead
        title="오늘의 랭킹"
        desc="판매·찜·조회를 합친 지금 가장 반응 좋은 상품"
        more="/ranking"
        moreLabel="랭킹 전체"
      />
      <ProductGrid products={top.map((a) => a.product)} ranked className={MOBILE_FOUR} />
    </section>
  );
}

function RecommendSection() {
  const store = useApp();
  const recs = useMemo(
    () =>
      recommendForCustomer({
        recentlyViewed: store.recentlyViewed,
        wishlist: store.wishlist.map((w) => w.productId),
        limit: 8,
      }),
    [store.recentlyViewed, store.wishlist],
  );
  const reasons = Object.fromEntries(recs.map((r) => [r.product.id, r.reason]));
  return (
    <section>
      <SectionHead
        title={`${DEMO_CUSTOMER_NAME}님을 위한 추천`}
        desc="자주 본 브랜드·카테고리와 찜 목록을 바탕으로 골랐어요"
        more="/my?tab=recommend"
        moreLabel="더 보기"
      />
      <ProductGrid products={recs.map((r) => r.product)} reasons={reasons} className={MOBILE_FOUR} />
    </section>
  );
}

function NewBrandsSection() {
  const fresh = BRANDS.filter(isNewBrand);
  const rest = BRANDS.filter((b) => !isNewBrand(b)).sort(
    (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
  );
  const list = [...fresh, ...rest].slice(0, 4);
  const now = new Date();
  return (
    <section>
      <SectionHead title="새로 들어온 브랜드" more="/brands" moreLabel="브랜드 전체" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {list.map((b) => {
          const newer = isNewBrand(b);
          return (
            <Link
              key={b.id}
              href={`/brands/${b.slug}`}
              className="hover-lift group block overflow-hidden rounded-cardlg border border-neutral-border bg-white"
            >
              <GradientImage
                gradient={b.gradient}
                ratio="aspect-[4/5] md:aspect-[4/3]"
                asset={BRAND_ASSET[b.slug]}
                overlay
                label={`${b.name} 브랜드 이미지`}
                className="rounded-none"
              >
                <BrandGarment brandId={b.id} asset={BRAND_ASSET[b.slug]} />
                <div className="absolute inset-0 flex flex-col justify-between p-3">
                  <div>
                    {newer ? (
                      <Badge tone="dark" size="sm">
                        신규 입점
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        입점 {daysBetween(b.joinedAt, now)}일차
                      </Badge>
                    )}
                  </div>
                  <p className="text-[1.15rem] font-black leading-none tracking-tight text-white underline-offset-4 group-hover:underline md:text-[1.3rem]">
                    {b.name}
                  </p>
                </div>
              </GradientImage>
              <div className="p-3">
                <p className="line-clamp-1 text-[0.85rem] font-semibold leading-snug">{b.tagline}</p>
                <p className="tabular mt-1 text-[0.78rem] text-neutral-text2">
                  팔로워 {num(b.followers)} · 상품 {brandProductCount(b.id)}개
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RisingSection() {
  const store = useApp();
  const rising = useMemo(() => {
    const aggs = allProductAgg(store);
    const hot = aggs.filter((a) => a.velocity > 0.3 || a.worst === "rising").sort((a, b) => b.velocity - a.velocity);
    const list =
      hot.length >= 4 ? hot : [...hot, ...aggs.filter((a) => !hot.includes(a)).sort((a, b) => b.velocity - a.velocity)];
    return list.slice(0, 8);
  }, [store]);
  return (
    <section>
      <SectionHead
        title="지금 반응이 빠른 상품"
        desc="지난주보다 판매와 찜이 크게 늘어난 상품"
        more="/ranking"
        moreLabel="랭킹"
      />
      <HScroll className="pb-1">
        {rising.map((a) => (
          <div key={a.product.id} className="w-[168px] shrink-0 snap-start sm:w-[200px] md:w-[220px]">
            <ProductCard
              product={a.product}
              reason={a.worst === "rising" ? "찜·재입고 신청 급증" : `지난주 대비 판매 ${signed(a.velocity, 0)}`}
              compact
            />
          </div>
        ))}
      </HScroll>
    </section>
  );
}

const EDITS = [
  {
    href: "/shop?category=outer",
    eyebrow: "SEASON EDIT 01",
    title: "아우터, 첫 단추",
    desc: "코트·자켓·플리스 — 브랜드별 실루엣 비교",
    gradient: ["#1f2937", "#6b7280"] as [string, string],
    asset: "category_outer.jpg",
    garment: { kind: "coat" as GarmentKind, color: "베이지" },
  },
  {
    href: "/shop?gender=women",
    eyebrow: "SEASON EDIT 02",
    title: "여성 컨템포러리",
    desc: "MELLOW CODE · HALF MOON의 단정한 실루엣",
    gradient: ["#3f3f46", "#c4b5fd"] as [string, string],
    asset: "fashion_editorial_03.jpg",
    garment: { kind: "dress" as GarmentKind, color: "크림" },
  },
  {
    href: "/shop?sale=1",
    eyebrow: "SEASON EDIT 03",
    title: "시즌 오프 세일",
    desc: "지금 할인 중인 상품만 모아보기",
    gradient: ["#0c4a6e", "#7dd3fc"] as [string, string],
    asset: "hero_secondary.jpg",
    garment: { kind: "hoodie" as GarmentKind, color: "그레이" },
  },
];

function SeasonEditSection() {
  return (
    <section>
      <SectionHead title="시즌 스타일 편집" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        {EDITS.map((e) => (
          <Link key={e.href} href={e.href} className="group block">
            <GradientImage
              gradient={e.gradient}
              ratio="aspect-[2/1] sm:aspect-[4/5]"
              asset={e.asset}
              overlay
              label={e.title}
              className="rounded-cardlg transition-shadow group-hover:shadow-raised"
            >
              {!assetUrl(e.asset) && (
                <EditorialGarment
                  kind={e.garment.kind}
                  color={e.garment.color}
                  className="right-[4%] top-[8%] h-[84%] w-[42%] transition-transform duration-500 group-hover:scale-[1.04] sm:inset-x-0 sm:top-[6%] sm:mx-auto sm:h-[56%] sm:w-[72%]"
                />
              )}
              <div className="absolute inset-0 flex flex-col justify-end p-4 text-white md:p-5">
                <p className="text-[0.78rem] font-bold tracking-[0.18em] text-white/75">{e.eyebrow}</p>
                <p className="mt-1 text-[1.3rem] font-black leading-tight md:text-[1.5rem]">{e.title}</p>
                <p className="mt-1 text-[0.85rem] text-white/85">{e.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[0.85rem] font-semibold underline-offset-4 group-hover:underline">
                  보러가기
                  <ArrowRight size={14} />
                </span>
              </div>
            </GradientImage>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FitCtaDynamic() {
  const fp = useApp((s) => s.fitProfile);
  const done = !!(fp.height && fp.weight && fp.topSize && fp.bottomSize);
  return (
    <>
      <div className="mt-6">
        <Button variant="accent" size="lg" href="/style" icon={<Ruler size={18} />}>
          {done ? "핏 프로필 수정" : "1분 만에 핏 프로필 만들기"}
        </Button>
      </div>
      {done && (
        <p className="mt-4 text-[0.82rem] text-white/60">
          현재 프로필: 키 {fp.height}cm · {fp.weight}kg · 상의 {fp.topSize} · 하의 {fp.bottomSize}
        </p>
      )}
    </>
  );
}

function FitCtaSection() {
  return (
    <section data-tour="c-fit-cta" className="overflow-hidden rounded-cardlg bg-brand-black text-white">
      <div className="grid items-center md:grid-cols-12">
        <div className="p-6 md:col-span-7 md:p-10">
          <p className="inline-flex items-center gap-2 text-[0.78rem] font-bold tracking-[0.18em] text-white/60">
            <Sparkles size={14} />
            FIT SIGNAL
          </p>
          <h2 className="mt-3 text-[1.6rem] font-black leading-tight tracking-tight md:text-[2.1rem]">
            내 사이즈, 브랜드마다
            <br className="md:hidden" /> 다르다면?
          </h2>
          <p className="mt-3 max-w-[30rem] leading-relaxed text-white/75">
            키·몸무게·평소 사이즈만 입력하면 상품마다 추천 사이즈와 이유를 알려드려요.
          </p>
          <Hydrated
            fallback={
              <div className="mt-6">
                <Skeleton className="h-[52px] w-56 rounded-xl" />
              </div>
            }
          >
            <FitCtaDynamic />
          </Hydrated>
        </div>
        <div className="p-6 md:col-span-5 md:p-8 md:pl-0">
          <GradientImage
            gradient={["#315cf5", "#1e2a4a"]}
            ratio="aspect-[4/3]"
            asset="fit_profile.jpg"
            label="핏 프로필 안내"
            className="rounded-2xl"
          >
            {!assetUrl("fit_profile.jpg") && (
              <EditorialGarment kind="shirt" color="블랙" className="inset-x-0 top-[5%] mx-auto h-[42%] w-[38%]" />
            )}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <div className="rounded-xl bg-white/95 p-3 text-neutral-text shadow-raised">
                <p className="text-[0.78rem] font-bold text-neutral-text2">예시 · 오버핏 옥스포드 셔츠</p>
                <div className="mt-2 flex gap-1.5" aria-hidden>
                  {["S", "M", "L", "XL"].map((z) => (
                    <span
                      key={z}
                      className={cn(
                        "flex h-8 min-w-[2.5rem] items-center justify-center rounded-lg border text-[0.85rem] font-bold",
                        z === "S"
                          ? "border-brand-black bg-brand-black text-white"
                          : "border-neutral-border text-neutral-text2",
                      )}
                    >
                      {z}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[0.9rem] font-bold">
                  추천 사이즈 <span className="text-brand-accent">S</span> · 크게 나온 상품이라 한 치수 작게
                </p>
              </div>
            </div>
          </GradientImage>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    { icon: <Truck size={20} />, t: "무료배송", d: "5만원 이상 무료 · 평균 1~2일 도착" },
    { icon: <RefreshCcw size={20} />, t: "교환·반품", d: "수령 후 7일 이내 · 사이즈 교환 1회 무료" },
    { icon: <ShieldCheck size={20} />, t: "사이즈 상담", d: "핏 프로필 기반 추천 · 실측표 제공" },
  ];
  return (
    <section aria-label="신뢰·배송·교환 안내" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((i) => (
        <div
          key={i.t}
          className="flex items-center gap-3 rounded-2xl border border-neutral-border bg-white px-4 py-3.5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-ivory text-neutral-text">
            {i.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-[0.95rem] font-bold">{i.t}</span>
            <span className="block text-[0.8rem] text-neutral-text2">{i.d}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

function SectionSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-40" />
      <SkeletonGrid n={n} />
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */
export default function HomePage() {
  const hydrated = useHydrated();
  const track = useApp((s) => s.track);
  const tracked = useRef(false);
  useEffect(() => {
    if (hydrated && !tracked.current) {
      tracked.current = true;
      track("view_home");
    }
  }, [hydrated, track]);

  return (
    <div className="animate-fadeIn">
      <Hero />
      <QuickEntry />
      <Container className="space-y-12 py-9 md:space-y-20 md:py-14">
        <Hydrated fallback={<SectionSkeleton />}>
          <RankingSection />
        </Hydrated>
        <FitCtaSection />
        <Hydrated fallback={<SectionSkeleton />}>
          <RecommendSection />
        </Hydrated>
        <Hydrated fallback={<SectionSkeleton n={4} />}>
          <RisingSection />
        </Hydrated>
        <NewBrandsSection />
        <SeasonEditSection />
        <TrustSection />
      </Container>
    </div>
  );
}

/** 사진 전까지 에디토리얼 칸에 놓는 의류 실루엣 구성 (D-53) */
function EditorialGarment({ kind, color, className }: { kind: GarmentKind; color: string; className?: string }) {
  const [a, b] = colorHex(color);
  return (
    <div className={cn("pointer-events-none absolute", className)} aria-hidden>
      <Garment kind={kind} color={a} shade={b} id={`ed-${kind}-${a.slice(1)}`} />
    </div>
  );
}
