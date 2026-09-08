import type { Metadata } from "next";
import { Suspense } from "react";
import { EvidencePage } from "@/components/ax/ops/EvidencePage";

export const metadata: Metadata = { title: "AX Evidence · Business AX" };

export default function Page() {
  return <Suspense fallback={null}><EvidencePage /></Suspense>;
}
