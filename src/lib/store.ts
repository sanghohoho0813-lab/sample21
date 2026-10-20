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
  ActionChange,
  ActionStatus,
  AXAction,
  CartItem,
  EvidenceLog,
  EvidenceType,
  EventName,
  FitProfile,
  Notification,
  Order,
  OrderStatus,
  RestockSubscription,
  ReturnReason,
  ReturnRequest,
  Role,
  TrackedEvent,
} from "./types";
import type { ThemeId } from "./theme";
import { DEFAULT_THEME } from "./theme";
import { orderAmounts } from "./pricing";
import { withPayment } from "./orderMemo";
import { repairCouponOrder } from "./migrations";
import { candidateKey, type Candidate } from "./intel/candidates";
import { approvalOf, approvalPolicy, assigneeOf, dueOf, needsApproval } from "./intel/policy";
import { snapshot } from "./intel/measure";

export interface ActionParamPatch {
  quantity?: number;
  discountRate?: number;
  assigneeName?: string;
  dueAt?: string;
}
import {
  SEED_ACTIONS,
  SEED_EVIDENCE,
  SEED_ORDERS,
  BRAND_BY_ID,
  PRODUCT_BY_ID,
  VARIANT_BY_ID,
  DEMO_CUSTOMER_ID,
  DEMO_CUSTOMER_NAME,
  CAMPAIGNS,
} from "./demo/seed";

export type FontScale = "small" | "default" | "large";
export interface WishItem {
  productId: string;
  variantId: string | null;
  addedAt: string;
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

export const ROLE_LABEL: Record<Role, string> = { owner: "대표", md: "MD", ops: "운영직원", customer: "고객" };
export const ROLE_NAME: Record<Role, string> = {
  owner: "정우성 대표",
  md: "박지원 MD",
  ops: "김민재 운영",
  customer: DEMO_CUSTOMER_NAME,
};

export interface AppState {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  // ----- Settings / System Core
  theme: ThemeId;
  fontScale: FontScale;
  reducedMotion: boolean;
  role: Role;
  tutorialDone: boolean;
  customerTourDone: boolean;
  deviceOverride: "auto" | "desktop" | "mobile";
  setTheme: (t: ThemeId) => void;
  setFontScale: (f: FontScale) => void;
  setReducedMotion: (v: boolean) => void;
  setRole: (r: Role) => void;
  setTutorialDone: (v: boolean) => void;
  setCustomerTourDone: (v: boolean) => void;
  // ----- Customer state
  fitProfile: FitProfile;
  updateFitProfile: (p: Partial<FitProfile>) => void;
  wishlist: WishItem[];
  toggleWishlist: (productId: string, variantId?: string | null) => boolean;
  removeWishlist: (productId: string) => void;
  restockSubs: RestockSubscription[];
  subscribeRestock: (variantId: string) => RestockSubscription;
  cancelRestock: (id: string) => void;
  cart: CartItem[];
  addToCart: (variantId: string, qty?: number) => void;
  updateCartQty: (variantId: string, qty: number) => void;
  removeFromCart: (variantId: string) => void;
  /** 장바구니 옵션 변경 — 자리·수량을 유지하고, 같은 옵션이 이미 있으면 합친다 */
  replaceCartItem: (fromVariantId: string, toVariantId: string) => void;
  clearCart: () => void;
  recentlyViewed: string[];
  pushRecentlyViewed: (productId: string) => void;
  orders: Order[];
  placeOrder: (input: { address: string; memo?: string; couponRate?: number; payment: string }) => Order;
  returns: ReturnRequest[];
  requestReturn: (orderId: string, variantId: string, reason: ReturnReason, note?: string) => ReturnRequest;
  events: TrackedEvent[];
  track: (
    name: EventName,
    meta?: { productId?: string; variantId?: string; [k: string]: string | number | undefined },
  ) => void;
  notifications: Notification[];
  pushNotification: (n: Omit<Notification, "id" | "at" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  // ----- Deltas (Customer Event → AX 반영)
  viewDelta: Record<string, number>;
  wishlistDelta: Record<string, number>;
  cartDelta: Record<string, number>;
  restockDelta: Record<string, number>;
  inventoryDelta: Record<string, number>;
  returnDelta: Record<string, number>;
  salePriceOverride: Record<string, number>;
  fitNoteOverride: Record<string, string>;
  variantRestockState: Record<string, "review" | "progress" | "restocked">;
  orderStatusOverride: Record<string, { status: OrderStatus; history: Order["statusHistory"] }>;
  campaignStatusOverride: Record<string, "scheduled" | "running" | "ended">;
  // ----- AX
  actions: AXAction[];
  /** 상태 변경 — 승인이 필요한 과제는 승인 전에 '실행중'으로 갈 수 없다(false 반환) */
  updateActionStatus: (id: string, status: ActionStatus, actor: string, note?: string) => boolean;
  /** 신호 엔진 후보를 실행 센터 과제로 등록 */
  createActionFromCandidate: (c: Candidate, actor: string) => string;
  /** 수량·할인율·담당자·기한 변경 — 변경 이력과 증빙을 남긴다 */
  updateActionParams: (id: string, patch: ActionParamPatch, actor: string, note?: string) => void;
  /** 정책상 필요한 승인 */
  approveAction: (id: string, actor: string) => void;
  evidence: EvidenceLog[];
  addEvidence: (e: Omit<EvidenceLog, "id" | "at"> & { at?: string }) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, actor: string) => void;
  // ----- Demo
  resetDemo: () => void;
  lastResetAt: string | null;
}

const initialCustomer = () => ({
  fitProfile: {
    height: null,
    weight: null,
    topSize: null,
    bottomSize: null,
    preferredFit: null,
    bodyType: null,
  } as FitProfile,
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
    {
      id: "n-seed-1",
      title: "주문이 배송 완료되었습니다",
      body: "헤비 코튼 크루넥 스웻셔츠 · 그레이 · S",
      at: new Date(Date.now() - 41 * 86400000).toISOString(),
      read: true,
      kind: "order" as const,
      href: "/my/orders/MF-ME-001",
    },
  ] as Notification[],
  viewDelta: {},
  wishlistDelta: {},
  cartDelta: {},
  restockDelta: {},
  inventoryDelta: {},
  returnDelta: {},
  salePriceOverride: {},
  fitNoteOverride: {},
  variantRestockState: {},
  orderStatusOverride: {},
  campaignStatusOverride: {},
  actions: withSeedBaselines(structuredClone(SEED_ACTIONS)),
  evidence: structuredClone(SEED_EVIDENCE),
});

