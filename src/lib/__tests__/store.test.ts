/* 고객 화면 ↔ AX 운영화면을 잇는 공유 스토어의 핵심 순환을 검증한다 (브라우저 없이, 저장소는 메모리). */
import { beforeEach, describe, expect, it } from "vitest";
import { useApp } from "@/lib/store";
import { PRODUCT_BY_ID, variantsOf } from "@/lib/demo/seed";
import { allOrders, effPrice } from "@/lib/kpi";
import { orderAmounts } from "@/lib/pricing";

const store = () => useApp.getState();
const oxford = variantsOf("p-nove-oxford");

beforeEach(() => store().resetDemo());

describe("주문 (Loop 2: 고객 주문 → AX 주문·재고)", () => {
  it("저장된 결제금액은 주문서에 보인 금액과 같다 (쿠폰 포함)", () => {
    store().addToCart(oxford[0].id, 2);
    const unit = effPrice(PRODUCT_BY_ID["p-nove-oxford"], store());
    const expected = orderAmounts([{ unitPrice: unit, listPrice: PRODUCT_BY_ID["p-nove-oxford"].price, qty: 2 }], 5);

    const order = store().placeOrder({ address: "서울 마포구 성산로 12", memo: "문 앞", couponRate: 5, payment: "카드" });

    expect(order.subtotal).toBe(expected.subtotal);
    expect(order.total).toBe(expected.total);
    expect(order.total).toBeGreaterThan(0);
    expect(order.discount).toBe(expected.coupon + expected.itemDiscount);
  });

  it("주문하면 장바구니가 비고 재고가 수량만큼 줄며 AX 주문 목록 맨 위에 나타난다", () => {
    store().addToCart(oxford[1].id, 3);
    const order = store().placeOrder({ address: "서울 마포구 성산로 12", payment: "카드" });

    expect(store().cart).toHaveLength(0);
    expect(store().inventoryDelta[oxford[1].id]).toBe(-3);
    expect(allOrders(store())[0].id).toBe(order.id);
  });

  it("운영자가 바꾼 주문 상태와 이력이 고객 주문에 반영된다", () => {
    store().addToCart(oxford[0].id);
    const { id } = store().placeOrder({ address: "서울 마포구 성산로 12", payment: "카드" });

    store().updateOrderStatus(id, "preparing", "운영직원");

    const o = allOrders(store()).find((x) => x.id === id)!;
    expect(o.status).toBe("preparing");
    expect(o.statusHistory.map((h) => h.status)).toEqual(["pending", "preparing"]);
  });
});

describe("재입고 알림 (Loop 1: 신청 → 구매로 닫힘)", () => {
  it("알림을 신청한 옵션을 주문하면 알림이 '구매 완료'로 닫히고 주문번호가 연결된다", () => {
    const v = oxford[2];
    store().subscribeRestock(v.id);
    store().addToCart(v.id);
    const order = store().placeOrder({ address: "서울 마포구 성산로 12", payment: "카드" });

    const sub = store().restockSubs.find((s) => s.variantId === v.id)!;
    expect(sub.status).toBe("purchased");
    expect(sub.purchaseOrderId).toBe(order.id);
  });
});

describe("데모 초기화", () => {
  it("주문·장바구니·재고 변화가 모두 처음 상태로 돌아간다", () => {
    store().addToCart(oxford[0].id);
    store().placeOrder({ address: "서울 마포구 성산로 12", payment: "카드" });
    store().resetDemo();
    expect(store().orders).toHaveLength(0);
    expect(store().inventoryDelta).toEqual({});
  });
});

describe("저장 데이터 마이그레이션 v4 → v5", () => {
  it("쿠폰 할인이 100배로 저장된 주문은 같은 쿠폰율로 다시 계산하고, 정상 주문은 그대로 둔다", async () => {
    const { repairCouponOrder } = await import("@/lib/migrations");
    store().addToCart(oxford[0].id);
    const ok = store().placeOrder({ address: "서울 마포구 성산로 12", payment: "카드", couponRate: 5 });
    expect(repairCouponOrder(ok)).toBe(ok);

    // 예전 식으로 저장된 주문: 쿠폰액 = round(79,000 × 5 / 100) × 100 = 395,000
    const broken = { ...ok, discount: ok.discount - (ok.subtotal - ok.total + ok.shippingFee) + 395_000, total: ok.subtotal - 395_000 + ok.shippingFee };
    const fixed = repairCouponOrder(broken);
    expect(fixed.total).toBe(ok.total);
    expect(fixed.discount).toBe(ok.discount);
  });
});
