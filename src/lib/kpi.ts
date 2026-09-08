/* ------------------------------------------------------------------
   KPI / Selectors — 모든 숫자는 코드로 계산한다 (AI 아님).
   Seed + Store delta를 합쳐 "현재 상태"를 만든다.
------------------------------------------------------------------- */
import type { AppState } from "./store";
import type { InventoryStatus, Order, OrderStatus, Product, ReturnRequest, Variant, SegmentId } from "./types";
import { BRAND_BY_ID, CUSTOMERS, DAILY, PRODUCTS, PRODUCT_BY_ID, RETURNS, SEED_ORDERS, VARIANTS, variantsOf, PRODUCT_DAILY_BY_ID } from "./demo/seed";
import { safeDiv } from "./format";

type Delta = Pick<AppState, "viewDelta" | "wishlistDelta" | "cartDelta" | "restockDelta" | "inventoryDelta" | "returnDelta" | "salePriceOverride" | "fitNoteOverride" | "variantRestockState" | "orderStatusOverride" | "orders" | "returns">;

export function effVariant(v: Variant, d: Delta): Variant {
  const p = PRODUCT_BY_ID[v.productId];
  const wishAdd = d.wishlistDelta[v.productId] ?? 0;
  return {
    ...v,
    stock: Math.max(0, v.stock + (d.inventoryDelta[v.id] ?? 0)),
    restockRequests: v.restockRequests + (d.restockDelta[v.id] ?? 0),
    wishlist7d: v.wishlist7d + (wishAdd > 0 && v.size === (p.categoryId === "shoes" ? v.size : "M") && v.color === p.colors[0] ? wishAdd : 0),
    cart7d: v.cart7d + (d.cartDelta[v.id] ?? 0),
    views7d: v.views7d + Math.round((d.viewDelta[v.productId] ?? 0) / Math.max(1, p.sizes.length)),
    returns30d: v.returns30d + (d.returnDelta[v.id] ?? 0),
    fitReturns30d: v.fitReturns30d + (d.returnDelta[v.id] ?? 0),
  };
}
export const effVariants = (productId: string, d: Delta) => variantsOf(productId).map((v) => effVariant(v, d));
export const effPrice = (p: Product, d: Pick<Delta, "salePriceOverride">) => d.salePriceOverride[p.id] ?? p.salePrice ?? p.price;
export const effFitNote = (p: Product, d: Pick<Delta, "fitNoteOverride">) => d.fitNoteOverride[p.id] ?? p.fitNote;
export const discountRate = (p: Product, d: Pick<Delta, "salePriceOverride">) => { const price = effPrice(p, d); return price < p.price ? (p.price - price) / p.price : 0; };

