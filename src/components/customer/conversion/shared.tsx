"use client";
/* ------------------------------------------------------------------
   Customer Conversion — shared helpers (local to this area).
   Foundation files (src/lib/*) are not modified; anything missing is
   computed here.
------------------------------------------------------------------- */
import { useEffect, useState } from "react";
import type { Fit, Order, OrderStatus, Product, SizingTendency, Variant } from "@/lib/types";
import type { AppState } from "@/lib/store";
import type { Tone } from "@/components/ui/Badge";
import { DEMO_CUSTOMER_ID, PRODUCT_BY_ID, VARIANT_BY_ID, variantId } from "@/lib/demo/seed";
import { allOrders, effVariant, effVariants, inventoryStatus } from "@/lib/kpi";
import { hashStr, mulberry32, pick, randInt } from "@/lib/demo/rng";
import { isoDaysAgo } from "@/lib/dates";

/* ------------------------------ Labels ------------------------------ */
export const FIT_LABEL: Record<Fit, string> = { slim: "슬림핏", regular: "레귤러핏", relaxed: "릴랙스핏", oversized: "오버핏" };
export const FIT_DESC: Record<Fit, string> = { slim: "몸에 붙는 실루엣", regular: "표준 실루엣", relaxed: "여유 있는 실루엣", oversized: "넉넉하게 떨어지는 실루엣" };
export const SIZING_LABEL: Record<SizingTendency, string> = { small: "작게 나옴", true: "정사이즈", large: "크게 나옴" };
export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL"];
export const PREFERRED_FIT_OPTIONS: { value: Fit; label: string }[] = [
  { value: "slim", label: "슬림" }, { value: "regular", label: "레귤러" }, { value: "relaxed", label: "릴랙스" }, { value: "oversized", label: "오버핏" },
];

/* ------------------------------ Shipping / coupon ------------------------------ */
export const FREE_SHIP_MIN = 50000;
export const SHIP_FEE = 3000;
export const shippingFeeFor = (subtotal: number) => (subtotal >= FREE_SHIP_MIN ? 0 : SHIP_FEE);
export interface Coupon { code: string; label: string; rate: number; desc: string }
export const COUPONS: Coupon[] = [
  { code: "", label: "쿠폰 없음", rate: 0, desc: "" },
  { code: "WELCOME5", label: "WELCOME5 · 5% 할인", rate: 5, desc: "첫 구매 감사 쿠폰 (DEMO)" },
  { code: "FIT10", label: "FIT10 · 10% 할인", rate: 10, desc: "핏 프로필 완성 쿠폰 (DEMO)" },
];
export const couponByCode = (code: string | null | undefined): Coupon => COUPONS.find((c) => c.code === (code ?? "")) ?? COUPONS[0];
/** 스토어 placeOrder와 동일한 계산: 100원 단위 절사 */
export const couponDiscount = (subtotal: number, rate: number) => Math.round((subtotal * rate) / 100 / 100) * 100;

