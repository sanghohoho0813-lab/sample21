/* 라우트 메타데이터(탭 제목·설명) — 서버에서 정해 첫 HTML부터 올바른 제목이 나가게 한다.
   화면 이름은 메뉴 정의(AX_NAV)를 그대로 써서 메뉴·제목이 어긋나지 않게 한다. */
import type { Metadata } from "next";
import { NAV_BY_KEY, type NavKey } from "@/lib/roles";

/** AX 화면 제목 — 템플릿(ax/layout)이 "· MORFIT AX"를 붙인다 */
export const axMeta = (key: NavKey, title?: string): Metadata => ({ title: title ?? NAV_BY_KEY[key].label });

/** 이 파일 하나로 끝나는 라우트 세그먼트용 레이아웃(메타데이터만 제공) */
export function Passthrough({ children }: { children: React.ReactNode }) {
  return children;
}
