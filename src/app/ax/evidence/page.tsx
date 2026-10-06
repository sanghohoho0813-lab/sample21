import { axMeta } from "@/lib/meta";
import { Suspense } from "react";
import { EvidencePage } from "@/components/ax/ops/EvidencePage";

export const metadata = axMeta("evidence");

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EvidencePage />
    </Suspense>
  );
}
