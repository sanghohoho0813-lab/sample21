"use client";
/* ------------------------------------------------------------------
   MORFIT Shared Demo Store — Customer Front와 Business AX가 같은 상태를
   공유한다. 이것이 Closed Data Loop의 기술적 기반이다.
   Seed(정적) + Delta(변경분)를 합쳐 화면에 보여주며, localStorage에 유지된다.
   Supabase 전환 시 이 파일의 action 구현만 repository 호출로 교체한다.
------------------------------------------------------------------- */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ActionStatus, AXAction, CartItem, EvidenceLog, EvidenceType, EventName, FitProfile, Notification,
  Order, OrderStatus, RestockSubscription, ReturnReason, ReturnRequest, Role, TrackedEvent,
} from "./types";
import type { ThemeId } from "./theme";
import { DEFAULT_THEME } from "./theme";
import {
  SEED_ACTIONS, SEED_EVIDENCE, SEED_ORDERS, PRODUCT_BY_ID, VARIANT_BY_ID, DEMO_CUSTOMER_ID, DEMO_CUSTOMER_NAME, CAMPAIGNS,
} from "./demo/seed";

export type FontScale = "small" | "default" | "large";
export interface WishItem { productId: string; variantId: string | null; addedAt: string }

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

export const ROLE_LABEL: Record<Role, string> = { owner: "대표", md: "MD", ops: "운영직원", customer: "고객" };
export const ROLE_NAME: Record<Role, string> = { owner: "정우성 대표", md: "박지원 MD", ops: "김민재 운영", customer: DEMO_CUSTOMER_NAME };

export interface AppState {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  // ----- Settings / System Core
  theme: ThemeId; fontScale: FontScale; reducedMotion: boolean; role: Role;
  tutorialDone: boolean; customerTourDone: boolean; deviceOverride: "auto" | "desktop" | "mobile";
  setTheme: (t: ThemeId) => void; setFontScale: (f: FontScale) => void; setReducedMotion: (v: boolean) => void; setRole: (r: Role) => void;
  setTutorialDone: (v: boolean) => void; setCustomerTourDone: (v: boolean) => void;
  // ----- Customer state
  fitProfile: FitProfile; updateFitProfile: (p: Partial<FitProfile>) => void;
  wishlist: WishItem[]; toggleWishlist: (productId: string, variantId?: string | null) => boolean; removeWishlist: (productId: string) => void;
  restockSubs: RestockSubscription[]; subscribeRestock: (variantId: string) => RestockSubscription; cancelRestock: (id: string) => void;
  cart: CartItem[]; addToCart: (variantId: string, qty?: number) => void; updateCartQty: (variantId: string, qty: number) => void; removeFromCart: (variantId: string) => void; clearCart: () => void;
  recentlyViewed: string[]; pushRecentlyViewed: (productId: string) => void;
  orders: Order[]; placeOrder: (input: { address: string; memo?: string; couponRate?: number; payment: string }) => Order;
  returns: ReturnRequest[]; requestReturn: (orderId: string, variantId: string, reason: ReturnReason, note?: string) => ReturnRequest;
  events: TrackedEvent[]; track: (name: EventName, meta?: { productId?: string; variantId?: string; [k: string]: string | number | undefined }) => void;
  notifications: Notification[]; pushNotification: (n: Omit<Notification, "id" | "at" | "read">) => void; markRead: (id: string) => void; markAllRead: () => void;
  // ----- Deltas (Customer Event → AX 반영)
  viewDelta: Record<string, number>; wishlistDelta: Record<string, number>; cartDelta: Record<string, number>;
  restockDelta: Record<string, number>; inventoryDelta: Record<string, number>; returnDelta: Record<string, number>;
  salePriceOverride: Record<string, number>; fitNoteOverride: Record<string, string>;
  variantRestockState: Record<string, "review" | "progress" | "restocked">;
  orderStatusOverride: Record<string, { status: OrderStatus; history: Order["statusHistory"] }>;
  campaignStatusOverride: Record<string, "scheduled" | "running" | "ended">;
  // ----- AX
  actions: AXAction[]; updateActionStatus: (id: string, status: ActionStatus, actor: string, note?: string) => void;
  evidence: EvidenceLog[]; addEvidence: (e: Omit<EvidenceLog, "id" | "at"> & { at?: string }) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, actor: string) => void;
  // ----- Demo
  resetDemo: () => void;
  lastResetAt: string | null;
}

