/* 장바구니 옵션 변경 — 자리·수량 유지, 같은 옵션이 있으면 합치기, 수요 신호(옵션별 장바구니 수) 반영 */
import { beforeEach, describe, expect, it } from "vitest";
import { useApp } from "@/lib/store";
import { SCENARIO, variantId } from "@/lib/demo/seed";

const store = () => useApp.getState();
const L = variantId(SCENARIO.A_PRODUCT, 0, "L");
const XL = variantId(SCENARIO.A_PRODUCT, 0, "XL");
const B = variantId(SCENARIO.B_PRODUCT, 0, "M");

beforeEach(() => {
  store().resetDemo();
  store().clearCart();
});

describe("장바구니 옵션 변경", () => {
  it("옵션만 바꾸고 자리와 수량은 그대로 둔다", () => {
    store().addToCart(L, 2);
    store().addToCart(B);
    store().replaceCartItem(L, XL);
    expect(store().cart.map((c) => [c.variantId, c.qty])).toEqual([
      [XL, 2],
      [B, 1],
    ]);
  });

  it("바꾼 옵션이 이미 담겨 있으면 한 줄로 합친다(최대 9개)", () => {
    store().addToCart(L, 5);
    store().addToCart(XL, 6);
    store().replaceCartItem(L, XL);
    expect(store().cart).toHaveLength(1);
    expect(store().cart[0]).toMatchObject({ variantId: XL, qty: 9 });
  });

  it("바꾼 옵션의 장바구니 신호가 수량만큼 오르고, 같은 옵션이면 아무것도 바뀌지 않는다", () => {
    store().addToCart(L, 2);
    const before = store().cartDelta[XL] ?? 0;
    store().replaceCartItem(L, XL);
    expect(store().cartDelta[XL]).toBe(before + 2);
    const snapshot = JSON.stringify(store().cart);
    store().replaceCartItem(XL, XL);
    expect(JSON.stringify(store().cart)).toBe(snapshot);
  });
});
