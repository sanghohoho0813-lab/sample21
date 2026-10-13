/* Commerce Intelligence 엔진 — 신호 판독·옵션·반품·할인·운영 정책이 데모 시나리오에서
   기대한 판단을 내리고, 임계값(노이즈 가드)이 지켜지는지 검증한다. */
import { beforeEach, describe, expect, it } from "vitest";
import { useApp } from "@/lib/store";
import { PRODUCT_BY_ID, SCENARIO, SEED_ACTIONS, VARIANTS, variantId, variantsOf } from "@/lib/demo/seed";
import { THRESHOLDS, classify, readAll, skuSignals, type SkuSignals } from "@/lib/intel/signals";
import { optionMatrix, productReading } from "@/lib/intel/options";
import { MIN_SUPPORT, fitGuideImpact, returnIntel } from "@/lib/intel/returns";
import { MARGIN_FLOOR, bestRate, markdownDecision, simulateMarkdown } from "@/lib/intel/markdown";
import { approvalOf, canApprove, needsApproval, priorityOf } from "@/lib/intel/policy";
import { candidateKey, engineCandidates } from "@/lib/intel/candidates";

const state = () => useApp.getState();
const TRUCKER_M = variantId(SCENARIO.E_PRODUCT, 0, "M");
const TRUCKER_S = variantId(SCENARIO.E_PRODUCT, 0, "S");

beforeEach(() => state().resetDemo());

/** 합성 신호 — 판정 규칙만 떼어 검증한다 */
function synth(
  over: Partial<{
    views: [number, number];
    wish: [number, number];
    cart: [number, number];
    sales: [number, number];
    stock: number;
    requests: number;
    ret: [number, number, number];
  }>,
): SkuSignals {
  const base = skuSignals(variantsOf(SCENARIO.A_PRODUCT)[3], state());
  const t = (now: number, prev: number) => ({ now, prev, delta: (now - prev) / Math.max(1, prev) });
  const [vn, vp] = over.views ?? [100, 100];
  const [sn, sp] = over.sales ?? [5, 5];
  const [r30, f30, s30] = over.ret ?? [0, 0, 20];
  const conv = { now: sn / Math.max(1, vn), prev: sp / Math.max(1, vp), delta: 0 };
  conv.delta = (conv.now - conv.prev) / (conv.prev || 1);
  return {
    ...base,
    variant: {
      ...base.variant,
      stock: over.stock ?? 30,
      restockRequests: over.requests ?? 0,
      returns30d: r30,
      fitReturns30d: f30,
      sales30d: s30,
      sales7d: sn,
      salesPrev7d: sp,
      views7d: vn,
      viewsPrev7d: vp,
    },
    views: t(vn, vp),
    wishlist: t(...(over.wish ?? [10, 10])),
    cart: t(...(over.cart ?? [10, 10])),
    sales: t(sn, sp),
    conversion: conv,
    cartToOrder: sn / Math.max(1, (over.cart ?? [10, 10])[0]),
    returnRate: r30 / Math.max(1, s30),
    fitReturnShare: f30 / Math.max(1, r30),
    coverDays: (over.stock ?? 30) / Math.max(0.1, sn / 7),
    status: (over.stock ?? 30) <= 0 ? "soldout" : base.status,
  };
}

