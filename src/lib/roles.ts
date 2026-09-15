import type { Role } from "./types";
import { ICON_TONE, type IconTone } from "./theme";

export type NavKey = "dashboard" | "actions" | "sales" | "products" | "inventory" | "customers" | "fit" | "campaigns" | "brands" | "orders" | "evidence" | "why" | "present" | "settings";
export type NavGroupId = "today" | "supply" | "demand" | "proof";

export interface NavGroup { id: NavGroupId; label: string; desc: string; tone: IconTone }
export interface NavItem { key: NavKey; no: string; label: string; href: string; group: NavGroupId; tone: IconTone; accent: string; roles: Role[]; icon: string; tour?: string }

/* ------------------------------------------------------------------
   AX 사이드바 4그룹 — "질문이 같은 화면끼리" 묶는다.
   1 오늘의 판단 : 지금 무엇을 보고, 무엇을 결정할까
   2 상품 · 재고 : 무엇을 얼마나 들여오고 언제 채울까 (공급 쪽)
   3 고객 · 매출 : 누가 얼마에 사고, 왜 돌아오거나 반품할까 (수요 쪽)
   4 근거 · 설정 : 그래서 효과가 있었나 · 어떻게 보여주고 설정할까
   톤은 위에서 아래로 진함 → 옅음 순서로 내려간다 (같은 색, 다른 톤).
------------------------------------------------------------------- */
export const NAV_GROUPS: NavGroup[] = [
  { id: "today", label: "오늘의 판단", desc: "지금 무엇을 보고 무엇을 결정할까", tone: "t1" },
  { id: "supply", label: "상품 · 재고", desc: "무엇을 얼마나, 언제 채울까", tone: "t3" },
  { id: "demand", label: "고객 · 매출", desc: "누가 얼마에 사고 왜 돌아오는가", tone: "t6" },
  { id: "proof", label: "근거 · 설정", desc: "효과의 증거와 시연 · 설정", tone: "t9" },
];

export const AX_NAV: NavItem[] = [
  { key: "dashboard", no: "01", label: "경영 대시보드", href: "/ax", group: "today", tone: "t1", accent: ICON_TONE.t1, roles: ["owner", "md", "ops"], icon: "LayoutDashboard" },
  { key: "actions", no: "02", label: "Growth & Action Center", href: "/ax/actions", group: "today", tone: "t2", accent: ICON_TONE.t2, roles: ["owner", "md", "ops"], icon: "Zap", tour: "nav-actions" },

  { key: "products", no: "03", label: "상품·SKU", href: "/ax/products", group: "supply", tone: "t3", accent: ICON_TONE.t3, roles: ["owner", "md", "ops"], icon: "Shirt" },
  { key: "inventory", no: "04", label: "재고·재입고", href: "/ax/inventory", group: "supply", tone: "t4", accent: ICON_TONE.t4, roles: ["owner", "md", "ops"], icon: "Boxes", tour: "nav-inventory" },
  { key: "brands", no: "05", label: "브랜드·파트너", href: "/ax/brands", group: "supply", tone: "t5", accent: ICON_TONE.t5, roles: ["owner", "md"], icon: "Store" },

  { key: "sales", no: "06", label: "매출·마진", href: "/ax/sales", group: "demand", tone: "t5", accent: ICON_TONE.t5, roles: ["owner", "md"], icon: "TrendingUp" },
  { key: "customers", no: "07", label: "고객·재구매", href: "/ax/customers", group: "demand", tone: "t6", accent: ICON_TONE.t6, roles: ["owner", "md", "ops"], icon: "Users" },
  { key: "fit", no: "08", label: "핏·반품", href: "/ax/fit-returns", group: "demand", tone: "t7", accent: ICON_TONE.t7, roles: ["owner", "md", "ops"], icon: "Ruler" },
  { key: "campaigns", no: "09", label: "캠페인·기획전", href: "/ax/campaigns", group: "demand", tone: "t7", accent: ICON_TONE.t7, roles: ["owner", "md"], icon: "Megaphone" },
  { key: "orders", no: "10", label: "주문·배송", href: "/ax/orders", group: "demand", tone: "t8", accent: ICON_TONE.t8, roles: ["owner", "md", "ops"], icon: "PackageCheck" },

  { key: "evidence", no: "11", label: "AX Evidence", href: "/ax/evidence", group: "proof", tone: "t8", accent: ICON_TONE.t8, roles: ["owner", "md", "ops"], icon: "FileCheck2" },
  { key: "why", no: "12", label: "기획의도 (Why AX)", href: "/ax/why", group: "proof", tone: "t9", accent: ICON_TONE.t9, roles: ["owner", "md", "ops"], icon: "BookOpen", tour: "nav-why" },
  { key: "present", no: "13", label: "시연 모드", href: "/ax/present", group: "proof", tone: "t9", accent: ICON_TONE.t9, roles: ["owner", "md", "ops"], icon: "Presentation" },
  { key: "settings", no: "14", label: "설정", href: "/ax/settings", group: "proof", tone: "t10", accent: ICON_TONE.t10, roles: ["owner", "md", "ops"], icon: "Settings", tour: "nav-settings" },
];