const initialCustomer = () => ({
  fitProfile: { height: null, weight: null, topSize: null, bottomSize: null, preferredFit: null, bodyType: null } as FitProfile,
  wishlist: [
    { productId: "p-aerno-coat", variantId: null, addedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { productId: "p-mellow-knitdress", variantId: null, addedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  ] as WishItem[],
  restockSubs: [] as RestockSubscription[],
  cart: [] as CartItem[],
  recentlyViewed: [] as string[],
  orders: [] as Order[],
  returns: [] as ReturnRequest[],
  events: [] as TrackedEvent[],
  notifications: [
    { id: "n-seed-1", title: "주문이 배송 완료되었습니다", body: "헤비 코튼 크루넥 스웻셔츠 · 그레이 · S", at: new Date(Date.now() - 41 * 86400000).toISOString(), read: true, kind: "order" as const, href: "/my/orders/MF-ME-001" },
  ] as Notification[],
  viewDelta: {}, wishlistDelta: {}, cartDelta: {}, restockDelta: {}, inventoryDelta: {}, returnDelta: {},
  salePriceOverride: {}, fitNoteOverride: {}, variantRestockState: {}, orderStatusOverride: {}, campaignStatusOverride: {},
  actions: structuredClone(SEED_ACTIONS),
  evidence: structuredClone(SEED_EVIDENCE),
});

const noopStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      theme: DEFAULT_THEME, fontScale: "default", reducedMotion: false, role: "owner",
      tutorialDone: false, customerTourDone: false, deviceOverride: "auto",
      setTheme: (theme) => set({ theme }), setFontScale: (fontScale) => set({ fontScale }), setReducedMotion: (reducedMotion) => set({ reducedMotion }), setRole: (role) => set({ role }),
      setTutorialDone: (tutorialDone) => set({ tutorialDone }), setCustomerTourDone: (customerTourDone) => set({ customerTourDone }),
      ...initialCustomer(),
      lastResetAt: null,

      updateFitProfile: (p) => {
        const next = { ...get().fitProfile, ...p, updatedAt: nowIso() };
        set({ fitProfile: next });
        if (next.height && next.weight && next.topSize && next.bottomSize) get().track("complete_fit_profile");
      },

      toggleWishlist: (productId, variantId = null) => {
        const { wishlist, wishlistDelta } = get();
        const exists = wishlist.some((w) => w.productId === productId);
        if (exists) {
          set({ wishlist: wishlist.filter((w) => w.productId !== productId), wishlistDelta: { ...wishlistDelta, [productId]: (wishlistDelta[productId] ?? 0) - 1 } });
          get().track("remove_wishlist", { productId });
          return false;
        }
        set({ wishlist: [{ productId, variantId, addedAt: nowIso() }, ...wishlist], wishlistDelta: { ...wishlistDelta, [productId]: (wishlistDelta[productId] ?? 0) + 1 } });
        get().track("add_wishlist", { productId, variantId: variantId ?? undefined });
        return true;
      },
      removeWishlist: (productId) => { const { wishlist } = get(); if (wishlist.some((w) => w.productId === productId)) get().toggleWishlist(productId); },

      subscribeRestock: (variantId) => {
        const existing = get().restockSubs.find((s) => s.variantId === variantId && s.status === "waiting");
        if (existing) return existing;
        const v = VARIANT_BY_ID[variantId];
        const sub: RestockSubscription = { id: uid("rs"), variantId, productId: v.productId, createdAt: nowIso(), status: "waiting" };
        set((s) => ({ restockSubs: [sub, ...s.restockSubs], restockDelta: { ...s.restockDelta, [variantId]: (s.restockDelta[variantId] ?? 0) + 1 } }));
        get().track("subscribe_restock", { productId: v.productId, variantId });
        const p = PRODUCT_BY_ID[v.productId];
        get().addEvidence({ type: "CUSTOMER", title: `재입고 알림 신청 · ${p.name} ${v.color} ${v.size}`, detail: `고객 ${DEMO_CUSTOMER_NAME}이 품절 옵션의 재입고 알림을 신청했습니다. Demand Radar 수요신호에 즉시 반영됩니다.`, actor: DEMO_CUSTOMER_NAME, productId: p.id, customerId: DEMO_CUSTOMER_ID, source: "DEMO", status: "demo" });
        return sub;
      },
      cancelRestock: (id) => set((s) => {
        const sub = s.restockSubs.find((x) => x.id === id);
        return { restockSubs: s.restockSubs.filter((x) => x.id !== id), restockDelta: sub ? { ...s.restockDelta, [sub.variantId]: (s.restockDelta[sub.variantId] ?? 0) - 1 } : s.restockDelta };
      }),

      addToCart: (variantId, qty = 1) => {
        const v = VARIANT_BY_ID[variantId];
        set((s) => {
          const found = s.cart.find((c) => c.variantId === variantId);
          const cart = found ? s.cart.map((c) => (c.variantId === variantId ? { ...c, qty: Math.min(9, c.qty + qty) } : c)) : [...s.cart, { variantId, productId: v.productId, qty }];
          return { cart, cartDelta: { ...s.cartDelta, [variantId]: (s.cartDelta[variantId] ?? 0) + qty } };
        });
        get().track("add_to_cart", { productId: v.productId, variantId });
      },
      updateCartQty: (variantId, qty) => set((s) => ({ cart: s.cart.map((c) => (c.variantId === variantId ? { ...c, qty: Math.max(1, Math.min(9, qty)) } : c)) })),
      removeFromCart: (variantId) => set((s) => ({ cart: s.cart.filter((c) => c.variantId !== variantId) })),
      clearCart: () => set({ cart: [] }),

      pushRecentlyViewed: (productId) => set((s) => ({ recentlyViewed: [productId, ...s.recentlyViewed.filter((p) => p !== productId)].slice(0, 12), viewDelta: { ...s.viewDelta, [productId]: (s.viewDelta[productId] ?? 0) + 1 } })),

      placeOrder: ({ address, memo, couponRate = 0, payment }) => {
        const { cart } = get();
        const items = cart.map((c) => { const p = PRODUCT_BY_ID[c.productId]; const price = get().salePriceOverride[p.id] ?? p.salePrice ?? p.price; return { variantId: c.variantId, productId: c.productId, qty: c.qty, unitPrice: price, discount: p.price - price }; });
        const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
        const coupon = Math.round(subtotal * couponRate / 100) * 100;
        const shippingFee = subtotal >= 50000 ? 0 : 3000;
        const total = subtotal - coupon + shippingFee;
        const at = nowIso();
        const d = new Date();
        const id = `MF${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(get().orders.length + 1).padStart(2, "0")}${Math.floor(Math.random() * 90 + 10)}`;
        const order: Order = { id, customerId: DEMO_CUSTOMER_ID, customerName: DEMO_CUSTOMER_NAME, createdAt: at, status: "pending", items, subtotal, discount: coupon + items.reduce((s, i) => s + i.discount * i.qty, 0), shippingFee, total, channel: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "web", address, memo: memo ? `${memo} · 결제수단(DEMO): ${payment}` : `결제수단(DEMO): ${payment}`, source: "DEMO", statusHistory: [{ status: "pending", at, actor: DEMO_CUSTOMER_NAME }] };
        set((s) => {
          const inv = { ...s.inventoryDelta };
          for (const it of items) inv[it.variantId] = (inv[it.variantId] ?? 0) - it.qty;
          return { orders: [order, ...s.orders], cart: [], inventoryDelta: inv };
        });
        get().track("complete_demo_order", { orderId: id, total });
        get().pushNotification({ title: "DEMO 주문이 접수되었습니다", body: `주문번호 ${id} · ${items.length}개 상품 · 운영팀 확인 후 상품준비로 전환됩니다.`, kind: "order", href: `/my/orders/${id}` });
        get().addEvidence({ type: "CUSTOMER", title: `DEMO 주문 접수 ${id}`, detail: `${DEMO_CUSTOMER_NAME} 고객 주문 ${items.length}건 · 합계 ${total.toLocaleString("ko-KR")}원. 주문·매출·재고에 즉시 반영되었습니다.`, actor: DEMO_CUSTOMER_NAME, orderId: id, customerId: DEMO_CUSTOMER_ID, source: "DEMO", status: "demo" });
        return order;
      },

      requestReturn: (orderId, variantId, reason, note) => {
        const v = VARIANT_BY_ID[variantId];
        const rr: ReturnRequest = { id: uid("RT"), orderId, customerId: DEMO_CUSTOMER_ID, productId: v.productId, variantId, reason, createdAt: nowIso(), status: "requested", note };
        set((s) => ({ returns: [rr, ...s.returns], returnDelta: { ...s.returnDelta, [variantId]: (s.returnDelta[variantId] ?? 0) + 1 } }));
        get().updateOrderStatus(orderId, "return-requested", DEMO_CUSTOMER_NAME);
        get().track("request_return", { productId: v.productId, variantId, reason });
        const p = PRODUCT_BY_ID[v.productId];
        get().addEvidence({ type: "RISK", title: `반품 요청 · ${p.name} (${reason})`, detail: `고객 반품 사유가 구조화되어 Fit Risk 계산에 반영되었습니다.`, actor: DEMO_CUSTOMER_NAME, productId: p.id, orderId, source: "DEMO", status: "demo" });
        return rr;
      },

      track: (name, meta) => set((s) => ({ events: [{ id: uid("ev"), name, at: nowIso(), productId: meta?.productId, variantId: meta?.variantId, meta: meta as Record<string, string | number> | undefined }, ...s.events].slice(0, 400) })),

      pushNotification: (n) => set((s) => ({ notifications: [{ ...n, id: uid("n"), at: nowIso(), read: false }, ...s.notifications].slice(0, 50) })),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      addEvidence: (e) => set((s) => ({ evidence: [{ ...e, id: uid("evd"), at: e.at ?? nowIso() } as EvidenceLog, ...s.evidence] })),

      updateActionStatus: (id, status, actor, note) => {
        const action = get().actions.find((a) => a.id === id);
        if (!action) return;
        const at = nowIso();
        set((s) => ({ actions: s.actions.map((a) => (a.id === id ? { ...a, status, statusHistory: [...a.statusHistory, { status, at, actor, note }], resultNote: status === "done" ? (note ?? a.resultNote ?? "실행 완료 (Demo)") : a.resultNote } : a)) }));
        const evType: EvidenceType = status === "done" ? "RESULT" : status === "dismissed" || status === "hold" ? "EXCEPTION" : "ACTION";
        const statusLabel: Record<ActionStatus, string> = { recommended: "추천됨", confirmed: "확인", "in-progress": "실행중", done: "완료", hold: "보류", dismissed: "무시" };
        get().addEvidence({ type: evType, title: `${action.title} → ${statusLabel[status]}`, detail: note ? `${actor}: ${note}` : `${actor}이(가) Action 상태를 '${statusLabel[status]}'(으)로 변경했습니다.`, actor, actionId: id, productId: action.productId, source: "DEMO", status: "demo" });

        // ---- Side effects: the loop closes back to the customer ----
        if (action.type === "restock" || action.type === "rebalance") {
          const vid = action.variantId;
          if (vid) {
            if (status === "confirmed") set((s) => ({ variantRestockState: { ...s.variantRestockState, [vid]: "review" } }));
            if (status === "in-progress") set((s) => ({ variantRestockState: { ...s.variantRestockState, [vid]: "progress" } }));
            if (status === "done") {
              const qty = action.quantity ?? 20;
              set((s) => ({ inventoryDelta: { ...s.inventoryDelta, [vid]: (s.inventoryDelta[vid] ?? 0) + qty }, variantRestockState: { ...s.variantRestockState, [vid]: "restocked" } }));
              const waiting = get().restockSubs.filter((r) => r.variantId === vid && r.status === "waiting");
              if (waiting.length) {
                set((s) => ({ restockSubs: s.restockSubs.map((r) => (r.variantId === vid && r.status === "waiting" ? { ...r, status: "notified", notifiedAt: at } : r)) }));
                const v = VARIANT_BY_ID[vid]; const p = PRODUCT_BY_ID[v.productId];
                get().pushNotification({ title: "기다리던 상품이 재입고되었습니다", body: `${p.name} · ${v.color} · ${v.size} 옵션이 다시 준비되었습니다. 지금 구매할 수 있어요.`, kind: "restock", href: `/products/${p.id}?color=${v.color}&size=${v.size}` });
              }
              const v = VARIANT_BY_ID[vid]; const p = PRODUCT_BY_ID[v.productId];
              get().addEvidence({ type: "RESULT", title: `${p.name} ${v.color} ${v.size} 재고 +${qty} 반영`, detail: `재입고 Action 완료 → 재고 반영 → 재입고 알림 ${waiting.length}명 발송 (고객 화면 상태 변경).`, actor, actionId: id, productId: p.id, kpiDelta: `재고 ${qty} 증가 · 알림 ${waiting.length}건`, source: "DEMO", status: "demo" });
            }
          }
        }
        if (action.type === "markdown" && status === "done" && action.productId) {
          const p = PRODUCT_BY_ID[action.productId];
          const rate = action.discountRate ?? 0.15;
          const newPrice = Math.round(p.price * (1 - rate) / 1000) * 1000;
          set((s) => ({ salePriceOverride: { ...s.salePriceOverride, [p.id]: newPrice } }));
          get().addEvidence({ type: "REVENUE", title: `${p.name} 할인 ${Math.round(rate * 100)}% 적용`, detail: `판매가 ${p.price.toLocaleString("ko-KR")}원 → ${newPrice.toLocaleString("ko-KR")}원. 고객 화면 가격과 세일 목록에 즉시 반영. 판매·마진 변화는 실증에서 비교합니다.`, actor, actionId: id, productId: p.id, kpiDelta: "BASELINE 대비 변화: VALIDATE LATER", source: "DEMO", status: "pilot-ready" });
        }
        if (action.type === "fit-guide" && status === "done" && action.productId) {
          const p = PRODUCT_BY_ID[action.productId];
          const improved = p.id === "p-plane-wide"
            ? "⚠️ 허리가 타이트하게 나온 상품입니다. 최근 구매 고객의 82%가 '사이즈 작음'으로 교환했습니다. 평소 사이즈보다 한 치수 크게 선택하세요. 논워시 원단이라 첫 세탁 후 약 1cm 추가로 줄어듭니다."
            : `${p.fitNote} (핏 안내 보강 · 실측·반품 데이터 기준)`;
          set((s) => ({ fitNoteOverride: { ...s.fitNoteOverride, [p.id]: improved } }));
          get().addEvidence({ type: "RESULT", title: `${p.name} 핏 안내 변경 반영`, detail: "상품 상세의 핏 안내와 핏 추천 규칙(+1 사이즈 보정)이 변경되었습니다. 이후 반품률 비교는 실증 단계에서 측정합니다.", actor, actionId: id, productId: p.id, kpiDelta: "Fit Return Rate: VALIDATE LATER", source: "DEMO", status: "pilot-ready" });
        }
        if (action.type === "segment-campaign" && (status === "in-progress" || status === "done")) {
          set((s) => ({ campaignStatusOverride: { ...s.campaignStatusOverride, "cp-06": status === "done" ? "ended" : "running" } }));
          if (action.segment === "cycle-due") {
            get().pushNotification({ title: "AERNO 신상품, 다시 만나볼 시간이에요", body: "지난 구매 이후 45일이 지났어요. 코듀로이 워크 자켓과 릴랙스 울 코트를 7% 할인가로 추천드립니다.", kind: "recommend", href: "/my?tab=recommend" });
          }
        }
        if (action.type === "cart-reminder" && (status === "in-progress" || status === "done")) {
          get().pushNotification({ title: "장바구니에 담아둔 상품이 기다리고 있어요", body: "재고가 얼마 남지 않은 옵션이 있습니다. 지금 확인해보세요.", kind: "recommend", href: "/cart" });
        }
      },

      updateOrderStatus: (orderId, status, actor) => {
        const at = nowIso();
        const own = get().orders.find((o) => o.id === orderId);
        if (own) {
          set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status, statusHistory: [...o.statusHistory, { status, at, actor }] } : o)) }));
        } else {
          const seed = SEED_ORDERS.find((o) => o.id === orderId);
          if (!seed) return;
          set((s) => { const prev = s.orderStatusOverride[orderId]?.history ?? seed.statusHistory; return { orderStatusOverride: { ...s.orderStatusOverride, [orderId]: { status, history: [...prev, { status, at, actor }] } } }; });
        }
        const label: Record<OrderStatus, string> = { pending: "결제대기", preparing: "상품준비중", shipped: "출고완료", "in-transit": "배송중", delivered: "배송완료", cancelled: "취소", "return-requested": "반품요청", "exchange-requested": "교환요청" };
        const isMine = own || SEED_ORDERS.find((o) => o.id === orderId)?.customerId === DEMO_CUSTOMER_ID;
        if (isMine && actor !== DEMO_CUSTOMER_NAME) get().pushNotification({ title: `주문 ${orderId} · ${label[status]}`, body: status === "shipped" ? "상품이 출고되었습니다. 배송 조회를 확인하세요." : status === "delivered" ? "배송이 완료되었습니다. 사이즈는 잘 맞으셨나요?" : `주문 상태가 '${label[status]}'(으)로 변경되었습니다.`, kind: "order", href: `/my/orders/${orderId}` });
        get().addEvidence({ type: "ACTION", title: `주문 ${orderId} → ${label[status]}`, detail: `${actor}이(가) 주문 상태를 변경했습니다. 고객 My Page 주문상태에 동시에 반영됩니다.`, actor, orderId, source: "DEMO", status: "demo" });
      },

      resetDemo: () => set({ ...initialCustomer(), role: "owner", tutorialDone: false, customerTourDone: false, lastResetAt: nowIso() }),
    }),
    {
      name: "morfit-demo-v1",
      version: 3,
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : noopStorage)),
      partialize: (s) => { const { hydrated: _h, ...rest } = s; void _h; return rest as AppState; },
      migrate: (persisted, version) => (version < 3 ? ({} as AppState) : (persisted as AppState)),
      onRehydrateStorage: () => (state) => { state?.setHydrated(true); },
    },
  ),
);

/* Campaign status with override (Loop 4) */
export const campaignStatus = (id: string, override: AppState["campaignStatusOverride"]) => override[id] ?? CAMPAIGNS.find((c) => c.id === id)?.status ?? "draft";
