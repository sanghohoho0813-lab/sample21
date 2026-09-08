import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersPage } from "@/components/ax/ops/OrdersPage";

export const metadata: Metadata = { title: "주문·배송 · Business AX" };

export default function Page() {
  return <Suspense fallback={null}><OrdersPage /></Suspense>;
}
