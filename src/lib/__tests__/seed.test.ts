/* 데모 시드의 불변 조건 — 시연 시나리오(A~D)가 언제 열어도 같은 이야기를 하도록 지킨다. */
import { describe, expect, it } from "vitest";
import { DAILY, PRODUCT_DAILY, PRODUCT_BY_ID, SCENARIO, SEED_ORDERS, VARIANT_BY_ID, variantsOf } from "@/lib/demo/seed";
import { inventoryStatus } from "@/lib/kpi";

describe("시드 주문", () => {
  it("아직 오지 않은 시각의 주문·상태 변경이 없다", () => {
    const now = Date.now() + 1_000;
    for (const o of SEED_ORDERS) {
      expect(Date.parse(o.createdAt)).toBeLessThanOrEqual(now);
      for (const h of o.statusHistory) {
        expect(Date.parse(h.at)).toBeLessThanOrEqual(now);
        expect(Date.parse(h.at)).toBeGreaterThanOrEqual(Date.parse(o.createdAt));
      }
    }
  });
  it("결제금액 = 상품금액 − 할인 + 배송비 (정상가 기준 할인 포함)", () => {
    for (const o of SEED_ORDERS) {
      const list = o.items.reduce((s, i) => s + (i.unitPrice + i.discount) * i.qty, 0);
      expect(o.total).toBe(list - o.discount + o.shippingFee);
    }
  });
});

describe("시나리오", () => {
  it("A: 옥스포드 셔츠 블랙 M은 재고 4개 · 재입고 요청 18건으로 품절 임박", () => {
    const v = VARIANT_BY_ID[SCENARIO.A_VARIANT];
    expect(v).toMatchObject({ stock: 4, restockRequests: 18 });
    expect(inventoryStatus(v)).toBe("low");
  });
  it("C: 발마칸 코트는 최근 3주 판매가 그 이전보다 적다(저회전)", () => {
    const s = PRODUCT_DAILY.find((p) => p.productId === SCENARIO.C_PRODUCT)!.series;
    const recent = s.slice(-21).reduce((n, d) => n + d.units, 0);
    expect(recent).toBeLessThan(s.slice(0, 9).reduce((n, d) => n + d.units, 0) * (21 / 9));
  });
  it("모든 상품에 옵션이 있고, 옵션은 상품에 속한다", () => {
    for (const id of Object.keys(PRODUCT_BY_ID)) {
      const vs = variantsOf(id);
      expect(vs.length).toBeGreaterThan(0);
      expect(vs.every((v) => v.productId === id)).toBe(true);
    }
  });
  it("일간 매출 90일 · 상품별 시계열 30일", () => {
    expect(DAILY).toHaveLength(90);
    expect(PRODUCT_DAILY.every((p) => p.series.length === 30)).toBe(true);
  });
});
