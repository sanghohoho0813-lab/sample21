"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, ShoppingBag, Bell, Trash2, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { BRAND_BY_ID, PRODUCTS, PRODUCT_BY_ID } from "@/lib/demo/seed";
import { useApp, type WishItem } from "@/lib/store";
import { effPrice } from "@/lib/kpi";
import { relTime } from "@/lib/dates";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle, SectionHead } from "@/components/customer/Section";
import { ProductGrid } from "@/components/customer/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Misc";
import { EmptyState, SkeletonCard } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { OptionSheet } from "@/components/customer/conversion/OptionSheet";
import { parseVariant, productStockState, stockState, useDocumentTitle } from "@/components/customer/conversion/shared";

function priceNote(p: Product, current: number, overridden: boolean) {
  if (current < p.price) { const rate = Math.round(((p.price - current) / p.price) * 100); return { text: overridden ? `찜한 뒤 가격 인하 · ${rate}% 할인 중` : `${rate}% 할인 중`, tone: "error" as const }; }
  return { text: "가격 변동 없음", tone: "neutral" as const };
}

function WishRow({ item, onPick }: { item: WishItem; onPick: (p: Product, colorIdx: number, size: string | null) => void }) {
  const store = useApp();
  const p = PRODUCT_BY_ID[item.productId];
  if (!p) return null;
  const parsed = item.variantId ? parseVariant(item.variantId) : null;
  const variant = parsed?.variant ?? null;
  const price = effPrice(p, store);
  const note = priceNote(p, price, !!store.salePriceOverride[p.id]);
  const pState = productStockState(p, store);
  const vState = variant ? stockState(variant, store) : null;
  const subscribed = variant ? store.restockSubs.some((s) => s.variantId === variant.id && s.status === "waiting") : false;
  const remove = () => { store.removeWishlist(p.id); toast("찜 목록에서 삭제했습니다", undefined, "info"); };
  const toCart = () => {
    if (variant && vState?.purchasable) { store.addToCart(variant.id); toast("장바구니에 담았습니다", `${p.name} · ${variant.color} · ${variant.size}`); return; }
    onPick(p, parsed?.colorIdx ?? 0, variant?.size ?? null);
  };
  const restock = () => { if (!variant) return; store.subscribeRestock(variant.id); toast("재입고 알림을 신청했습니다", "Business AX 수요신호에 반영"); };
  return (
    <li className="rounded-cardlg border border-neutral-border bg-white p-4 md:p-5 transition-shadow hover:shadow-raised">
      <div className="flex gap-4">
        <Link href={`/products/${p.id}`} className="shrink-0 w-24 md:w-28"><ProductImage colors={p.colors} variant={parsed?.colorIdx ?? 0} label={p.name} ratio="aspect-[3/4]" /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="text-[0.78rem] font-bold text-neutral-text2">{BRAND_BY_ID[p.brandId].name}</p><Link href={`/products/${p.id}`} className="font-semibold leading-snug hover:underline underline-offset-2">{p.name}</Link></div>
            <button type="button" onClick={remove} aria-label="찜 삭제" className="h-10 w-10 -mr-2 -mt-1 shrink-0 inline-flex items-center justify-center rounded-full text-neutral-text2 hover:bg-brand-ivory hover:text-neutral-text"><Trash2 size={18} /></button>
          </div>
          <p className="text-[0.82rem] text-neutral-text2 mt-0.5">{variant ? `선택 옵션 · ${variant.color} · ${variant.size}` : "옵션 미선택"} · {relTime(item.addedAt)} 찜</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Price price={price} original={p.price} size="sm" />
            <Badge tone={note.tone === "error" ? "error" : "neutral"} size="sm">{note.text}</Badge>
            <Badge tone={(vState ?? pState).tone} size="sm">{(vState ?? pState).label}</Badge>
          </div>
          <div className="mt-3 hidden sm:flex gap-2">
            {variant && vState && !vState.purchasable ? (
              <Button size="sm" variant="brand" onClick={restock} disabled={subscribed} icon={<Bell size={14} />}>{subscribed ? "재입고 알림 신청 완료" : "재입고 알림"}</Button>
            ) : (
              <Button size="sm" variant="brand" onClick={toCart} icon={<ShoppingBag size={14} />}>{variant ? "장바구니 이동" : "옵션 선택 후 담기"}</Button>
            )}
            <Button size="sm" variant="outline" href={`/products/${p.id}`}>상세 보기</Button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex sm:hidden gap-2">
        {variant && vState && !vState.purchasable ? (
          <Button size="md" variant="brand" className="flex-1" onClick={restock} disabled={subscribed} icon={<Bell size={14} />}>{subscribed ? "재입고 알림 신청 완료" : "재입고 알림"}</Button>
        ) : (
          <Button size="md" variant="brand" className="flex-1" onClick={toCart} icon={<ShoppingBag size={14} />}>{variant ? "장바구니 이동" : "옵션 선택 후 담기"}</Button>
        )}
        <Button size="md" variant="outline" href={`/products/${p.id}`}>상세</Button>
      </div>
    </li>
  );
}

