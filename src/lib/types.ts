/* ------------------------------------------------------------------
   MORFIT — Shared Data Model (SSOT). Demo Repository is centralized in
   src/lib/demo/seed.ts; mutable state lives in src/lib/store.ts.
------------------------------------------------------------------- */

export type Gender = "men" | "women" | "unisex";
export type CategoryId = "outer" | "top" | "bottom" | "dress" | "shoes" | "bag" | "acc";
export type Fit = "slim" | "regular" | "relaxed" | "oversized";
export type SizingTendency = "small" | "true" | "large"; // 작게 나옴 / 정사이즈 / 크게 나옴
export type SourcingType = "purchase" | "consignment"; // 사입 / 입점·위탁
export type DataSource = "DEMO" | "LIVE" | "SIMULATION";

export interface Brand {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  sourcing: SourcingType;
  commissionRate: number; // 입점·위탁 수수료 (0~1)
  leadTimeDays: number; // 재입고 공급 리드타임
  manager: string;
  contractStatus: "active" | "renewal" | "new";
  joinedAt: string; // ISO
  gradient: [string, string];
  followers: number;
}

export interface Category {
  id: CategoryId;
  name: string;
  gradient: [string, string];
}

export interface Product {
  id: string;
  brandId: string;
  categoryId: CategoryId;
  gender: Gender;
  name: string;
  subtitle: string;
  price: number; // 정상가
  salePrice: number | null; // 판매가(할인 시)
  cost: number; // 원가 또는 정산기준
  fit: Fit;
  sizing: SizingTendency;
  colors: string[];
  sizes: string[];
  material: string;
  care: string;
  description: string;
  fitNote: string; // 상품 상세 핏 안내 (Loop 3에서 변경됨)
  model: { height: number; weight: number; size: string };
  measurements: Record<string, Record<string, number>>; // size → { 총장, 가슴, ... }
  tags: string[];
  createdAt: string;
  season: "SS" | "FW" | "ALL";
  seasonEndsInDays: number;
  gradient: [string, string];
  rating: number;
  reviewCount: number;
}

export interface Variant {
  id: string;
  productId: string;
  color: string;
  size: string;
  stock: number;
  incoming: number; // 예정 입고량
  sales7d: number;
  salesPrev7d: number;
  sales30d: number;
  views7d: number;
  wishlist7d: number;
  wishlistPrev7d: number;
  cart7d: number;
  restockRequests: number;
  returns30d: number;
  fitReturns30d: number;
}

export type InventoryStatus =
  | "normal"
  | "rising"
  | "low"
  | "soldout"
  | "overstock"
  | "slow"
  | "restock-review"
  | "restock-progress"
  | "restocked";

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
  units: number;
  views: number;
  wishlist: number;
  discount: number;
  returns: number;
}

export interface ProductDaily {
  productId: string;
  series: { date: string; units: number; views: number; wishlist: number }[];
}

export type Role = "owner" | "md" | "ops" | "customer";

export interface Customer {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  joinedAt: string;
  lastPurchaseAt: string | null;
  orderCount: number;
  totalSpend: number;
  avgCycleDays: number | null;
  favoriteBrandId: string | null;
  favoriteCategory: CategoryId | null;
  wishlistCount: number;
  cartCount: number;
  restockWaiting: number;
  hasFitProfile: boolean;
  returnCount: number;
  ltv: number;
  segment: SegmentId;
}

export type SegmentId =
  | "first-purchase"
  | "wish-no-buy"
  | "restock-waiting"
  | "cycle-due"
  | "brand-loyal"
  | "post-return-drop"
  | "vip";

export type OrderStatus =
  | "pending" // 결제대기 Demo
  | "preparing"
  | "shipped" // 출고완료
  | "in-transit"
  | "delivered"
  | "cancelled"
  | "return-requested"
  | "exchange-requested";

export interface OrderItem {
  variantId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  discount: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  channel: "web" | "mobile";
  address: string;
  memo?: string;
  source: DataSource;
  statusHistory: { status: OrderStatus; at: string; actor: string }[];
}

export type ReturnReason =
  | "size-small"
  | "size-large"
  | "fit"
  | "color"
  | "material"
  | "delivery"
  | "change-of-mind"
  | "other";

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  variantId: string;
  reason: ReturnReason;
  createdAt: string;
  status: "requested" | "approved" | "completed" | "rejected";
  note?: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: "sale" | "brand" | "segment" | "restock" | "new";
  startAt: string;
  endAt: string;
  status: "draft" | "scheduled" | "running" | "ended";
  productIds: string[];
  segment: SegmentId | "all";
  discountRate: number;
  impressions: number;
  clicks: number;
  carts: number;
  orders: number;
  revenue: number;
  discountCost: number;
  estMargin: number;
  returns: number;
  beforeRevenue: number;
}

export type ActionStatus = "recommended" | "confirmed" | "in-progress" | "done" | "hold" | "dismissed";
export type ActionType = "restock" | "rebalance" | "markdown" | "fit-guide" | "segment-campaign" | "cart-reminder";
export type Urgency = "high" | "mid" | "low";

export interface AXAction {
  id: string;
  type: ActionType;
  title: string;
  productId?: string;
  variantId?: string;
  brandId?: string;
  segment?: SegmentId;
  trigger: string;
  reasons: string[];
  expectedImpact: string;
  caution?: string;
  urgency: Urgency;
  owner: Role; // 담당 역할
  ownerName: string;
  recommendedAt: string;
  status: ActionStatus;
  statusHistory: { status: ActionStatus; at: string; actor: string; note?: string }[];
  resultNote?: string;
  quantity?: number; // 재입고 추천 수량
  discountRate?: number;
  engine: "demand" | "fit" | "markdown" | "repeat";
  automation: "L2" | "L3";
  errorCost: "LOW" | "MID" | "HIGH";
}

export type EvidenceType =
  | "BASELINE" | "ACTION" | "RESULT" | "ADOPTION" | "CUSTOMER"
  | "EFFICIENCY" | "REVENUE" | "SCALE" | "RISK" | "EXCEPTION";

export interface EvidenceLog {
  id: string;
  type: EvidenceType;
  title: string;
  detail: string;
  at: string;
  actor: string;
  actionId?: string;
  productId?: string;
  orderId?: string;
  customerId?: string;
  kpiDelta?: string;
  source: DataSource;
  status: "demo" | "pilot-ready" | "live";
}

export interface RestockSubscription {
  id: string;
  variantId: string;
  productId: string;
  createdAt: string;
  status: "waiting" | "notified" | "purchased";
  notifiedAt?: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  qty: number;
}

export interface FitProfile {
  height: number | null;
  weight: number | null;
  topSize: string | null;
  bottomSize: string | null;
  preferredFit: Fit | null;
  bodyType: "straight" | "hourglass" | "inverted" | "pear" | null;
  updatedAt?: string;
}

export type EventName =
  | "view_home" | "search_product" | "select_category" | "view_product" | "select_color"
  | "select_size" | "complete_fit_profile" | "view_fit_recommendation" | "add_wishlist"
  | "remove_wishlist" | "subscribe_restock" | "add_to_cart" | "begin_checkout"
  | "complete_demo_order" | "view_order" | "request_return" | "view_recommendation"
  | "click_recommendation" | "return_visit";

export interface TrackedEvent {
  id: string;
  name: EventName;
  at: string;
  productId?: string;
  variantId?: string;
  meta?: Record<string, string | number>;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind: "restock" | "order" | "recommend" | "system";
  href?: string;
}
