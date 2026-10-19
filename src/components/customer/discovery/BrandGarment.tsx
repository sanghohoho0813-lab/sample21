/* 브랜드 이미지 자리 — 그 브랜드 대표 상품의 실루엣(사진 전까지, D-53). 사진이 등록되면 그리지 않는다. */
import { PRODUCTS, colorHex } from "@/lib/demo/seed";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/cn";
import { Garment, garmentKind } from "@/components/ui/Garment";

export function BrandGarment({ brandId, asset, className }: { brandId: string; asset?: string; className?: string }) {
  const p = PRODUCTS.find((x) => x.brandId === brandId);
  if (!p || (asset && assetUrl(asset))) return null;
  const [a, b] = colorHex(p.colors[0]);
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-[8%] mx-auto h-[58%] w-[66%] transition-transform duration-500 group-hover:scale-[1.04]",
        className,
      )}
      aria-hidden
    >
      <Garment kind={garmentKind(p.name, p.categoryId)} color={a} shade={b} id={`brand-${brandId}`} />
    </div>
  );
}
