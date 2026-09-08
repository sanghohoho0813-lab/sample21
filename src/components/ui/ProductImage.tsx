/* Photo assets will be applied later (Google Drive 「샘플 21. 의류」).
   Until then, every image slot renders a designed gradient placeholder with
   the product's color DNA — never an empty box. Drop files into /public/images
   and register them in src/lib/assets.ts to switch to real photos. */
import { cn } from "@/lib/cn";
import { colorHex } from "@/lib/demo/seed";
import { assetUrl } from "@/lib/assets";

export function ProductImage({ colors, label, className, ratio = "aspect-[3/4]", asset, variant = 0, children }: {
  colors: string[]; label?: string; className?: string; ratio?: string; asset?: string; variant?: number; children?: React.ReactNode;
}) {
  const url = asset ? assetUrl(asset) : null;
  const [a, b] = colorHex(colors[variant % colors.length] ?? colors[0]);
  return (
    <div className={cn("ph-img rounded-2xl overflow-hidden", ratio, className)} style={{ ["--ph-a" as string]: a, ["--ph-b" as string]: b }} role="img" aria-label={label ?? "상품 이미지"}>
      {url ? <img src={url} alt={label ?? ""} className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : (
        <div className="absolute inset-0 flex items-end p-3">
          <span className="text-[0.7rem] font-semibold tracking-wider uppercase text-white/80 mix-blend-luminosity">{label ? label.slice(0, 22) : "MORFIT"}</span>
        </div>
      )}
      {children}
    </div>
  );
}

export function GradientImage({ gradient, className, ratio = "aspect-[16/9]", label, asset, overlay, children }: {
  gradient: [string, string]; className?: string; ratio?: string; label?: string; asset?: string; overlay?: boolean; children?: React.ReactNode;
}) {
  const url = asset ? assetUrl(asset) : null;
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", ratio, className)} style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }} role="img" aria-label={label ?? ""}>
      {url && <img src={url} alt={label ?? ""} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />}
      {children}
    </div>
  );
}
