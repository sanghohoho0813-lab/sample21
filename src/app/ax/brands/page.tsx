import { axMeta } from "@/lib/meta";
import { Suspense } from "react";
import { BrandsPage } from "@/components/ax/ops/BrandsPage";

export const metadata = axMeta("brands");

export default function Page() {
  return <Suspense fallback={null}><BrandsPage /></Suspense>;
}
