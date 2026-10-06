import { axMeta } from "@/lib/meta";
import { Suspense } from "react";
import { CustomersPage } from "@/components/ax/ops/CustomersPage";

export const metadata = axMeta("customers");

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CustomersPage />
    </Suspense>
  );
}
