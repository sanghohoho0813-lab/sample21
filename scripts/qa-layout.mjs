/* scripts/qa-layout.mjs — 모바일 품질 결함 자동 검출 (UI/UX Stabilization §16~20)
   각 폭 × 각 Route에서:
   1) 문서 가로 넘침            2) 한글 세로 깨짐(줄당 2글자 이하로 3줄 이상)
   3) 숫자·금액·날짜·% 줄바꿈   4) 말줄임 없이 잘린 글자       5) 카드 박스 밖으로 나간 글자
   + STRESS 모드(QA_STRESS=1): 상품명·브랜드명·캠페인명(seed 데이터)을 길게, 금액을 10자리로, 배지를 99+로 바꿔 같은 검사.
   실행: node scripts/qa-layout.mjs  (QA_BASE, QA_WIDTHS, QA_ROUTES, QA_STRESS, QA_DRAWER=1 로 조정) */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = process.env.QA_OUT ?? "qa-output";
const WIDTHS = (process.env.QA_WIDTHS ?? "360,390,412,430,768,1024,1280,1440").split(",").map(Number);
const STRESS = process.env.QA_STRESS === "1";
const DRAWER = process.env.QA_DRAWER === "1";
const ROUTES = (process.env.QA_ROUTES ?? "/,/ranking,/new,/brands,/brands/nove-studio,/shop,/search?q=셔츠,/style,/products/p-nove-oxford,/wishlist,/cart,/checkout,/my,/my/orders,/my/orders/MF-ME-001,/my/restock,/my/profile,/next/membership,/ax,/ax/actions,/ax/sales,/ax/products,/ax/products/p-nove-oxford,/ax/inventory,/ax/customers,/ax/fit-returns,/ax/campaigns,/ax/brands,/ax/orders,/ax/evidence,/ax/evidence/pack,/ax/why,/ax/present,/ax/settings").split(",");

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const findings = [];
const add = (f) => findings.push(f);

// 스트레스 대상 = '데이터'만 (상품명·브랜드명·캠페인명 — seed의 name 필드). 버튼·배지 같은 고정 문구는 늘리지 않는다.
const DATA_NAMES = [...new Set([...fs.readFileSync("src/lib/demo/seed.ts", "utf8").matchAll(/\bname: "([^"]{3,40})"/g)].map((m) => m[1]))]
  .sort((a, b) => b.length - a.length);
const stressScript = (names) => {
  const longName = " 헤비 워시드 오버사이즈 스페셜 에디션";
  const nodes = [];
  const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3) nodes.push(c); else if (c.nodeType === 1 && !["SCRIPT", "STYLE", "SVG", "svg"].includes(c.nodeName)) walk(c); } };
  walk(document.body);
  for (const t of nodes) {
    const s = t.nodeValue ?? ""; const trimmed = s.trim(); if (!trimmed) continue;
    const el = t.parentElement; if (!el) continue;
    // 금액: 1~9자리 → 10자리 (원 단위)
    if (/^[₩]?[\d,]{1,11}원$/.test(trimmed)) { t.nodeValue = s.replace(trimmed, "1,254,540,000원"); continue; }
    if (/^[\d,.]+만원$/.test(trimmed)) { t.nodeValue = s.replace(trimmed, "125,454만원"); continue; }
    // 배지 숫자
    if (/^\d{1,2}$/.test(trimmed) && el.closest("[aria-label*='장바구니'],[aria-label*='알림'],[aria-label*='찜']")) { t.nodeValue = "99+"; continue; }
    // 상품·브랜드·캠페인명(데이터)을 길게 — 메뉴·헤더·폼 옵션은 제외
    if (el.closest("nav, header, option, select")) continue;
    const hit = names.find((n) => s.includes(n));
    if (hit) t.nodeValue = s.replace(hit, hit + longName);
  }
};

