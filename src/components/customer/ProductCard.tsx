"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { BRAND_BY_ID, colorHex } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { effPrice, productAgg } from "@/lib/kpi";
import { ProductImage } from "@/components/ui/ProductImage";
import { Price } from "@/components/ui/Misc";
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
        <div className="relative overflow-hidden rounded-lg">
          <ProductImage
            colors={product.colors}
            label={product.name}
            caption={false}
            className="!rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          {rank !== undefined && (
            <span
              className={cn(
                "tabular absolute left-0 top-0 flex h-8 min-w-[32px] items-center justify-center px-2 text-[0.88rem] font-black",
                rank <= 3 ? "bg-brand-black text-white" : "bg-white/90 text-brand-black",
              )}
            >
              {rank}
            </span>
          )}
          {badge && (
            <span
              className={cn(
                "absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[0.78rem] font-bold leading-tight backdrop-blur-sm",
                BADGE_TONE[badge.tone],
              )}
            >
              {badge.t}
            </span>
          )}
        </div>
        <div className="mt-2.5 space-y-1 pr-1">
          <p className="truncate text-[0.78rem] font-bold uppercase tracking-[0.04em] text-neutral-text">
            {brand.name}
          </p>
          <p className="line-clamp-2 min-h-[2.5em] text-[0.9rem] leading-snug text-neutral-text2 underline-offset-2 group-hover:text-neutral-text">
            {product.name}
          </p>
          <Price price={price} original={product.price} size="sm" strike={false} className="pt-0.5" />
          {reason ? (
            <p className="text-[0.78rem] font-semibold text-brand-accent">{reason}</p>
          ) : (
            !compact && (
              <div className="flex items-center gap-2 text-[0.78rem] text-neutral-text2">
                <span className="tabular">
                  <span className="text-neutral-text">★ {product.rating}</span> (
                  {product.reviewCount.toLocaleString("ko-KR")})
                </span>
                {product.colors.length > 1 && (
                  <span className="flex items-center gap-1" aria-label={`색상 ${product.colors.length}가지`}>
                    {product.colors.slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                        style={{ background: colorHex(c)[0] }}
                        aria-hidden
                      />
                    ))}
                  </span>
                )}
              </div>
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
          "absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-fast hover:scale-110 active:scale-90",
          wished ? "text-[#e0344f]" : "text-neutral-text/70 hover:text-neutral-text",
        )}
      >
        <Heart size={20} strokeWidth={1.8} fill={wished ? "currentColor" : "rgba(255,255,255,0.55)"} />
      </button>
    </div>
  );
}

const BADGE_TONE = {
  accent: "bg-brand-accent/90 text-white",
  warning: "bg-[#fff1e6]/95 text-[#b45309]",
  neutral: "bg-white/90 text-neutral-text2",
  dark: "bg-brand-black/85 text-white",
} as const;

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
    <div className={cn("stagger stagger-sm grid gap-x-2.5 gap-y-7 md:gap-x-5 md:gap-y-10", cols, className)}>
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