/** 시연 시작 시 이미 검토·실행 중인 시나리오 과제는 그 시점(데모 시작) 지표를 '전'으로 둔다.
 *  데모 이전에 끝난 과제는 전/후를 만들지 않는다(꾸민 성과 방지). */
function withSeedBaselines(actions: AXAction[]): AXAction[] {
  const empty = {
    viewDelta: {},
    wishlistDelta: {},
    cartDelta: {},
    restockDelta: {},
    inventoryDelta: {},
    returnDelta: {},
    salePriceOverride: {},
    fitNoteOverride: {},
    variantRestockState: {},
    orderStatusOverride: {},
    orders: [],
    returns: [],
    restockSubs: [],
    fitProfile: { height: null, weight: null, topSize: null, bottomSize: null, preferredFit: null, bodyType: null },
    notifications: [],
    campaignStatusOverride: {},
  } as unknown as Parameters<typeof snapshot>[1];
  return actions.map((a) =>
    (a.status === "confirmed" || a.status === "in-progress") && !a.baseline
      ? {
          ...a,
          baseline: {
            at: a.statusHistory.find((h) => h.status === "confirmed")?.at ?? a.recommendedAt,
            metrics: snapshot(a, empty),
          },
        }
      : a,
  );
}

const noopStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      theme: DEFAULT_THEME,
      fontScale: "default",
      reducedMotion: false,
      role: "owner",
      tutorialDone: false,
      customerTourDone: false,
      deviceOverride: "auto",
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setRole: (role) => set({ role }),
      setTutorialDone: (tutorialDone) => set({ tutorialDone }),
      setCustomerTourDone: (customerTourDone) => set({ customerTourDone }),
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
          set({
            wishlist: wishlist.filter((w) => w.productId !== productId),
            wishlistDelta: { ...wishlistDelta, [productId]: (wishlistDelta[productId] ?? 0) - 1 },
          });
          get().track("remove_wishlist", { productId });
          return false;
        }
        set({
          wishlist: [{ productId, variantId, addedAt: nowIso() }, ...wishlist],
          wishlistDelta: { ...wishlistDelta, [productId]: (wishlistDelta[productId] ?? 0) + 1 },
        });
        get().track("add_wishlist", { productId, variantId: variantId ?? undefined });
        return true;
      },
      removeWishlist: (productId) => {
        const { wishlist } = get();
        if (wishlist.some((w) => w.productId === productId)) get().toggleWishlist(productId);
      },

      subscribeRestock: (variantId) => {
        const existing = get().restockSubs.find((s) => s.variantId === variantId && s.status === "waiting");
        if (existing) return existing;
        const v = VARIANT_BY_ID[variantId];
        const sub: RestockSubscription = {
          id: uid("rs"),
          variantId,
          productId: v.productId,
          createdAt: nowIso(),
          status: "waiting",
        };
        set((s) => ({
          restockSubs: [sub, ...s.restockSubs],
          restockDelta: { ...s.restockDelta, [variantId]: (s.restockDelta[variantId] ?? 0) + 1 },
        }));
        get().track("subscribe_restock", { productId: v.productId, variantId });
        const p = PRODUCT_BY_ID[v.productId];
        get().addEvidence({
          type: "CUSTOMER",
          title: `재입고 알림 신청 · ${p.name} ${v.color} ${v.size}`,
          detail: `고객 ${DEMO_CUSTOMER_NAME}이 품절 옵션의 재입고 알림을 신청했습니다. 수요 레이더 수요신호에 즉시 반영됩니다.`,
          actor: DEMO_CUSTOMER_NAME,
          productId: p.id,
          customerId: DEMO_CUSTOMER_ID,
          source: "DEMO",
          status: "demo",
        });
        return sub;
      },
      cancelRestock: (id) =>
        set((s) => {
          const sub = s.restockSubs.find((x) => x.id === id);
          return {
            restockSubs: s.restockSubs.filter((x) => x.id !== id),
            restockDelta: sub
              ? { ...s.restockDelta, [sub.variantId]: (s.restockDelta[sub.variantId] ?? 0) - 1 }
              : s.restockDelta,
          };
        }),

      addToCart: (variantId, qty = 1) => {
        const v = VARIANT_BY_ID[variantId];
        set((s) => {
          const found = s.cart.find((c) => c.variantId === variantId);
          const cart = found
            ? s.cart.map((c) => (c.variantId === variantId ? { ...c, qty: Math.min(9, c.qty + qty) } : c))
            : [...s.cart, { variantId, productId: v.productId, qty }];
          return { cart, cartDelta: { ...s.cartDelta, [variantId]: (s.cartDelta[variantId] ?? 0) + qty } };
        });
        get().track("add_to_cart", { productId: v.productId, variantId });
      },
      updateCartQty: (variantId, qty) =>
        set((s) => ({
          cart: s.cart.map((c) => (c.variantId === variantId ? { ...c, qty: Math.max(1, Math.min(9, qty)) } : c)),
        })),
      removeFromCart: (variantId) => set((s) => ({ cart: s.cart.filter((c) => c.variantId !== variantId) })),
      replaceCartItem: (from, to) => {
        const v = VARIANT_BY_ID[to];
        const old = get().cart.find((c) => c.variantId === from);
        if (from === to || !v || !old) return;
        set((s) => {
          const merged = s.cart.some((c) => c.variantId === to);
          const cart = merged
            ? s.cart
                .filter((c) => c.variantId !== from)
                .map((c) => (c.variantId === to ? { ...c, qty: Math.min(9, c.qty + old.qty) } : c))
            : s.cart.map((c) => (c.variantId === from ? { variantId: to, productId: v.productId, qty: old.qty } : c));
          // 바꾼 옵션은 새로 담은 것과 같은 수요 신호다(옵션별 장바구니 수)
          return { cart, cartDelta: { ...s.cartDelta, [to]: (s.cartDelta[to] ?? 0) + old.qty } };
        });
        get().track("change_cart_option", { productId: v.productId, variantId: to, from });
      },
      clearCart: () => set({ cart: [] }),

      pushRecentlyViewed: (productId) =>
        set((s) => ({
          recentlyViewed: [productId, ...s.recentlyViewed.filter((p) => p !== productId)].slice(0, 12),
          viewDelta: { ...s.viewDelta, [productId]: (s.viewDelta[productId] ?? 0) + 1 },
        })),

      placeOrder: ({ address, memo, couponRate = 0, payment }) => {
        const { cart } = get();
        const items = cart.map((c) => {
          const p = PRODUCT_BY_ID[c.productId];
          const price = get().salePriceOverride[p.id] ?? p.salePrice ?? p.price;
          return {
            variantId: c.variantId,
            productId: c.productId,
            qty: c.qty,
            unitPrice: price,
            discount: p.price - price,
          };
        });
        // 금액 규칙은 장바구니·주문서 화면과 같은 함수로 계산한다(lib/pricing) — 화면 금액 = 저장 금액
        const { subtotal, coupon, shippingFee, total } = orderAmounts(
          items.map((i) => ({ unitPrice: i.unitPrice, listPrice: i.unitPrice + i.discount, qty: i.qty })),
          couponRate,
        );
        const at = nowIso();
        const d = new Date();
        const id = `MF${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(get().orders.length + 1).padStart(2, "0")}${Math.floor(Math.random() * 90 + 10)}`;
        const order: Order = {
          id,
          customerId: DEMO_CUSTOMER_ID,
          customerName: DEMO_CUSTOMER_NAME,
          createdAt: at,
          status: "pending",
          items,
          subtotal,
          discount: coupon + items.reduce((s, i) => s + i.discount * i.qty, 0),
          shippingFee,
          total,
          channel: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "web",
          address,
          memo: withPayment(memo, payment),
          source: "DEMO",
          statusHistory: [{ status: "pending", at, actor: DEMO_CUSTOMER_NAME }],
        };
        // Loop 1 완결: 재입고 알림을 받았던(또는 기다리던) 옵션을 이 주문에서 구매하면 '구매 완료'로 닫는다 (D-17)
        const bought = new Set(items.map((i) => i.variantId));
        const closing = get().restockSubs.filter((r) => bought.has(r.variantId) && r.status !== "purchased");
        set((s) => {
          const inv = { ...s.inventoryDelta };
          for (const it of items) inv[it.variantId] = (inv[it.variantId] ?? 0) - it.qty;
          const restockSubs = closing.length
            ? s.restockSubs.map((r) =>
                bought.has(r.variantId) && r.status !== "purchased"
                  ? { ...r, status: "purchased" as const, purchasedAt: at, purchaseOrderId: id }
                  : r,
              )
            : s.restockSubs;
          return { orders: [order, ...s.orders], cart: [], inventoryDelta: inv, restockSubs };
        });
        get().track("complete_demo_order", { orderId: id, total });
        get().pushNotification({
          title: "데모 주문이 접수되었습니다",
          body: `주문번호 ${id} · ${items.length}개 상품 · 운영팀 확인 후 상품준비로 전환됩니다.`,
          kind: "order",
          href: `/my/orders/${id}`,
        });
        get().addEvidence({
          type: "CUSTOMER",
          title: `데모 주문 접수 ${id}`,
          detail: `${DEMO_CUSTOMER_NAME} 고객 주문 ${items.length}건 · 합계 ${total.toLocaleString("ko-KR")}원. 주문·매출·재고에 즉시 반영되었습니다.`,
          actor: DEMO_CUSTOMER_NAME,
          orderId: id,
          customerId: DEMO_CUSTOMER_ID,
          source: "DEMO",
          status: "demo",
        });
        for (const r of closing) {
          const v = VARIANT_BY_ID[r.variantId];
          const p = PRODUCT_BY_ID[v.productId];
          const restockAction = get().actions.find(
            (a) => a.variantId === r.variantId && (a.type === "restock" || a.type === "rebalance"),
          );
          const viaNotice = r.status === "notified";
          get().addEvidence({
            type: "RESULT",
            title: `재입고 알림 → 구매 전환 · ${p.name} ${v.color} ${v.size}`,
            detail: viaNotice
              ? `재입고 알림을 받은 고객이 해당 옵션을 구매했습니다 (알림 ${r.notifiedAt ? new Date(r.notifiedAt).toLocaleString("ko-KR") : "-"} → 주문 ${id}). 재입고 과제가 매출로 이어진 첫 기록입니다.`
              : `재입고 알림 대기 중이던 고객이 해당 옵션을 구매했습니다 (주문 ${id}).`,
            actor: DEMO_CUSTOMER_NAME,
            actionId: restockAction?.id,
            productId: p.id,
            orderId: id,
            customerId: DEMO_CUSTOMER_ID,
            kpiDelta: viaNotice ? "알림→구매 전환 1건 (기준값 대비: 실증 후 확인)" : "대기→구매 1건",
            source: "DEMO",
            status: "demo",
          });
        }
        return order;
      },

      requestReturn: (orderId, variantId, reason, note) => {
        const v = VARIANT_BY_ID[variantId];
        const rr: ReturnRequest = {
          id: uid("RT"),
          orderId,
          customerId: DEMO_CUSTOMER_ID,
          customerName: DEMO_CUSTOMER_NAME,
          productId: v.productId,
          variantId,
          reason,
          createdAt: nowIso(),
          status: "requested",
          note,
        };
        set((s) => ({
          returns: [rr, ...s.returns],
          returnDelta: { ...s.returnDelta, [variantId]: (s.returnDelta[variantId] ?? 0) + 1 },
        }));
        get().updateOrderStatus(orderId, "return-requested", DEMO_CUSTOMER_NAME);
        get().track("request_return", { productId: v.productId, variantId, reason });
        const p = PRODUCT_BY_ID[v.productId];
        get().addEvidence({
          type: "RISK",
          title: `반품 요청 · ${p.name} (${reason})`,
          detail: `고객 반품 사유가 구조화되어 핏 위험도 계산에 반영되었습니다.`,
          actor: DEMO_CUSTOMER_NAME,
          productId: p.id,
          orderId,
          source: "DEMO",
          status: "demo",
        });
        return rr;
      },

      track: (name, meta) =>
        set((s) => ({
          events: [
            {
              id: uid("ev"),
              name,
              at: nowIso(),
              productId: meta?.productId,
              variantId: meta?.variantId,
              meta: meta as Record<string, string | number> | undefined,
            },
            ...s.events,
          ].slice(0, 400),
        })),

      pushNotification: (n) =>
        set((s) => ({
          notifications: [{ ...n, id: uid("n"), at: nowIso(), read: false }, ...s.notifications].slice(0, 50),
        })),
      markRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      addEvidence: (e) =>
        set((s) => ({ evidence: [{ ...e, id: uid("evd"), at: e.at ?? nowIso() } as EvidenceLog, ...s.evidence] })),

      updateActionStatus: (id, status, actor, note) => {
        const action = get().actions.find((a) => a.id === id);
        if (!action) return false;
        // 승인 게이트 — 돈이 크게 움직이는 과제는 승인 전에 실행을 시작하거나 완료할 수 없다
        if ((status === "in-progress" || status === "done") && needsApproval(action)) return false;
        const at = nowIso();
        // 성과 비교의 '전' — 검토 확정(또는 바로 실행) 시점의 지표를 한 번만 기록한다
        const baseline =
          action.baseline ??
          (status === "confirmed" || status === "in-progress" || status === "done"
            ? { at, metrics: snapshot(action, get()) }
            : undefined);
        set((s) => ({
          actions: s.actions.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  baseline,
                  statusHistory: [...a.statusHistory, { status, at, actor, note }],
                  resultNote: status === "done" ? (note ?? a.resultNote ?? "실행 완료 (데모)") : a.resultNote,
                }
              : a,
          ),
        }));
        const evType: EvidenceType =
          status === "done" ? "RESULT" : status === "dismissed" || status === "hold" ? "EXCEPTION" : "ACTION";
        const statusLabel: Record<ActionStatus, string> = {
          recommended: "추천됨",
          confirmed: "확인",
          "in-progress": "실행중",
          done: "완료",
          hold: "보류",
          dismissed: "무시",
        };
        get().addEvidence({
          type: evType,
          title: `${action.title} → ${statusLabel[status]}`,
          detail: note
            ? `${actor}: ${note}`
            : `${actor}이(가) 과제 상태를 '${statusLabel[status]}'(으)로 변경했습니다.`,
          actor,
          actionId: id,
          productId: action.productId,
          source: "DEMO",
          status: "demo",
        });

        // ---- Side effects: the loop closes back to the customer ----
        if (action.type === "restock" || action.type === "rebalance") {
          const vid = action.variantId;
          if (vid) {
            if (status === "confirmed")
              set((s) => ({ variantRestockState: { ...s.variantRestockState, [vid]: "review" } }));
            if (status === "in-progress")
              set((s) => ({ variantRestockState: { ...s.variantRestockState, [vid]: "progress" } }));
            if (status === "done") {
              const qty = action.quantity ?? 20;
              set((s) => ({
                inventoryDelta: { ...s.inventoryDelta, [vid]: (s.inventoryDelta[vid] ?? 0) + qty },
                variantRestockState: { ...s.variantRestockState, [vid]: "restocked" },
              }));
              const waiting = get().restockSubs.filter((r) => r.variantId === vid && r.status === "waiting");
              if (waiting.length) {
                set((s) => ({
                  restockSubs: s.restockSubs.map((r) =>
                    r.variantId === vid && r.status === "waiting" ? { ...r, status: "notified", notifiedAt: at } : r,
                  ),
                }));
                const v = VARIANT_BY_ID[vid];
                const p = PRODUCT_BY_ID[v.productId];
                get().pushNotification({
                  title: "기다리던 상품이 재입고되었습니다",
                  body: `${p.name} · ${v.color} · ${v.size} 옵션이 다시 준비되었습니다. 지금 구매할 수 있어요.`,
                  kind: "restock",
                  href: `/products/${p.id}?color=${v.color}&size=${v.size}`,
                });
              }
              const v = VARIANT_BY_ID[vid];
              const p = PRODUCT_BY_ID[v.productId];
              get().addEvidence({
                type: "RESULT",
                title: `${p.name} ${v.color} ${v.size} 재고 +${qty} 반영`,
                detail: `재입고 과제 완료 → 재고 반영 → 재입고 알림 ${waiting.length}명 발송 (고객 화면 상태 변경).`,
                actor,
                actionId: id,
                productId: p.id,
                kpiDelta: `재고 ${qty} 증가 · 알림 ${waiting.length}건`,
                source: "DEMO",
                status: "demo",
              });
            }
          }
        }
        if (action.type === "markdown" && status === "done" && action.productId) {
          const p = PRODUCT_BY_ID[action.productId];
          const rate = action.discountRate ?? 0.15;
          const newPrice = Math.round((p.price * (1 - rate)) / 1000) * 1000;
          set((s) => ({ salePriceOverride: { ...s.salePriceOverride, [p.id]: newPrice } }));
          get().addEvidence({
            type: "REVENUE",
            title: `${p.name} 할인 ${Math.round(rate * 100)}% 적용`,
            detail: `판매가 ${p.price.toLocaleString("ko-KR")}원 → ${newPrice.toLocaleString("ko-KR")}원. 고객 화면 가격과 세일 목록에 즉시 반영. 판매·마진 변화는 실증에서 비교합니다.`,
            actor,
            actionId: id,
            productId: p.id,
            kpiDelta: "기준값 대비 변화: 실증 후 확인",
            source: "DEMO",
            status: "pilot-ready",
          });
        }
        if (action.type === "fit-guide" && status === "done" && action.productId) {
          const p = PRODUCT_BY_ID[action.productId];
          const improved =
            p.id === "p-plane-wide"
              ? "⚠️ 허리가 타이트하게 나온 상품입니다. 최근 구매 고객의 82%가 '사이즈 작음'으로 교환했습니다. 평소 사이즈보다 한 치수 크게 선택하세요. 논워시 원단이라 첫 세탁 후 약 1cm 추가로 줄어듭니다."
              : `${p.fitNote} (핏 안내 보강 · 실측·반품 데이터 기준)`;
          set((s) => ({ fitNoteOverride: { ...s.fitNoteOverride, [p.id]: improved } }));
          get().addEvidence({
            type: "RESULT",
            title: `${p.name} 핏 안내 변경 반영`,
            detail:
              "상품 상세의 핏 안내와 핏 추천 규칙(+1 사이즈 보정)이 변경되었습니다. 이후 반품률 비교는 실증 단계에서 측정합니다.",
            actor,
            actionId: id,
            productId: p.id,
            kpiDelta: "사이즈 반품률: 실증 후 확인",
            source: "DEMO",
            status: "pilot-ready",
          });
        }
        if (action.type === "segment-campaign" && (status === "in-progress" || status === "done")) {
          set((s) => ({
            campaignStatusOverride: { ...s.campaignStatusOverride, "cp-06": status === "done" ? "ended" : "running" },
          }));
          if (action.segment === "cycle-due") {
            get().pushNotification({
              title: "AERNO 신상품, 다시 만나볼 시간이에요",
              body: "지난 구매 이후 45일이 지났어요. 코듀로이 워크 자켓과 릴랙스 울 코트를 7% 할인가로 추천드립니다.",
              kind: "recommend",
              href: "/my?tab=recommend",
            });
          }
        }
        if (action.type === "cart-reminder" && (status === "in-progress" || status === "done")) {
          get().pushNotification({
            title: "장바구니에 담아둔 상품이 기다리고 있어요",
            body: "재고가 얼마 남지 않은 옵션이 있습니다. 지금 확인해보세요.",
            kind: "recommend",
            href: "/cart",
          });
        }
        // 성과 비교의 '후' — 실행 결과(재고 반영·알림·가격)가 반영된 뒤의 지표
        if (status === "done") {
          const done = get().actions.find((a) => a.id === id);
          if (done) {
            const result = { at: nowIso(), metrics: snapshot(done, get()) };
            set((s) => ({ actions: s.actions.map((a) => (a.id === id ? { ...a, result } : a)) }));
          }
        }
        return true;
      },

      createActionFromCandidate: (c, actor) => {
        const existing = get().actions.find(
          (a) => a.status !== "dismissed" && a.status !== "done" && candidateKey(a) === c.key,
        );
        if (existing) return existing.id;
        const at = nowIso();
        const id = `act-e-${(get().actions.filter((a) => a.origin === "engine").length + 1).toString().padStart(3, "0")}-${Date.now().toString(36).slice(-4)}`;
        const p = c.productId ? PRODUCT_BY_ID[c.productId] : undefined;
        const manager = p ? BRAND_BY_ID[p.brandId]?.manager : undefined;
        const engineLabel: Record<AXAction["engine"], string> = {
          demand: "수요 엔진",
          fit: "핏·반품 엔진",
          markdown: "할인 판단 엔진",
          repeat: "재구매 엔진",
        };
        const action: AXAction = {
          id,
          type: c.type,
          engine: c.engine,
          automation: "L3",
          errorCost: c.type === "markdown" ? "HIGH" : c.type === "fit-guide" ? "LOW" : "MID",
          title: c.title,
          productId: c.productId,
          variantId: c.variantId,
          brandId: p?.brandId,
          trigger: c.why,
          reasons: c.reasons,
          expectedImpact: c.impactLabel,
          urgency: c.urgency,
          owner: "md",
          ownerName: manager ?? ROLE_NAME.md,
          recommendedAt: at,
          status: "recommended",
          statusHistory: [
            { status: "recommended", at, actor: engineLabel[c.engine], note: "신호 엔진 후보" },
            { status: "recommended", at, actor, note: "운영자가 과제로 등록" },
          ],
          quantity: c.quantity,
          discountRate: c.discountRate,
          origin: "engine",
          pattern: c.pattern,
        };
        set((s) => ({ actions: [action, ...s.actions] }));
        get().addEvidence({
          type: "ACTION",
          title: `신호 → 과제 등록: ${c.title}`,
          detail: `${engineLabel[c.engine]}가 찾은 후보를 ${actor}이(가) 실행 센터에 등록했습니다. 근거: ${c.why}`,
          actor,
          actionId: id,
          productId: c.productId,
          kpiDelta: c.impactLabel,
          source: "DEMO",
          status: "demo",
        });
        return id;
      },

      updateActionParams: (id, patch, actor, note) => {
        const action = get().actions.find((a) => a.id === id);
        if (!action || action.status === "done" || action.status === "dismissed") return;
        const at = nowIso();
        const changes: ActionChange[] = [];
        const pct = (n?: number) => (n === undefined ? "-" : `${Math.round(n * 100)}%`);
        if (patch.quantity !== undefined && patch.quantity !== action.quantity)
          changes.push({
            at,
            actor,
            field: "quantity",
            from: `${action.quantity ?? 0}개`,
            to: `${patch.quantity}개`,
            note,
          });
        if (patch.discountRate !== undefined && patch.discountRate !== action.discountRate)
          changes.push({
            at,
            actor,
            field: "discountRate",
            from: pct(action.discountRate),
            to: pct(patch.discountRate),
            note,
          });
        if (patch.assigneeName !== undefined && patch.assigneeName !== assigneeOf(action))
          changes.push({ at, actor, field: "assignee", from: assigneeOf(action), to: patch.assigneeName, note });
        if (patch.dueAt !== undefined && patch.dueAt !== dueOf(action).toISOString())
          changes.push({
            at,
            actor,
            field: "dueAt",
            from: dueOf(action).toISOString().slice(0, 10),
            to: patch.dueAt.slice(0, 10),
            note,
          });
        if (!changes.length) return;
        const next: AXAction = {
          ...action,
          quantity: patch.quantity ?? action.quantity,
          discountRate: patch.discountRate ?? action.discountRate,
          assigneeName: patch.assigneeName ?? action.assigneeName,
          dueAt: patch.dueAt ?? action.dueAt,
          changes: [...(action.changes ?? []), ...changes],
        };
        // 승인 뒤 수량·할인율이 바뀌어 정책 근거가 달라지면 승인은 무효 — 다시 받아야 한다
        const wasApproved = !!approvalOf(action).approvedBy;
        const reapprove = wasApproved && !approvalOf(next).approvedBy && approvalOf(next).required;
        set((s) => ({ actions: s.actions.map((a) => (a.id === id ? next : a)) }));
        const fieldLabel: Record<ActionChange["field"], string> = {
          quantity: "수량",
          discountRate: "할인율",
          assignee: "담당자",
          dueAt: "기한",
        };
        get().addEvidence({
          type: "ACTION",
          title: `${action.title} — ${changes.map((c) => fieldLabel[c.field]).join("·")} 변경`,
          detail:
            changes.map((c) => `${fieldLabel[c.field]} ${c.from} → ${c.to}`).join(" · ") +
            (note ? ` (사유: ${note})` : "") +
            (reapprove ? " · 정책 근거가 바뀌어 승인을 다시 받아야 합니다." : ""),
          actor,
          actionId: id,
          productId: action.productId,
          source: "DEMO",
          status: "demo",
        });
      },

      approveAction: (id, actor) => {
        const action = get().actions.find((a) => a.id === id);
        if (!action) return;
        const at = nowIso();
        const policy = approvalPolicy(action);
        set((s) => ({
          actions: s.actions.map((a) =>
            a.id === id
              ? {
                  ...a,
                  approval: { ...policy, approvedBy: actor, approvedAt: at },
                  statusHistory: [...a.statusHistory, { status: a.status, at, actor, note: `승인 — ${policy.reason}` }],
                }
              : a,
          ),
        }));
        get().addEvidence({
          type: "ACTION",
          title: `${action.title} → 승인`,
          detail: `${actor} 승인. 근거: ${policy.reason}`,
          actor,
          actionId: id,
          productId: action.productId,
          source: "DEMO",
          status: "demo",
        });
      },

      updateOrderStatus: (orderId, status, actor) => {
        const at = nowIso();
        const own = get().orders.find((o) => o.id === orderId);
        if (own) {
          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId ? { ...o, status, statusHistory: [...o.statusHistory, { status, at, actor }] } : o,
            ),
          }));
        } else {
          const seed = SEED_ORDERS.find((o) => o.id === orderId);
          if (!seed) return;
          set((s) => {
            const prev = s.orderStatusOverride[orderId]?.history ?? seed.statusHistory;
            return {
              orderStatusOverride: {
                ...s.orderStatusOverride,
                [orderId]: { status, history: [...prev, { status, at, actor }] },
              },
            };
          });
        }
        const label: Record<OrderStatus, string> = {
          pending: "결제대기",
          preparing: "상품준비중",
          shipped: "출고완료",
          "in-transit": "배송중",
          delivered: "배송완료",
          cancelled: "취소",
          "return-requested": "반품요청",
          "exchange-requested": "교환요청",
        };
        const isMine = own || SEED_ORDERS.find((o) => o.id === orderId)?.customerId === DEMO_CUSTOMER_ID;
        if (isMine && actor !== DEMO_CUSTOMER_NAME)
          get().pushNotification({
            title: `주문 ${orderId} · ${label[status]}`,
            body:
              status === "shipped"
                ? "상품이 출고되었습니다. 배송 조회를 확인하세요."
                : status === "delivered"
                  ? "배송이 완료되었습니다. 사이즈는 잘 맞으셨나요?"
                  : `주문 상태가 '${label[status]}'(으)로 변경되었습니다.`,
            kind: "order",
            href: `/my/orders/${orderId}`,
          });
        get().addEvidence({
          type: "ACTION",
          title: `주문 ${orderId} → ${label[status]}`,
          detail: `${actor}이(가) 주문 상태를 변경했습니다. 고객 마이페이지 주문상태에 동시에 반영됩니다.`,
          actor,
          orderId,
          source: "DEMO",
          status: "demo",
        });
      },

      resetDemo: () =>
        set({
          ...initialCustomer(),
          role: "owner",
          tutorialDone: false,
          customerTourDone: false,
          lastResetAt: nowIso(),
        }),
    }),
    {
      name: "morfit-demo-v1",
      // v4: 화면 문구 한글화(D-28)로 시드의 담당자·엔진 이름이 바뀜 → 이전 저장본은 새 시드로 초기화
      // v5: 쿠폰 할인 100배로 저장된 고객 주문 금액을 바로잡음(D-42) — 나머지 데이터는 유지
      // v6: 운영 통제 — 시연 시작 시 검토·실행 중인 시나리오 과제에 성과 비교 기준값을 채움 (D-48)
      version: 6,
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : noopStorage)),
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s;
        void _h;
        return rest as AppState;
      },
      migrate: (persisted, version) => {
        if (version < 4) return {} as AppState;
        let state = persisted as AppState;
        if (version < 5) state = { ...state, orders: (state.orders ?? []).map(repairCouponOrder) };
        if (version < 6 && state.actions) {
          // 사용자가 상태를 바꾸지 않은 시나리오 과제만 — 바꾼 과제는 당시 지표를 알 수 없으므로 비워 둔다
          const seedStatus = new Map(SEED_ACTIONS.map((a) => [a.id, a.status]));
          state = {
            ...state,
            actions: state.actions.map((a) => (seedStatus.get(a.id) === a.status ? withSeedBaselines([a])[0] : a)),
          };
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/* Campaign status with override (Loop 4) */
export const campaignStatus = (id: string, override: AppState["campaignStatusOverride"]) =>
  override[id] ?? CAMPAIGNS.find((c) => c.id === id)?.status ?? "draft";
