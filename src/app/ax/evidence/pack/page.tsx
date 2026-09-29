import type { Metadata } from "next";
import { EvidencePackPage } from "@/components/ax/ops/EvidencePackPage";

export const metadata: Metadata = { title: "증빙 리포트 · AX 운영화면" };

export default function Page() {
  return <EvidencePackPage />;
}
