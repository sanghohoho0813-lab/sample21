import type { Metadata } from "next";
import { NEXT_MENUS } from "@/lib/nextMenus";
export { Passthrough as default } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const menu = NEXT_MENUS.find((m) => m.slug === slug);
  return { title: menu ? `${menu.label} (예정)` : "향후 확장" };
}
