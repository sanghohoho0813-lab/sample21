import type { Metadata } from "next";
import { AxShell } from "@/components/ax/AxShell";

export const metadata: Metadata = { title: "AX 운영화면", robots: { index: false } };

export default function AxLayout({ children }: { children: React.ReactNode }) {
  return <AxShell>{children}</AxShell>;
}
