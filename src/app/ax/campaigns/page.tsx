import type { Metadata } from "next";
import { Suspense } from "react";
import { CampaignsPage } from "@/components/ax/ops/CampaignsPage";

export const metadata: Metadata = { title: "캠페인·기획전 · Business AX" };

export default function Page() {
  return <Suspense fallback={null}><CampaignsPage /></Suspense>;
}
