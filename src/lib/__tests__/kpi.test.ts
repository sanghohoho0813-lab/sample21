import { describe, expect, it } from "vitest";
import { PRODUCTS, PRODUCT_BY_ID, VARIANTS } from "@/lib/demo/seed";
import { daysOfStock, demandScore, effPrice, inventoryStatus, markdownReview, restockFunnel, restockPriority } from "@/lib/kpi";
import type { Variant } from "@/lib/types";

const emptyDelta = {
  viewDelta: {}, wishlistDelta: {}, cartDelta: {}, restockDelta: {}, inventoryDelta: {}, returnDelta: {},
  salePriceOverride: {}, fitNoteOverride: {}, variantRestockState: {}, orderStatusOverride: {}, orders: [], returns: [],
};
const base = VARIANTS[0];
const variant = (patch: Partial<Variant>): Variant => ({ ...base, ...patch });

describe("inventoryStatus", () => {
  it("재고 0이면 품절", () => expect(inventoryStatus(variant({ stock: 0 }))).toBe("soldout"));
  it("남은 판매일 4일 이하면 품절 임박", () => {
    const v = variant({ stock: 3, sales30d: 30 }); // 하루 1개 → 3일
    expect(daysOfStock(v)).toBe(3);
    expect(inventoryStatus(v)).toBe("low");
  });
  it("운영자가 정한 재입고 단계가 재고 계산보다 우선한다", () => {
    const v = variant({ stock: 0 });
    expect(inventoryStatus(v, { variantRestockState: { [v.id]: "progress" } })).toBe("restock-progress");
    expect(inventoryStatus(v, { variantRestockState: { [v.id]: "restocked" } })).toBe("restocked");
  });
});

describe("demandScore · restockPriority (전체 시드 옵션)", () => {
  it("수요 점수는 0~100 정수", () => {
    for (const v of VARIANTS) {
      const s = demandScore(v);
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
  it("재입고 추천 수량은 0 이상, 5개 단위", () => {
    for (const v of VARIANTS) {
      const { suggestedQty, score } = restockPriority(v, emptyDelta);
      expect(suggestedQty).toBeGreaterThanOrEqual(0);
      expect(suggestedQty % 5).toBe(0);
      expect(score).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("markdownReview", () => {
  it("추천 할인율은 30%를 넘지 않고, 현재 할인율보다 낮아지지 않는다", () => {
    for (const p of PRODUCTS) {
      const m = markdownReview(p, emptyDelta);
      expect(m.suggestedRate).toBeLessThanOrEqual(Math.max(0.3, m.currentRate));
      expect(m.suggestedRate).toBeGreaterThanOrEqual(m.currentRate);
    }
  });
});

describe("effPrice", () => {
  it("운영자 할인가 > 시드 할인가 > 정상가 순으로 적용", () => {
    const p = PRODUCTS.find((x) => x.salePrice) ?? PRODUCTS[0];
    expect(effPrice(p, { salePriceOverride: {} })).toBe(p.salePrice ?? p.price);
    expect(effPrice(p, { salePriceOverride: { [p.id]: 12_300 } })).toBe(12_300);
    expect(effPrice(PRODUCT_BY_ID["p-nove-oxford"], { salePriceOverride: {} })).toBeGreaterThan(0);
  });
});

describe("restockFunnel", () => {
  it("알림 발송 → 구매 전환율", () => {
    const at = "2026-10-01T00:00:00.000Z";
    const f = restockFunnel([
      { id: "a", variantId: "v1", productId: "p", status: "waiting", createdAt: at },
      { id: "b", variantId: "v2", productId: "p", status: "notified", createdAt: at, notifiedAt: at },
      { id: "c", variantId: "v3", productId: "p", status: "purchased", createdAt: at, notifiedAt: at, purchasedAt: at },
    ]);
    expect(f).toMatchObject({ total: 3, waiting: 1, notified: 1, purchased: 1, sent: 2, noticeToPurchase: 0.5 });
  });
});
