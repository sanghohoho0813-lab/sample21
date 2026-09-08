import type { Role } from "./types";
import { ICON_ACCENTS } from "./theme";

export type NavKey = "dashboard" | "actions" | "sales" | "products" | "inventory" | "customers" | "fit" | "campaigns" | "brands" | "orders" | "evidence" | "why" | "present" | "settings";

export interface NavItem { key: NavKey; no: string; label: string; href: string; group: string; accent: string; roles: Role[]; icon: string; tour?: string }

export const AX_NAV: NavItem[] = [
  { key: "dashboard", no: "01", label: "경영 대시보드", href: "/ax", group: "핵심 운영", accent: ICON_ACCENTS.overview, roles: ["owner", "md", "ops"], icon: "LayoutDashboard" },
  { key: "actions", no: "02", label: "Growth & Action Center", href: "/ax/actions", group: "핵심 운영", accent: ICON_ACCENTS.ai, roles: ["owner", "md", "ops"], icon: "Zap", tour: "nav-actions" },
  { key: "sales", no: "03", label: "매출·마진", href: "/ax/sales", group: "핵심 운영", accent: ICON_ACCENTS.sales, roles: ["owner", "md"], icon: "TrendingUp" },
  { key: "products", no: "04", label: "상품·SKU", href: "/ax/products", group: "핵심 운영", accent: ICON_ACCENTS.operations, roles: ["owner", "md", "ops"], icon: "Shirt" },
  { key: "inventory", no: "05", label: "재고·재입고", href: "/ax/inventory", group: "핵심 운영", accent: ICON_ACCENTS.risk, roles: ["owner", "md", "ops"], icon: "Boxes", tour: "nav-inventory" },
  { key: "customers", no: "06", label: "고객·재구매", href: "/ax/customers", group: "고객·성장", accent: ICON_ACCENTS.customer, roles: ["owner", "md", "ops"], icon: "Users" },
  { key: "fit", no: "07", label: "핏·반품", href: "/ax/fit-returns", group: "고객·성장", accent: "#C76C86", roles: ["owner", "md", "ops"], icon: "Ruler" },
  { key: "campaigns", no: "08", label: "캠페인·기획전", href: "/ax/campaigns", group: "고객·성장", accent: "#D96D32", roles: ["owner", "md"], icon: "Megaphone" },
  { key: "brands", no: "09", label: "브랜드·파트너", href: "/ax/brands", group: "고객·성장", accent: "#148C8C", roles: ["owner", "md"], icon: "Store" },
  { key: "orders", no: "10", label: "주문·배송", href: "/ax/orders", group: "운영", accent: "#5B8DEF", roles: ["owner", "md", "ops"], icon: "PackageCheck" },
  { key: "evidence", no: "11", label: "AX Evidence", href: "/ax/evidence", group: "운영", accent: ICON_ACCENTS.evidence, roles: ["owner", "md", "ops"], icon: "FileCheck2" },
  { key: "why", no: "12", label: "기획의도 (Why AX)", href: "/ax/why", group: "스토리", accent: "#7376D9", roles: ["owner", "md", "ops"], icon: "BookOpen", tour: "nav-why" },
  { key: "present", no: "13", label: "시연 모드", href: "/ax/present", group: "스토리", accent: "#D79A43", roles: ["owner", "md", "ops"], icon: "Presentation" },
  { key: "settings", no: "14", label: "설정", href: "/ax/settings", group: "관리", accent: ICON_ACCENTS.settings, roles: ["owner", "md", "ops"], icon: "Settings", tour: "nav-settings" },
];

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
