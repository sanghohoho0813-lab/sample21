"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, ShoppingBag, Bell, Zap, Truck, ChevronRight, Star, Ruler, User, Shirt, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { BRAND_BY_ID, CATEGORY_NAME, PRODUCTS } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { effPrice, effFitNote, productAgg } from "@/lib/kpi";
import { recommendFit } from "@/lib/engine";
import { fmtDate } from "@/lib/dates";
import { Container, SectionHead } from "@/components/customer/Section";
import { ProductGrid } from "@/components/customer/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { Button } from "@/components/ui/Button";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { Price, Progress } from "@/components/ui/Misc";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { OptionPicker } from "./OptionPicker";
import { FitSignal } from "./FitSignal";
import { FIT_LABEL, FIT_DESC, SIZING_LABEL, FREE_SHIP_MIN, etaLabel, findVariant, stockState, demoReviews, type DemoReview } from "./shared";

const SLOTS = [{ key: "front", label: "정면" }, { key: "detail", label: "디테일" }, { key: "wear", label: "착용컷" }];

function Gallery({ product, colorIdx, onColor }: { product: Product; colorIdx: number; onColor: (i: number) => void }) {
  const [slot, setSlot] = useState(0);
  const cur = SLOTS[slot];
  return (
    <div className="md:sticky md:top-[88px] space-y-3 min-w-0">
      <ProductImage colors={product.colors} variant={colorIdx} label={`${product.name} · ${product.colors[colorIdx]} · ${cur.label}`} ratio="aspect-[3/4]" className="rounded-2xl md:rounded-cardlg">
        {slot === 1 && <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42), transparent 42%)" }} />}
        {slot === 2 && <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(17,17,17,0.28))" }} />}
        <div className="absolute right-3 top-3 flex items-center gap-1.5"><span className="rounded-full bg-white/85 px-2.5 py-1 text-[0.72rem] font-bold text-brand-black">{cur.label}</span></div>
        <div className="absolute left-3 top-3"><span className="rounded-full bg-brand-black/70 px-2.5 py-1 text-[0.72rem] font-semibold text-white">사진 준비중 · 컬러 프리뷰</span></div>
      </ProductImage>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {SLOTS.map((s, i) => (
          <button key={s.key} type="button" onClick={() => setSlot(i)} aria-label={`${s.label} 이미지`} aria-pressed={slot === i} className={cn("relative w-[72px] shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-fast active:scale-95", slot === i ? "border-brand-black" : "border-transparent hover:border-neutral-border")}>
            <ProductImage colors={product.colors} variant={colorIdx} label={s.label} ratio="aspect-[3/4]" className="rounded-lg">
              {i === 1 && <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42), transparent 42%)" }} />}
              {i === 2 && <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(17,17,17,0.28))" }} />}
            </ProductImage>
            <span className="absolute inset-x-0 bottom-0 bg-white/85 text-[0.68rem] font-bold text-center py-0.5 text-brand-black">{s.label}</span>
          </button>
        ))}
        <span className="w-px bg-neutral-border shrink-0 my-2" aria-hidden />
        {product.colors.map((c, i) => (
          <button key={c} type="button" onClick={() => onColor(i)} aria-label={`색상 ${c} 이미지`} aria-pressed={colorIdx === i} className={cn("relative w-[72px] shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-fast active:scale-95", colorIdx === i ? "border-brand-black" : "border-transparent hover:border-neutral-border")}>
            <ProductImage colors={product.colors} variant={i} label={c} ratio="aspect-[3/4]" className="rounded-lg" />
            <span className="absolute inset-x-0 bottom-0 bg-white/85 text-[0.68rem] font-bold text-center py-0.5 text-brand-black">{c}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeGuide({ product, selectedSize, recommended }: { product: Product; selectedSize: string | null; recommended: string | null }) {
  const sizes = product.sizes;
  const keys = Object.keys(product.measurements[sizes[0]] ?? {});
  if (!keys.length) return <div className="rounded-cardlg border border-neutral-border bg-white p-5"><p className="font-bold">사이즈 가이드</p><p className="text-neutral-text2 text-[0.9rem] mt-1">단일 사이즈(FREE) 상품입니다. {product.fitNote}</p></div>;
  const unit = product.categoryId === "shoes" ? "cm (발길이 기준)" : "cm";
  return (
    <div className="rounded-cardlg border border-neutral-border bg-white overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-[1.05rem]">사이즈 가이드 <span className="text-[0.82rem] font-normal text-neutral-text2">단위 {unit} · 측정 방법에 따라 1~2cm 차이</span></p><div className="flex gap-1.5 text-[0.75rem]"><span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-brand-black" />선택</span><span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-brand-accent" />추천</span></div></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.9rem] min-w-[420px]">
          <thead><tr className="bg-brand-ivory text-neutral-text2"><th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">사이즈</th>{keys.map((k) => <th key={k} className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">{k}</th>)}</tr></thead>
          <tbody>
            {sizes.map((s) => {
              const sel = s === selectedSize, rec = s === recommended;
              return (
                <tr key={s} className={cn("border-t border-neutral-border", sel && "bg-brand-black text-white", !sel && rec && "bg-brand-accent/10")}>
                  <td className="px-4 py-2.5 font-bold whitespace-nowrap">{s}{rec && <span className={cn("ml-1.5 text-[0.7rem] font-bold rounded px-1 py-0.5 align-middle", sel ? "bg-white/20 text-white" : "bg-brand-accent text-white")}>추천</span>}</td>
                  {keys.map((k) => <td key={k} className="px-4 py-2.5 text-right tabular">{product.measurements[s]?.[k] ?? "-"}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StarRow({ n, size = 14 }: { n: number; size?: number }) {
  return <span className="inline-flex gap-0.5" aria-label={`별점 ${n}점`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= n ? "text-brand-black" : "text-neutral-border"} fill={i <= n ? "currentColor" : "none"} />)}</span>;
}

function Reviews({ product }: { product: Product }) {
  const reviews = useMemo(() => demoReviews(product), [product]);
  const dist = product.sizing === "small" ? [62, 33, 5] : product.sizing === "large" ? [6, 36, 58] : [12, 79, 9];
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? reviews : reviews.slice(0, 4);
  return (
    <div className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div><p className="font-bold text-[1.05rem] flex items-center gap-2">리뷰 <DemoBadge label="DEMO 리뷰" /></p><p className="text-[0.85rem] text-neutral-text2 mt-0.5">실제 고객 리뷰가 아닌 시연용 예시입니다.</p></div>
        <div className="flex items-center gap-2"><span className="text-[2rem] font-black leading-none tabular">{product.rating}</span><div><StarRow n={Math.round(product.rating)} /><p className="text-[0.78rem] text-neutral-text2 tabular">리뷰 {product.reviewCount}개 (Demo)</p></div></div>
      </div>
      {(product.categoryId !== "bag" && product.categoryId !== "acc") && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[["작아요", dist[0]], ["딱 맞아요", dist[1]], ["커요", dist[2]]].map(([l, v]) => <div key={l as string} className="rounded-xl bg-brand-ivory px-3 py-2.5"><p className="text-[0.78rem] text-neutral-text2">{l}</p><p className="font-bold tabular">{v}%</p><Progress value={(v as number) / 100} className="mt-1.5 h-1.5 bg-white" tone={l === "딱 맞아요" ? "success" : "warning"} /></div>)}
        </div>
      )}
      <ul className="divide-y divide-neutral-border">
        {list.map((r: DemoReview) => (
          <li key={r.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><StarRow n={r.rating} /><span className="font-semibold text-[0.9rem]">{r.name}</span></div><span className="text-[0.78rem] text-neutral-text2 tabular">{fmtDate(r.at)}</span></div>
            <p className="text-[0.82rem] text-neutral-text2 mt-1">{r.height}cm · {r.weight}kg · {r.bodyType} · 구매 <span className="font-semibold text-neutral-text">{r.color} {r.size}</span></p>
            <p className="text-[0.95rem] mt-1.5 leading-relaxed">{r.text}</p>
            <p className="text-[0.78rem] text-neutral-text2 mt-1.5">도움돼요 {r.helpful}</p>
          </li>
        ))}
      </ul>
      {reviews.length > 4 && <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-4 h-11 w-full rounded-xl border border-neutral-border font-semibold hover:bg-brand-ivory active:bg-brand-ivory transition-colors">{showAll ? "접기" : `리뷰 ${reviews.length - 4}개 더 보기`}</button>}
    </div>
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const store = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const brand = BRAND_BY_ID[product.brandId];
  const single = product.sizes.length === 1 && product.sizes[0] === "FREE";
  const initColor = () => { const c = params.get("color"); const i = c ? product.colors.indexOf(c) : -1; return i >= 0 ? i : 0; };
  const initSize = () => { const s = params.get("size"); return s && product.sizes.includes(s) ? s : single ? "FREE" : null; };
  const [colorIdx, setColorIdx] = useState<number>(initColor);
  const [size, setSize] = useState<string | null>(initSize);
  const [added, setAdded] = useState<string | null>(null);

  // view tracking + recently viewed (once per product)
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (seen.current === product.id) return;
    seen.current = product.id;
    store.track("view_product", { productId: product.id });
    store.pushRecentlyViewed(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  // URL → selection (e.g. notification / presentation links)
  useEffect(() => {
    const c = params.get("color"); const s = params.get("size");
    if (c) { const i = product.colors.indexOf(c); if (i >= 0) setColorIdx(i); }
    if (s && product.sizes.includes(s)) setSize(s);
  }, [params, product]);

  const price = effPrice(product, store);
  const free = price >= FREE_SHIP_MIN;
  const variant = findVariant(product.id, colorIdx, size);
  const st = variant ? stockState(variant, store) : null;
  const subscribed = !!variant && store.restockSubs.some((s) => s.variantId === variant.id && s.status === "waiting");
  const wished = store.wishlist.some((w) => w.productId === product.id);
  const agg = productAgg(product, store);
  const fit = useMemo(() => recommendFit(product, store.fitProfile, store.fitNoteOverride[product.id]), [product, store.fitProfile, store.fitNoteOverride]);
  const fitNote = effFitNote(product, store);

  const pickColor = (i: number) => { setColorIdx(i); store.track("select_color", { productId: product.id, color: product.colors[i] }); };
  const pickSize = (s: string) => { setSize(s); store.track("select_size", { productId: product.id, size: s, variantId: findVariant(product.id, colorIdx, s)?.id }); };
  const requireOption = () => {
    if (variant) return true;
    toast("색상과 사이즈를 선택해주세요", undefined, "warning");
    document.getElementById("options")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  };
  const addCart = () => {
    if (!requireOption() || !variant || !st) return;
    if (!st.purchasable) { toast("품절된 옵션입니다", "재입고 알림을 신청해 주세요", "warning"); return; }
    store.addToCart(variant.id);
    setAdded(variant.id);
    toast("장바구니에 담았습니다", `${product.name} · ${variant.color} · ${variant.size} — 장바구니에서 확인하세요`);
  };
  const buyNow = () => {
    if (!requireOption() || !variant || !st) return;
    if (!st.purchasable) { toast("품절된 옵션입니다", "재입고 알림을 신청해 주세요", "warning"); return; }
    store.addToCart(variant.id);
    router.push("/cart");
  };
  const restock = () => {
    if (!variant) return;
    store.subscribeRestock(variant.id);
    toast("재입고 알림을 신청했습니다", "Business AX 수요신호에 반영");
  };
  const wish = () => {
    const on = store.toggleWishlist(product.id, variant?.id ?? null);
    toast(on ? "찜 목록에 저장했습니다" : "찜을 해제했습니다", on ? (variant ? `${variant.color} · ${variant.size} 옵션과 함께 저장` : "재고와 가격 변화를 알려드릴게요") : undefined, on ? "success" : "info");
  };

  const soldoutSelected = !!st && !st.purchasable;
  const related = PRODUCTS.filter((p) => p.brandId === product.brandId && p.id !== product.id).slice(0, 4);
  const alsoViewed = PRODUCTS.filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.brandId !== product.brandId).map((p) => ({ p, s: productAgg(p, store).rankScore })).sort((a, b) => b.s - a.s).slice(0, 4).map((x) => x.p);
  const badge = agg.worst === "rising" || product.tags.includes("급상승") ? { t: "급상승", tone: "accent" as const } : product.tags.includes("베스트") ? { t: "BEST", tone: "dark" as const } : Date.now() - new Date(product.createdAt).getTime() < 30 * 86400000 ? { t: "NEW", tone: "dark" as const } : null;

  const RestockCta = ({ full, tour }: { full?: boolean; tour?: string }) => subscribed ? (
    <Button variant="secondary" size="lg" full={full} className={cn(!full && "flex-[2]")} onClick={() => router.push("/my/restock")} icon={<Bell size={18} />} data-tour={tour} aria-label="재입고 알림 신청 완료 · 내 재입고 알림 목록 보기">신청 완료 · 알림 목록 보기</Button>
  ) : (
    <Button variant="brand" size="lg" full={full} className={cn(!full && "flex-[2]")} onClick={restock} icon={<Bell size={18} />} data-tour={tour}>재입고 알림 신청</Button>
  );

  return (
    <div className="pb-24 md:pb-0">
      <Container className="pt-4 md:pt-8">
        <nav className="hidden md:flex items-center gap-1 text-[0.82rem] text-neutral-text2 mb-5" aria-label="경로"><Link href="/" className="hover:text-neutral-text">홈</Link><ChevronRight size={14} /><Link href={`/shop?category=${product.categoryId}`} className="hover:text-neutral-text">{CATEGORY_NAME[product.categoryId]}</Link><ChevronRight size={14} /><Link href={`/brands/${brand.slug}`} className="hover:text-neutral-text">{brand.name}</Link></nav>
        <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 md:gap-10 items-start">
          <Gallery product={product} colorIdx={colorIdx} onColor={pickColor} />

          <div className="space-y-6 min-w-0">
            <div>
              <div className="flex items-center gap-2 mb-2"><Link href={`/brands/${brand.slug}`} className="text-[0.85rem] font-bold tracking-wide text-neutral-text2 hover:text-neutral-text inline-flex items-center gap-0.5">{brand.name}<ChevronRight size={14} /></Link>{badge && <Badge tone={badge.tone} size="sm">{badge.t}</Badge>}</div>
              <h1 className="text-[1.5rem] md:text-[1.8rem] font-bold tracking-tight leading-tight">{product.name}</h1>
              <p className="text-neutral-text2 mt-1">{product.subtitle}</p>
              <div className="mt-3 flex items-center gap-3 text-[0.85rem] text-neutral-text2"><span className="inline-flex items-center gap-1"><Star size={14} className="text-brand-black" fill="currentColor" /><span className="font-semibold text-neutral-text tabular">{product.rating}</span> · 리뷰 {product.reviewCount}</span><span className="inline-flex items-center gap-1"><Heart size={14} /> 찜 {agg.wishlist7d} (7일)</span></div>
              <div className="mt-4"><Price price={price} original={product.price} size="lg" />{store.salePriceOverride[product.id] && <p className="mt-1 text-[0.82rem] text-brand-accent font-semibold">MD 할인 적용 · 가격이 방금 조정되었습니다 (DEMO)</p>}</div>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-ivory px-4 py-3 text-[0.9rem]"><Truck size={18} className="mt-0.5 shrink-0" /><div><p className="font-bold">{etaLabel(free)}</p><p className="text-neutral-text2 text-[0.82rem]">{free ? "무료배송 · 오늘 자정 전 주문 시" : `배송비 3,000원 · ${FREE_SHIP_MIN.toLocaleString("ko-KR")}원 이상 구매 시 무료`}</p></div></div>
            </div>

            <div id="options" className="rounded-cardlg border border-neutral-border bg-white p-5 scroll-mt-24">
              <OptionPicker product={product} colorIdx={colorIdx} size={size} onColor={pickColor} onSize={pickSize}
                sizeAction={<a href="#fit-signal" onClick={(e) => { e.preventDefault(); document.getElementById("fit-signal")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="inline-flex items-center gap-1 text-[0.85rem] font-bold text-brand-accent hover:underline underline-offset-2"><Ruler size={14} />핏 추천{fit.ready && fit.size ? ` ${fit.size}` : ""}</a>} />
              {variant && (
                <div className="mt-4 rounded-xl bg-brand-ivory px-4 py-3 flex items-center justify-between gap-3 text-[0.9rem]">
                  <span className="min-w-0"><span className="font-semibold">{variant.color} · {variant.size}</span><span className="text-neutral-text2"> · 1개</span></span>
                  <span className="font-bold tabular">{price.toLocaleString("ko-KR")}원</span>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="lg" onClick={wish} aria-pressed={wished} aria-label={wished ? "찜 해제" : "찜하기"} className="w-[56px] px-0 shrink-0" icon={<Heart size={20} fill={wished ? "currentColor" : "none"} className={wished ? "text-brand-accent" : undefined} />} />
                {soldoutSelected ? <RestockCta tour="c-restock" /> : (
                  <>
                    <Button variant="outline" size="lg" className="flex-1" onClick={addCart} icon={<ShoppingBag size={18} />}>장바구니</Button>
                    <Button variant="brand" size="lg" className="flex-1" onClick={buyNow} icon={<Zap size={18} />}>바로 주문</Button>
                  </>
                )}
              </div>
              {added && <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-brand-accent/40 bg-brand-accent/5 px-4 py-2.5 text-[0.88rem] animate-fadeIn"><span className="font-semibold">장바구니에 담았습니다</span><Link href="/cart" className="inline-flex items-center gap-1 font-bold text-brand-accent hover:underline underline-offset-2">장바구니 보기<ArrowRight size={14} /></Link></div>}
              {soldoutSelected && <p className="mt-3 text-[0.82rem] text-neutral-text2 leading-relaxed">품절 옵션의 재입고 알림 신청은 Business AX의 <span className="font-semibold text-neutral-text">Demand Radar</span> 수요신호가 되어 MD의 재입고 판단에 바로 반영됩니다. 입고되면 알림으로 알려드립니다.</p>}
            </div>

            <FitSignal product={product} selectedSize={size} onPickSize={pickSize} />
          </div>
        </div>
      </Container>

      <Container className="mt-10 md:mt-14 space-y-8 md:space-y-10">
        <section id="size-guide" className="space-y-4">
          <SectionHead title="사이즈·핏 정보" desc="실측표와 핏 특성을 함께 확인하세요." />
          <SizeGuide product={product} selectedSize={size} recommended={fit.ready ? fit.size : null} />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-cardlg border border-neutral-border bg-white p-5">
              <p className="font-bold flex items-center gap-2"><Shirt size={16} />핏 정보</p>
              <div className="mt-3 flex flex-wrap gap-2"><Badge tone="dark">{FIT_LABEL[product.fit]}</Badge><Badge tone={product.sizing === "true" ? "success" : "warning"}>{SIZING_LABEL[product.sizing]}</Badge></div>
              <p className="text-[0.85rem] text-neutral-text2 mt-2">{FIT_DESC[product.fit]}</p>
              <div className="mt-3 grid grid-cols-3 text-[0.72rem] text-neutral-text2 text-center"><span>작음</span><span>정사이즈</span><span>큼</span></div>
              <div className="relative h-2 rounded-full bg-brand-ivory mt-1"><span className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-brand-black border-2 border-white shadow-card", product.sizing === "small" ? "left-[12%]" : product.sizing === "large" ? "left-[82%]" : "left-[47%]")} /></div>
              <p className="text-[0.88rem] mt-3 leading-relaxed">{fitNote}</p>
            </div>
            <div className="rounded-cardlg border border-neutral-border bg-white p-5">
              <p className="font-bold flex items-center gap-2"><User size={16} />모델 정보</p>
              <dl className="mt-3 space-y-1.5 text-[0.9rem]"><div className="flex justify-between"><dt className="text-neutral-text2">키</dt><dd className="tabular font-semibold">{product.model.height}cm</dd></div><div className="flex justify-between"><dt className="text-neutral-text2">몸무게</dt><dd className="tabular font-semibold">{product.model.weight}kg</dd></div><div className="flex justify-between"><dt className="text-neutral-text2">착용 사이즈</dt><dd className="font-semibold">{product.model.size}</dd></div></dl>
              <p className="text-[0.82rem] text-neutral-text2 mt-3">모델 착용 사진은 준비 중입니다.</p>
            </div>
            <div className="rounded-cardlg border border-neutral-border bg-white p-5">
              <p className="font-bold flex items-center gap-2"><Ruler size={16} />소재·세탁 정보</p>
              <dl className="mt-3 space-y-2 text-[0.9rem]"><div><dt className="text-neutral-text2 text-[0.8rem]">소재</dt><dd className="font-semibold">{product.material}</dd></div><div><dt className="text-neutral-text2 text-[0.8rem]">세탁</dt><dd>{product.care}</dd></div><div><dt className="text-neutral-text2 text-[0.8rem]">상품 설명</dt><dd className="leading-relaxed">{product.description}</dd></div></dl>
            </div>
          </div>
        </section>

        <section id="reviews"><Reviews product={product} /></section>

        {related.length > 0 && <section><SectionHead title={`${brand.name}의 다른 상품`} desc={brand.tagline} more={`/brands/${brand.slug}`} moreLabel="브랜드 보기" /><ProductGrid products={related} /></section>}
        {alsoViewed.length > 0 && <section><SectionHead title="함께 본 상품" desc={`${CATEGORY_NAME[product.categoryId]} 카테고리에서 반응이 좋은 상품`} more={`/shop?category=${product.categoryId}`} /><ProductGrid products={alsoViewed} /></section>}
      </Container>

      {/* Mobile sticky CTA — sits above the 64px bottom nav */}
      <div className="md:hidden fixed inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-neutral-border px-4 py-2.5 bottom-[calc(64px+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={wish} aria-pressed={wished} aria-label={wished ? "찜 해제" : "찜하기"} className="w-[52px] px-0 shrink-0" icon={<Heart size={20} fill={wished ? "currentColor" : "none"} className={wished ? "text-brand-accent" : undefined} />} />
          {soldoutSelected ? <RestockCta /> : (
            <>
              <Button variant="outline" size="lg" className="flex-1" onClick={addCart} icon={<ShoppingBag size={18} />}>장바구니</Button>
              <Button variant="brand" size="lg" className="flex-1" onClick={buyNow}>바로 주문</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <Container className="pt-4 md:pt-8">
      <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 md:gap-10">
        <div className="skeleton aspect-[3/4] w-full rounded-cardlg" />
        <div className="space-y-4"><div className="skeleton h-4 w-24" /><div className="skeleton h-8 w-3/4" /><div className="skeleton h-5 w-1/2" /><div className="skeleton h-8 w-40" /><div className="skeleton h-40 w-full rounded-cardlg" /><div className="skeleton h-14 w-full rounded-xl" /><div className="skeleton h-64 w-full rounded-cardlg" /></div>
      </div>
    </Container>
  );
}
