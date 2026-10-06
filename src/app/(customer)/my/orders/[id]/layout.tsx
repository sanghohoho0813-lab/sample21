import type { Metadata } from "next";
export { Passthrough as default } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `주문 ${decodeURIComponent((await params).id)}` };
}