describe("신호 판독 — 조합으로 '왜 이 SKU를 봐야 하는가'를 말한다", () => {
  it("관심 상승 + 품절이면 수요 급등·품절로 읽고 재입고를 권한다", () => {
    const p = classify(synth({ views: [180, 100], wish: [30, 10], stock: 0, requests: 9 }));
    expect(p.code).toBe("surge-shortage");
    expect(p.action).toBe("restock");
    expect(p.why).toMatch(/조회 \+80%/);
    expect(p.why).toMatch(/재입고 신청 9건/);
  });

  it("조회가 적으면 증감률이 커도 급등으로 보지 않는다 (노이즈 가드)", () => {
    const p = classify(synth({ views: [12, 3], wish: [3, 1], cart: [2, 1], stock: 40, requests: 0 }));
    expect(12).toBeLessThan(THRESHOLDS.minViews);
    expect(["steady", "quiet"]).toContain(p.code);
  });

  it("팔리지만 사이즈·핏 사유 반품이 많으면 '팔리지만 반품'으로 읽는다", () => {
    const p = classify(synth({ ret: [6, 5, 20] }));
    expect(p.code).toBe("sold-but-returned");
    expect(p.action).toBe("fit-guide");
  });

  it("인기 사이즈가 품절이면 옆 사이즈의 관심은 '대체 탐색'으로 읽고, 그 옵션이 아니라 품절 사이즈 재입고를 해법으로 낸다", () => {
    const r = readAll(VARIANTS, state()).find((x) => x.signals.variant.id === variantId(SCENARIO.E_PRODUCT, 0, "L"))!;
    expect(r.pattern.code).toBe("interest-no-conversion");
    expect(r.pattern.why).toMatch(/S·M 품절로 넘어온 관심/);
    expect(r.pattern.action).toBeNull();
    // 원인(품절 사이즈)보다 앞서지 않는다
    const m = readAll(VARIANTS, state()).find((x) => x.signals.variant.id === TRUCKER_M)!;
    expect(r.pattern.severity).toBeLessThan(m.pattern.severity);
  });

  it("담기만 하고 사지 않는 옵션은 장바구니 이탈로 읽는다 (재고 있음)", () => {
    const r = readAll(VARIANTS, state()).find((x) => x.signals.variant.id === SCENARIO.F_VARIANT)!;
    expect(r.pattern.code).toBe("cart-abandon");
    expect(r.pattern.action).toBe("cart-reminder");
  });

  it("데모 시나리오: 옥스포드 블랙 M·트러커 인디고 M은 주의 SKU 상단, 발마칸은 관심 식음·재고 과잉", () => {
    const r = readAll(VARIANTS, state());
    const codeOf = (id: string) => r.find((x) => x.signals.variant.id === id)?.pattern.code;
    expect(codeOf(SCENARIO.A_VARIANT)).toBe("surge-shortage");
    expect(codeOf(TRUCKER_M)).toBe("surge-shortage");
    const balmacaan = r.filter((x) => x.signals.variant.productId === SCENARIO.C_PRODUCT).map((x) => x.pattern.code);
    expect(balmacaan).toContain("cooling-overstock");
    // 심각도 내림차순
    for (let i = 1; i < r.length; i++) expect(r[i - 1].pattern.severity).toBeGreaterThanOrEqual(r[i].pattern.severity);
  });
});

describe("옵션 단위 판단 — 색상×사이즈·사이즈 커브", () => {
  it("트러커 자켓: 인디고 S·M 품절이 전환 하락의 원인이라고 말한다", () => {
    const p = PRODUCT_BY_ID[SCENARIO.E_PRODUCT];
    const m = optionMatrix(p, state());
    expect(m.cells["인디고"]?.M.status).toBe("soldout");
    const reading = productReading(p, state(), m);
    expect(reading.headline).toMatch(/품절/);
    expect(reading.blockedOptions.length).toBeGreaterThanOrEqual(2);
  });

  it("사이즈 커브의 판매·재고 비중은 각각 합이 1이다", () => {
    const m = optionMatrix(PRODUCT_BY_ID[SCENARIO.A_PRODUCT], state());
    const sum = (k: "salesShare" | "stockShare") => m.sizeCurve.reduce((s, x) => s + x[k], 0);
    expect(sum("salesShare")).toBeCloseTo(1, 5);
    expect(sum("stockShare")).toBeCloseTo(1, 5);
  });
});

describe("반품 Intelligence — 패턴은 최소 표본을 넘을 때만 말한다", () => {
  it("와이드 데님의 '작음' 반품 집중을 찾아 핏 안내 개선을 권한다", () => {
    const ri = returnIntel(state());
    const f = ri.findings.find((x) => x.kind === "size" && x.productId === SCENARIO.B_PRODUCT);
    expect(f).toBeDefined();
    expect(f!.direction).toBe("small");
    expect(f!.action).toBe("fit-guide");
    expect(f!.support).toBeGreaterThanOrEqual(MIN_SUPPORT.size);
  });

  it("모든 발견은 기준 대비 배수(lift)와 표본 수를 가진다", () => {
    for (const f of returnIntel(state()).findings) {
      expect(f.support).toBeGreaterThan(0);
      expect(Number.isFinite(f.lift)).toBe(true);
      expect(f.evidence.length).toBeGreaterThan(0);
    }
  });

  it("핏 프로필이 있는 고객의 사이즈 반품률이 없는 고객보다 낮다 (데모 가설)", () => {
    const { profileEffect: e } = returnIntel(state());
    expect(e.withProfile).toBeLessThan(e.withoutProfile);
  });

  it("핏 안내 개선 기대치는 현재보다 낮고 가정이 함께 적혀 있다", () => {
    const imp = fitGuideImpact(SCENARIO.B_PRODUCT, state());
    expect(imp.target).toBeLessThan(imp.before);
    expect(imp.assumption).toMatch(/가정|실증/);
  });
});

