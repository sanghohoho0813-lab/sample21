import type { Metadata } from "next";
import { AxShell } from "@/components/ax/AxShell";

/** 운영화면 탭 제목: "<화면 이름> · MORFIT AX" — 화면 이름은 메뉴 정의(AX_NAV)에서 */
export const metadata: Metadata = { title: { default: "경영 대시보드 · MORFIT AX", template: "%s · MORFIT AX" }, robots: { index: false, follow: false } };

export default function AxLayout({ children }: { children: React.ReactNode }) {
  return <AxShell>{children}</AxShell>;
}
