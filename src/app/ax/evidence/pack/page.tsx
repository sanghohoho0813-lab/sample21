import type { Metadata } from "next";
import { EvidencePackPage } from "@/components/ax/ops/EvidencePackPage";

export const metadata: Metadata = { title: "Evidence Pack · Business AX" };

export default function Page() {
  return <EvidencePackPage />;
}
