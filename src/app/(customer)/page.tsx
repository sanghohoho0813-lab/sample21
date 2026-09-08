"use client";
/* ------------------------------------------------------------------
   MORFIT Home — Editorial multi-brand fashion home.
   3초 안에: 멀티브랜드 패션 플랫폼 · 탐색 CTA · 브랜드/스타일 차별점 · 개인화 진입.
   Sections: Hero → 오늘의 랭킹 → 취향별 추천 → 신규 입점 브랜드 → 반응 빠른 상품
             → 시즌 스타일 편집 → 사이즈 프로필 CTA → 신뢰·배송·교환
------------------------------------------------------------------- */
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, Ruler, TrendingUp, Truck, RefreshCcw, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { BRANDS, BRAND_BY_ID, PRODUCTS, DEMO_CUSTOMER_NAME } from "@/lib/demo/seed";
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
import { SkeletonGrid, Skeleton } from "@/components/ui/States";
import { Freshness } from "@/components/ui/Misc";
import { Container, SectionHead } from "@/components/customer/Section";
import { ProductCard, ProductGrid, HScroll } from "@/components/customer/ProductCard";
import { BRAND_ASSET, isNewBrand, brandProductCount } from "@/components/customer/discovery/BrandCard";

const VARIANT_COUNT = PRODUCTS.reduce((s, p) => s + p.colors.length * p.sizes.length, 0);