/** 예상 도착일 (내일 = 무료배송 상품 / 모레 = 유료배송) */
export function etaLabel(free: boolean) {
  const d = new Date(); d.setDate(d.getDate() + (free ? 1 : 2));
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${free ? "내일" : "모레"}(${d.getMonth() + 1}/${d.getDate()} ${dow}) 도착 예정`;
}

/* ------------------------------ Variant / stock ------------------------------ */
type StoreLike = Pick<AppState, "viewDelta" | "wishlistDelta" | "cartDelta" | "restockDelta" | "inventoryDelta" | "returnDelta" | "salePriceOverride" | "fitNoteOverride" | "variantRestockState" | "orderStatusOverride" | "orders" | "returns">;

export type StockKey = "normal" | "rising" | "low" | "soldout" | "review" | "progress" | "restocked";
export interface StockState { key: StockKey; label: string; short: string; tone: Tone; purchasable: boolean; stock: number }

/** 고객 화면용 재고 상태 — 내부용 상태(과잉·저회전)는 '정상'으로 보여준다. */
export function stockState(v: Variant, store: StoreLike): StockState {
  const ev = effVariant(v, store);
  const st = inventoryStatus(ev, store);
  const stock = ev.stock;
  const purchasable = stock > 0;
  if (st === "restocked") return { key: "restocked", label: "입고 완료", short: "입고", tone: "success", purchasable, stock };
  if (st === "restock-progress") return { key: "progress", label: purchasable ? `재입고 진행중 · 남은 재고 ${stock}개` : "재입고 진행중", short: "재입고 진행", tone: "info", purchasable, stock };
  if (st === "restock-review") return { key: "review", label: purchasable ? `재입고 검토중 · 남은 재고 ${stock}개` : "재입고 검토중", short: "재입고 검토", tone: "info", purchasable, stock };
  if (!purchasable) return { key: "soldout", label: "품절", short: "품절", tone: "error", purchasable, stock };
  if (st === "low") return { key: "low", label: `품절 임박 · 재고 ${stock}개`, short: `품절 임박 ${stock}개`, tone: "warning", purchasable, stock };
  if (st === "rising") return { key: "rising", label: "관심 상승 · 정상", short: "관심 상승", tone: "accent", purchasable, stock };
  return { key: "normal", label: "정상", short: "정상", tone: "neutral", purchasable, stock };
}

/** 상품 전체의 대표(최악) 재고 상태 — 찜 목록 배지용 */
export function productStockState(p: Product, store: StoreLike): StockState {
  const states = effVariants(p.id, store).map((v) => stockState(v, store));
  const order: StockKey[] = ["soldout", "low", "progress", "review", "restocked", "rising", "normal"];
  for (const k of order) { const hit = states.find((s) => s.key === k); if (hit) return k === "soldout" && states.some((s) => s.purchasable) ? { ...hit, label: "일부 옵션 품절", short: "일부 품절", tone: "warning" } : hit; }
  return states[0] ?? { key: "normal", label: "정상", short: "정상", tone: "neutral", purchasable: true, stock: 0 };
}

export const findVariant = (productId: string, colorIdx: number | null, size: string | null): Variant | null => {
  if (colorIdx === null || !size) return null;
  return VARIANT_BY_ID[variantId(productId, colorIdx, size)] ?? null;
};
export const parseVariant = (vid: string) => {
  const v = VARIANT_BY_ID[vid];
  if (!v) return null;
  const p = PRODUCT_BY_ID[v.productId];
  return { variant: v, product: p, colorIdx: Math.max(0, p.colors.indexOf(v.color)) };
};
export const optionLabel = (vid: string | null | undefined) => { const v = vid ? VARIANT_BY_ID[vid] : null; return v ? `${v.color} · ${v.size}` : null; };
export const productHref = (vid: string) => { const v = VARIANT_BY_ID[vid]; return v ? `/products/${v.productId}?color=${encodeURIComponent(v.color)}&size=${encodeURIComponent(v.size)}` : "/"; };

/* ------------------------------ Orders ------------------------------ */
export const myOrders = (store: Pick<AppState, "orders" | "orderStatusOverride">): Order[] => allOrders(store).filter((o) => o.customerId === DEMO_CUSTOMER_ID);
export function orderSummary(o: Order) {
  const first = PRODUCT_BY_ID[o.items[0]?.productId];
  const qty = o.items.reduce((s, i) => s + i.qty, 0);
  return first ? (o.items.length > 1 ? `${first.name} 외 ${o.items.length - 1}건` : `${first.name}${qty > 1 ? ` × ${qty}` : ""}`) : "상품 없음";
}
export const ORDER_FILTERS: { key: "all" | OrderStatus | "active" | "after"; label: string }[] = [
  { key: "all", label: "전체" }, { key: "active", label: "진행중" }, { key: "delivered", label: "배송완료" }, { key: "after", label: "취소·반품·교환" },
];
export function filterOrders(orders: Order[], key: (typeof ORDER_FILTERS)[number]["key"]) {
  if (key === "all") return orders;
  if (key === "active") return orders.filter((o) => ["pending", "preparing", "shipped", "in-transit"].includes(o.status));
  if (key === "after") return orders.filter((o) => ["cancelled", "return-requested", "exchange-requested"].includes(o.status));
  return orders.filter((o) => o.status === key);
}

/* ------------------------------ Demo reviews (deterministic) ------------------------------ */
export interface DemoReview { id: string; name: string; height: number; weight: number; bodyType: string; size: string; color: string; rating: number; text: string; at: string; helpful: number }
const REVIEWER = ["김*연", "이*우", "박*준", "최*윤", "정*린", "강*아", "조*우", "윤*민", "장*진", "임*현", "한*호", "오*원"];
const BODY = ["보통 체형", "마른 체형", "어깨 넓은 체형", "골반 있는 체형", "상체 발달", "하체 발달"];
const TEXT_BY_SIZING: Record<SizingTendency, string[]> = {
  small: ["평소 사이즈로 샀더니 조금 타이트해요. 한 치수 크게 가는 게 맞는 것 같아요.", "안내대로 한 치수 크게 골랐더니 딱 맞아요. 원단 질감이 좋습니다.", "작게 나온다는 후기 보고 업사이즈 했는데 정답이었어요.", "허리가 살짝 조이는 느낌이라 다음엔 한 치수 크게 살 예정입니다."],
  true: ["정사이즈라 평소대로 샀는데 잘 맞아요. 사진이랑 색감도 비슷합니다.", "핏 추천 그대로 골랐더니 편하게 맞습니다. 재구매 의사 있어요.", "실측 보고 골랐는데 총장·어깨 다 표기랑 같았어요.", "고민 없이 평소 사이즈 추천드려요. 마감이 깔끔합니다."],
  large: ["크게 나와서 한 치수 작게 샀는데 세미 오버핏으로 예쁘게 떨어져요.", "평소 사이즈로 사면 확실히 넉넉합니다. 오버핏 좋아하면 그대로 가세요.", "안내대로 다운사이즈 했더니 딱 원하던 실루엣이에요.", "품이 넉넉해서 레이어드하기 좋아요. 기장은 표기와 같았습니다."],
};
export function demoReviews(p: Product): DemoReview[] {
  const r = mulberry32(hashStr(p.id + ":reviews"));
  const n = randInt(r, 4, 6);
  const isShoe = p.categoryId === "shoes";
  const women = p.gender === "women";
  return Array.from({ length: n }).map((_, i) => {
    const height = women ? randInt(r, 155, 172) : p.gender === "men" ? randInt(r, 168, 185) : randInt(r, 158, 183);
    const weight = Math.round(height - randInt(r, 100, 118));
    const rating = r() < 0.72 ? 5 : r() < 0.8 ? 4 : 3;
    const text = isShoe ? pick(r, ["발볼이 넓은 편인데 5mm 크게 신으니 편해요.", "평소 신는 사이즈 그대로 잘 맞습니다.", "가볍고 쿠션감이 좋아요. 정사이즈 추천.", "처음엔 조금 타이트했는데 며칠 신으니 길들여졌어요."]) : p.categoryId === "bag" || p.categoryId === "acc" ? pick(r, ["사진보다 실물이 더 고급스러워요.", "크기가 딱 실용적이에요. 매일 쓰고 있습니다.", "마감이 깔끔하고 색상도 사진과 같아요.", "선물용으로 샀는데 반응이 좋았어요."]) : pick(r, TEXT_BY_SIZING[p.sizing]);
    return { id: `${p.id}-rv-${i}`, name: pick(r, REVIEWER), height, weight, bodyType: pick(r, BODY), size: pick(r, p.sizes), color: pick(r, p.colors), rating, text, at: isoDaysAgo(randInt(r, 2, 60), randInt(r, 9, 22)), helpful: randInt(r, 0, 38) };
  });
}

/* ------------------------------ Local prefs ------------------------------ */
/** localStorage-backed preference (per viewer). Reads after mount to avoid SSR mismatch. */
export function useLocalPref<T>(key: string, initial: T): [T, (v: T) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const raw = window.localStorage.getItem(key); if (raw) setValue({ ...initial, ...JSON.parse(raw) }); } catch { /* ignore */ }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = (v: T) => { setValue(v); try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } };
  return [value, update, loaded];
}
export interface NotifyPrefs { restock: boolean; order: boolean; recommend: boolean }
export const NOTIFY_KEY = "morfit-notify-prefs";
export const DEFAULT_NOTIFY: NotifyPrefs = { restock: true, order: true, recommend: true };
export const INTERESTS_KEY = "morfit-interests";

export function useDocumentTitle(title: string) {
  useEffect(() => { document.title = `${title} | MORFIT`; }, [title]);
}
