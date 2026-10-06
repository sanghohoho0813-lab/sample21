/* 저장 데이터 마이그레이션 — 브라우저(localStorage)에 남아 있는 이전 버전 데이터를 현재 규칙에 맞춘다. */
import type { Order } from "./types";
import { orderAmounts } from "./pricing";

/**
 * v4 → v5: 쿠폰 할인이 100배로 저장된 주문(D-42)을 같은 쿠폰율로 다시 계산한다. 정상 주문은 그대로 둔다.
 * 예전 식은 round(상품금액 × 율 / 100) × 100 ≈ 상품금액 × 율 이므로, 저장된 쿠폰액 ÷ 상품금액 = 쿠폰율(%)이다.
 */
export function repairCouponOrder(o: Order): Order {
  const itemDiscount = o.items.reduce((s, i) => s + i.discount * i.qty, 0);
  const storedCoupon = o.discount - itemDiscount;
  if (o.subtotal <= 0 || storedCoupon <= o.subtotal) return o;
  const rate = Math.round(storedCoupon / o.subtotal);
  const a = orderAmounts(o.items.map((i) => ({ unitPrice: i.unitPrice, listPrice: i.unitPrice + i.discount, qty: i.qty })), rate);
  return { ...o, subtotal: a.subtotal, discount: a.coupon + itemDiscount, shippingFee: a.shippingFee, total: a.total };
}
