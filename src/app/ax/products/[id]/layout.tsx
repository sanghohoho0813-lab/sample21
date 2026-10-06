import type { Metadata } from "next";
import { PRODUCT_BY_ID } from "@/lib/demo/seed";
import { axMeta } from "@/lib/meta";
export { Passthrough as default } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const product = PRODUCT_BY_ID[(await params).id];
  return axMeta("products", product ? `${product.name} · 상품·옵션` : "상품을 찾을 수 없음");
}