const detectScript = () => {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) out.push({ kind: "doc-overflow", detail: `${sw}>${vw}` });
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false; const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05; };
  const label = (el) => { const t = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40); const tour = el.closest("[data-tour]")?.getAttribute("data-tour"); return `${el.tagName.toLowerCase()}${tour ? `@${tour}` : ""} "${t}"`; };
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let n;
  while ((n = tw.nextNode())) {
    const text = (n.nodeValue ?? "").trim(); if (!text) continue;
    const el = n.parentElement; if (!el || seen.has(el) || !visible(el)) continue;
    if (el.closest("[aria-hidden='true'], .sr-only, svg")) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0.5);
    if (!rects.length) continue;
    const tops = [...new Set(rects.map((r) => Math.round(r.top)))];
    const lines = tops.length;
    // 2) 한글 세로 깨짐
    const hangul = (text.match(/[가-힣]/g) || []).length;
    if (hangul >= 3 && lines >= 3 && text.replace(/\s/g, "").length / lines <= 2.2) { out.push({ kind: "vertical-korean", detail: label(el) }); seen.add(el); continue; }
    // 3) 숫자·금액·날짜·% 줄바꿈
    if (text.length <= 18 && /^[₩+\-−]?\s*[\d][\d,.:\s]*(%|원|만원|억|억원|개|건|명|일|점|p)?$/.test(text) && lines > 1) { out.push({ kind: "number-wrap", detail: label(el) }); seen.add(el); continue; }
    if (/^\d{4}\.\d{2}\.\d{2}/.test(text) && text.length <= 22 && lines > 1) { out.push({ kind: "date-wrap", detail: label(el) }); seen.add(el); continue; }
    // 4) 말줄임 없이 잘림 (가로)
    const cs = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== "visible" && cs.textOverflow !== "ellipsis" && !cs.webkitLineClamp?.match(/\d/) && !["auto", "scroll"].includes(cs.overflowX) && el.clientWidth > 0) { out.push({ kind: "clipped", detail: label(el) }); seen.add(el); continue; }
    // 5) 카드 박스 밖으로 나감
    const card = el.closest(".rounded-cardlg, .rounded-2xl, .rounded-xl");
    // 카드 사이에서 이미 잘라주는(overflow hidden · 말줄임) 조상이 있으면 '박스 밖'이 아니다
    let clippedBy = null; for (let a = el; a && a !== card; a = a.parentElement) { const o = getComputedStyle(a); if (o.overflowX !== "visible" || o.overflow !== "visible") { clippedBy = a; break; } }
    if (card && card !== el && !clippedBy) {
      const cr = card.getBoundingClientRect(); const ccs = getComputedStyle(card);
      if (ccs.overflowX === "visible" && ccs.overflow === "visible") {
        const r = rects.reduce((a, b) => ({ left: Math.min(a.left, b.left), right: Math.max(a.right, b.right) }), { left: Infinity, right: -Infinity });
        if (r.right > cr.right + 2 || r.left < cr.left - 2) { out.push({ kind: "out-of-box", detail: label(el) }); seen.add(el); }
      }
    }
  }
  return out;
};

for (const width of WIDTHS) {
  const mobile = width < 768;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 800 : 900 }, deviceScaleFactor: 1, locale: "ko-KR", hasTouch: mobile });
  await ctx.addInitScript(() => { try { const k = "morfit-demo-v1"; const s = JSON.parse(localStorage.getItem(k) || "{}"); s.state = { ...(s.state || {}), tutorialDone: true, customerTourDone: true }; s.version = 5; localStorage.setItem(k, JSON.stringify(s)); } catch {} });
  const page = await ctx.newPage();
  await page.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1100);
    if (DRAWER && mobile) {
      const btn = page.locator('button[aria-label="메뉴 열기"], button[aria-label="전체 메뉴"]').first();
      if (await btn.count()) { await btn.click().catch(() => {}); await page.waitForTimeout(450); }
    }
    if (STRESS) { await page.evaluate(stressScript, DATA_NAMES); await page.waitForTimeout(120); }
    const res = await page.evaluate(detectScript).catch((e) => [{ kind: "error", detail: String(e).slice(0, 120) }]);
    for (const r of res) add({ width, route, ...r });
  }
  await ctx.close();
}
await browser.close();
const tag = `${STRESS ? "stress" : "normal"}${DRAWER ? "-drawer" : ""}`;
fs.writeFileSync(path.join(OUT, `qa-layout-${tag}.json`), JSON.stringify(findings, null, 2));
const byKind = findings.reduce((a, f) => ((a[f.kind] = (a[f.kind] ?? 0) + 1), a), {});
console.log(`LAYOUT QA (${tag}) — widths ${WIDTHS.join("/")} × ${ROUTES.length} routes → ${findings.length} findings`, JSON.stringify(byKind));
const uniq = new Map(); for (const f of findings) { const k = `${f.kind}|${f.route}|${f.detail}`; if (!uniq.has(k)) uniq.set(k, { ...f, widths: [f.width] }); else uniq.get(k).widths.push(f.width); }
for (const f of [...uniq.values()].slice(0, 120)) console.log(` ${f.kind.padEnd(15)} ${f.route.padEnd(26)} [${f.widths.join(",")}] ${f.detail}`);
