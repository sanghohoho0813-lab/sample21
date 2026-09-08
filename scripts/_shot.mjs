import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const [,, route, out, w, full, prep] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: Number(w), height: Number(w) < 768 ? 844 : 900 } });
await p.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
if (prep === "tutdone") { await p.goto(BASE + "/ax/settings", { waitUntil: "load" }); await p.evaluate(() => { const k = "morfit-demo-v1"; const s = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":3}'); s.state = { ...(s.state||{}), tutorialDone: true, customerTourDone: true }; localStorage.setItem(k, JSON.stringify(s)); }); }
await p.goto(BASE + route, { waitUntil: "load" }); await p.waitForTimeout(1500);
const skip = p.getByText("건너뛰기"); if (await skip.count()) { await skip.first().click(); await p.waitForTimeout(300); }
await p.screenshot({ path: out, fullPage: full === "full" }); await b.close();
