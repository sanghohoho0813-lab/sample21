import { describe, expect, it } from "vitest";
import { FREE_SHIP_MIN, SHIP_FEE, couponDiscount, orderAmounts, shippingFeeFor } from "@/lib/pricing";

describe("couponDiscount", () => {
  it("정률 할인액을 100원 단위로 반올림한다", () => {
    expect(couponDiscount(79_000, 5)).toBe(4_000); // 3,950 → 4,000
    expect(couponDiscount(158_000, 10)).toBe(15_800);
    expect(couponDiscount(129_000, 7)).toBe(9_000); // 9,030 → 9,000
  });
  it("쿠폰이 없으면 0원", () => {
    expect(couponDiscount(79_000, 0)).toBe(0);
  });
});

describe("shippingFeeFor", () => {
  it(`${FREE_SHIP_MIN.toLocaleString()}원 이상이면 무료, 미만이면 ${SHIP_FEE.toLocaleString()}원`, () => {
    expect(shippingFeeFor(FREE_SHIP_MIN - 1)).toBe(SHIP_FEE);
    expect(shippingFeeFor(FREE_SHIP_MIN)).toBe(0);
  });
});

describe("orderAmounts", () => {
  it("상품금액 − 쿠폰 + 배송비 = 결제금액", () => {
    const a = orderAmounts([{ unitPrice: 79_000, listPrice: 89_000, qty: 2 }], 5);
    expect(a).toEqual({ subtotal: 158_000, itemDiscount: 20_000, coupon: 7_900, shippingFee: 0, total: 150_100 });
  });
  it("회귀: 쿠폰을 써도 결제금액은 음수가 되지 않는다 (할인액 100배 계산 버그)", () => {
    for (const rate of [5, 7, 10]) {
      const a = orderAmounts([{ unitPrice: 79_000, listPrice: 79_000, qty: 1 }], rate);
      expect(a.coupon).toBeLessThan(a.subtotal);
      expect(a.total).toBeGreaterThan(0);
    }
  });
  it("소액 주문은 배송비가 붙는다", () => {
    expect(orderAmounts([{ unitPrice: 19_000, listPrice: 19_000, qty: 1 }]).total).toBe(19_000 + SHIP_FEE);
  });
});