export const NAV_BY_KEY = Object.fromEntries(AX_NAV.map((n) => [n.key, n])) as Record<NavKey, NavItem>;
export const navByKey = (key: NavKey) => NAV_BY_KEY[key];

export type Permission = "company-pnl" | "brand-margin" | "all-orders" | "own-orders" | "actions-approve" | "actions-execute" | "campaign-create" | "user-admin" | "evidence" | "customer-personal" | "inventory-edit" | "funding";

export const PERMISSIONS: Record<Permission, { label: string; roles: Partial<Record<Role, "full" | "partial" | "none">> }> = {
  "company-pnl": { label: "전체 매출·손익", roles: { owner: "full", md: "partial", ops: "none", customer: "none" } },
  "brand-margin": { label: "브랜드·상품 마진", roles: { owner: "full", md: "full", ops: "none", customer: "none" } },
  "all-orders": { label: "전체 주문 조회", roles: { owner: "full", md: "full", ops: "full", customer: "none" } },
  "own-orders": { label: "본인 주문·반품", roles: { owner: "full", md: "full", ops: "full", customer: "full" } },
  "actions-approve": { label: "Action 승인", roles: { owner: "full", md: "full", ops: "partial", customer: "none" } },
  "actions-execute": { label: "Action 실행·완료", roles: { owner: "full", md: "full", ops: "full", customer: "none" } },
  "campaign-create": { label: "캠페인 생성", roles: { owner: "full", md: "full", ops: "none", customer: "none" } },
  "inventory-edit": { label: "재고 조정", roles: { owner: "full", md: "full", ops: "partial", customer: "none" } },
  "customer-personal": { label: "고객 개인정보", roles: { owner: "full", md: "partial", ops: "partial", customer: "none" } },
  evidence: { label: "AX Evidence", roles: { owner: "full", md: "full", ops: "partial", customer: "none" } },
  "user-admin": { label: "사용자·권한 관리", roles: { owner: "full", md: "none", ops: "none", customer: "none" } },
  funding: { label: "자금·투자 지표", roles: { owner: "full", md: "none", ops: "none", customer: "none" } },
};

export const can = (role: Role, p: Permission) => (PERMISSIONS[p].roles[role] ?? "none") !== "none";
export const canFull = (role: Role, p: Permission) => (PERMISSIONS[p].roles[role] ?? "none") === "full";
export const navFor = (role: Role) => AX_NAV.filter((n) => n.roles.includes(role));
/** 역할이 볼 수 있는 항목이 있는 그룹만 (순서 고정) */
export const navGroupsFor = (role: Role) => { const items = navFor(role); return NAV_GROUPS.filter((g) => items.some((i) => i.group === g.id)); };
