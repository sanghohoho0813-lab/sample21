/* 운영 통제와 Commerce Intelligence 전체 Loop — 브라우저 없이 스토어만으로 검증한다.
   고객 조회·찜·재입고 신청 → 신호 → 후보 → 과제 등록 → 승인 → 실행 → 재고 반영
   → 재입고 알림 → 구매 → 증빙·성과 전/후 */
import { beforeEach, describe, expect, it } from "vitest";
import { useApp } from "@/lib/store";
import { DEMO_CUSTOMER_ID, PRODUCT_BY_ID, SCENARIO, VARIANT_BY_ID, variantId } from "@/lib/demo/seed";
import { allOrders, effVariant } from "@/lib/kpi";
import { recommendFit } from "@/lib/engine";
import { customerLifecycle, fitHistory, productReturnSignal } from "@/lib/intel/lifecycle";
import { engineCandidates } from "@/lib/intel/candidates";
import { compareRows } from "@/lib/intel/measure";
import { approvalOf, needsApproval } from "@/lib/intel/policy";
import { skuSignals } from "@/lib/intel/signals";

const store = () => useApp.getState();
const TRUCKER_M = variantId(SCENARIO.E_PRODUCT, 0, "M");
const act = (id: string) => store().actions.find((a) => a.id === id)!;

beforeEach(() => store().resetDemo());

describe("운영 통제 — 승인 게이트", () => {
  it("대표 승인이 필요한 할인은 승인 전 '실행 시작'이 거부되고, 승인 후에는 진행된다", () => {
    store().updateActionStatus("act-003", "confirmed", "박지원 MD");
    expect(store().updateActionStatus("act-003", "in-progress", "박지원 MD")).toBe(false);
    expect(act("act-003").status).toBe("confirmed");

    store().approveAction("act-003", "정우성 대표");
    expect(needsApproval(act("act-003"))).toBe(false);
    expect(store().updateActionStatus("act-003", "in-progress", "박지원 MD")).toBe(true);
    expect(act("act-003").status).toBe("in-progress");
    expect(store().evidence.some((e) => e.actionId === "act-003" && /승인/.test(e.title))).toBe(true);
  });

  it("승인 뒤 할인율을 올리면 변경 이력이 남고 승인을 다시 받아야 한다", () => {
    store().approveAction("act-003", "정우성 대표");
    store().updateActionParams("act-003", { discountRate: 0.28 }, "박지원 MD", "재고 소진 속도 미달");

    const a = act("act-003");
    expect(a.changes?.at(-1)).toMatchObject({
      field: "discountRate",
      from: "20%",
      to: "28%",
      note: "재고 소진 속도 미달",
    });
    expect(approvalOf(a).approvedBy).toBeUndefined();
    expect(store().updateActionStatus("act-003", "in-progress", "박지원 MD")).toBe(false);
  });

  it("담당자·기한 변경도 이력에 남고, 값이 같으면 기록하지 않는다", () => {
    store().updateActionParams("act-001", { assigneeName: "이도윤 MD" }, "정우성 대표");
    store().updateActionParams("act-001", { assigneeName: "이도윤 MD" }, "정우성 대표");
    expect(act("act-001").changes).toHaveLength(1);
    expect(act("act-001").assigneeName).toBe("이도윤 MD");
  });

  it("검토 확정 때 '전' 지표, 완료 때 '후' 지표를 기록한다", () => {
    store().updateActionStatus("act-001", "confirmed", "박지원 MD");
    const before = act("act-001").baseline!.metrics.stock;
    store().updateActionStatus("act-001", "in-progress", "박지원 MD");
    store().updateActionStatus("act-001", "done", "박지원 MD", "60개 입고");
    const a = act("act-001");
    expect(a.result!.metrics.stock).toBe(before + 60);
    const rows = compareRows(a, store())!;
    expect(rows.find((r) => r.label === "재고")?.better).toBe(true);
  });
});

