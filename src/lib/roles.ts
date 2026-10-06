import type { Role } from "./types";
import { ICON_TONE, type IconTone } from "./theme";

export type NavKey = "dashboard" | "actions" | "sales" | "products" | "inventory" | "customers" | "fit" | "campaigns" | "brands" | "orders" | "evidence" | "why" | "present" | "settings";
export type NavEntryId = "dashboard" | "actions" | "supply" | "demand" | "growth" | "evidence" | "story" | "settings";

/** 메뉴 아이콘 이름 — 실제 컴포넌트는 AxShell의 NAV_ICONS에 등록된 것만 번들에 들어간다 */
export type NavIconName = "BookOpen" | "Boxes" | "FileCheck2" | "LayoutDashboard" | "Megaphone" | "PackageCheck" | "Presentation" | "Ruler" | "Settings" | "Shirt" | "Store" | "TrendingUp" | "Users" | "Zap";
export interface NavItem { key: NavKey; no: string; label: string; href: string; group: NavEntryId; tone: IconTone; accent: string; roles: Role[]; icon: NavIconName; tour?: string }
/** 1차 메뉴 — 단일 화면이면 key, 여러 화면을 묶으면 children(2차) */
export interface NavEntry { id: NavEntryId; label: string; desc: string; icon: NavIconName; tone: IconTone; key?: NavKey; children?: NavKey[]; tour?: string }

/* ------------------------------------------------------------------
   AX 정보구조 (UI/UX 안정화 v1.0) — 1차 메뉴 14개 → 8개, 최대 2단계.
   기능·URL은 하나도 없애지 않고, "같은 질문을 푸는 화면"끼리 상위 메뉴 아래로 편입했다.
     경영 대시보드 · 실행 센터 · 상품·재고▸ · 주문·고객▸ · 매출·마케팅▸ · 성과 증빙 · 소개·시연▸ · 설정
   아이콘 색: 같은 1차 메뉴에 속한 화면은 같은 톤(같은 색의 다른 톤 사다리).
------------------------------------------------------------------- */
export const NAV_TREE: NavEntry[] = [
  { id: "dashboard", label: "경영 대시보드", desc: "오늘 무엇을 보고 무엇을 결정할까", icon: "LayoutDashboard", tone: "t1", key: "dashboard" },
  { id: "actions", label: "실행 센터", desc: "추천을 확인·승인·실행", icon: "Zap", tone: "t2", key: "actions" },
  { id: "supply", label: "상품·재고", desc: "무엇을 얼마나, 언제 채울까", icon: "Boxes", tone: "t3", children: ["products", "inventory", "brands"], tour: "nav-group-supply" },
  { id: "demand", label: "주문·고객", desc: "누가 사고, 왜 돌아오거나 반품하나", icon: "PackageCheck", tone: "t5", children: ["orders", "customers", "fit"], tour: "nav-group-demand" },
  { id: "growth", label: "매출·마케팅", desc: "얼마를 벌었고 무엇을 알릴까", icon: "TrendingUp", tone: "t6", children: ["sales", "campaigns"], tour: "nav-group-growth" },
  { id: "evidence", label: "성과 증빙", desc: "추천→실행→결과 기록", icon: "FileCheck2", tone: "t7", key: "evidence" },
  { id: "story", label: "소개·시연", desc: "기획의도와 시연 순서", icon: "BookOpen", tone: "t8", children: ["why", "present"], tour: "nav-group-story" },
  { id: "settings", label: "설정", desc: "테마·역할·데모·데이터", icon: "Settings", tone: "t10", key: "settings" },
];
const ENTRY_OF: Record<NavKey, NavEntry> = Object.fromEntries(NAV_TREE.flatMap((e) => (e.key ? [[e.key, e]] : (e.children ?? []).map((k) => [k, e])))) as Record<NavKey, NavEntry>;
const tone = (k: NavKey) => ENTRY_OF[k].tone;
const item = (key: NavKey, no: string, label: string, href: string, icon: NavIconName, roles: Role[], tour?: string): NavItem =>
  ({ key, no, label, href, group: ENTRY_OF[key].id, tone: tone(key), accent: ICON_TONE[tone(key)], roles, icon, tour });

