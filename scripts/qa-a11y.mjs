/* scripts/qa-a11y.mjs — 접근성 · Hover 커버리지 자동 점검 (프로덕션 서버 대상, Playwright)
   1) 접근 가능한 이름이 없는 button / link / input / select
   2) 모바일(390px) 터치 타겟: 44px 미만 → warn, 40px 미만 → violation (인라인 텍스트 링크 제외)
   3) 데스크톱(1280px) hover 시 시각 변화가 전혀 없는 button / link (같은 class 조합은 1회만 검사)
   결과: 콘솔 요약 + QA_OUT/qa-a11y.json. 실행: node scripts/qa-a11y.mjs (QA_BASE 기본 http://localhost:3000) */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = process.env.QA_OUT ?? "qa-output";
const ROUTES = (process.env.QA_ROUTES ?? "/,/ranking,/new,/brands,/brands/nove-studio,/shop,/search?q=셔츠,/style,/products/p-nove-oxford,/wishlist,/cart,/checkout,/my,/my/orders,/my/restock,/my/profile,/next/membership,/ax,/ax/actions,/ax/sales,/ax/products,/ax/products/p-nove-oxford,/ax/inventory,/ax/customers,/ax/fit-returns,/ax/campaigns,/ax/brands,/ax/orders,/ax/evidence,/ax/evidence/pack,/ax/why,/ax/present,/ax/settings").split(",");
const HOVER_SAMPLE = Number(process.env.QA_HOVER_SAMPLE ?? 50);
const HOVER_PROPS = ["background-color", "color", "border-top-color", "box-shadow", "transform", "text-decoration-line", "opacity", "filter", "outline-color", "translate", "scale"];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const report = { base: BASE, at: new Date().toISOString(), unnamed: [], small: [], smallWarn: [], noHover: [], scanned: { elements: 0, hovered: 0, routes: 0 } };

const dismissTour = async (page) => { const skip = page.getByText("건너뛰기"); if (await skip.count()) { await skip.first().click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(250); } };

