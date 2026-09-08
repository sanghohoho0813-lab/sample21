import type { Metadata } from "next";
import { Suspense } from "react";
import { FitReturnsPage } from "@/components/ax/ops/FitReturnsPage";

export const metadata: Metadata = { title: "핏·반품 · Business AX" };

export default function Page() {
  return <Suspense fallback={null}><FitReturnsPage /></Suspense>;
}
