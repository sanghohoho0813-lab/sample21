"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Bell } from "lucide-react";
import type { Product } from "@/lib/types";
import { BRAND_BY_ID } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { effPrice } from "@/lib/kpi";
import { Responsive } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { Price } from "@/components/ui/Misc";
import { toast } from "@/components/ui/Toast";
import { OptionPicker } from "./OptionPicker";
import { findVariant, stockState } from "./shared";

/** 찜·장바구니에서 옵션(색상·사이즈)을 고른 뒤 장바구니에 담는 시트 */
export function OptionSheet({ product, open, onClose, initialColorIdx = 0, initialSize = null, onAdded }: {
  product: Product | null; open: boolean; onClose: () => void; initialColorIdx?: number; initialSize?: string | null; onAdded?: (variantId: string) => void;
}) {
  const store = useApp();
  const router = useRouter();
  const [colorIdx, setColorIdx] = useState<number | null>(initialColorIdx);
  const [size, setSize] = useState<string | null>(initialSize);
  useEffect(() => { if (open) { setColorIdx(initialColorIdx); setSize(initialSize ?? (product?.sizes.length === 1 ? product.sizes[0] : null)); } }, [open, initialColorIdx, initialSize, product]);
  if (!product) return null;
  const variant = findVariant(product.id, colorIdx, size);
  const st = variant ? stockState(variant, store) : null;
  const subscribed = variant ? store.restockSubs.some((s) => s.variantId === variant.id && s.status === "waiting") : false;
  const add = () => {
    if (!variant) { toast("색상과 사이즈를 선택해주세요", undefined, "warning"); return; }
    store.addToCart(variant.id);
    toast("장바구니에 담았습니다", `${product.name} · ${variant.color} · ${variant.size}`);
    onAdded?.(variant.id);
    onClose();
  };
  const restock = () => {
    if (!variant) return;
    store.subscribeRestock(variant.id);
    toast("재입고 알림을 신청했습니다", "Business AX 수요신호에 반영됩니다");
    onClose();
  };
  return (
    <Responsive open={open} onClose={onClose} title="옵션 선택" size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => { onClose(); router.push(`/products/${product.id}`); }}>상세 보기</Button>
          {st && !st.purchasable ? (
            <Button variant="brand" className="flex-[2]" onClick={restock} disabled={subscribed} icon={<Bell size={16} />}>{subscribed ? "재입고 알림 신청 완료" : "재입고 알림 신청"}</Button>
          ) : (
            <Button variant="brand" className="flex-[2]" onClick={add} icon={<ShoppingBag size={16} />}>장바구니 담기</Button>
          )}
        </div>
      }>
      <div className="flex gap-4 mb-5">
        <ProductImage colors={product.colors} variant={colorIdx ?? 0} label={product.name} className="w-20 shrink-0" ratio="aspect-[3/4]" />
        <div className="min-w-0">
          <p className="text-[0.78rem] font-bold text-neutral-text2">{BRAND_BY_ID[product.brandId].name}</p>
          <p className="font-semibold leading-snug">{product.name}</p>
          <Price price={effPrice(product, store)} original={product.price} size="sm" className="mt-1" />
        </div>
      </div>
      <OptionPicker product={product} colorIdx={colorIdx} size={size} onColor={(i) => { setColorIdx(i); }} onSize={setSize} compact />
    </Responsive>
  );
}