export function allOrders(d: Pick<Delta, "orders" | "orderStatusOverride">): Order[] {
  const seed = SEED_ORDERS.map((o) => { const ov = d.orderStatusOverride[o.id]; return ov ? { ...o, status: ov.status, statusHistory: ov.history } : o; });
  return [...d.orders, ...seed].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
export const allReturns = (d: Pick<Delta, "returns">): ReturnRequest[] => [...d.returns, ...RETURNS];

export const dailySales = (v: Variant) => Math.max(0.05, v.sales30d / 30);
export const daysOfStock = (v: Variant) => (v.stock <= 0 ? 0 : Math.round(v.stock / dailySales(v)));
export const velocityDelta = (v: Variant) => safeDiv(v.sales7d - v.salesPrev7d, Math.max(1, v.salesPrev7d));

export function inventoryStatus(v: Variant, d?: Pick<Delta, "variantRestockState">): InventoryStatus {
  const rs = d?.variantRestockState[v.id];
  if (rs === "restocked") return "restocked";
  if (rs === "progress") return "restock-progress";
  if (rs === "review") return "restock-review";
  if (v.stock <= 0) return "soldout";
  const dos = daysOfStock(v);
  const p = PRODUCT_BY_ID[v.productId];
  if (dos <= 4) return "low";
  if (velocityDelta(v) > 0.3 && (v.wishlist7d > v.wishlistPrev7d * 1.3 || v.restockRequests > 3)) return "rising";
  if (dos > p.seasonEndsInDays * 0.6 && v.stock >= 10) return "overstock";
  if (dos > 45 && v.sales7d < v.salesPrev7d) return "slow";
  return "normal";
}
export const INVENTORY_STATUS_LABEL: Record<InventoryStatus, string> = { normal: "정상", rising: "관심 상승", low: "품절 임박", soldout: "품절", overstock: "과잉", slow: "저회전", "restock-review": "재입고 검토", "restock-progress": "재입고 진행", restocked: "입고 완료" };
export const INVENTORY_STATUS_TONE: Record<InventoryStatus, "neutral" | "info" | "warning" | "error" | "success" | "accent"> = { normal: "neutral", rising: "accent", low: "warning", soldout: "error", overstock: "warning", slow: "info", "restock-review": "info", "restock-progress": "info", restocked: "success" };

/** Demand Score 0~100 — 규칙 기반 (RULE + STATISTICAL). */
export function demandScore(v: Variant) {
  const vel = Math.max(-1, Math.min(2, velocityDelta(v)));
  const wish = safeDiv(v.wishlist7d - v.wishlistPrev7d, Math.max(1, v.wishlistPrev7d));
  const stockPressure = v.stock <= 0 ? 1 : Math.max(0, 1 - daysOfStock(v) / 14);
  const restock = Math.min(1, v.restockRequests / 15);
  const cart = Math.min(1, v.cart7d / 20);
  const score = 100 * (0.3 * Math.max(0, vel) / 2 + 0.2 * Math.max(0, Math.min(2, wish)) / 2 + 0.25 * stockPressure + 0.15 * restock + 0.1 * cart);
  return Math.round(Math.min(100, score));
}
export function restockPriority(v: Variant, d: Delta) {
  const p = PRODUCT_BY_ID[v.productId];
  const b = BRAND_BY_ID[p.brandId];
  const dos = daysOfStock(v);
  const price = effPrice(p, d);
  const margin = safeDiv(price - p.cost, price);
  const risk = v.stock <= 0 ? 1 : dos <= b.leadTimeDays ? 0.85 : dos <= b.leadTimeDays * 2 ? 0.5 : 0.15;
  const score = Math.round(100 * (0.45 * risk + 0.25 * Math.min(1, demandScore(v) / 70) + 0.15 * margin + 0.15 * Math.min(1, v.restockRequests / 15)));
  const suggestedQty = Math.max(0, Math.round(dailySales(v) * Math.min(p.seasonEndsInDays, 30 + b.leadTimeDays) * (1 + Math.max(0, velocityDelta(v)) * 0.5) - v.stock - v.incoming));
  return { score, suggestedQty: suggestedQty > 0 ? Math.ceil(suggestedQty / 5) * 5 : 0, daysOfStock: dos, leadTime: b.leadTimeDays, margin };
}
export function markdownReview(p: Product, d: Delta) {
  const vs = effVariants(p.id, d);
  const stock = vs.reduce((s, v) => s + v.stock, 0);
  const s30 = vs.reduce((s, v) => s + v.sales30d, 0);
  const s7 = vs.reduce((s, v) => s + v.sales7d, 0);
  const p7 = vs.reduce((s, v) => s + v.salesPrev7d, 0);
  const dos = stock <= 0 ? 0 : Math.round(stock / Math.max(0.1, s30 / 30));
  const price = effPrice(p, d);
  const margin = safeDiv(price - p.cost, price);
  const currentRate = discountRate(p, d);
  const headroom = Math.max(0, margin - 0.25); // keep ≥25% margin
  const shouldReview = dos > p.seasonEndsInDays * 0.5 && stock >= 8 && s7 <= p7;
  const suggested = shouldReview ? Math.min(0.3, Math.round((currentRate + Math.min(headroom, 0.15)) * 20) / 20) : currentRate;
  return { stock, s30, s7, p7, dos, margin, currentRate, suggestedRate: suggested, shouldReview, stockValue: stock * p.cost };
}

/* ------------------------------ Product-level aggregates ------------------------------ */
export function productAgg(p: Product, d: Delta) {
  const vs = effVariants(p.id, d);
  const sum = (f: (v: Variant) => number) => vs.reduce((s, v) => s + f(v), 0);
  const sales7d = sum((v) => v.sales7d), salesPrev7d = sum((v) => v.salesPrev7d), sales30d = sum((v) => v.sales30d);
  const stock = sum((v) => v.stock), views7d = sum((v) => v.views7d) + (d.viewDelta[p.id] ?? 0), wishlist7d = sum((v) => v.wishlist7d), wishlistPrev7d = sum((v) => v.wishlistPrev7d);
  const cart7d = sum((v) => v.cart7d), restockRequests = sum((v) => v.restockRequests), returns30d = sum((v) => v.returns30d), fitReturns30d = sum((v) => v.fitReturns30d), incoming = sum((v) => v.incoming);
  const price = effPrice(p, d);
  const revenue30d = sales30d * price;
  const margin30d = sales30d * (price - p.cost);
  const returnRate = safeDiv(returns30d, Math.max(1, sales30d));
  const fitReturnRate = safeDiv(fitReturns30d, Math.max(1, sales30d));
  const soldout = vs.filter((v) => v.stock <= 0).length;
  const low = vs.filter((v) => v.stock > 0 && daysOfStock(v) <= 4).length;
  const statuses = vs.map((v) => inventoryStatus(v, d));
  const worst: InventoryStatus = statuses.includes("soldout") ? "soldout" : statuses.includes("low") ? "low" : statuses.includes("rising") ? "rising" : statuses.includes("overstock") ? "overstock" : statuses.includes("slow") ? "slow" : statuses.includes("restock-progress") ? "restock-progress" : statuses.includes("restock-review") ? "restock-review" : statuses.includes("restocked") ? "restocked" : "normal";
  const demand = Math.max(0, ...vs.map(demandScore));
  const dos = stock <= 0 ? 0 : Math.round(stock / Math.max(0.1, sales30d / 30));
  return { product: p, variants: vs, sales7d, salesPrev7d, sales30d, stock, views7d, wishlist7d, wishlistPrev7d, cart7d, restockRequests, returns30d, fitReturns30d, incoming, price, revenue30d, margin30d, marginRate: safeDiv(price - p.cost, price), returnRate, fitReturnRate, soldout, low, worst, demand, daysOfStock: dos, velocity: safeDiv(sales7d - salesPrev7d, Math.max(1, salesPrev7d)), rankScore: sales7d * 3 + wishlist7d * 1.5 + views7d * 0.05 + cart7d };
}
export type ProductAgg = ReturnType<typeof productAgg>;
export const allProductAgg = (d: Delta) => PRODUCTS.map((p) => productAgg(p, d));

/* ------------------------------ Period KPI ------------------------------ */
export type Period = "today" | "7d" | "30d" | "90d";
export const PERIOD_LABEL: Record<Period, string> = { today: "오늘", "7d": "최근 7일", "30d": "최근 30일", "90d": "최근 90일" };
const periodDays: Record<Period, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

export function periodOrders(orders: Order[], period: Period, offset = 0) {
  const days = periodDays[period];
  const end = Date.now() - offset * days * 86400000;
  const start = end - days * 86400000;
  return orders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t > start && t <= end && o.status !== "cancelled"; });
}
export function salesKpi(d: Delta, period: Period) {
  const orders = allOrders(d);
  const cur = periodOrders(orders, period), prev = periodOrders(orders, period, 1);
  const agg = (os: Order[]) => {
    const revenue = os.reduce((s, o) => s + o.total, 0);
    const units = os.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
    const discount = os.reduce((s, o) => s + o.discount, 0);
    const cost = os.reduce((s, o) => s + o.items.reduce((a, i) => a + PRODUCT_BY_ID[i.productId].cost * i.qty, 0), 0);
    const grossMargin = os.reduce((s, o) => s + o.subtotal, 0) - cost - discount;
    return { revenue, orders: os.length, units, discount, cost, grossMargin, aov: safeDiv(revenue, os.length) };
  };
  const c = agg(cur), p = agg(prev);
  const days = periodDays[period];
  const daily = DAILY.slice(-days);
  const views = daily.reduce((s, x) => s + x.views, 0) + Object.values(d.viewDelta).reduce((s, x) => s + x, 0);
  const conversion = safeDiv(c.orders, Math.max(1, Math.round(views / 3.2)));
  const buyers = new Map<string, number>();
  for (const o of orders) if (o.status !== "cancelled") buyers.set(o.customerId, (buyers.get(o.customerId) ?? 0) + 1);
  const repeat = safeDiv([...buyers.values()].filter((n) => n >= 2).length, Math.max(1, buyers.size));
  const rets = allReturns(d).filter((r) => Date.now() - new Date(r.createdAt).getTime() <= days * 86400000);
  const returnRate = safeDiv(rets.length, Math.max(1, c.units));
  const fitReturnRate = safeDiv(rets.filter((r) => r.reason === "size-small" || r.reason === "size-large" || r.reason === "fit").length, Math.max(1, c.units));
  return { period, cur: c, prev: p, conversion, repeat, returnRate, fitReturnRate, returns: rets.length, views };
}

