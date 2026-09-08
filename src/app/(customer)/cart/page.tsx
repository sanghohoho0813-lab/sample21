"use client";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Minus, Plus, Trash2, Truck, Ticket, Heart, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { BRAND_BY_ID, PRODUCT_BY_ID, VARIANT_BY_ID } from "@/lib/demo/seed";
import { useApp, campaignStatus } from "@/lib/store";
import { effPrice } from "@/lib/kpi";
import { krw } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle } from "@/components/customer/Section";
import { ProductImage } from "@/components/ui/ProductImage";
import { Button } from "@/components/ui/Button";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Form";
import { EmptyState, SkeletonCard } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { OptionSheet } from "@/components/customer/conversion/OptionSheet";
import { PriceSummary } from "@/components/customer/conversion/OrderBits";
import { AERNO_COUPON, COUPONS, FREE_SHIP_MIN, couponByCode, couponDiscount, etaLabel, parseVariant, shippingFeeFor, stockState, useDocumentTitle } from "@/components/customer/conversion/shared";

function CartContent() {
  const store = useApp();
  const [coupon, setCoupon] = useState("");
  const [sheet, setSheet] = useState<{ product: Product; colorIdx: number } | null>(null);
  const rows = store.cart.map((c) => { const parsed = parseVariant(c.variantId); if (!parsed) return null; const price = effPrice(parsed.product, store); const st = stockState(parsed.variant, store); return { c, ...parsed, price, st }; }).filter((r): r is NonNullable<typeof r> => !!r);
  const subtotal = rows.reduce((s, r) => s + r.price * r.c.qty, 0);
  const itemDiscount = rows.reduce((s, r) => s + (r.product.price - r.price) * r.c.qty, 0);
  const aernoRunning = campaignStatus("cp-06", store.campaignStatusOverride) === "running";
  const coupons = aernoRunning ? [...COUPONS, AERNO_COUPON] : COUPONS;
  const cp = couponByCode(coupon);
  const cDisc = couponDiscount(subtotal, cp.rate);
  const ship = shippingFeeFor(subtotal);
  const total = subtotal - cDisc + ship;
  const blocked = rows.filter((r) => !r.st.purchasable);
  const short = rows.filter((r) => r.st.purchasable && r.st.stock < r.c.qty);
  const canCheckout = rows.length > 0 && blocked.length === 0;
  const wishCandidates = store.wishlist.map((w) => PRODUCT_BY_ID[w.productId]).filter((p): p is Product => !!p && !store.cart.some((c) => c.productId === p.id)).slice(0, 4);
  const checkoutHref = `/checkout${cp.code ? `?coupon=${cp.code}` : ""}`;

  if (rows.length === 0) {
    return (
      <>
        <EmptyState icon={<ShoppingBag size={22} />} title="장바구니가 비어 있습니다" desc="상품을 담으면 예상 배송일과 결제 금액을 미리 보여드립니다." action={<div className="flex gap-2"><Button variant="brand" href="/ranking">상품 둘러보기</Button><Button variant="outline" href="/wishlist">찜한 상품</Button></div>} />
        {wishCandidates.length > 0 && <WishQuick products={wishCandidates} onPick={(p) => setSheet({ product: p, colorIdx: 0 })} />}
        <OptionSheet product={sheet?.product ?? null} open={!!sheet} onClose={() => setSheet(null)} initialColorIdx={sheet?.colorIdx ?? 0} />
      </>
    );
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
      <div className="space-y-4 min-w-0">
        <ul className="rounded-cardlg border border-neutral-border bg-white divide-y divide-neutral-border">
          {rows.map(({ c, product, variant, colorIdx, price, st }) => (
            <li key={c.variantId} className="p-4 md:p-5">
              <div className="flex gap-4">
                <Link href={`/products/${product.id}`} className="shrink-0 w-20 md:w-24"><ProductImage colors={product.colors} variant={colorIdx} label={product.name} ratio="aspect-[3/4]" /></Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-[0.78rem] font-bold text-neutral-text2">{BRAND_BY_ID[product.brandId].name}</p><Link href={`/products/${product.id}`} className="font-semibold leading-snug hover:underline underline-offset-2">{product.name}</Link><p className="text-[0.85rem] text-neutral-text2 mt-0.5">{variant.color} · {variant.size}</p></div>
                    <button type="button" onClick={() => { store.removeFromCart(c.variantId); toast("장바구니에서 삭제했습니다", undefined, "info"); }} aria-label="삭제" className="h-10 w-10 -mr-2 -mt-1 shrink-0 inline-flex items-center justify-center rounded-full text-neutral-text2 hover:bg-brand-ivory hover:text-neutral-text"><Trash2 size={18} /></button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-xl border border-neutral-border" role="group" aria-label="수량">
                      <button type="button" onClick={() => store.updateCartQty(c.variantId, c.qty - 1)} disabled={c.qty <= 1} aria-label="수량 줄이기" className="h-11 w-11 inline-flex items-center justify-center rounded-l-xl hover:bg-brand-ivory disabled:opacity-40 active:bg-brand-ivory"><Minus size={16} /></button>
                      <span className="w-10 text-center font-bold tabular" aria-live="polite">{c.qty}</span>
                      <button type="button" onClick={() => { if (c.qty >= 9) { toast("최대 9개까지 담을 수 있습니다", undefined, "warning"); return; } if (c.qty + 1 > st.stock) { toast(`재고가 ${st.stock}개 남았습니다`, undefined, "warning"); return; } store.updateCartQty(c.variantId, c.qty + 1); }} aria-label="수량 늘리기" className="h-11 w-11 inline-flex items-center justify-center rounded-r-xl hover:bg-brand-ivory active:bg-brand-ivory"><Plus size={16} /></button>
                    </div>
                    <p className="font-bold tabular text-[1.05rem]">{krw(price * c.qty)}{price < product.price && <span className="ml-2 text-[0.8rem] font-normal text-neutral-text2 line-through">{krw(product.price * c.qty)}</span>}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.82rem]">
                    <span className="inline-flex items-center gap-1 text-neutral-text2"><Truck size={14} />{etaLabel(subtotal >= FREE_SHIP_MIN)}</span>
                    {st.key !== "normal" && <Badge tone={st.tone} size="sm">{st.label}</Badge>}
                    {st.purchasable && st.stock < c.qty && <span className="text-semantic-error font-semibold">재고 {st.stock}개 · 수량을 줄여주세요</span>}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {blocked.length > 0 && <p className="text-[0.88rem] text-semantic-error font-semibold">품절된 옵션이 있어 주문할 수 없습니다. 삭제하거나 상품 상세에서 재입고 알림을 신청해 주세요.</p>}
        {short.length > 0 && <p className="text-[0.88rem] text-semantic-warning font-semibold">일부 상품의 재고가 수량보다 적습니다. 주문 시 재고만큼만 반영됩니다.</p>}

        <div className="rounded-cardlg border border-neutral-border bg-white p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3"><Ticket size={18} /><p className="font-bold">쿠폰</p><DemoBadge /></div>
          <Select name="coupon" aria-label="쿠폰 선택" value={coupon} onChange={(e) => { setCoupon(e.target.value); const sel = couponByCode(e.target.value); if (sel.code) toast(`${sel.code} 쿠폰을 적용했습니다`, `${sel.rate}% 할인 · ${sel.desc}`); }}>
            {coupons.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </Select>
          <p className="text-[0.8rem] text-neutral-text2 mt-2">시연용 쿠폰입니다. 선택한 쿠폰은 주문서로 그대로 전달됩니다.{aernoRunning && <span className="ml-1 font-semibold text-brand-accent">AERNO 재구매 캠페인 진행중 · AERNO7 사용 가능</span>}</p>
        </div>

        {wishCandidates.length > 0 && <WishQuick products={wishCandidates} onPick={(p) => setSheet({ product: p, colorIdx: 0 })} />}
      </div>

      <aside className="lg:sticky lg:top-[96px] rounded-cardlg border border-neutral-border bg-white p-5 md:p-6 shadow-card min-w-0">
        <p className="font-bold text-[1.05rem] mb-4">결제 예정 금액</p>
        <PriceSummary subtotal={subtotal} itemDiscount={itemDiscount} coupon={cDisc} shipping={ship} total={total} couponLabel={cp.code || undefined} />
        <p className="mt-3 text-[0.8rem] text-neutral-text2">{ship > 0 ? `${krw(FREE_SHIP_MIN - subtotal)} 더 담으면 무료배송` : "무료배송 적용"} · {etaLabel(ship === 0)}</p>
        <Link href={canCheckout ? checkoutHref : "#"} aria-disabled={!canCheckout} onClick={(e) => { if (!canCheckout) { e.preventDefault(); toast("품절 옵션을 정리한 뒤 주문할 수 있습니다", undefined, "warning"); return; } store.track("begin_checkout", { items: rows.length, total, coupon: cp.code }); }}
          className={cn("mt-5 h-[52px] w-full rounded-xl inline-flex items-center justify-center gap-2 font-bold text-[1rem] transition-all duration-fast active:scale-[0.98]", canCheckout ? "bg-brand-black text-white hover:bg-[#2a2a2a] hover:shadow-raised" : "bg-neutral-border text-neutral-text2 cursor-not-allowed")}>
          주문하기<ArrowRight size={18} />
        </Link>
        <p className="mt-3 text-[0.78rem] text-neutral-text2 leading-relaxed">DEMO 주문입니다. 실제 결제는 이루어지지 않으며, 주문은 Business AX 주문·매출·재고에 즉시 반영됩니다.</p>
      </aside>
      <OptionSheet product={sheet?.product ?? null} open={!!sheet} onClose={() => setSheet(null)} initialColorIdx={sheet?.colorIdx ?? 0} />
    </div>
  );
}

function WishQuick({ products, onPick }: { products: Product[]; onPick: (p: Product) => void }) {
  const store = useApp();
  return (
    <div className="mt-6 rounded-cardlg border border-neutral-border bg-white p-4 md:p-5">
      <div className="flex items-center justify-between gap-2 mb-3"><p className="font-bold flex items-center gap-2"><Heart size={16} />찜한 상품 담기</p><Link href="/wishlist" className="text-[0.85rem] font-semibold text-neutral-text2 hover:text-neutral-text">전체 보기</Link></div>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map((p) => (
          <li key={p.id} className="min-w-0">
            <Link href={`/products/${p.id}`} className="block"><ProductImage colors={p.colors} label={p.name} ratio="aspect-[3/4]" className="rounded-xl" /></Link>
            <p className="mt-2 text-[0.85rem] font-semibold leading-snug line-clamp-2 min-h-[2.5em]">{p.name}</p>
            <p className="text-[0.85rem] font-bold tabular">{krw(effPrice(p, store))}</p>
            <Button size="sm" variant="outline" full className="mt-2" onClick={() => onPick(p)}>옵션 선택 후 담기</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CartPage() {
  useDocumentTitle("장바구니");
  return (
    <Container className="py-6 md:py-10">
      <PageTitle title="장바구니" desc="수량과 쿠폰을 확인하고 주문서로 이동하세요." />
      <Hydrated fallback={<div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6"><SkeletonCard lines={5} /><SkeletonCard lines={4} /></div>}><CartContent /></Hydrated>
    </Container>
  );
}
