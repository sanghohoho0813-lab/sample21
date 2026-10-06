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

export function ProductCard({
  product,
  rank,
  reason,
  className,
  compact,
}: {
  product: Product;
  rank?: number;
  reason?: string;
  className?: string;
  compact?: boolean;
}) {
  const store = useApp();
  const wished = store.wishlist.some((w) => w.productId === product.id);
  const price = effPrice(product, store);
  const agg = productAgg(product, store);
  const brand = BRAND_BY_ID[product.brandId];
  const isNew = Date.now() - new Date(product.createdAt).getTime() < 30 * 86400000;
  const badge =
    agg.worst === "rising" || product.tags.includes("급상승")
      ? { t: "급상승", tone: "accent" as const }
      : agg.worst === "low"
        ? { t: "품절 임박", tone: "warning" as const }
        : agg.worst === "soldout"
          ? { t: "일부 품절", tone: "neutral" as const }
          : isNew
            ? { t: "신상", tone: "dark" as const }
            : product.tags.includes("베스트")
              ? { t: "베스트", tone: "dark" as const }
              : null;
  return (
    <div className={cn("group relative", className)}>
      <Link
        href={`/products/${product.id}`}
        className="block"
        onClick={() => store.track("view_product", { productId: product.id })}
      >
        <div className="relative overflow-hidden rounded-2xl">
          <ProductImage
            colors={product.colors}
            label={product.name}
            caption={false}
            className="transition-transform duration-normal group-hover:scale-[1.03]"
          />
          {rank !== undefined && (
            <span className="tabular absolute left-0 top-0 flex h-9 min-w-[36px] items-center justify-center rounded-br-2xl bg-brand-black px-2 text-[0.95rem] font-black text-white">
              {rank}
            </span>
          )}
          {badge && (
            <span className="absolute bottom-2 left-2">
              <Badge tone={badge.tone} size="sm">
                {badge.t}
              </Badge>
            </span>
          )}
        </div>
        <div className={cn("mt-2.5", compact ? "space-y-0" : "space-y-0.5")}>
          <p className="text-[0.78rem] font-bold tracking-wide text-neutral-text2">{brand.name}</p>
          <p className="line-clamp-2 min-h-[2.6em] text-[0.95rem] font-semibold leading-snug underline-offset-2 group-hover:underline">
            {product.name}
          </p>
          <Price price={price} original={product.price} size="sm" />
          {reason ? (
            <p className="text-[0.78rem] font-semibold text-brand-accent">{reason}</p>
          ) : (
            !compact && (
              <p className="tabular text-[0.78rem] text-neutral-text2">
                ★ {product.rating} · 리뷰 {product.reviewCount}
              </p>
            )
          )}
        </div>
      </Link>
      <button
        type="button"
        aria-label={wished ? "찜 해제" : "찜하기"}
        aria-pressed={wished}
        onClick={(e) => {
          e.preventDefault();
          const on = store.toggleWishlist(product.id);
          toast(
            on ? "찜 목록에 저장했습니다" : "찜을 해제했습니다",
            on ? "재고와 가격 변화를 알려드릴게요" : undefined,
            on ? "success" : "info",
          );
        }}
        className={cn(
          "absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full shadow-card transition-all duration-fast hover:scale-110 hover:shadow-raised active:scale-95",
          wished ? "bg-brand-black text-white hover:bg-[#2a2a2a]" : "bg-white/90 text-neutral-text hover:bg-white",
        )}
      >
        <Heart size={18} fill={wished ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

export function ProductGrid({
  products,
  ranked,
  reasons,
  cols = "grid-cols-2 md:grid-cols-4",
  className,
}: {
  products: Product[];
  ranked?: boolean;
  reasons?: Record<string, string>;
  cols?: string;
  className?: string;
}) {
  return (
    <div className={cn("stagger stagger-sm grid gap-x-4 gap-y-7", cols, className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} rank={ranked ? i + 1 : undefined} reason={reasons?.[p.id]} />
      ))}
    </div>
  );
}

export function HScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4", className)}>
      {children}
    </div>
  );
}