describe("전체 Loop — 고객 행동이 SKU 운영 판단이 되고 다시 고객에게 닫힌다", () => {
  it("관심 → 신호 → 후보 → 등록 → 실행 → 재고 → 알림 → 구매 → 증빙", () => {
    const v = VARIANT_BY_ID[TRUCKER_M];

    // 1) 고객: 품절 옵션을 보고 찜하고 재입고 알림을 신청한다
    const requestsBefore = effVariant(v, store()).restockRequests;
    store().track("view_product", { productId: v.productId, variantId: v.id });
    store().toggleWishlist(v.productId, v.id);
    store().subscribeRestock(v.id);
    const sig = skuSignals(v, store());
    expect(sig.variant.restockRequests).toBe(requestsBefore + 1);

    // 2) 신호 엔진: 재입고 후보를 낸다
    const cand = engineCandidates(store(), store().actions).find((c) => c.variantId === v.id);
    expect(cand).toBeDefined();
    expect(cand!.reasons.join(" ")).toMatch(new RegExp(`재입고 신청 ${requestsBefore + 1}건`));

    // 3) 운영자: 과제로 등록 — 같은 후보를 다시 등록해도 하나만 생긴다
    const id = store().createActionFromCandidate(cand!, "박지원 MD");
    expect(store().createActionFromCandidate(cand!, "박지원 MD")).toBe(id);
    expect(store().actions.filter((a) => a.origin === "engine")).toHaveLength(1);
    expect(engineCandidates(store(), store().actions).some((c) => c.variantId === v.id)).toBe(false);

    // 4) 검토 → (필요하면 승인) → 실행 → 완료
    store().updateActionStatus(id, "confirmed", "박지원 MD");
    if (needsApproval(act(id))) store().approveAction(id, "정우성 대표");
    expect(store().updateActionStatus(id, "in-progress", "박지원 MD")).toBe(true);
    expect(store().variantRestockState[v.id]).toBe("progress");
    expect(store().updateActionStatus(id, "done", "박지원 MD", "입고 검수 완료")).toBe(true);

    // 5) 재고 반영 + 대기 고객 알림
    const qty = act(id).quantity!;
    expect(effVariant(v, store()).stock).toBe(v.stock + qty);
    const mySub = store().restockSubs.find((r) => r.variantId === v.id)!;
    expect(mySub.status).toBe("notified");
    expect(store().notifications.some((n) => n.kind === "restock")).toBe(true);

    // 6) 고객 구매 → 알림이 '구매'로 닫힘
    store().addToCart(v.id);
    store().placeOrder({ address: "서울 마포구 성산로 12", payment: "카드" });
    expect(store().restockSubs.find((r) => r.variantId === v.id)!.status).toBe("purchased");

    // 7) 증빙과 성과 전/후 — 알림 후 구매까지 측정된다
    const ev = store().evidence.filter((e) => e.actionId === id);
    expect(ev.some((e) => /과제 등록/.test(e.title))).toBe(true);
    expect(ev.some((e) => e.type === "RESULT")).toBe(true);
    const rows = compareRows(act(id), store())!;
    const purchased = rows.find((r) => r.label === "알림 후 구매")!;
    expect(purchased.after).toBe("1건");
  });
});

describe("핏 학습 — 구매·반품 기록이 다음 추천 사이즈가 된다", () => {
  const me = () => fitHistory(DEMO_CUSTOMER_ID, store());

  it("받아서 유지한 주문의 사이즈를 그룹별로 배운다", () => {
    const top = me().find((f) => f.group === "top");
    expect(top?.size).toBe("S");
    expect(top?.corrected).toBe(false);
  });

  it("'사이즈 작음' 반품을 하면 그 그룹은 한 치수 크게 보정되고, 추천 이유에 남는다", () => {
    const order = allOrders(store()).find((o) => o.id === "MF-ME-001")!; // AERNO 스웨트 S (상의)
    store().requestReturn(order.id, order.items[0].variantId, "size-small");
    const top = me().find((f) => f.group === "top")!;
    expect(top.size).toBe("M");
    expect(top.corrected).toBe(true);

    const fit = recommendFit(PRODUCT_BY_ID[SCENARIO.A_PRODUCT], store().fitProfile, undefined, { history: me() });
    expect(fit.ready).toBe(true); // 프로필이 없어도 기록으로 추천
    expect(fit.reasons.join(" ")).toMatch(/내 구매 기록/);
  });

  it("계산한 사이즈가 상품에 없으면 가장 가까운 사이즈를 추천한다 (XS → S, M이 아니라)", () => {
    const oxford = PRODUCT_BY_ID[SCENARIO.A_PRODUCT]; // 크게 나온 상품 · S~XL
    expect(oxford.sizes).not.toContain("XS");
    const fit = recommendFit(oxford, { ...store().fitProfile, topSize: "S" });
    expect(fit.size).toBe("S");
  });

  it("상품 반품이 '작음'으로 몰린 상품은 반품 데이터를 추천 근거로 쓴다", () => {
    const sig = productReturnSignal(SCENARIO.B_PRODUCT, store());
    expect(sig?.direction).toBe("small");
    const fit = recommendFit(PRODUCT_BY_ID[SCENARIO.B_PRODUCT], { ...store().fitProfile, bottomSize: "M" }, undefined, {
      returnSignal: sig,
    });
    expect(fit.reasons.join(" ")).toMatch(/반품 데이터/);
  });

  it("Lifecycle 단계는 첫 구매·핏 학습·재구매를 기록에서 판정하고 다음 행동을 낸다", () => {
    const lc = customerLifecycle(DEMO_CUSTOMER_ID, store());
    const reached = Object.fromEntries(lc.stages.map((s) => [s.key, s.reached]));
    expect(reached).toMatchObject({ first: true, fit: true, repeat: true, returns: false });
    expect(lc.next.label.length).toBeGreaterThan(0);
  });
});
