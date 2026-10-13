/* Commerce Intelligence Loop E2E — 고객 행동이 SKU 운영 판단이 되고 다시 고객에게 닫히는지 실제 앱으로 검증한다.
   고객 조회·찜·재입고 신청 → 신호 판독 → 엔진 후보 → 과제 등록 → 검토·실행·완료 → 재고 반영
   → 고객 재입고 알림 → 구매 → 증빙·성과 전/후 · Loop 검증 8/8
   + 승인 게이트: 20% 이상 할인은 승인 전 '실행 시작' 불가 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const VID = "p-plane-trucker-c0-M"; // 데님 트러커 자켓 · 인디고 · M (시나리오 E)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "ko-KR" });
await ctx.addInitScript(() => {
  const k = "morfit-demo-v1";
  const s = JSON.parse(localStorage.getItem(k) || "{}");
  s.state = { ...(s.state || {}), tutorialDone: true, customerTourDone: true };
  s.version = 6;
  localStorage.setItem(k, JSON.stringify(s));
});
const page = await ctx.newPage();
await page.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
const step = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log("✓", name);
  } catch (e) {
    results.push({ name, ok: false });
    console.log("✗", name, "—", String(e.message).slice(0, 240));
  }
};
const must = (c, m) => {
  if (!c) throw new Error(m);
};
const go = async (path) => {
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(600);
};
const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}").state ?? {});
const action = async () => (await state()).actions.find((a) => a.variantId === VID && a.origin === "engine");

await step("고객: 품절 옵션을 보고 찜하고 재입고 알림 신청", async () => {
  await go(`/products/p-plane-trucker?color=${encodeURIComponent("인디고")}&size=M`);
  await page.getByRole("button", { name: /찜/ }).first().click();
  await page.waitForTimeout(300);
  await page.locator('[data-tour="c-restock"]').first().click();
  await page.waitForTimeout(400);
  const st = await state();
  must(
    st.restockSubs.some((r) => r.variantId === VID && r.status === "waiting"),
    "재입고 신청이 저장되지 않음",
  );
  must((st.restockDelta[VID] ?? 0) === 1, "재입고 신청 집계(delta)가 오르지 않음");
});

await step("AX 신호 판독: 트러커 인디고 M이 '수요 급등·재고 부족'으로 읽히고 신청 13건 반영", async () => {
  await go("/ax/inventory");
  const row = page.locator(`[data-signal-row="${VID}"]`).first();
  await row.waitFor({ timeout: 8000 });
  const t = await row.innerText();
  must(/수요 급등/.test(t), "판독 패턴이 다름: " + t.slice(0, 120));
  must(/재입고 신청 13건/.test(t), "고객 신청이 신호에 반영되지 않음: " + t.slice(0, 160));
});

await step("실행 센터: 엔진 후보를 과제로 등록 (중복 후보는 사라짐)", async () => {
  await go("/ax/actions");
  const cand = page.locator(`[data-candidate="restock:${VID}"]`).first();
  await cand.waitFor({ timeout: 8000 });
  await cand.getByRole("button", { name: /과제로 등록/ }).click();
  await page.waitForTimeout(600);
  const a = await action();
  must(a && a.status === "recommended", "엔진 과제가 생성되지 않음");
  must((await page.locator(`[data-candidate="restock:${VID}"]`).count()) === 0, "등록 후에도 후보가 남아 있음");
  must((await page.locator(`[data-action-id="${a.id}"]`).count()) === 1, "등록한 과제 카드가 보이지 않음");
});

await step("검토 → 실행 → 완료: 기준값·결과 스냅샷 · 재고 반영 · 알림 발송", async () => {
  const a = await action();
  const card = page.locator(`[data-action-id="${a.id}"]`);
  await card.getByRole("button", { name: "확인", exact: true }).click();
  await page.waitForTimeout(400);
  must((await action()).baseline, "검토 확정 때 기준값이 기록되지 않음");
  const start = card.getByRole("button", { name: "실행 시작" });
  must(!(await start.isDisabled()), "MD 전결 과제인데 실행 시작이 막힘");
  await start.click();
  await page.waitForTimeout(400);
  await card.getByRole("button", { name: /^완료/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole("dialog").getByRole("button", { name: "완료 처리" }).click();
  await page.waitForTimeout(500);
  const st = await state();
  const done = st.actions.find((x) => x.id === a.id);
  must(done.status === "done" && done.result, "완료·결과 스냅샷 없음");
  must((st.inventoryDelta[VID] ?? 0) === done.quantity, "재고가 과제 수량만큼 늘지 않음");
  must(st.restockSubs.find((r) => r.variantId === VID)?.status === "notified", "재입고 알림이 발송되지 않음");
  must(
    st.notifications.some((n) => n.kind === "restock"),
    "고객 알림함에 재입고 알림 없음",
  );
});

await step("고객: 알림을 받고 같은 옵션을 구매 → 알림이 '구매'로 닫힘", async () => {
  await go(`/products/p-plane-trucker?color=${encodeURIComponent("인디고")}&size=M`);
  await page
    .getByRole("button", { name: /장바구니/ })
    .first()
    .click();
  await page.waitForTimeout(300);
  await go("/cart");
  await page
    .getByRole("link", { name: /주문하기/ })
    .first()
    .click();
  await page.waitForLoadState("networkidle");
  const agree = page.locator('input[name="agree"]');
  await agree.waitFor({ timeout: 8000 });
  for (let i = 0; i < 3 && !/checkout\/complete/.test(page.url()); i++) {
    if (!(await agree.isChecked())) await agree.check();
    await page
      .getByRole("button", { name: /DEMO 주문 완료|주문 완료/ })
      .first()
      .click();
    await page.waitForURL(/checkout\/complete/, { timeout: 6000 }).catch(() => {});
  }
  must(/checkout\/complete/.test(page.url()), "주문 완료 페이지가 아님");
  const sub = (await state()).restockSubs.find((r) => r.variantId === VID);
  must(sub.status === "purchased" && sub.notifiedAt, "알림 후 구매로 닫히지 않음");
});

await step("성과 전/후: 과제 카드에서 '알림 후 구매 1건'이 측정됨", async () => {
  const a = await action();
  await go(`/ax/actions?open=${a.id}`);
  const out = page.locator(`[data-action-id="${a.id}"] [data-outcome]`);
  await out.waitFor({ timeout: 8000 });
  const t = await out.innerText();
  must(/알림 후 구매[\s\S]*1건/.test(t), "성과 표에 알림 후 구매가 없음: " + t.replace(/\s+/g, " ").slice(0, 200));
});

await step("Loop 검증 패널: 트러커 인디고 M 8/8 단계 통과", async () => {
  await go("/ax/evidence");
  const panel = page.locator('[data-tour="loop-verifier"]');
  await panel.waitFor({ timeout: 8000 });
  await panel.locator("select").selectOption(VID);
  await page.waitForTimeout(300);
  const ok = await panel.locator('[data-loop-step][data-ok="true"]').count();
  const failed = await panel.locator('[data-loop-step][data-ok="false"]').allInnerTexts();
  must(ok === 8, `통과 ${ok}/8 — 미통과: ${failed.map((x) => x.replace(/\s+/g, " ").slice(0, 40)).join(" | ")}`);
});

await step("승인 게이트: 20% 할인(act-003)은 승인 전 실행 불가 → 대표 승인 후 실행", async () => {
  await go("/ax/actions?open=act-003");
  const card = page.locator('[data-action-id="act-003"]');
  await card.waitFor({ timeout: 8000 });
  const confirm = card.getByRole("button", { name: "확인", exact: true });
  if (await confirm.count()) {
    await confirm.click();
    await page.waitForTimeout(300);
  }
  const start = card.getByRole("button", { name: "실행 시작" });
  must(await start.isDisabled(), "승인 전인데 실행 시작 가능");
  await card.getByRole("button", { name: "승인", exact: true }).click();
  await page.waitForTimeout(300);
  must(!(await start.isDisabled()), "승인 후에도 실행 시작이 막힘");
  const a = (await state()).actions.find((x) => x.id === "act-003");
  must(a.approval?.approvedBy, "승인 기록 없음");
});

await step("변경 이력: 수량 변경이 이력·증빙에 남는다", async () => {
  await go("/ax/actions?open=act-001");
  const card = page.locator('[data-action-id="act-001"]');
  await card.locator('input[type="number"]').fill("80");
  await card.getByRole("button", { name: "변경 저장" }).click();
  await page.waitForTimeout(300);
  const st = await state();
  const a = st.actions.find((x) => x.id === "act-001");
  must(a.quantity === 80 && a.changes?.some((c) => c.field === "quantity"), "수량 변경 이력 없음");
  must(
    st.evidence.some((e) => e.actionId === "act-001" && /수량/.test(e.title)),
    "변경 증빙 없음",
  );
});

const failed = results.filter((r) => !r.ok).length;
console.log(
  `\n${results.length - failed}/${results.length} 통과${errors.length ? ` · pageerror ${errors.length}: ${errors[0]}` : ""}`,
);
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
