import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomersPage } from "@/components/ax/ops/CustomersPage";

export const metadata: Metadata = { title: "고객·재구매 · Business AX" };

export default function Page() {
  return <Suspense fallback={null}><CustomersPage /></Suspense>;
}
