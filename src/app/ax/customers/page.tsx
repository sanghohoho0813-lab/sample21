import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomersPage } from "@/components/ax/ops/CustomersPage";

export const metadata: Metadata = { title: "고객·재구매 · AX 운영화면" };

export default function Page() {
  return <Suspense fallback={null}><CustomersPage /></Suspense>;
}