/* ------------------------------ Hero ------------------------------ */
function Hero() {
  return (
    <section data-tour="c-hero" className="bg-brand-ivory border-b border-neutral-border">
      <Container className="py-8 md:py-14 lg:py-16 grid md:grid-cols-12 gap-8 md:gap-10 items-center">
        <div className="md:col-span-6 lg:col-span-6">
          <p className="text-[0.74rem] md:text-[0.8rem] font-bold tracking-[0.2em] text-neutral-text2">MULTI-BRAND FASHION PLATFORM</p>
          <h1 className="mt-3 text-[2.35rem] leading-[1.05] md:text-[3.2rem] lg:text-[3.6rem] font-black tracking-tight">
            오늘의 취향을<br />브랜드 너머로
          </h1>
          <p className="mt-4 md:mt-5 text-[1rem] md:text-[1.1rem] text-neutral-text2 leading-relaxed max-w-[34rem]">
            MORFIT은 AERNO·NOVE STUDIO·PLANE ARCHIVE 등 10개 브랜드의 옷과 신발을 한곳에서 비교하고, 내 사이즈에 맞는 상품까지 찾아주는 <strong className="text-neutral-text">멀티브랜드 패션 플랫폼</strong>입니다.
          </p>
          <div className="mt-6 md:mt-7 flex flex-wrap gap-2.5">
            <Button variant="brand" size="lg" href="/ranking" icon={<TrendingUp size={18} />}>랭킹 보기</Button>
            <Button variant="outline" size="lg" href="/style" icon={<Ruler size={18} />}>스타일 찾기</Button>
          </div>
          <ul className="mt-7 md:mt-8 grid grid-cols-3 gap-2 max-w-[32rem]" aria-label="MORFIT 특징">
            {[
              { v: `${BRANDS.length}`, l: "브랜드 · 4가지 무드" },
              { v: `${PRODUCTS.length}`, l: `상품 · ${num(VARIANT_COUNT)} 옵션` },
              { v: "핏 추천", l: "내 사이즈 기준" },
            ].map((s) => (
              <li key={s.l} className="rounded-2xl bg-white/70 border border-neutral-border px-3 py-2.5">
                <p className="font-black text-[1.15rem] md:text-[1.3rem] leading-none tabular">{s.v}</p>
                <p className="mt-1 text-[0.72rem] md:text-[0.78rem] text-neutral-text2 font-semibold">{s.l}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-6 grid grid-cols-3 gap-2.5 md:gap-3">
          <GradientImage gradient={["#111111", "#3d3d3d"]} ratio="aspect-[3/4]" className="col-span-2 row-span-2 rounded-cardlg" asset="hero_main.jpg" overlay label="FW 에디토리얼 메인">
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-[0.68rem] font-bold tracking-[0.18em] text-white/75">FW EDITORIAL</p>
              <p className="mt-1 font-bold text-[1.05rem] md:text-[1.25rem] leading-tight">구조적인 미니멀리즘,<br />오늘의 아우터</p>
              <Link href="/shop?category=outer" className="mt-2 inline-flex items-center gap-1 text-[0.82rem] font-semibold underline-offset-4 hover:underline">아우터 보기<ArrowRight size={14} /></Link>
            </div>
          </GradientImage>
          <Link href="/brands/mellow-code" className="block group">
            <GradientImage gradient={BRAND_BY_ID["b-mellow"].gradient} ratio="aspect-[3/4]" asset="fashion_editorial_01.jpg" overlay label="MELLOW CODE 룩" className="group-hover:shadow-raised transition-shadow">
              <span className="absolute bottom-3 left-3 text-white text-[0.72rem] font-bold tracking-wide">MELLOW CODE</span>
            </GradientImage>
          </Link>
          <Link href="/brands/current-type" className="block group">
            <GradientImage gradient={BRAND_BY_ID["b-current"].gradient} ratio="aspect-[3/4]" asset="fashion_editorial_02.jpg" overlay label="CURRENT TYPE 룩" className="group-hover:shadow-raised transition-shadow">
              <span className="absolute bottom-3 left-3 text-white text-[0.72rem] font-bold tracking-wide">CURRENT TYPE</span>
            </GradientImage>
          </Link>
        </div>
      </Container>
      <div className="border-t border-neutral-border/70">
        <Container className="py-3">
          <HScroll className="items-center gap-2">
            <span className="shrink-0 text-[0.72rem] font-bold tracking-widest text-neutral-text2 pr-1">BRANDS</span>
            {BRANDS.map((b) => (
              <Link key={b.id} href={`/brands/${b.slug}`} className="shrink-0 snap-start h-9 px-3 rounded-full bg-white border border-neutral-border text-[0.82rem] font-bold hover:border-neutral-text2 hover:bg-neutral-canvas transition-colors inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: `linear-gradient(135deg, ${b.gradient[0]}, ${b.gradient[1]})` }} />{b.name}
              </Link>
            ))}
            <Link href="/brands" className="shrink-0 h-9 px-3 rounded-full bg-brand-black text-white text-[0.82rem] font-bold inline-flex items-center gap-1">전체 브랜드<ChevronRight size={14} /></Link>
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
      <SectionHead title="오늘의 랭킹" desc="판매·찜·조회를 합쳐 계산한 지금 가장 반응이 좋은 상품" more="/ranking" moreLabel="랭킹 전체" />
      <ProductGrid products={top.map((a) => a.product)} ranked />
      <div className="mt-4"><Freshness source="DEMO" /></div>
    </section>
  );
}

function RecommendSection() {
  const store = useApp();
  const fp = store.fitProfile;
  const profileDone = !!(fp.height && fp.weight && fp.topSize && fp.bottomSize);
  const recs = useMemo(() => recommendForCustomer({ recentlyViewed: store.recentlyViewed, wishlist: store.wishlist.map((w) => w.productId), limit: 8 }), [store.recentlyViewed, store.wishlist]);
  const reasons = Object.fromEntries(recs.map((r) => [r.product.id, r.reason]));
  return (
    <section>
      <SectionHead title="취향별 추천" desc={`${DEMO_CUSTOMER_NAME}님이 자주 본 브랜드·카테고리와 찜 목록을 바탕으로 골랐어요`} more="/style" moreLabel="취향 설정" />
      {!profileDone && (
        <Link href="/style" className="mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-neutral-border bg-brand-ivory px-4 py-3.5 hover:border-neutral-text2 transition-colors group">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-white border border-neutral-border flex items-center justify-center text-brand-accent"><Ruler size={18} /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-[0.95rem]">핏 프로필을 완성하면 사이즈까지 맞춰 추천해요</span>
            <span className="block text-[0.82rem] text-neutral-text2">키·몸무게·평소 사이즈 4가지만 입력하면 됩니다 · 1분</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-neutral-text2 group-hover:text-neutral-text" />
        </Link>
      )}
      <ProductGrid products={recs.map((r) => r.product)} reasons={reasons} />
    </section>
  );
}

function NewBrandsSection() {
  const fresh = BRANDS.filter(isNewBrand);
  const rest = BRANDS.filter((b) => !isNewBrand(b)).sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
  const list = [...fresh, ...rest].slice(0, 4);
  const now = new Date();
  return (
    <section>
      <SectionHead title="신규 입점 브랜드" desc="새로 합류한 브랜드부터 최근 입점 순으로" more="/brands" moreLabel="브랜드 전체" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {list.map((b) => {
          const newer = isNewBrand(b);
          return (
            <Link key={b.id} href={`/brands/${b.slug}`} className="group block rounded-cardlg overflow-hidden border border-neutral-border bg-white hover-lift">
              <GradientImage gradient={b.gradient} ratio="aspect-[4/5] md:aspect-[4/3]" asset={BRAND_ASSET[b.slug]} overlay label={`${b.name} 브랜드 이미지`} className="rounded-none">
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <div>{newer ? <Badge tone="dark" size="sm">NEW 입점</Badge> : <Badge tone="neutral" size="sm">입점 {daysBetween(b.joinedAt, now)}일차</Badge>}</div>
                  <p className="text-white font-black text-[1.15rem] md:text-[1.3rem] tracking-tight leading-none group-hover:underline underline-offset-4">{b.name}</p>
                </div>
              </GradientImage>
              <div className="p-3">
                <p className="text-[0.85rem] font-semibold leading-snug line-clamp-1">{b.tagline}</p>
                <p className="mt-1 text-[0.75rem] text-neutral-text2 tabular">팔로워 {num(b.followers)} · 상품 {brandProductCount(b.id)}개</p>
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
    const list = hot.length >= 4 ? hot : [...hot, ...aggs.filter((a) => !hot.includes(a)).sort((a, b) => b.velocity - a.velocity)];
    return list.slice(0, 8);
  }, [store]);
  return (
    <section>
      <SectionHead title="지금 반응이 빠른 상품" desc="직전 7일보다 판매가 크게 늘었거나 찜·재입고 신청이 몰리는 상품" more="/ranking" moreLabel="랭킹" />
      <HScroll className="pb-1">
        {rising.map((a) => (
          <div key={a.product.id} className="w-[168px] sm:w-[200px] md:w-[220px] shrink-0 snap-start">
            <ProductCard product={a.product} reason={a.worst === "rising" ? "급상승 · 관심 상승 중" : `7일 판매 ${signed(a.velocity, 0)}`} compact />
          </div>
        ))}
      </HScroll>
    </section>
  );
}

const EDITS = [
  { href: "/shop?category=outer", eyebrow: "SEASON EDIT 01", title: "아우터, 첫 단추", desc: "코트·자켓·플리스 — 브랜드별 실루엣 비교", gradient: ["#1f2937", "#6b7280"] as [string, string], asset: "category_outer.jpg" },
  { href: "/shop?gender=women", eyebrow: "SEASON EDIT 02", title: "여성 컨템포러리", desc: "MELLOW CODE · HALF MOON의 단정한 실루엣", gradient: ["#3f3f46", "#c4b5fd"] as [string, string], asset: "fashion_editorial_03.jpg" },
  { href: "/shop?sale=1", eyebrow: "SEASON EDIT 03", title: "시즌 오프 세일", desc: "지금 할인 중인 상품만 모아보기", gradient: ["#0c4a6e", "#7dd3fc"] as [string, string], asset: "hero_secondary.jpg" },
];

function SeasonEditSection() {
  return (
    <section>
      <SectionHead title="시즌 스타일 편집" desc="에디터가 고른 세 가지 테마" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {EDITS.map((e) => (
          <Link key={e.href} href={e.href} className="group block">
            <GradientImage gradient={e.gradient} ratio="aspect-[16/9] sm:aspect-[4/5]" asset={e.asset} overlay label={e.title} className="rounded-cardlg transition-shadow group-hover:shadow-raised">
              <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-end text-white">
                <p className="text-[0.68rem] font-bold tracking-[0.18em] text-white/75">{e.eyebrow}</p>
                <p className="mt-1 font-black text-[1.3rem] md:text-[1.5rem] leading-tight">{e.title}</p>
                <p className="mt-1 text-[0.85rem] text-white/85">{e.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[0.85rem] font-semibold underline-offset-4 group-hover:underline">보러가기<ArrowRight size={14} /></span>
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
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Button variant="accent" size="lg" href="/style" icon={<Ruler size={18} />}>{done ? "핏 프로필 수정" : "핏 프로필 만들기"}</Button>
        <Button variant="ghost" size="lg" href="/ranking" className="text-white hover:bg-white/10">먼저 둘러보기</Button>
      </div>
      {done && <p className="mt-4 text-[0.82rem] text-white/60">현재 프로필: 키 {fp.height}cm · {fp.weight}kg · 상의 {fp.topSize} · 하의 {fp.bottomSize}</p>}
    </>
  );
}

function FitCtaSection() {
  return (
    <section data-tour="c-fit-cta" className="rounded-cardlg bg-brand-black text-white overflow-hidden">
      <div className="grid md:grid-cols-12 items-center">
        <div className="md:col-span-7 p-6 md:p-10">
          <p className="text-[0.72rem] font-bold tracking-[0.18em] text-white/60 inline-flex items-center gap-2"><Sparkles size={14} />FIT SIGNAL</p>
          <h2 className="mt-3 text-[1.6rem] md:text-[2.1rem] font-black tracking-tight leading-tight">내 사이즈, 브랜드마다<br className="md:hidden" /> 다르다면?</h2>
          <p className="mt-3 text-white/75 leading-relaxed max-w-[30rem]">키·몸무게·평소 사이즈를 입력하면 상품마다 추천 사이즈와 그 이유를 보여드려요. 작게 나온 옷, 크게 나온 옷도 미리 알 수 있습니다.</p>
          <Hydrated fallback={<div className="mt-6 flex gap-2.5"><Skeleton className="h-[52px] w-44 rounded-xl" /><Skeleton className="h-[52px] w-32 rounded-xl" /></div>}>
            <FitCtaDynamic />
          </Hydrated>
        </div>
        <div className="md:col-span-5 p-6 md:p-8 md:pl-0">
          <GradientImage gradient={["#315cf5", "#1e2a4a"]} ratio="aspect-[16/9] md:aspect-[4/3]" asset="fit_profile.jpg" label="핏 프로필 안내" className="rounded-2xl">
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <div className="rounded-xl bg-white/95 text-neutral-text p-3">
                <p className="text-[0.72rem] font-bold text-neutral-text2">예시 · 오버핏 옥스포드 셔츠</p>
                <p className="mt-0.5 font-bold text-[0.95rem]">추천 사이즈 <span className="text-brand-accent">S</span> · 크게 나온 상품이라 한 치수 작게</p>
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
    <section aria-label="신뢰·배송·교환 안내" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((i) => (
        <div key={i.t} className="flex items-center gap-3 rounded-2xl border border-neutral-border bg-white px-4 py-3.5">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-brand-ivory flex items-center justify-center text-neutral-text">{i.icon}</span>
          <span className="min-w-0"><span className="block font-bold text-[0.95rem]">{i.t}</span><span className="block text-[0.8rem] text-neutral-text2">{i.d}</span></span>
        </div>
      ))}
    </section>
  );
}

function SectionSkeleton({ n = 8 }: { n?: number }) {
  return <div className="space-y-4"><Skeleton className="h-7 w-40" /><SkeletonGrid n={n} /></div>;
}

/* ------------------------------ Page ------------------------------ */
export default function HomePage() {
  const hydrated = useHydrated();
  const track = useApp((s) => s.track);
  const tracked = useRef(false);
  useEffect(() => { document.title = "MORFIT — 멀티브랜드 패션 플랫폼"; }, []);
  useEffect(() => { if (hydrated && !tracked.current) { tracked.current = true; track("view_home"); } }, [hydrated, track]);

  return (
    <div className="animate-fadeIn">
      <Hero />
      <Container className="py-10 md:py-14 space-y-14 md:space-y-20">
        <Hydrated fallback={<SectionSkeleton />}><RankingSection /></Hydrated>
        <Hydrated fallback={<SectionSkeleton />}><RecommendSection /></Hydrated>
        <NewBrandsSection />
        <Hydrated fallback={<SectionSkeleton n={4} />}><RisingSection /></Hydrated>
        <SeasonEditSection />
        <FitCtaSection />
        <TrustSection />
      </Container>
    </div>
  );
}
