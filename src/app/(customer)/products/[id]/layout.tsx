import type { Metadata } from "next";
import { BRAND_BY_ID, PRODUCT_BY_ID } from "@/lib/demo/seed";
export { Passthrough as default } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const product = PRODUCT_BY_ID[(await params).id];
  if (!product) return { title: "상품을 찾을 수 없음" };
  const brand = BRAND_BY_ID[product.brandId]?.name;
  const title = brand ? `${product.name} · ${brand}` : product.name;
  return {
    title,
    description: product.subtitle,
    openGraph: { title, description: product.subtitle, images: ["/opengraph-image"] },
  };
}
