import { axMeta } from "@/lib/meta";
import { Suspense } from "react";
import { FitReturnsPage } from "@/components/ax/ops/FitReturnsPage";

export const metadata = axMeta("fit");

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FitReturnsPage />
    </Suspense>
  );
}