export function inventoryKpi(d: Delta) {
  const aggs = allProductAgg(d);
  const vs = VARIANTS.map((v) => effVariant(v, d));
  const lowRisk = vs.filter((v) => { const s = inventoryStatus(v, d); return s === "low" || s === "soldout"; }).length;
  const rising = vs.filter((v) => inventoryStatus(v, d) === "rising").length;
  const slowValue = aggs.filter((a) => a.worst === "slow" || a.worst === "overstock").reduce((s, a) => s + a.stock * a.product.cost, 0);
  const totalStockValue = aggs.reduce((s, a) => s + a.stock * a.product.cost, 0);
  const sold30 = aggs.reduce((s, a) => s + a.sales30d, 0);
  const sellThrough = safeDiv(sold30, sold30 + aggs.reduce((s, a) => s + a.stock, 0));
  const restockRequests = vs.reduce((s, v) => s + v.restockRequests, 0);
  const lostSales = vs.filter((v) => v.stock <= 0).reduce((s, v) => s + dailySales(v) * 7 * effPrice(PRODUCT_BY_ID[v.productId], d), 0);
  return { lowRisk, rising, slowValue, totalStockValue, sellThrough, restockRequests, lostSales7d: lostSales, variants: vs.length };
}

export function customerKpi(d: Delta) {
  const orders = allOrders(d);
  const buyers = new Set(orders.filter((o) => o.status !== "cancelled").map((o) => o.customerId));
  const newCust30 = CUSTOMERS.filter((c) => Date.now() - new Date(c.joinedAt).getTime() <= 30 * 86400000).length;
  const withProfile = CUSTOMERS.filter((c) => c.hasFitProfile).length;
  const segments = Object.fromEntries((["first-purchase", "wish-no-buy", "restock-waiting", "cycle-due", "brand-loyal", "post-return-drop", "vip"] as SegmentId[]).map((s) => [s, CUSTOMERS.filter((c) => c.segment === s).length])) as Record<SegmentId, number>;
  return { total: CUSTOMERS.length, buyers: buyers.size, newCust30, profileRate: safeDiv(withProfile, CUSTOMERS.length), segments };
}

export function actionKpi(actions: AppState["actions"]) {
  const created = actions.length;
  const done = actions.filter((a) => a.status === "done").length;
  const open = actions.filter((a) => a.status === "recommended" || a.status === "confirmed" || a.status === "in-progress").length;
  const high = actions.filter((a) => a.urgency === "high" && a.status !== "done" && a.status !== "dismissed").length;
  return { created, done, open, high, executionRate: safeDiv(done, Math.max(1, created)) };
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = { pending: "결제대기(DEMO)", preparing: "상품준비중", shipped: "출고완료", "in-transit": "배송중", delivered: "배송완료", cancelled: "취소", "return-requested": "반품요청", "exchange-requested": "교환요청" };
export const ORDER_STATUS_FLOW: OrderStatus[] = ["pending", "preparing", "shipped", "in-transit", "delivered"];

export const productSeries = (productId: string) => PRODUCT_DAILY_BY_ID[productId]?.series ?? [];
