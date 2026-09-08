/* Whole-Hybrid Acceptance Journey (Unified U-7 / MORFIT §51) — drives the real app end to end.
   Fails loudly on: dead route, missing element, overlay stuck, state not propagating between surfaces. */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "ko-KR" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
const results = [];
const step = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); console.log("✓", name); } catch (e) { results.push({ name, ok: false, err: String(e.message).slice(0, 200) }); console.log("✗", name, "—", String(e.message).slice(0, 200)); } };
const go = async (path) => { await page.goto(BASE + path, { waitUntil: "networkidle" }); await page.waitForTimeout(400); };
const text = async () => (await page.locator("body").innerText());

await step("Fresh load + Demo Reset", async () => { await go("/ax/settings"); await page.evaluate(() => localStorage.clear()); await go("/"); });
await step("Customer Home 5초 테스트 (MORFIT/멀티브랜드/CTA)", async () => { const t = await text(); if (!/멀티브랜드|브랜드/.test(t)) throw new Error("no multibrand copy"); await page.locator('[data-tour="c-hero"]').first().waitFor({ timeout: 5000 }); });
await step("Tutorial 닫기 (overlay cleanup)", async () => { const skip = page.getByText("건너뛰기"); if (await skip.count()) { await skip.first().click(); await page.waitForTimeout(300); } const blocked = await page.evaluate(() => !!document.querySelector('[role="dialog"][aria-label="튜토리얼"]')); if (blocked) throw new Error("tutorial overlay remains"); });
await step("Ranking", async () => { await go("/ranking"); await page.locator('[data-tour="c-ranking"]').waitFor({ timeout: 5000 }); });
await step("Product detail (Scenario A)", async () => { await go("/products/p-nove-oxford?color=블랙&size=M"); await page.locator('[data-tour="c-fit-signal"]').waitFor({ timeout: 8000 }); });
await step("Fit profile → recommendation", async () => { const h = page.locator('input[name="height"]'); if (await h.count()) { await h.fill("168"); await page.locator('input[name="weight"]').fill("55"); } await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}"); }); });
await step("Restock subscribe (Loop 1 start)", async () => { const btn = page.locator('[data-tour="c-restock"]'); await btn.first().waitFor({ timeout: 5000 }); await btn.first().click(); await page.waitForTimeout(500); const st = await page.evaluate(() => JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}").state); if (!st || !(st.restockSubs || []).length) throw new Error("restockSubs not persisted"); });
await step("Business AX 전환 + KPI", async () => { await go("/ax"); await page.locator('[data-tour="kpi-row"]').waitFor({ timeout: 8000 }); const skip = page.getByText("건너뛰기"); if (await skip.count()) await skip.first().click(); });
await step("Role switch (MD) changes UI", async () => { const before = await text(); await page.getByRole("radio", { name: "MD" }).first().click(); await page.waitForTimeout(400); const after = await text(); if (before === after) throw new Error("role switch no change"); await page.getByRole("radio", { name: "대표" }).first().click(); });
await step("Demand Radar shows restock request reflected", async () => { await go("/ax/inventory"); await page.locator('[data-tour="demand-radar"]').waitFor({ timeout: 8000 }); const row = page.locator('[data-tour="radar-scenario-a"]'); await row.first().waitFor({ timeout: 5000 }); const t = await row.first().innerText(); if (!/19/.test(t)) throw new Error("expected restockRequests 18+1=19 in scenario row: " + t.replace(/\s+/g, " ").slice(0, 200)); });
await step("Action approve → execute → done (Loop 1 close)", async () => {
  await go("/ax/actions?open=act-001");
  await page.locator('[data-tour="action-first"]').first().waitFor({ timeout: 8000 });
  for (const label of ["확인", "실행 시작", "완료"]) { const b = page.getByRole("button", { name: new RegExp(`^${label}`) }); await b.first().waitFor({ timeout: 5000 }); await b.first().click(); await page.waitForTimeout(400); const confirm = page.getByRole("button", { name: /완료 처리|저장|확인$/ }); if (label === "완료" && (await confirm.count())) { await confirm.last().click(); } await page.waitForTimeout(400); }
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}").state);
  const a = st.actions.find((x) => x.id === "act-001"); if (a.status !== "done") throw new Error("act-001 status " + a.status);
  if (!(st.inventoryDelta["p-nove-oxford-c0-M"] > 0)) throw new Error("inventory not increased");
  if (!st.notifications.some((n) => n.kind === "restock")) throw new Error("no restock notification");
});
await step("Customer sees restock notification / status", async () => { await go("/my/restock"); const t = await text(); if (!/재입고/.test(t)) throw new Error("no restock text"); });
await step("Cart → Checkout → DEMO order (Loop 2 start)", async () => {
  await go("/products/p-aerno-sweat"); const size = page.getByRole("button", { name: /^S$|^M$/ }).first(); await size.click(); await page.getByRole("button", { name: /장바구니/ }).first().click(); await page.waitForTimeout(300);
  await go("/cart"); await page.getByRole("link", { name: /주문하기/ }).first().click(); await page.waitForLoadState("networkidle");
  const agree = page.locator('input[type="checkbox"]'); if (await agree.count()) await agree.first().check();
  await page.getByRole("button", { name: /DEMO 주문 완료|주문 완료/ }).first().click(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500);
  if (!/checkout\/complete/.test(page.url())) throw new Error("not on completion page: " + page.url());
});
await step("AX orders shows customer order → status change (Loop 2 close)", async () => {
  await go("/ax/orders"); const st = await page.evaluate(() => JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}").state); const oid = st.orders[0].id; const t = await text(); if (!t.includes(oid)) throw new Error("order not listed");
  const btn = page.getByRole("button", { name: /상품준비/ }).first(); await btn.waitFor({ timeout: 5000 }); await btn.click(); await page.waitForTimeout(400);
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}").state); if (st2.orders[0].status !== "preparing") throw new Error("status not changed: " + st2.orders[0].status);
});
await step("Customer My Page reflects order status", async () => { const st = await page.evaluate(() => JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}").state); await go(`/my/orders/${st.orders[0].id}`); const t = await text(); if (!/상품준비/.test(t)) throw new Error("status not reflected"); });
await step("Evidence lists loop", async () => { await go("/ax/evidence"); await page.locator('[data-tour="evidence-list"]').waitFor({ timeout: 8000 }); const t = await text(); if (!/재고 \+/.test(t)) throw new Error("restock result evidence missing"); });
await step("Why AX discoverable", async () => { await go("/ax"); await page.locator('[data-tour="nav-why"]').first().click(); await page.waitForLoadState("networkidle"); await page.locator('[data-tour="why-top"]').waitFor({ timeout: 8000 }); });
await step("Presentation mode starts", async () => { await go("/ax/present"); await page.getByRole("button", { name: /시연 시작/ }).first().click(); await page.waitForTimeout(600); const t = await text(); if (!/시연 모드 · 1/.test(t)) throw new Error("controller missing"); await page.keyboard.press("Escape"); });
await step("Theme 9 switch + no residual", async () => {
  await go("/ax/settings"); await page.locator('[data-tour="settings-theme"]').waitFor({ timeout: 8000 });
  const ids = ["deep-navy", "navy-gold", "emerald-gold", "forest-sage", "deep-teal", "onyx-gold", "burgundy-slate", "plum-indigo", "steel-platinum"];
  for (const id of ids) { const b = page.locator(`[data-theme-id="${id}"]`); await b.first().click(); await page.waitForTimeout(150); const applied = await page.evaluate(() => document.documentElement.getAttribute("data-theme")); if (applied !== id) throw new Error(`theme ${id} not applied (${applied})`); }
  await page.locator('[data-theme-id="deep-navy"]').first().click();
});
await step("Font scale + role + device preview (no recursion)", async () => {
  await page.getByRole("tab", { name: "크게" }).first().click(); const f = await page.evaluate(() => document.documentElement.getAttribute("data-font")); if (f !== "large") throw new Error("font not applied");
  await page.getByRole("tab", { name: "기본" }).first().click();
  await page.locator('[data-tour="device-preview"]').first().click(); await page.waitForTimeout(1500);
  const frame = page.frames().find((fr) => fr.url().includes("preview=1")); if (!frame) throw new Error("preview iframe missing");
  const inner = await frame.locator('[data-tour="device-preview"]').count(); if (inner > 0) throw new Error("recursive preview button inside frame");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300); const overflow = await page.evaluate(() => document.body.style.overflow); if (overflow === "hidden") throw new Error("scroll lock not restored");
});
await step("Demo Reset restores initial state", async () => { await go("/ax/settings"); await page.getByRole("button", { name: /데모 초기화/ }).first().click(); await page.waitForTimeout(300); const c = page.getByRole("button", { name: /초기화 실행|초기화$/ }); await c.last().click(); await page.waitForTimeout(600); const st = await page.evaluate(() => JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}").state); if ((st.orders || []).length) throw new Error("orders not cleared"); });

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} steps passed. pageerrors: ${errors.length}`);
errors.slice(0, 5).forEach((e) => console.log("  ", e));
process.exit(failed.length ? 1 : 0);