describe("할인 판단 — 근거 없이 할인하지 않는다", () => {
  it("발마칸 코트(관심 식음·재고 과잉)는 할인을 권하고, 마진 하한을 지킨다", () => {
    const p = PRODUCT_BY_ID[SCENARIO.C_PRODUCT];
    const d = markdownDecision(p, state());
    expect(d.verdict).toBe("markdown");
    expect(d.suggestedRate).toBeGreaterThan(0);
    expect(d.suggestedRate).toBeLessThanOrEqual(d.maxRateByMargin + 1e-9);
    const sim = simulateMarkdown(p, state(), d.suggestedRate);
    expect(sim.marginRate).toBeGreaterThanOrEqual(MARGIN_FLOOR - 0.02); // 1,000원 단위 반올림 허용
  });

  it("트러커 자켓(관심 상승·인기 옵션 품절)은 할인하지 않는다 — 재입고가 먼저", () => {
    const d = markdownDecision(PRODUCT_BY_ID[SCENARIO.E_PRODUCT], state());
    expect(d.verdict).not.toBe("markdown");
  });

  it("할인율이 클수록 예상 판매는 늘고(같거나), 최적 할인율은 탐색 범위 안에 있다", () => {
    const p = PRODUCT_BY_ID[SCENARIO.C_PRODUCT];
    const a = simulateMarkdown(p, state(), 0.1);
    const b = simulateMarkdown(p, state(), 0.3);
    expect(b.units).toBeGreaterThanOrEqual(a.units);
    const best = bestRate(p, state(), 0.3);
    expect(best.rate).toBeGreaterThanOrEqual(0);
    expect(best.rate).toBeLessThanOrEqual(0.3);
  });

  it("할인 권장 상품은 전체 중 소수다 (무조건 할인 금지)", () => {
    const verdicts = Object.values(PRODUCT_BY_ID).map((p) => markdownDecision(p, state()).verdict);
    expect(verdicts.filter((v) => v === "markdown").length).toBeLessThanOrEqual(3);
  });
});

describe("운영 정책 — 승인·우선순위", () => {
  const act = (id: string) => SEED_ACTIONS.find((a) => a.id === id)!;

  it("20% 이상 할인은 대표 승인, MD는 승인할 수 없다", () => {
    const a = act("act-003");
    expect(needsApproval(a)).toBe(true);
    expect(canApprove("md", a)).toBe(false);
    expect(canApprove("owner", a)).toBe(true);
  });

  it("승인 뒤 할인율이 바뀌면 승인이 무효가 된다", () => {
    const a = act("act-003");
    const approved = { ...a, approval: { ...approvalOf(a), approvedBy: "대표", approvedAt: "2026-10-01T00:00:00Z" } };
    expect(needsApproval(approved)).toBe(false);
    expect(needsApproval({ ...approved, discountRate: 0.28 })).toBe(true);
  });

  it("재입고 60개(옥스포드)는 MD 전결이다", () => {
    expect(needsApproval(act("act-001"))).toBe(false);
  });

  it("우선순위 점수는 0~100 사이이고 신호가 강한 과제가 더 높다", () => {
    const r = readAll(VARIANTS, state());
    const hi = priorityOf(act("act-001"), r);
    expect(hi.score).toBeGreaterThan(0);
    expect(hi.score).toBeLessThanOrEqual(100);
    expect(hi.severity).toBeGreaterThan(0);
  });
});

describe("후보 과제 — 엔진이 새로 찾은 것만", () => {
  it("트러커 인디고 M 재입고를 후보로 내고, 이미 열린 과제와 겹치는 후보는 내지 않는다", () => {
    const cands = engineCandidates(state(), state().actions);
    const c = cands.find((x) => x.variantId === TRUCKER_M);
    expect(c?.type).toBe("restock");
    expect(c!.quantity).toBeGreaterThan(0);
    // 시드 과제가 이미 다루는 옥스포드 블랙 M은 후보로 다시 나오지 않는다
    expect(cands.some((x) => x.variantId === SCENARIO.A_VARIANT)).toBe(false);
    // 키가 유일하다
    expect(new Set(cands.map((x) => x.key)).size).toBe(cands.length);
  });

  it("candidateKey는 후보 키와 같은 형식이다", () => {
    expect(candidateKey({ type: "restock", variantId: TRUCKER_S })).toBe(`restock:${TRUCKER_S}`);
  });
});
