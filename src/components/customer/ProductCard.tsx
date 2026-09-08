"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { BRAND_BY_ID } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { effPrice, productAgg } from "@/lib/kpi";
import { ProductImage } from "@/components/ui/ProductImage";
import { Price } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

export function ProductCard({ product, rank, reason, className, compact }: { product: Product; rank?: number; reason?: string; className?: string; compact?: boolean }) {
  const store = useApp();
  const wished = store.wishlist.some((w) => w.productId === product.id);
  const price = effPrice(product, store);
  const agg = productAgg(product, store);
  const brand = BRAND_BY_ID[product.brandId];
  const isNew = Date.now() - new Date(product.createdAt).getTime() < 30 * 86400000;
  const badge = agg.worst === "rising" || product.tags.includes("급상승") ? { t: "급상승", tone: "accent" as const } : agg.worst === "low" ? { t: "품절 임박", tone: "warning" as const } : agg.worst === "soldout" ? { t: "일부 품절", tone: "neutral" as const } : isNew ? { t: "NEW", tone: "dark" as const } : product.tags.includes("베스트") ? { t: "BEST", tone: "dark" as const } : null;
  return (
    <div className={cn("group relative", className)}>
      <Link href={`/products/${product.id}`} className="block" onClick={() => store.track("view_product", { productId: product.id })}>
        <div className="relative overflow-hidden rounded-2xl">
          <ProductImage colors={product.colors} label={product.name} className="transition-transform duration-normal group-hover:scale-[1.03]" />
          {rank !== undefined && <span className="absolute left-0 top-0 h-9 min-w-[36px] px-2 rounded-br-2xl bg-brand-black text-white font-black text-[0.95rem] flex items-center justify-center tabular">{rank}</span>}
          {badge && <span className="absolute left-2 bottom-2"><Badge tone={badge.tone} size="sm">{badge.t}</Badge></span>}
        </div>
        <div className={cn("mt-2.5", compact ? "space-y-0" : "space-y-0.5")}>
          <p className="text-[0.78rem] font-bold text-neutral-text2 tracking-wide">{brand.name}</p>
          <p className="text-[0.95rem] font-semibold leading-snug line-clamp-2 min-h-[2.6em] group-hover:underline underline-offset-2">{product.name}</p>
          <Price price={price} original={product.price} size="sm" />
          {reason ? <p className="text-[0.78rem] text-brand-accent font-semibold">{reason}</p> : !compact && <p className="text-[0.78rem] text-neutral-text2 tabular">★ {product.rating} · 리뷰 {product.reviewCount}</p>}
        </div>
      </Link>
      <button type="button" aria-label={wished ? "찜 해제" : "찜하기"} aria-pressed={wished} onClick={(e) => { e.preventDefault(); const on = store.toggleWishlist(product.id); toast(on ? "찜 목록에 저장했습니다" : "찜을 해제했습니다", on ? "재고와 가격 변화를 알려드릴게요" : undefined, on ? "success" : "info"); }}
        className={cn("absolute right-2 top-2 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-fast shadow-card", wished ? "bg-brand-black text-white" : "bg-white/90 text-neutral-text hover:bg-white active:scale-95")}>
        <Heart size={18} fill={wished ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

export function ProductGrid({ products, ranked, reasons, cols = "grid-cols-2 md:grid-cols-4", className }: { products: Product[]; ranked?: boolean; reasons?: Record<string, string>; cols?: string; className?: string }) {
  return (
    <div className={cn("grid gap-x-4 gap-y-7", cols, className)}>
      {products.map((p, i) => <ProductCard key={p.id} product={p} rank={ranked ? i + 1 : undefined} reason={reasons?.[p.id]} />)}
    </div>
  );
}

export function HScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 snap-x snap-mandatory", className)}>{children}</div>;
}