for (const width of (process.env.QA_WIDTHS ?? "1280,390").split(",").map(Number)) {
  const mobile = width < 768;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, deviceScaleFactor: 1, locale: "ko-KR", hasTouch: mobile });
  const page = await ctx.newPage();
  await page.route("**/*", (route) => (route.request().url().startsWith(BASE) ? route.continue() : route.abort()));
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1200); await dismissTour(page); await page.waitForTimeout(200); await dismissTour(page);
    const items = await page.evaluate((mobile) => {
      const txt = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
      const accName = (el) => {
        const lb = el.getAttribute("aria-labelledby"); if (lb) { const t = lb.split(/\s+/).map((id) => txt(document.getElementById(id))).join(" ").trim(); if (t) return t; }
        const al = el.getAttribute("aria-label"); if (al && al.trim()) return al.trim();
        if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l && txt(l)) return txt(l); }
        const wrap = el.closest("label"); if (wrap && txt(wrap)) return txt(wrap);
        const t = txt(el); if (t) return t;
        const img = el.querySelector("img[alt]"); if (img && img.getAttribute("alt")?.trim()) return img.getAttribute("alt").trim();
        const st = el.querySelector("svg > title"); if (st && txt(st)) return txt(st);
        const ti = el.getAttribute("title"); if (ti && ti.trim()) return ti.trim();
        const ph = el.getAttribute("placeholder"); if (ph && ph.trim()) return ph.trim();
        if (el.tagName === "INPUT" && (el.type === "submit" || el.type === "button") && el.value) return el.value;
        return "";
      };
      const out = []; let idx = 0;
      for (const el of document.querySelectorAll('a[href], button, [role="button"], input:not([type="hidden"]), select, textarea')) {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        const hidden = r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0" || !!el.closest('[aria-hidden="true"]') || !!el.closest("[inert]") || !!el.closest('[hidden]');
        el.setAttribute("data-qa-idx", String(idx));
        const cls = typeof el.className === "string" ? el.className : "";
        out.push({ idx, hidden, name: accName(el).slice(0, 60), tag: el.tagName.toLowerCase(), role: el.getAttribute("role"), type: el.getAttribute("type"), w: Math.round(r.width), h: Math.round(r.height), display: cs.display, disabled: !!el.disabled || el.getAttribute("aria-disabled") === "true", inView: r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0, sig: `${el.tagName.toLowerCase()}|${cls}`, desc: `${el.tagName.toLowerCase()}${el.getAttribute("data-tour") ? `[${el.getAttribute("data-tour")}]` : ""}${cls ? "." + cls.split(/\s+/).filter(Boolean).slice(0, 4).join(".") : ""}` });
        idx++;
      }
      return out;
    }, mobile);
    report.scanned.elements += items.length; report.scanned.routes += 1;
    for (const it of items) {
      if (it.hidden) continue;
      const interactive = it.tag === "button" || it.tag === "a" || it.role === "button" || it.tag === "input" || it.tag === "select" || it.tag === "textarea";
      if (interactive && !it.name) report.unnamed.push({ route, width, desc: it.desc, size: `${it.w}×${it.h}` });
      if (mobile && (it.tag === "button" || it.role === "button" || (it.tag === "a" && it.display !== "inline")) && !it.disabled) {
        const m = Math.min(it.w, it.h);
        if (m < 40) report.small.push({ route, desc: it.desc, name: it.name, size: `${it.w}×${it.h}` });
        else if (m < 44) report.smallWarn.push({ route, desc: it.desc, name: it.name, size: `${it.w}×${it.h}` });
      }
    }
    if (!mobile) {
      const seen = new Set(); let n = 0;
      for (const it of items) {
        if (it.hidden || !it.inView || it.disabled || !(it.tag === "button" || it.tag === "a" || it.role === "button")) continue;
        if (seen.has(it.sig)) continue; seen.add(it.sig);
        if (n++ >= HOVER_SAMPLE) break;
        const sel = `[data-qa-idx="${it.idx}"]`;
        const snap = (s) => s.evaluate((el, props) => { const pick = (e) => props.map((p) => getComputedStyle(e).getPropertyValue(p)); const nodes = [el, ...Array.from(el.querySelectorAll("*")).slice(0, 6)]; return nodes.map(pick); }, HOVER_PROPS);
        try {
          await page.mouse.move(2, 2); await page.waitForTimeout(200);
          const loc = page.locator(sel).first(); const box = await loc.boundingBox(); if (!box) continue;
          // pick a point that actually lands on the element (wrapped inline links can have empty box centers)
          const candidates = [[box.x + box.width / 2, box.y + Math.min(box.height / 2, 20)], [box.x + 12, box.y + 12], [box.x + box.width - 12, box.y + box.height - 12]];
          let point = null;
          for (const [x, y] of candidates) { const ok = await page.evaluate(([x, y, s]) => { const el = document.querySelector(s); const t = document.elementFromPoint(x, y); return !!el && !!t && (t === el || el.contains(t)); }, [x, y, sel]); if (ok) { point = [x, y]; break; } }
          if (!point) continue; // covered by another element (overlay / sticky) — not a hover problem
          const before = await snap(loc);
          await page.mouse.move(point[0], point[1]); await page.waitForTimeout(350);
          const after = await snap(loc);
          report.scanned.hovered += 1;
          if (JSON.stringify(before) === JSON.stringify(after)) report.noHover.push({ route, desc: it.desc, name: it.name });
        } catch { /* element detached (navigation / overlay) */ }
      }
      await page.mouse.move(2, 2);
    }
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "qa-a11y.json"), JSON.stringify(report, null, 2));
const uniq = (arr, k) => Array.from(new Map(arr.map((x) => [k(x), x])).values());
console.log(`A11Y SUMMARY — routes ${report.scanned.routes} · elements ${report.scanned.elements} · hovered ${report.scanned.hovered}`);
console.log(`unnamed ${report.unnamed.length} (unique ${uniq(report.unnamed, (x) => x.desc).length}) · small(<40) ${report.small.length} (unique ${uniq(report.small, (x) => x.desc).length}) · warn(40~43) ${report.smallWarn.length} · noHover ${report.noHover.length} (unique ${uniq(report.noHover, (x) => x.desc).length})`);
for (const [k, arr] of [["UNNAMED", report.unnamed], ["SMALL<40", report.small], ["NOHOVER", report.noHover]]) { console.log(`\n== ${k} (unique by desc, top 40) ==`); for (const x of uniq(arr, (y) => y.desc).slice(0, 40)) console.log(` ${x.route} ${x.desc} ${x.name ? `"${x.name}"` : ""} ${x.size ?? ""}`); }
