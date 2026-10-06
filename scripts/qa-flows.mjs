/* 실제 사용 흐름 + 예외 상황 E2E (UI/UX 고도화 v2 · 기능 안정화 · 2차: 뒤로 버튼 · 하단 결제 바 · 완료 화면 · 카드 자리 유지 · 3차: 쿠폰 금액 · 키보드 · 탭 제목)
   - 고객(휴대폰 390): 검색 0건/결과 · 상품 상세 하단 구매 바 → 옵션 시트 · 찜 · 장바구니 수량/삭제 ·
     주문서 입력 검증(오류 표시 → 고치면 즉시 해제) · 핏 프로필 범위 검증 · 주문 취소 · 품절 옵션 재입고 알림 · 하단 탭 숨김
   - AX(PC 1440): 실행 센터 필터/초기화 · 무시 사유 필수 · 주문 검색 0건 · 재고 상태 필터 · 증빙 필터 접기/열기 ·
     캠페인 날짜 검증 · CSV 형식/필수 열 검증 · 상품 표 → 상세 이동
   실행: node scripts/qa-flows.mjs  (QA_BASE) */
import { chromium } from "playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const exe = fs.existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined;
const browser = await chromium.launch({ executablePath: exe });
const results = [];
const problems = [];
const init = () => { try { const k = "morfit-demo-v1"; const s = JSON.parse(localStorage.getItem(k) || "{}"); s.state = { ...(s.state || {}), tutorialDone: true, customerTourDone: true }; s.version = 5; localStorage.setItem(k, JSON.stringify(s)); } catch { /* 저장소 차단 환경 */ } };

