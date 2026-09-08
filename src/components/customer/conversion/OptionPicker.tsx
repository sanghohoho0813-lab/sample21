"use client";
import { Check } from "lucide-react";
import type { Product } from "@/lib/types";
import { colorHex, variantsOf } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { stockState } from "./shared";

/** 색상 스와치 + 사이즈 버튼. 사이즈 버튼은 옵션별 재고 상태를 함께 보여준다. */
export function OptionPicker({ product, colorIdx, size, onColor, onSize, compact, sizeAction }: {
  product: Product; colorIdx: number | null; size: string | null;
  onColor: (idx: number) => void; onSize: (size: string) => void; compact?: boolean; sizeAction?: React.ReactNode;
}) {
  const store = useApp();
  const variants = variantsOf(product.id);
  const single = product.sizes.length === 1 && product.sizes[0] === "FREE";
  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[0.9rem] font-bold">색상 <span className="font-normal text-neutral-text2">{colorIdx !== null ? product.colors[colorIdx] : "선택해주세요"}</span></p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {product.colors.map((c, i) => {
            const [a, b] = colorHex(c);
            const active = colorIdx === i;
            const anyStock = variants.filter((v) => v.color === c).some((v) => stockState(v, store).purchasable);
            return (
              <button key={c} type="button" onClick={() => onColor(i)} aria-label={`색상 ${c}`} aria-pressed={active} title={c}
                className={cn("group inline-flex items-center gap-2 h-11 pl-1.5 pr-3 rounded-full border transition-all duration-fast active:scale-[0.98]", active ? "border-brand-black bg-brand-black text-white" : "border-neutral-border bg-white hover:border-neutral-text2")}>
                <span className="relative h-8 w-8 rounded-full border border-black/10 shrink-0" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
                  {active && <span className="absolute inset-0 flex items-center justify-center text-white"><Check size={14} strokeWidth={3} /></span>}
                </span>
                <span className="text-[0.88rem] font-semibold">{c}</span>
                {!anyStock && <span className={cn("text-[0.72rem]", active ? "text-white/70" : "text-neutral-text2")}>품절</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[0.9rem] font-bold">사이즈 <span className="font-normal text-neutral-text2">{size ?? (single ? "단일 사이즈" : "선택해주세요")}</span></p>
          {sizeAction}
        </div>
        {colorIdx === null ? <p className="text-[0.88rem] text-neutral-text2">색상을 먼저 선택하면 사이즈별 재고를 보여드립니다.</p> : (
          <div className={cn("grid gap-2", product.categoryId === "shoes" ? "grid-cols-3 sm:grid-cols-5" : single ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4")}>
            {product.sizes.map((s) => {
              const v = variants.find((x) => x.color === product.colors[colorIdx] && x.size === s);
              const st = v ? stockState(v, store) : null;
              const active = size === s;
              return (
                <button key={s} type="button" onClick={() => onSize(s)} aria-pressed={active} aria-label={`사이즈 ${s}${st ? ` · ${st.label}` : ""}`}
                  className={cn("relative min-h-[52px] rounded-xl border px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all duration-fast active:scale-[0.98]",
                    active ? "border-brand-black bg-brand-black text-white" : "border-neutral-border bg-white hover:border-neutral-text2",
                    st && !st.purchasable && !active && "bg-brand-ivory text-neutral-text2")}>
                  <span className={cn("text-[1rem] font-bold leading-none", st && !st.purchasable && !active && "line-through decoration-neutral-text2/60")}>{single ? "FREE" : s}</span>
                  {st && st.key !== "normal" && (
                    <span className={cn("text-[0.7rem] font-semibold leading-tight text-center", active ? "text-white/80" : st.key === "soldout" ? "text-semantic-error" : st.key === "low" ? "text-semantic-warning" : st.key === "restocked" ? "text-semantic-success" : "text-brand-accent")}>{st.short}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {!compact && colorIdx !== null && size && (() => {
          const v = variants.find((x) => x.color === product.colors[colorIdx] && x.size === size);
          const st = v ? stockState(v, store) : null;
          return st ? <div className="mt-2.5 flex items-center gap-2 text-[0.85rem]"><Badge tone={st.tone} size="sm">{st.label}</Badge>{st.key === "soldout" && <span className="text-neutral-text2">재입고 알림을 신청하면 입고 즉시 알려드립니다.</span>}{st.key === "restocked" && <span className="text-neutral-text2">기다리던 옵션이 다시 준비되었습니다.</span>}</div> : null;
        })()}
      </div>
    </div>
  );
}
