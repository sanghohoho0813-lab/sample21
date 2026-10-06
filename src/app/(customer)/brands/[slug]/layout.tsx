import type { Metadata } from "next";
import { BRANDS } from "@/lib/demo/seed";
export { Passthrough as default } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  return brand ? { title: brand.name, description: brand.tagline } : { title: "브랜드를 찾을 수 없음" };
}
