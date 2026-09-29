/* 화면에 보이는 영문 단어 수집 — 한글 UI 통일(D-28) 점검용.
   허용: AI · AX · B2B · B2C · 브랜드/서비스명 · 단위(cm, kg) · 코드(주문번호 등)
   실행: node scripts/qa-english.mjs  (QA_BASE, QA_ROUTES, QA_WIDTHS) */
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const WIDTHS = (process.env.QA_WIDTHS ?? "390,1440").split(",").map(Number);
const ROUTES = (process.env.QA_ROUTES ?? "/,/ranking,/new,/brands,/brands/nove-studio,/shop,/search?q=셔츠,/style,/products/p-nove-oxford,/wishlist,/cart,/checkout,/my,/my/orders,/my/orders/MF-ME-001,/my/restock,/my/profile,/next/membership,/ax,/ax/actions,/ax/sales,/ax/products,/ax/products/p-nove-oxford,/ax/inventory,/ax/customers,/ax/fit-returns,/ax/campaigns,/ax/brands,/ax/orders,/ax/evidence,/ax/evidence/pack,/ax/why,/ax/present,/ax/settings").split(",");
const exe = fs.existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined;
const browser = await chromium.launch({ executablePath: exe });
const seen = new Map();
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(300);
    const words = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const el = n.parentElement; if (!el) continue;
        if (el.closest("script,style,noscript,svg,[aria-hidden=true],code,pre,.recharts-wrapper")) continue;
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
        for (const m of n.textContent.matchAll(/[A-Za-z][A-Za-z&'’.-]*[A-Za-z]|[A-Za-z]/g)) out.push({ w: m[0], ctx: n.textContent.trim().slice(0, 60) });
      }
      return out;
    });
    for (const { w, ctx: c } of words) {
      const k = w;
      if (!seen.has(k)) seen.set(k, { count: 0, routes: new Set(), sample: c });
      const e = seen.get(k); e.count++; e.routes.add(route);
    }
  }
  await ctx.close();
}
await browser.close();
const rows = [...seen.entries()].sort((a, b) => b[1].count - a[1].count);
fs.mkdirSync("qa-output", { recursive: true });
fs.writeFileSync("qa-output/qa-english.json", JSON.stringify(rows.map(([w, e]) => ({ w, count: e.count, routes: [...e.routes], sample: e.sample })), null, 1));
for (const [w, e] of rows) console.log(String(e.count).padStart(4), w.padEnd(18), [...e.routes].slice(0, 3).join(","), "|", e.sample);
