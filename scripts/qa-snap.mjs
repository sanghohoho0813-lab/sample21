/* scripts/qa-snap.mjs — 안정화 §31 스크린샷 세트 (육안 확인용) → qa-output/snap-*.png */
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
fs.mkdirSync("qa-output", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const init = () => {
  const k = "morfit-demo-v1";
  const s = JSON.parse(localStorage.getItem(k) || "{}");
  s.state = { ...(s.state || {}), tutorialDone: true, customerTourDone: true };
  s.version = 5;
  localStorage.setItem(k, JSON.stringify(s));
};
const shot = async (ctx, name, route, before) => {
  const page = await ctx.newPage();
  await page.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(1100);
  if (before) await before(page);
  await page.screenshot({ path: `qa-output/snap-${name}.png` });
  await page.close();
};
const m = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: "ko-KR",
  hasTouch: true,
});
await m.addInitScript(init);
await shot(m, "1-ax-mobile-home", "/ax");
await shot(m, "2-ax-mobile-drawer", "/ax/inventory", async (p) => {
  await p.getByRole("button", { name: "메뉴 열기", exact: true }).click();
  await p.waitForTimeout(500);
});
await shot(m, "3-ax-mobile-detail", "/ax/fit-returns", async (p) => {
  await p.evaluate(() => window.scrollTo(0, 1500));
  await p.waitForTimeout(400);
});
await shot(m, "4-customer-mobile-home", "/");
await shot(m, "5-customer-mobile-drawer", "/", async (p) => {
  await p.getByRole("button", { name: "전체 메뉴" }).click();
  await p.waitForTimeout(400);
  await p.getByRole("button", { name: /내 쇼핑/ }).click();
  await p.waitForTimeout(400);
});
await shot(m, "7-customer-mobile-product", "/products/p-nove-oxford?color=블랙&size=M");
const d = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: "ko-KR" });
await d.addInitScript(init);
await shot(d, "6-ax-desktop-inventory", "/ax/inventory");
await shot(d, "8-ax-desktop-products", "/ax/products");
const t = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, locale: "ko-KR" });
await t.addInitScript(init);
await shot(t, "9-ax-tablet-1024", "/ax");
await shot(t, "10-customer-tablet-1024-product", "/products/p-nove-oxford?color=블랙&size=M");
await browser.close();
console.log("snapshots saved");
