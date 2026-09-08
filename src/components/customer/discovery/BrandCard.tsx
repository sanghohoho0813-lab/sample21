"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Brand } from "@/lib/types";
import { PRODUCTS } from "@/lib/demo/seed";
import { num } from "@/lib/format";
import { cn } from "@/lib/cn";
import { GradientImage } from "@/components/ui/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";

/** Registered photo slots per brand (assets applied later; placeholder until then). */
export const BRAND_ASSET: Record<string, string> = { aerno: "brand_aerno.jpg", "nove-studio": "brand_nove.jpg", "still-form": "brand_stillform.jpg" };

/** 성격(무드) 분류 — 고객용 라벨. 사입/입점 구분은 고객에게 노출하지 않는다. */
export type BrandMood = "minimal" | "street" | "denim" | "women" | "shoes";
export const BRAND_MOOD: Record<string, BrandMood[]> = {
  "b-aerno": ["minimal"], "b-nove": ["minimal"], "b-still": ["minimal"], "b-unit": ["minimal"],
  "b-current": ["street"], "b-field": ["street"],
  "b-plane": ["denim"],
  "b-mellow": ["women"], "b-halfmoon": ["women"],
  "b-object": ["shoes"],
};
export const MOOD_OPTIONS: { value: BrandMood | "all"; label: string }[] = [
  { value: "all", label: "전체" }, { value: "minimal", label: "미니멀" }, { value: "street", label: "스트리트" }, { value: "denim", label: "데님" }, { value: "women", label: "여성" }, { value: "shoes", label: "신발·잡화" },
];
export const MOOD_LABEL: Record<BrandMood, string> = { minimal: "미니멀", street: "스트리트", denim: "데님", women: "여성", shoes: "신발·잡화" };

export const brandProductCount = (brandId: string) => PRODUCTS.filter((p) => p.brandId === brandId).length;
export const isNewBrand = (b: Brand) => b.contractStatus === "new" || Date.now() - new Date(b.joinedAt).getTime() < 60 * 86400000;

export function FollowButton({ brand, following, onToggle, size = "md", className }: { brand: Brand; following: boolean; onToggle: (id: string) => boolean; size?: "sm" | "md"; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={following}
      aria-label={following ? `${brand.name} 팔로우 해제` : `${brand.name} 팔로우`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); const on = onToggle(brand.id); toast(on ? `${brand.name}을(를) 팔로우했습니다` : "팔로우를 해제했습니다", on ? "신상품과 세일 소식을 먼저 알려드릴게요" : undefined, on ? "success" : "info"); }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border font-semibold transition-all duration-fast active:scale-[0.97] whitespace-nowrap",
        size === "sm" ? "h-10 md:h-9 px-3 text-[0.82rem]" : "h-11 px-4 text-[0.9rem]",
        following ? "bg-brand-black text-white border-brand-black hover:bg-[#2a2a2a]" : "bg-white text-neutral-text border-neutral-border hover:border-neutral-text2 hover:bg-neutral-canvas",
        className,
      )}
    >
      <Heart size={size === "sm" ? 14 : 16} fill={following ? "currentColor" : "none"} />{following ? "팔로잉" : "팔로우"}
    </button>
  );
}

export function BrandCard({ brand, following, onToggle, className }: { brand: Brand; following: boolean; onToggle: (id: string) => boolean; className?: string }) {
  const count = brandProductCount(brand.id);
  const followers = brand.followers + (following ? 1 : 0);
  const moods = BRAND_MOOD[brand.id] ?? [];
  return (
    <article className={cn("group rounded-cardlg border border-neutral-border bg-white overflow-hidden hover-lift", className)}>
      <Link href={`/brands/${brand.slug}`} className="block" aria-label={`${brand.name} 브랜드 페이지`}>
        <GradientImage gradient={brand.gradient} ratio="aspect-[4/5] md:aspect-[4/3]" asset={BRAND_ASSET[brand.slug]} overlay label={`${brand.name} 브랜드 이미지`} className="rounded-none">
          <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[0.68rem] font-bold tracking-[0.16em] text-white/80">{moods.map((m) => MOOD_LABEL[m]).join(" · ") || "BRAND"}</span>
              {isNewBrand(brand) && <Badge tone="dark" size="sm">NEW 입점</Badge>}
            </div>
            <p className="text-white font-black text-[1.25rem] md:text-[1.45rem] tracking-tight leading-none drop-shadow-sm group-hover:underline underline-offset-4">{brand.name}</p>
          </div>
        </GradientImage>
      </Link>
      <div className="p-3 md:p-4">
        <p className="text-[0.88rem] md:text-[0.92rem] font-semibold leading-snug line-clamp-2 min-h-[2.6em]">{brand.tagline}</p>
        <p className="mt-1.5 text-[0.78rem] text-neutral-text2 tabular">팔로워 {num(followers)} · 상품 {count}개</p>
        <div className="mt-3 flex items-center gap-2">
          <FollowButton brand={brand} following={following} onToggle={onToggle} size="sm" className="flex-1" />
          <Link href={`/brands/${brand.slug}`} className="h-10 md:h-9 px-3 rounded-full bg-neutral-canvas text-[0.82rem] font-semibold inline-flex items-center justify-center hover:bg-neutral-border/60 transition-colors">둘러보기</Link>
        </div>
      </div>
    </article>
  );
}
