/* Responsive + route smoke QA: screenshots every route at 8 widths, reports overflow/404/console errors. */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = process.env.QA_OUT ?? "qa/screens";
const WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const ROUTES = (process.env.QA_ROUTES ?? "/,/ranking,/new,/brands,/brands/nove-studio,/shop,/search?q=셔츠,/style,/products/p-nove-oxford,/wishlist,/cart,/checkout,/my,/my/orders,/my/restock,/my/profile,/next/membership,/ax,/ax/actions,/ax/sales,/ax/products,/ax/products/p-nove-oxford,/ax/inventory,/ax/customers,/ax/fit-returns,/ax/campaigns,/ax/brands,/ax/orders,/ax/evidence,/ax/why,/ax/present,/ax/settings").split(",");

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const report = [];
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, deviceScaleFactor: 1, locale: "ko-KR" });
  const page = await ctx.newPage();
  await page.route("**/*", (route) => (route.request().url().startsWith(BASE) ? route.continue() : route.abort()));
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 160)}`); });
  for (const route of ROUTES) {
    errors.length = 0;
    const res = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => ({ status: () => `ERR ${e.message}` }));
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const notFound = await page.evaluate(() => /페이지를 찾을 수 없습니다|404/.test(document.body.innerText.slice(0, 400)));
    const file = `${OUT}/${width}${route.replace(/[^a-z0-9]+/gi, "_")}.png`;
    if (process.env.QA_SHOTS !== "0") await page.screenshot({ path: file, fullPage: width >= 1024 ? false : true });
    report.push({ width, route, status: res.status(), overflow, notFound, errors: [...errors] });
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
const bad = report.filter((r) => r.status !== 200 || r.overflow > 0 || r.notFound || r.errors.length);
console.log(`checked ${report.length} route×width combos; issues: ${bad.length}`);
for (const b of bad) console.log(`${b.width}px ${b.route} status=${b.status} overflow=${b.overflow} notFound=${b.notFound} ${b.errors.slice(0, 2).join(" | ")}`);