function WishlistContent() {
  const store = useApp();
  const [sheet, setSheet] = useState<{ product: Product; colorIdx: number; size: string | null } | null>(null);
  const items = store.wishlist.filter((w) => PRODUCT_BY_ID[w.productId]);
  const similar = useMemo(() => {
    const cats = new Set(items.map((w) => PRODUCT_BY_ID[w.productId]?.categoryId));
    const brands = new Set(items.map((w) => PRODUCT_BY_ID[w.productId]?.brandId));
    const wished = new Set(items.map((w) => w.productId));
    return PRODUCTS.filter((p) => !wished.has(p.id)).map((p) => ({ p, s: (cats.has(p.categoryId) ? 2 : 0) + (brands.has(p.brandId) ? 1.5 : 0) + (p.tags.includes("베스트") ? 1 : 0) + (p.salePrice ? 0.5 : 0) })).sort((a, b) => b.s - a.s).slice(0, 4).map((x) => x.p);
  }, [items]);
  return (
    <>
      {items.length === 0 ? (
        <EmptyState icon={<Heart size={22} />} title="아직 찜한 상품이 없습니다" desc="마음에 드는 상품의 하트를 누르면 재고와 가격 변화를 알려드립니다." action={<div className="flex gap-2"><Button variant="brand" href="/ranking">상품 둘러보기</Button><Button variant="outline" href="/new">신상품</Button></div>} />
      ) : (
        <ul className="space-y-3">{items.map((w) => <WishRow key={w.productId} item={w} onPick={(product, colorIdx, size) => setSheet({ product, colorIdx, size })} />)}</ul>
      )}
      <div className="mt-6 rounded-cardlg bg-brand-ivory px-5 py-4 text-[0.88rem] flex flex-wrap items-center justify-between gap-2"><span>찜 데이터는 Business AX의 <span className="font-semibold">Demand Radar</span> 관심 신호로 집계됩니다.</span><Link href="/my/restock" className="inline-flex items-center gap-0.5 font-semibold hover:underline underline-offset-2">내 재입고 알림<ChevronRight size={14} /></Link></div>
      {similar.length > 0 && <section className="mt-12"><SectionHead title="비슷한 상품 추천" desc={items.length ? "찜한 상품의 카테고리·브랜드를 기준으로 골랐습니다." : "지금 반응이 좋은 상품"} more="/ranking" /><ProductGrid products={similar} /></section>}
      <OptionSheet product={sheet?.product ?? null} open={!!sheet} onClose={() => setSheet(null)} initialColorIdx={sheet?.colorIdx ?? 0} initialSize={sheet?.size ?? null} />
    </>
  );
}

export default function WishlistPage() {
  useDocumentTitle("찜한 상품");
  return (
    <Container className="py-6 md:py-10 max-w-[960px]">
      <PageTitle title="찜한 상품" desc="선택한 옵션의 재고·가격 변화를 함께 보여드립니다." />
      <Hydrated fallback={<div className="space-y-3"><SkeletonCard lines={3} /><SkeletonCard lines={3} /></div>}><WishlistContent /></Hydrated>
    </Container>
  );
}
