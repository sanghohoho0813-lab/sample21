import type { Metadata } from "next";
import { Suspense } from "react";
import { EvidencePage } from "@/components/ax/ops/EvidencePage";

export const metadata: Metadata = { title: "성과 증빙 · AX 운영화면" };

export default function Page() {
  return <Suspense fallback={null}><EvidencePage /></Suspense>;
}