const ALL: Role[] = ["owner", "md", "ops"];
const MGMT: Role[] = ["owner", "md"];
export const AX_NAV: NavItem[] = [
  item("dashboard", "01", "경영 대시보드", "/ax", "LayoutDashboard", ALL),
  item("actions", "02", "실행 센터", "/ax/actions", "Zap", ALL, "nav-actions"),
  item("products", "03", "상품·옵션", "/ax/products", "Shirt", ALL),
  item("inventory", "04", "재고·재입고", "/ax/inventory", "Boxes", ALL, "nav-inventory"),
  item("brands", "05", "브랜드·입점사", "/ax/brands", "Store", MGMT),
  item("orders", "06", "주문·배송", "/ax/orders", "PackageCheck", ALL),
  item("customers", "07", "고객·재구매", "/ax/customers", "Users", ALL),
  item("fit", "08", "핏·반품", "/ax/fit-returns", "Ruler", ALL),
  item("sales", "09", "매출·마진", "/ax/sales", "TrendingUp", MGMT),
  item("campaigns", "10", "캠페인·기획전", "/ax/campaigns", "Megaphone", MGMT),
  item("evidence", "11", "성과 증빙", "/ax/evidence", "FileCheck2", ALL),
  item("why", "12", "기획의도", "/ax/why", "BookOpen", ALL, "nav-why"),
  item("present", "13", "시연 모드", "/ax/present", "Presentation", ALL),
  item("settings", "14", "설정", "/ax/settings", "Settings", ALL, "nav-settings"),
];

export const NAV_BY_KEY = Object.fromEntries(AX_NAV.map((n) => [n.key, n])) as Record<NavKey, NavItem>;
export const navByKey = (key: NavKey) => NAV_BY_KEY[key];
export const entryOf = (key: NavKey) => ENTRY_OF[key];
/** 현재 경로가 속한 화면 (상세 경로 포함: /ax/products/[id] → products) */
export const navKeyForPath = (pathname: string): NavKey | null => {
  if (pathname === "/ax") return "dashboard";
  const hit = [...AX_NAV].filter((n) => n.href !== "/ax" && pathname.startsWith(n.href)).sort((a, b) => b.href.length - a.href.length)[0];
  return hit?.key ?? null;
};
/** 역할별로 보이는 1차 메뉴와 그 안의 2차 화면 */
export const navTreeFor = (role: Role) => NAV_TREE.map((e) => ({ entry: e, items: (e.key ? [e.key] : e.children ?? []).map(navByKey).filter((n) => n.roles.includes(role)) })).filter((x) => x.items.length > 0);

export type Permission = "company-pnl" | "brand-margin" | "all-orders" | "own-orders" | "actions-approve" | "actions-execute" | "campaign-create" | "user-admin" | "evidence" | "customer-personal" | "inventory-edit" | "funding";

export const PERMISSIONS: Record<Permission, { label: string; roles: Partial<Record<Role, "full" | "partial" | "none">> }> = {
  "company-pnl": { label: "전체 매출·손익", roles: { owner: "full", md: "partial", ops: "none", customer: "none" } },
  "brand-margin": { label: "브랜드·상품 마진", roles: { owner: "full", md: "full", ops: "none", customer: "none" } },
  "all-orders": { label: "전체 주문 조회", roles: { owner: "full", md: "full", ops: "full", customer: "none" } },
  "own-orders": { label: "본인 주문·반품", roles: { owner: "full", md: "full", ops: "full", customer: "full" } },
  "actions-approve": { label: "과제 승인", roles: { owner: "full", md: "full", ops: "partial", customer: "none" } },
  "actions-execute": { label: "과제 실행·완료", roles: { owner: "full", md: "full", ops: "full", customer: "none" } },
  "campaign-create": { label: "캠페인 생성", roles: { owner: "full", md: "full", ops: "none", customer: "none" } },
  "inventory-edit": { label: "재고 조정", roles: { owner: "full", md: "full", ops: "partial", customer: "none" } },
  "customer-personal": { label: "고객 개인정보", roles: { owner: "full", md: "partial", ops: "partial", customer: "none" } },
  evidence: { label: "AX 성과 증빙", roles: { owner: "full", md: "full", ops: "partial", customer: "none" } },
  "user-admin": { label: "사용자·권한 관리", roles: { owner: "full", md: "none", ops: "none", customer: "none" } },
  funding: { label: "자금·투자 지표", roles: { owner: "full", md: "none", ops: "none", customer: "none" } },
};

export const can = (role: Role, p: Permission) => (PERMISSIONS[p].roles[role] ?? "none") !== "none";
export const canFull = (role: Role, p: Permission) => (PERMISSIONS[p].roles[role] ?? "none") === "full";
export const navFor = (role: Role) => AX_NAV.filter((n) => n.roles.includes(role));
