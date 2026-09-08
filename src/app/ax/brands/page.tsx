import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandsPage } from "@/components/ax/ops/BrandsPage";

export const metadata: Metadata = { title: "브랜드·파트너 · Business AX" };

export default function Page() {
  return <Suspense fallback={null}><BrandsPage /></Suspense>;
}