async function ctxFor(viewport, touch) {
  const ctx = await browser.newContext({ viewport, locale: "ko-KR", hasTouch: touch });
  await ctx.addInitScript(init);
  const page = await ctx.newPage();
  await page.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  page.on("pageerror", (e) => problems.push(`pageerror ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|net::/.test(m.text())) problems.push(`console ${m.text().slice(0, 160)}`); });
  return { ctx, page };
}
const step = async (name, fn) => { try { await fn(); results.push(["PASS", name]); console.log("✓", name); } catch (e) { results.push(["FAIL", name, String(e.message ?? e).split("\n")[0]]); console.log("✗", name, "—", String(e.message ?? e).split("\n")[0]); } };
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const go = async (p, url) => { await p.goto(BASE + url, { waitUntil: "networkidle" }); await p.waitForTimeout(500); };
const text = (p) => p.evaluate(() => document.body.innerText);
const store = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("morfit-demo-v1") || "{}").state ?? {});

/* ------------------------------ 고객 · 휴대폰 ------------------------------ */
{
  const { ctx, page: m } = await ctxFor({ width: 390, height: 844 }, true);

  await step("검색 0건 — 빈 결과 안내", async () => {
    await go(m, "/search?q=" + encodeURIComponent("존재하지않는상품zz"));
    const t = await text(m); must(/0개/.test(t) && /검색/.test(t), "0건 안내가 없음");
  });
  await step("검색 결과 — '셔츠'", async () => {
    await go(m, "/search?q=" + encodeURIComponent("셔츠"));
    must((await m.locator('a[href^="/products/"]').count()) > 0, "결과 상품 없음");
  });
  await step("상품 상세 — 하단 탭 대신 구매 바", async () => {
    await go(m, "/products/p-nove-oxford");
    must(await m.locator("[data-buy-bar]").isVisible(), "구매 바 없음");
    must(!(await m.getByRole("navigation", { name: "하단 메뉴" }).isVisible()), "상품 상세에서 하단 탭이 보임");
    const box = await m.locator("[data-buy-bar]").boundingBox(); must(box && box.y + box.height >= 844 - 2, "구매 바가 화면 맨 아래가 아님");
  });
  await step("구매 바 → 옵션 미선택 시 옵션 시트 · 버튼 비활성", async () => {
    await m.locator("[data-buy-bar]").getByRole("button", { name: "장바구니" }).click(); await m.waitForTimeout(400);
    const dlg = m.getByRole("dialog"); await dlg.waitFor({ timeout: 4000 });
    const cta = dlg.getByRole("button", { name: /색상과 사이즈를 선택해주세요/ }); must(await cta.isDisabled(), "옵션 없이 담기 버튼이 활성");
  });
  await step("옵션 시트에서 사이즈 선택 → 장바구니 담기", async () => {
    const dlg = m.getByRole("dialog");
    await dlg.getByRole("button", { name: /^사이즈 S/ }).click(); await m.waitForTimeout(200);
    await dlg.getByRole("button", { name: /장바구니 담기/ }).click(); await m.waitForTimeout(500);
    must((await m.getByRole("dialog").count()) === 0, "시트가 닫히지 않음");
    const st = await store(m); must((st.cart ?? []).length === 1, `장바구니 ${(st.cart ?? []).length}건`);
  });
  await step("구매 바 찜 버튼 — 아이콘 표시 · 토글", async () => {
    const heart = m.locator("[data-buy-bar]").getByRole("button", { name: /찜하기|찜 해제/ });
    const w = await heart.locator("svg").evaluate((s) => s.getBoundingClientRect().width); must(w >= 16, `하트 아이콘 폭 ${w}px`);
    await heart.click(); await m.waitForTimeout(300); must((await heart.getAttribute("aria-pressed")) === "true", "찜 상태로 바뀌지 않음");
  });
  await step("장바구니 — 수량 +/− · 삭제 · 빈 상태", async () => {
    await go(m, "/cart");
    await m.getByRole("button", { name: "수량 늘리기" }).first().click(); await m.waitForTimeout(200);
    must((await store(m)).cart[0].qty === 2, "수량 증가 안 됨");
    await m.getByRole("button", { name: "수량 줄이기" }).first().click(); await m.waitForTimeout(200);
    must((await store(m)).cart[0].qty === 1, "수량 감소 안 됨");
    await m.getByRole("button", { name: "삭제" }).first().click(); await m.waitForTimeout(300);
    must(/장바구니가 비어 있습니다/.test(await text(m)), "빈 장바구니 안내 없음");
  });
  await step("장바구니 → 주문서 — 하단 고정 결제 바(탭 위) · 주문서에서는 탭 숨김", async () => {
    await go(m, "/products/p-nove-oxford");
    await m.locator("[data-buy-bar]").getByRole("button", { name: "구매하기" }).click(); await m.waitForTimeout(300);
    const dlg = m.getByRole("dialog"); await dlg.getByRole("button", { name: /^사이즈 L/ }).click();
    await dlg.getByRole("button", { name: /구매하기/ }).click(); await m.waitForURL(/\/cart/, { timeout: 6000 }); await m.waitForTimeout(400);
    const bar = m.locator("[data-checkout-bar]"); must(await bar.isVisible(), "장바구니 결제 바 없음");
    const bb = await bar.boundingBox(); const tab = await m.getByRole("navigation", { name: "하단 메뉴" }).boundingBox();
    must(bb && tab && bb.y + bb.height <= tab.y + 1, "결제 바가 하단 탭과 겹침");
    await bar.getByRole("link", { name: /주문하기/ }).click(); await m.waitForURL(/\/checkout/, { timeout: 6000 }); await m.waitForTimeout(400);
    must(!(await m.getByRole("navigation", { name: "하단 메뉴" }).isVisible()), "주문서에서 하단 탭이 보임");
    const cb = await m.locator("[data-checkout-bar]").boundingBox(); must(cb && cb.y + cb.height >= 844 - 2, "주문서 결제 버튼이 화면 맨 아래가 아님");
  });
  await step("주문서 — 오류 표시 후 고치면 즉시 해제 · 정상 주문", async () => {
    await m.locator('input[name="name"]').fill(""); await m.locator('input[name="phone"]').fill("123");
    await m.getByRole("button", { name: /데모 주문 완료/ }).click(); await m.waitForTimeout(300);
    let t = await text(m);
    must(/주문자 이름을 입력/.test(t) && /휴대폰 번호 형식/.test(t) && /동의해주세요/.test(t), "필수 오류 문구가 모두 나오지 않음");
    must(await m.evaluate(() => document.activeElement?.getAttribute("name") === "name"), "첫 오류 칸으로 이동하지 않음");
    await m.locator('input[name="name"]').fill("김하늘"); await m.waitForTimeout(150);
    t = await m.locator("form", { has: m.locator('input[name="name"]') }).innerText(); must(!/주문자 이름을 입력/.test(t), "이름을 고쳐도 오류가 남아 있음");
    await m.locator('input[name="phone"]').fill("010-1234-5678");
    await m.locator('input[name="agree"]').check();
    await m.getByRole("button", { name: /데모 주문 완료/ }).click(); await m.waitForURL(/checkout\/complete/, { timeout: 8000 });
  });
  await step("주문 완료 — 버튼 높이 · 주문 정보 정리 · 중복 알림 없음", async () => {
    await m.waitForTimeout(500);
    for (const name of ["주문 상세 보기", "쇼핑 계속하기"]) { const h = (await m.getByRole("link", { name }).boundingBox())?.height ?? 0; must(h >= 44, `'${name}' 버튼 높이 ${h}px`); }
    const t = await text(m); must(/결제수단/.test(t) && /주문자/.test(t), "결제수단·주문자 정보 행 없음");
    must(!/결제수단\(데모\):/.test(t), "메모 원문이 그대로 노출됨");
    must(!/주문.*완료/.test(await m.locator("[data-toaster]").innerText()), "완료 화면과 같은 내용의 토스트가 또 뜸");
  });
  await step("주문 취소 — 확인 모달 → 취소 상태", async () => {
    const id = m.url().split("/").pop();
    await go(m, `/my/orders/${id}`);
    await m.getByRole("button", { name: "취소 요청" }).first().click(); await m.waitForTimeout(300);
    await m.getByRole("dialog").getByRole("button", { name: "취소 요청" }).click(); await m.waitForTimeout(400);
    const o = (await store(m)).orders.find((x) => x.id === id); must(o?.status === "cancelled", `상태 ${o?.status}`);
  });
  await step("쿠폰 주문 — 주문서에 보인 금액 그대로 저장 (할인 100배 계산 회귀)", async () => {
    await go(m, "/products/p-nove-oxford");
    await m.locator("[data-buy-bar]").getByRole("button", { name: "구매하기" }).click(); await m.waitForTimeout(300);
    const dlg = m.getByRole("dialog"); await dlg.getByRole("button", { name: /^사이즈 L/ }).click();
    await dlg.getByRole("button", { name: /구매하기/ }).click(); await m.waitForURL(/\/cart/, { timeout: 6000 }); await m.waitForTimeout(300);
    await m.locator("main select").first().selectOption({ label: "WELCOME5 · 5% 할인" }); await m.waitForTimeout(200);
    await m.locator("[data-checkout-bar]").getByRole("link", { name: /주문하기/ }).click(); await m.waitForURL(/\/checkout\?coupon=WELCOME5/, { timeout: 6000 }); await m.waitForTimeout(400);
    const shown = Number((await m.locator("[data-checkout-bar]").innerText()).replace(/[^0-9]/g, ""));
    await m.locator('input[name="agree"]').check();
    await m.locator("[data-checkout-bar]").getByRole("button").click(); await m.waitForURL(/checkout\/complete/, { timeout: 8000 });
    const o = (await store(m)).orders[0];
    must(o.total === shown && o.total > 0, `주문서 ${shown}원 ≠ 저장 ${o.total}원`);
  });
  await step("핏 프로필 — 범위 밖 값 거부 · 정상 저장", async () => {
    await go(m, "/style");
    const h = m.locator('input[name="height"]').first(); await h.fill("300");
    must(/120~220cm/.test(await text(m)) && (await h.getAttribute("aria-invalid")) === "true", "키 범위 오류가 바로 보이지 않음");
    await m.getByRole("button", { name: /프로필 저장/ }).click(); await m.waitForTimeout(300);
    must((await store(m)).fitProfile?.height == null, "범위 밖 키가 저장됨");
    await h.fill("170"); await m.locator('input[name="weight"]').first().fill("60"); await m.waitForTimeout(150);
    must((await h.getAttribute("aria-invalid")) !== "true", "고친 뒤에도 오류 표시가 남음");
    await m.getByRole("button", { name: /프로필 저장/ }).click(); await m.waitForTimeout(400);
    const fp = (await store(m)).fitProfile; must(fp?.height === 170 && fp?.weight === 60, "프로필 저장 안 됨");
  });
  await step("품절 옵션 — 구매 바가 재입고 알림으로 바뀌고 신청됨", async () => {
    await go(m, "/products/p-nove-oxford?color=" + encodeURIComponent("화이트") + "&size=M");
    const bar = m.locator("[data-buy-bar]");
    await bar.getByRole("button", { name: /재입고 알림 신청/ }).click(); await m.waitForTimeout(400);
    const subs = (await store(m)).restockSubs ?? []; must(subs.some((s) => s.status === "waiting"), "재입고 알림이 기록되지 않음");
  });
  await step("하단 탭 — 상품 상세 밖에서는 다시 보임", async () => {
    await go(m, "/wishlist"); must(await m.getByRole("navigation", { name: "하단 메뉴" }).isVisible(), "하단 탭이 안 보임");
  });
  await step("페이지 맨 아래 — 마지막 줄이 하단 탭·구매 바에 가려지지 않음", async () => {
    for (const u of ["/wishlist", "/products/p-nove-oxford"]) {
      await go(m, u); await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await m.waitForTimeout(400);
      const r = await m.evaluate(() => {
        const last = document.querySelector("footer")?.lastElementChild?.getBoundingClientRect();
        const tops = Array.from(document.querySelectorAll("[data-bottom-bar],[data-buy-bar],[data-checkout-bar]")).map((el) => el.getBoundingClientRect()).filter((b) => b.height > 0).map((b) => b.top);
        return { bottom: last?.bottom ?? 0, top: Math.min(...tops) };
      });
      must(r.bottom <= r.top + 1, `${u}: 푸터 마지막 줄 ${Math.round(r.bottom)} > 바 ${Math.round(r.top)}`);
    }
  });
  await step("뒤로 버튼 — 바로 들어온 하위 화면은 상위 화면으로", async () => {
    await go(m, "/products/p-nove-oxford");
    await m.locator("header").getByRole("button", { name: "뒤로" }).click(); await m.waitForURL(/\/shop/, { timeout: 6000 });
  });
  await step("뒤로 버튼 — 앱 안에서 이동했으면 직전 화면으로", async () => {
    await go(m, "/ranking");
    await m.locator('main a[href^="/products/"]').first().click(); await m.waitForURL(/\/products\//, { timeout: 6000 }); await m.waitForTimeout(300);
    await m.locator("header").getByRole("button", { name: "뒤로" }).click(); await m.waitForURL(/\/ranking/, { timeout: 6000 });
  });
  await step("찜 — 평소 상태 배지('정상'·'가격 변동 없음') 없음", async () => {
    await go(m, "/wishlist");
    const t = await m.locator("main").innerText(); must(!/가격 변동 없음|관심 상승|(^|\s)정상(\s|$)/m.test(t), "의미 없는 상태 배지가 보임");
  });
  await step("AX 주문(휴대폰) — 처리 버튼은 카드 내용 아래", async () => {
    await go(m, "/ax/orders");
    const btn = m.getByRole("button", { name: /^(상품준비|출고완료|배송중|배송완료)$/ }).first();
    const card = btn.locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
    const dl = await card.locator("dl").boundingBox(); const bb = await btn.boundingBox();
    must(dl && bb && bb.y >= dl.y + dl.height, "처리 버튼이 주문 내용보다 위에 있음");
  });
  await ctx.close();
}

/* ------------------------------ AX · PC ------------------------------ */
{
  const { ctx, page: d } = await ctxFor({ width: 1440, height: 900 }, false);
  const countText = async () => (await text(d)).match(/(\d+)건 · 긴급한 것부터/)?.[1];

  await step("실행 센터 — 유형 필터 · 초기화", async () => {
    await go(d, "/ax/actions");
    const all = await countText();
    await d.getByRole("button", { name: "할인", exact: true }).click(); await d.waitForTimeout(250);
    const filtered = await countText(); must(filtered && all && Number(filtered) < Number(all), `필터 전 ${all} → 후 ${filtered}`);
    await d.getByRole("button", { name: "초기화" }).first().click(); await d.waitForTimeout(250);
    must((await countText()) === all, "초기화 후 건수가 원래대로 돌아오지 않음");
  });
  await step("과제 무시 — 사유 없으면 처리 불가", async () => {
    await d.getByRole("button", { name: "무시" }).first().click(); await d.waitForTimeout(300);
    const dlg = d.getByRole("dialog"); const btn = dlg.getByRole("button", { name: "무시 처리" });
    must(await btn.isDisabled(), "사유 없이 무시 가능");
    await dlg.locator("textarea").fill("브랜드 정책상 보류"); must(!(await btn.isDisabled()), "사유 입력 후에도 비활성");
    await dlg.getByRole("button", { name: "취소" }).click(); await d.waitForTimeout(200);
  });
  await step("과제 확인 → 카드가 같은 자리에 남고 다음 단계 버튼으로", async () => {
    await go(d, "/ax/actions");
    const first = d.locator("[data-action-id]").first(); const id = await first.getAttribute("data-action-id");
    await first.getByRole("button", { name: "확인", exact: true }).click(); await d.waitForTimeout(400);
    must((await d.locator("[data-action-id]").first().getAttribute("data-action-id")) === id, "확인 후 카드 순서가 바뀜");
    must((await d.locator(`[data-action-id="${id}"]`).getByRole("button", { name: "실행 시작" }).count()) === 1, "다음 단계(실행 시작) 버튼 없음");
  });
  await step("키보드 — 모달은 열면 안으로 포커스 · Tab이 밖으로 새지 않음 · ESC로 닫으면 연 버튼으로", async () => {
    await go(d, "/ax/actions");
    const opener = d.locator("[data-action-id]").first().getByRole("button", { name: "무시" });
    await opener.focus(); await d.keyboard.press("Enter"); await d.waitForTimeout(300);
    const inDialog = () => d.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    must(await inDialog(), "모달을 열어도 포커스가 바깥에 있음");
    for (let i = 0; i < 12; i++) { await d.keyboard.press(i % 3 === 2 ? "Shift+Tab" : "Tab"); must(await inDialog(), `Tab ${i + 1}번째에 포커스가 모달 밖으로 나감`); }
    await d.keyboard.press("Escape"); await d.waitForTimeout(300);
    must((await d.getByRole("dialog").count()) === 0, "ESC로 닫히지 않음");
    must(await d.evaluate(() => document.activeElement?.textContent?.includes("무시") ?? false), "닫은 뒤 포커스가 연 버튼으로 돌아오지 않음");
  });
  await step("키보드 — 첫 Tab에 '본문 바로가기'", async () => {
    await go(d, "/ax/inventory");
    await d.keyboard.press("Tab");
    must(await d.evaluate(() => document.activeElement?.textContent === "본문 바로가기"), "건너뛰기 링크가 첫 포커스가 아님");
    await d.keyboard.press("Enter"); await d.waitForTimeout(200);
    must(await d.evaluate(() => document.activeElement?.id === "main"), "본문으로 이동하지 않음");
  });
  await step("탭 제목 — 화면마다 다르고 메뉴 이름과 같음", async () => {
    const cases = [["/ranking", "랭킹 | MORFIT"], ["/products/p-nove-oxford", /^오버핏 옥스포드 셔츠 · NOVE STUDIO \| MORFIT$/], ["/ax/actions", "실행 센터 · MORFIT AX"], ["/ax/orders", "주문·배송 · MORFIT AX"]];
    for (const [url, want] of cases) { await go(d, url); const t = await d.title(); must(typeof want === "string" ? t === want : want.test(t), `${url}: '${t}'`); }
    // 첫 HTML(서버 응답)에 이미 제목이 들어 있어야 한다 — 404도 마찬가지
    const html = await (await fetch(BASE + "/ranking")).text(); must(html.includes("<title>랭킹 | MORFIT</title>"), "서버 HTML에 제목 없음");
    const nf = await fetch(BASE + "/nope-page"); must(nf.status === 404 && (await nf.text()).includes("<title>페이지를 찾을 수 없음 | MORFIT</title>"), "404 제목");
  });
  await step("메타 리소스 — manifest · robots · 공유 이미지 · 보안 헤더", async () => {
    const mf = await fetch(BASE + "/manifest.webmanifest"); must(mf.ok && (await mf.json()).short_name === "MORFIT", "manifest");
    must(/Disallow: \/ax/.test(await (await fetch(BASE + "/robots.txt")).text()), "robots에 /ax 제외 없음");
    const og = await fetch(BASE + "/opengraph-image"); must(og.ok && og.headers.get("content-type") === "image/png", "OG 이미지");
    const home = await fetch(BASE + "/"); must(home.headers.get("x-content-type-options") === "nosniff" && !home.headers.get("x-powered-by"), "보안 헤더");
    must((await home.text()).includes('property="og:image"'), "og:image 메타 없음");
  });
  await step("주문 검색 0건 — 빈 상태", async () => {
    await go(d, "/ax/orders");
    await d.getByPlaceholder(/주문번호 또는 고객명/).fill("없는주문zz"); await d.waitForTimeout(400);
    must(/없습니다|0건/.test(await text(d)), "빈 결과 안내 없음");
  });
  await step("재고 — 상태 필터 · 0건 상태는 숨김", async () => {
    await go(d, "/ax/inventory");
    const before = await d.locator("[data-variant-id]").count();
    await d.getByRole("button", { name: /^품절 \d+/ }).first().click(); await d.waitForTimeout(300);
    const after = await d.locator("[data-variant-id]").count(); must(after > 0 && after < before, `품절 필터 ${before} → ${after}`);
    must((await d.getByRole("button", { name: /입고 완료 0$/ }).count()) === 0, "0건 상태 칩이 보임");
  });
  await step("증빙 — 필터는 접혀 있다가 열림 · 유형 필터", async () => {
    await go(d, "/ax/evidence");
    must((await d.getByLabel("담당자").count()) === 0, "필터가 처음부터 펼쳐져 있음");
    await d.getByRole("button", { name: /^필터/ }).click(); await d.waitForTimeout(250);
    must(await d.getByLabel("담당자").isVisible(), "필터가 열리지 않음");
    await d.getByRole("button", { name: "결과", exact: true }).click(); await d.waitForTimeout(250);
    must(/필터 1/.test(await text(d)) || (await d.getByRole("button", { name: /필터 1/ }).count()) > 0, "적용된 필터 수 표시 없음");
  });
  await step("캠페인 만들기 — 종료일이 시작일보다 빠르면 진행 불가", async () => {
    await go(d, "/ax/campaigns");
    await d.getByRole("button", { name: "캠페인 만들기" }).click(); await d.waitForTimeout(300);
    const dlg = d.getByRole("dialog");
    await dlg.getByRole("button", { name: "다음" }).click(); await dlg.getByRole("button", { name: "다음" }).click();
    await dlg.locator('input[name="cp-end"]').fill("2020-01-01"); await d.waitForTimeout(200);
    must(await dlg.getByRole("button", { name: "다음" }).isDisabled(), "잘못된 기간인데 다음 진행 가능");
    must(/종료일은 시작일 이후/.test(await dlg.innerText()), "기간 오류 안내 없음");
  });
  await step("CSV — 형식 오류 · 필수 열 누락 안내", async () => {
    await go(d, "/ax/settings");
    await d.getByRole("button", { name: /CSV 가져오기 열기/ }).click(); await d.waitForTimeout(300);
    const dlg = d.getByRole("dialog"); await dlg.getByRole("tab", { name: "업로드" }).click(); await d.waitForTimeout(200);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-csv-"));
    const bad = path.join(dir, "memo.txt"); fs.writeFileSync(bad, "hello");
    await dlg.locator('input[type="file"]').setInputFiles(bad); await d.waitForTimeout(300);
    must(/CSV 파일\(\.csv\)만/.test(await dlg.innerText()), "형식 오류 안내 없음");
    const csv = path.join(dir, "products.csv"); fs.writeFileSync(csv, "product_id,name\np-1,테스트\n");
    await dlg.locator('input[type="file"]').setInputFiles(csv); await d.waitForTimeout(500);
    must(/필수 열이 없습니다: .*brand_id/.test(await dlg.innerText()), "필수 열 누락 안내 없음");
  });
  await step("상품 표 → 행 클릭 시 상세로 이동", async () => {
    await go(d, "/ax/products");
    await d.locator("tbody tr").first().click(); await d.waitForURL(/\/ax\/products\/.+/, { timeout: 6000 });
  });
  await ctx.close();
}

await browser.close();
const fails = results.filter((r) => r[0] === "FAIL");
console.log(`\n${results.length - fails.length}/${results.length} flows passed · console/page errors: ${problems.length}`);
for (const p of [...new Set(problems)].slice(0, 10)) console.log("  !", p);
fs.mkdirSync("qa-output", { recursive: true });
fs.writeFileSync("qa-output/qa-flows.json", JSON.stringify({ results, problems }, null, 2));
process.exit(fails.length || problems.length ? 1 : 0);
