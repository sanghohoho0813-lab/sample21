/* 주문 금액 규칙 — 단일 출처(SSOT).
   장바구니·주문서 화면과 주문 저장(store.placeOrder)이 같은 함수를 써서
   '화면에 보인 금액 = 저장된 금액'이 항상 성립하게 한다. (단위 테스트: __tests__/pricing.test.ts) */

/** 이 금액 이상이면 무료배송 */
export const FREE_SHIP_MIN = 50_000;
export const SHIP_FEE = 3_000;

export const shippingFeeFor = (subtotal: number) => (subtotal >= FREE_SHIP_MIN ? 0 : SHIP_FEE);

/** 정률 쿠폰 할인액 — ratePercent는 % 단위(5 = 5%), 결과는 100원 단위 반올림 */
export const couponDiscount = (subtotal: number, ratePercent: number) =>
  Math.round((subtotal * ratePercent) / 100 / 100) * 100;

export interface PricedLine {
  /** 실제 판매가(할인 반영) */
  unitPrice: number;
  /** 정상가 */
  listPrice: number;
  qty: number;
}

export function orderAmounts(lines: PricedLine[], couponRatePercent = 0) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const itemDiscount = lines.reduce((s, l) => s + (l.listPrice - l.unitPrice) * l.qty, 0);
  const coupon = couponDiscount(subtotal, couponRatePercent);
  const shippingFee = shippingFeeFor(subtotal);
  return { subtotal, itemDiscount, coupon, shippingFee, total: subtotal - coupon + shippingFee };
}
