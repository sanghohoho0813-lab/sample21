import { axMeta } from "@/lib/meta";
import { Suspense } from "react";
import { OrdersPage } from "@/components/ax/ops/OrdersPage";

export const metadata = axMeta("orders");

export default function Page() {
  return <Suspense fallback={null}><OrdersPage /></Suspense>;
}
