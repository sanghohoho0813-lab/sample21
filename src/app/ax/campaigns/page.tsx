import { axMeta } from "@/lib/meta";
import { Suspense } from "react";
import { CampaignsPage } from "@/components/ax/ops/CampaignsPage";

export const metadata = axMeta("campaigns");

export default function Page() {
  return <Suspense fallback={null}><CampaignsPage /></Suspense>;
}
