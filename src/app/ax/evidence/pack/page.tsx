import { axMeta } from "@/lib/meta";
import { EvidencePackPage } from "@/components/ax/ops/EvidencePackPage";

export const metadata = axMeta("evidence", "증빙 리포트");

export default function Page() {
  return <EvidencePackPage />;
}
