"use client";
/* 12 기획의도 (Why AX) — MORFIT 맞춤 16섹션 스토리 페이지. 일반론 뒤에는 항상 "MORFIT이라면…"이 따라온다.
   숫자는 전부 Demo Repository(seed) + store 계산값이며 실제 성과가 아니다. */
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BookOpen, ExternalLink, LayoutDashboard, Play, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { BRANDS, BRAND_BY_ID, CUSTOMERS, DEMO_CUSTOMER_ID, PRODUCTS, PRODUCT_BY_ID, RETURN_REASON_LABEL, SCENARIO, SEED_EVIDENCE, SEED_ORDERS, VARIANTS, VARIANT_BY_ID, productSalesStats, CATEGORIES } from "@/lib/demo/seed";
import { demandScore, effVariant, restockPriority } from "@/lib/kpi";
import { krw, krwShort, num, pct } from "@/lib/format";
import { relTime } from "@/lib/dates";
import type { ReturnReason } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { useHydrated } from "@/components/system/hooks";
import { usePresentation } from "@/components/system/Presentation";
import { PageHeader } from "@/components/ax/AxShell";
import { AIReadyBadge } from "@/components/ax/AIReady";
import { ActionStatusBadge, UrgencyBadge } from "@/components/ax/StatusBadges";
import { WhySection, Tailor, P, BeforeAfter, FlowChips, Timeline, DataLoop, ImageSlot, NumberCase, QuoteLine, type WhyIndexItem } from "@/components/ax/system/WhyParts";
import { DesktopSectionNav, MobileSectionNav, useScrollSpy } from "@/components/ax/system/SectionNav";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Term, Freshness } from "@/components/ui/Misc";
import { SkeletonCard } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";

const INDEX: WhyIndexItem[] = [
  { id: "why-01", no: "01", title: "MORFIT의 현재" },
  { id: "why-02", no: "02", title: "멀티브랜드 패션사업이 어려운 이유" },
  { id: "why-03", no: "03", title: "고객이 상품을 발견하는 흐름" },
  { id: "why-04", no: "04", title: "현재 데이터가 끊기는 지점" },
  { id: "why-05", no: "05", title: "돈이 새는 곳: 품절과 과잉재고" },
  { id: "why-06", no: "06", title: "매출이 새는 곳: 찜·재입고·재구매 누락" },
  { id: "why-07", no: "07", title: "반품이 남기지 못했던 데이터" },
  { id: "why-08", no: "08", title: "MORFIT에서 AX란 무엇인가" },
  { id: "why-09", no: "09", title: "Customer Platform이 바꾸는 것" },
  { id: "why-10", no: "10", title: "Business AX가 바꾸는 것" },
  { id: "why-11", no: "11", title: "Demand Signal 구조" },
  { id: "why-12", no: "12", title: "Fit Signal 구조" },
  { id: "why-13", no: "13", title: "AI와 사람이 나누어 맡는 판단" },
  { id: "why-14", no: "14", title: "고객행동 → Action → 결과의 Closed Loop" },
  { id: "why-15", no: "15", title: "12개월 후 쌓이는 데이터 자산" },
  { id: "why-16", no: "16", title: "실증과 단계별 확장" },
];
const IDS = INDEX.map((i) => i.id);

export default function WhyPage() {
  const ready = useHydrated();
  const active = useScrollSpy(IDS, ready);
  const start = usePresentation((s) => s.start);
  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        tour="why-top"
        title="기획의도 — Why AX"
        badge={<Badge tone="demo" size="sm">DEMO</Badge>}
        desc="고객의 쇼핑 행동이 옵션별 수요 데이터가 되고, 그 데이터가 MD의 재고·할인·재구매 판단을 바꾸며, 처리 결과가 다시 고객 경험으로 돌아오는 구조를 16개 장면으로 설명합니다."
        right={<div className="flex items-center gap-2 flex-wrap"><Hydrated fallback={<span className="inline-block h-5 w-40 skeleton" />}><Freshness source="DEMO" /></Hydrated><Button size="sm" onClick={() => { start(); toast("시연 모드 시작", "하단 컨트롤러로 이동합니다.", "info"); }} icon={<Play size={14} />}>시연 시작</Button></div>}
      />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_236px] lg:gap-8 lg:items-start">
        <Hydrated fallback={<div className="space-y-4"><SkeletonCard lines={5} /><SkeletonCard lines={4} /><SkeletonCard lines={6} /></div>}>
          <WhyBody />
        </Hydrated>
        <DesktopSectionNav items={INDEX} active={active} />
      </div>
      <MobileSectionNav items={INDEX} active={active} />
    </div>
  );
}

function WhyBody() {
  const app = useApp();
  const start = usePresentation((s) => s.start);

  /* ---------------- Scenario numbers (seed + store delta) ---------------- */
  const d = useMemo(() => {
    const aSeed = VARIANT_BY_ID[SCENARIO.A_VARIANT];
    const a = effVariant(aSeed, app);
    const aP = PRODUCT_BY_ID[SCENARIO.A_PRODUCT];
    const aBrand = BRAND_BY_ID[aP.brandId];
    const aDaily = aSeed.sales7d / 7;
    const aStockDays = aDaily > 0 ? aSeed.stock / aDaily : 0;
    const aGapDays = Math.max(0, aBrand.leadTimeDays - aStockDays);
    const aLost = Math.round(aDaily * aGapDays * aP.price);
    const aScore = demandScore(a);
    const aPrio = restockPriority(a, app);

    const bP = PRODUCT_BY_ID[SCENARIO.B_PRODUCT];
    const bS = productSalesStats(SCENARIO.B_PRODUCT);
    const bFitShare = bS.returns30d ? bS.fitReturns30d / bS.returns30d : 0;
    const bRetRate = bS.sales30d ? bS.returns30d / bS.sales30d : 0;

    const cP = PRODUCT_BY_ID[SCENARIO.C_PRODUCT];
    const cS = productSalesStats(SCENARIO.C_PRODUCT);
    const cDos = cS.stock <= 0 ? 0 : Math.round(cS.stock / Math.max(0.1, cS.sales30d / 30));
    const cValue = cS.stock * cP.cost;

    const dCount = CUSTOMERS.filter((c) => c.segment === "cycle-due" && c.id !== DEMO_CUSTOMER_ID).length;
    const dBrand = BRAND_BY_ID[SCENARIO.D_BRAND];

    const purchase = BRANDS.filter((b) => b.sourcing === "purchase").length;
    const consignment = BRANDS.length - purchase;
    const leadMin = Math.min(...BRANDS.map((b) => b.leadTimeDays)), leadMax = Math.max(...BRANDS.map((b) => b.leadTimeDays));
    const soldout = VARIANTS.filter((v) => effVariant(v, app).stock <= 0).length;
    const restockTotal = VARIANTS.reduce((s, v) => s + effVariant(v, app).restockRequests, 0);
    const wishTotal = VARIANTS.reduce((s, v) => s + v.wishlist7d, 0);
    const act001 = app.actions.find((x) => x.id === "act-001");
    return { a, aSeed, aP, aBrand, aDaily, aStockDays, aGapDays, aLost, aScore, aPrio, bP, bS, bFitShare, bRetRate, cP, cS, cDos, cValue, dCount, dBrand, purchase, consignment, leadMin, leadMax, soldout, restockTotal, wishTotal, act001 };
  }, [app]);

  const evidenceExamples = useMemo(() => ["ev-002", "ev-003", "ev-005"].map((id) => SEED_EVIDENCE.find((e) => e.id === id)).filter((e): e is (typeof SEED_EVIDENCE)[number] => !!e), []);
  const reasonKeys = Object.keys(RETURN_REASON_LABEL) as ReturnReason[];

  return (
    <div className="space-y-5 min-w-0">
      {/* 01 */}
      <WhySection id="why-01" no="01" title="MORFIT의 현재" lead={<>MORFIT은 브랜드 {num(BRANDS.length)}개, 상품 {num(PRODUCTS.length)}개, 옵션 {num(VARIANTS.length)}개를 한 화면에서 파는 멀티브랜드 패션 커머스입니다. 매일 주문이 들어오고, 매일 찜과 재입고 신청이 쌓이지만, 그 신호가 MD의 판단까지 닿는 데는 시간이 걸립니다.</>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { k: "브랜드", v: `${BRANDS.length}개`, s: `사입 ${d.purchase} · 위탁 ${d.consignment}` },
            { k: "옵션(색상×사이즈)", v: num(VARIANTS.length), s: `상품 ${PRODUCTS.length}개` },
            { k: "90일 주문", v: num(SEED_ORDERS.length + app.orders.length), s: "가상 고객 " + num(CUSTOMERS.length) + "명" },
            { k: "재입고 알림 대기", v: `${num(d.restockTotal)}건`, s: `품절 옵션 ${d.soldout}개` },
          ].map((x) => <div key={x.k} className="rounded-2xl bg-neutral-canvas px-4 py-3"><p className="text-[0.78rem] text-neutral-text2">{x.k}</p><p className="text-[1.3rem] font-bold tabular leading-tight">{x.v}</p><p className="text-[0.78rem] text-neutral-text2">{x.s}</p></div>)}
        </div>
        <P>사입은 우리 재고 위험, 위탁은 수수료 정산입니다. 리드타임은 브랜드마다 {d.leadMin}~{d.leadMax}일로 다르고 시즌은 짧습니다. 대표님은 매출은 매일 보지만 <span className="font-semibold text-neutral-text">"어떤 색상·사이즈가 언제 부족해질지"</span>는 MD가 여러 화면을 비교한 뒤에야 알 수 있습니다.</P>
        <ImageSlot asset="why_ax_01_current.jpg" label="지금의 MORFIT — 판매·재고·고객 화면이 따로 놓인 MD의 책상" gradient={BRAND_BY_ID["b-nove"].gradient} caption="현재 상태" />
      </WhySection>

      {/* 02 */}
      <WhySection id="why-02" no="02" title="멀티브랜드 패션사업이 어려운 이유" lead="패션은 '상품'이 아니라 '옵션' 단위로 팔립니다. 같은 셔츠라도 블랙 M은 품절이고 화이트 XL은 남습니다. 브랜드가 열 개면 이 문제가 열 배가 됩니다.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { t: "옵션이 너무 많다", b: `상품 ${PRODUCTS.length}개가 색상·사이즈로 나뉘면 옵션 ${num(VARIANTS.length)}개. 사람이 매일 다 볼 수 없습니다.` },
            { t: "브랜드마다 핏이 다르다", b: "같은 M이라도 브랜드에 따라 작게, 크게 나옵니다. 사이즈 안내가 틀리면 그대로 반품이 됩니다." },
            { t: "시즌이 짧고 리드타임은 길다", b: `재입고에 ${d.leadMin}~${d.leadMax}일이 걸리는데, FW 아우터는 시즌이 끝나면 팔 수 없습니다. 늦게 알면 두 번 손해입니다.` },
            { t: "정산 구조가 섞여 있다", b: "사입은 재고 위험, 위탁은 수수료. 같은 할인이라도 마진 계산이 달라 브랜드별로 따로 봐야 합니다." },
          ].map((x) => <div key={x.t} className="rounded-2xl border border-neutral-border bg-white p-4"><p className="font-bold">{x.t}</p><p className="mt-1 text-[0.9rem] leading-relaxed text-neutral-text2">{x.b}</p></div>)}
        </div>
        <Tailor>MORFIT은 MD 3명이 브랜드 {BRANDS.length}개를 나눠 맡습니다. MD 한 명이 옵션 100개 이상을 매일 보고, 위탁 브랜드({d.consignment}개)는 할인 정책까지 협의해야 합니다. "무엇을 먼저 볼지"를 정해주는 것이 곧 인건비를 아끼는 일입니다.</Tailor>
      </WhySection>

      {/* 03 */}
      <WhySection id="why-03" no="03" title="고객이 상품을 발견하는 흐름" lead="고객은 홈에서 랭킹·브랜드·스타일로 상품을 찾고, 색상과 사이즈를 고르고, 망설이면 찜하거나 재입고 알림을 신청합니다. 이 모든 클릭이 '수요'입니다.">
        <FlowChips tone="primary" steps={[
          { label: "홈·랭킹", sub: "view_home" }, { label: "브랜드·스타일", sub: "select_category" }, { label: "상품 상세", sub: "view_product" }, { label: "색상·사이즈 선택", sub: "select_size" },
          { label: "핏 추천", sub: "view_fit_recommendation" }, { label: "찜·재입고 알림", sub: "subscribe_restock" }, { label: "장바구니·주문", sub: "complete_demo_order" }, { label: "배송·반품·재구매", sub: "request_return" },
        ]} />
        <P>각 단계는 이벤트 이름으로 기록됩니다. 중요한 것은 "몇 명이 봤다"가 아니라 <span className="font-semibold text-neutral-text">어떤 옵션에서 멈췄고, 어떤 옵션이 없어서 떠났는가</span>입니다. 품절이라 재입고 알림을 누른 고객은 이미 지갑을 연 고객입니다.</P>
        <Tailor>고객 화면의 <Term term="옵션">옵션</Term> 선택·찜·재입고 알림은 그 즉시 Business AX의 <Term term="Demand Signal">Demand Signal</Term>에 더해집니다. 시연에서 재입고 알림을 한 번 누르면 Demand Radar의 숫자가 1 올라가는 것을 그대로 볼 수 있습니다.</Tailor>
      </WhySection>

      {/* 04 */}
      <WhySection id="why-04" no="04" title="현재 데이터가 끊기는 지점" lead="데이터가 없는 것이 아닙니다. 쇼핑몰 통계, 재고 엑셀, CS 메모에 따로 있어서 한 사람의 머릿속에서만 합쳐집니다.">
        <BeforeAfter
          before={["조회·찜은 쇼핑몰 통계 화면에만 있고, 재고는 ERP·엑셀에 있음", "반품 사유는 CS 메모에 문장으로 남아 집계가 안 됨", "MD는 판매·재고·찜·반품 화면 3~4개를 오가며 눈으로 비교", "대표에게는 매출 합계만 보고되고 '왜'는 구두로 전달"]}
          after={["고객 이벤트가 옵션 ID 기준으로 재고·판매와 같은 표에 쌓임", "반품 사유가 8가지 구조로 선택되어 사이즈 관련 비율이 자동 계산", "Action Center가 '먼저 볼 것'을 우선순위와 근거로 정리", "대표는 KPI → 근거 → Action → 결과를 한 화면에서 따라감"]}
        />
        <Tailor>MORFIT은 Product와 Variant(옵션)를 분리하고, 고객 이벤트·주문·반품을 모두 <Term term="SKU">SKU</Term>(옵션 ID)로 연결합니다. 지금은 브라우저 안의 Demo Repository이지만 구조는 Supabase로 그대로 옮겨집니다.</Tailor>
      </WhySection>

      {/* 05 */}
      <WhySection id="why-05" no="05" title="돈이 새는 곳: 품절과 과잉재고" lead="품절은 '팔 수 있었던 매출'을 잃고, 과잉재고는 '이미 낸 원가'를 묶어둡니다. 두 문제는 같은 원인에서 나옵니다 — 옵션별 수요를 늦게 안다는 것.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NumberCase tone="risk" title={<>Scenario A · {d.aP.name} 블랙 M</>} badge={<Badge tone="warning" size="sm">품절 임박</Badge>}
            rows={[{ k: "현재고", v: `${num(d.a.stock)}개` }, { k: "최근 7일 판매", v: `${d.aSeed.sales7d}개 (직전 ${d.aSeed.salesPrev7d}개)` }, { k: "찜 7일", v: `${d.a.wishlist7d}건 (직전 ${d.aSeed.wishlistPrev7d}건)` }, { k: "재입고 알림", v: `${d.a.restockRequests}건` }]}
            note={<>하루 약 {d.aDaily.toFixed(1)}개씩 팔리니 재고는 {d.aStockDays.toFixed(1)}일분입니다. {d.aBrand.name} 리드타임은 {d.aBrand.leadTimeDays}일이라 지금 발주해도 약 {d.aGapDays.toFixed(1)}일은 품절입니다. 그 기간 놓치는 매출 추정 ≈ <span className="font-bold text-neutral-text">{krw(d.aLost)}</span> <Badge tone="demo" size="sm">SIMULATION</Badge></>} />
          <NumberCase title={<>Scenario C · {d.cP.name}</>} badge={<Badge tone="info" size="sm">저회전</Badge>}
            rows={[{ k: "옵션 합산 재고", v: `${num(d.cS.stock)}개` }, { k: "최근 30일 판매", v: `${d.cS.sales30d}개` }, { k: "재고일수", v: `${num(d.cDos)}일` }, { k: "시즌 종료까지", v: `${d.cP.seasonEndsInDays}일` }]}
            note={<>재고에 묶인 원가 약 <span className="font-bold text-neutral-text">{krwShort(d.cValue)}</span>. 시즌이 끝나기 전에 팔지 못하면 다음 해까지 창고에 남습니다. 지금 할인 10%에서 마진 여유 안에서 한 번 더 조정할지 검토가 필요합니다.</>} />
        </div>
        <P><Term term="재고일수">재고일수</Term>가 시즌 잔여일보다 길면 과잉, 리드타임보다 짧으면 품절 위험입니다. 옵션마다 매일 계산할 수 있는 숫자인데, 지금은 사람이 느낌으로 판단합니다.</P>
        <Tailor>옥스포드 셔츠 블랙 M은 지금 Demand Radar 최상단에 있고, 발마칸 코트는 할인 검토 Action(act-003)이 이미 만들어져 있습니다. 두 상품을 같은 화면에서 "먼저 볼 것"으로 올리는 것이 AX의 첫 일입니다.</Tailor>
      </WhySection>

      {/* 06 */}
      <WhySection id="why-06" no="06" title="매출이 새는 곳: 찜·재입고·재구매 누락" lead="사고 싶다고 손을 든 고객이 이미 있습니다. 찜한 고객, 재입고 알림을 신청한 고객, 구매주기가 돌아온 고객. 이들에게 아무 말도 하지 않으면 매출은 그냥 지나갑니다.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { t: "찜은 했는데 사지 않음", v: `${num(d.wishTotal)}건`, s: "최근 7일 전체 옵션 찜", b: "찜 뒤 가격·재고가 바뀌어도 알려주지 않으면 잊힙니다." },
            { t: "재입고 알림을 신청함", v: `${num(d.restockTotal)}건`, s: "지금 대기 중", b: "입고되면 바로 살 고객. 알림 발송이 늦으면 다른 곳에서 삽니다." },
            { t: "구매주기가 돌아옴", v: `${num(d.dCount)}명`, s: `${d.dBrand.name} 평균 45일 주기`, b: "2회 이상 산 고객이 40~52일째. 지금이 재구매 제안 시점입니다." },
          ].map((x) => <div key={x.t} className="rounded-2xl border border-neutral-border bg-white p-4"><p className="font-bold leading-snug">{x.t}</p><p className="mt-2 text-[1.4rem] font-bold tabular leading-none">{x.v}</p><p className="text-[0.78rem] text-neutral-text2">{x.s}</p><p className="mt-2 text-[0.88rem] leading-relaxed text-neutral-text2">{x.b}</p></div>)}
        </div>
        <Tailor>Scenario D의 {d.dBrand.name} 고객 {d.dCount}명은 이미 세그먼트로 묶여 있고 재구매 캠페인 Action(act-005)이 대기 중입니다. MD가 승인하면 My Page 추천과 알림으로 이어집니다. <Term term="재구매율">재구매율</Term>은 Baseline을 먼저 재고 실증에서 비교합니다.</Tailor>
      </WhySection>

      {/* 07 */}
      <WhySection id="why-07" no="07" title="반품이 남기지 못했던 데이터" lead="반품은 비용이지만, 동시에 가장 정직한 고객 피드백입니다. '사이즈가 작았다'는 한 줄이 구조화되면 다음 고객의 반품을 막는 규칙이 됩니다.">
        <NumberCase tone="risk" title={<>Scenario B · {d.bP.name}</>} badge={<Badge tone="error" size="sm">Fit Risk</Badge>}
          rows={[{ k: "최근 30일 판매", v: `${d.bS.sales30d}개` }, { k: "반품", v: `${d.bS.returns30d}건 (${pct(d.bRetRate, 0)})` }, { k: "사이즈 관련 반품", v: `${d.bS.fitReturns30d}건` }, { k: "반품 중 사이즈 비율", v: pct(d.bFitShare, 0) }]}
          note="논워시 데님이라 허리가 타이트하고 첫 세탁 후 줄어듭니다. 이 사실이 상품 상세 핏 안내와 추천 규칙에 반영되어 있지 않으면 같은 반품이 반복됩니다." />
        <div>
          <p className="text-[0.85rem] font-bold text-neutral-text2 mb-2">반품 사유 8가지 구조 — 문장이 아니라 선택지로 받습니다</p>
          <div className="flex flex-wrap gap-2">{reasonKeys.map((r) => <Badge key={r} tone={r === "size-small" || r === "size-large" || r === "fit" ? "accent" : "neutral"}>{RETURN_REASON_LABEL[r]}</Badge>)}</div>
        </div>
        <Tailor>고객이 My Page에서 반품을 요청하면 사유가 옵션 ID와 함께 저장되고, 핏·반품 화면의 <Term term="Fit Risk">Fit Risk</Term>가 즉시 올라갑니다. 데님은 핏 안내 강화 Action(act-004) 완료 시 상세 문구가 바뀌고 추천 사이즈가 한 치수 커집니다.</Tailor>
      </WhySection>

      {/* 08 */}
      <WhySection id="why-08" no="08" title="MORFIT에서 AX란 무엇인가" lead="AX는 'AI를 붙이는 일'이 아닙니다. 고객 행동을 신호로 바꾸고, 신호를 Action으로 바꾸고, Action의 결과를 다시 고객에게 돌려보내는 운영 방식의 전환입니다.">
        <FlowChips steps={[{ label: "ELIMINATE", sub: "채널별 중복 확인 제거" }, { label: "STANDARDIZE", sub: "상품·옵션·반품사유·Action 상태 통일" }, { label: "DIGITIZE", sub: "고객 Event 기록" }, { label: "AUTOMATE", sub: "계산·알림·상태 자동" }, { label: "AI", sub: "설명·복합판단만" }]} />
        <P>순서가 중요합니다. 기준을 통일한 다음에야 자동화가 의미를 갖고, 자동화가 돌아간 뒤에야 AI가 설명할 재료가 생깁니다. 자동발주(L4)는 없고 모든 Action은 사람이 승인합니다.</P>
        <QuoteLine>"AI가 추천했습니다"가 아니라 "이 숫자 때문에 지금 이 옵션을 봐야 합니다"라고 말하는 시스템.</QuoteLine>
        <Tailor>MORFIT의 네 엔진(Demand·Fit·Markdown·Repeat)은 전부 규칙과 수식입니다. LLM은 <Term term="AI Ready">AI Ready</Term> 상태로, 연결되더라도 계산이 아니라 경영 브리핑의 문장만 맡습니다. <AIReadyBadge kind="briefing" className="ml-1 align-middle" /></Tailor>
      </WhySection>

      {/* 09 */}
      <WhySection id="why-09" no="09" title="Customer Platform이 바꾸는 것" lead="고객 입장에서 AX는 보이지 않습니다. 대신 사이즈 고민이 줄고, 기다리던 옵션이 돌아왔다는 알림이 오고, 주문 상태가 바로 보입니다.">
        <BeforeAfter beforeTitle="고객이 겪던 것" afterTitle="MORFIT 고객 화면"
          before={["실측표를 보고도 M인지 L인지 모름 → 두 개 사서 하나 반품", "품절이면 그냥 이탈. 다시 들어왔는지 알 방법이 없음", "주문 후 '언제 오나' 고객센터에 문의", "지난번 산 브랜드의 신상품을 우연히 발견해야 함"]}
          after={["핏 프로필 한 번 입력 → 상품마다 추천 사이즈와 이유·주의점", "품절 옵션에 재입고 알림 → 입고되면 알림과 상태 변경", "My Page에서 상품준비 → 출고 → 배송 상태를 실시간 확인", "구매주기·관심 브랜드 기준 추천이 My Page와 알림으로"]}
        />
        <Tailor>고객 김하늘님이 옥스포드 셔츠 블랙 M에 재입고 알림을 신청하고 MD가 Action을 완료하면, 알림함에 "기다리던 상품이 재입고되었습니다"가 도착합니다. 이 왕복이 시연에서 실제로 동작합니다.</Tailor>
      </WhySection>

      {/* 10 */}
      <WhySection id="why-10" no="10" title="Business AX가 바꾸는 것" lead="대표·MD·운영직원은 각자 다른 질문을 갖고 출근합니다. Business AX는 역할마다 '오늘 먼저 볼 것'을 다르게 보여줍니다.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { r: "대표", q: "어디서 돈이 새고, 무엇을 결정해야 하나?", a: "경영 대시보드 KPI → AI 브리핑(규칙) → 긴급 Action. 10초 안에 방향을 잡습니다." },
            { r: "MD", q: "어떤 옵션을 언제 확보하고 무엇을 할인하나?", a: "Demand Radar와 Action Center에서 근거가 달린 추천을 승인·실행합니다." },
            { r: "운영직원", q: "오늘 처리할 주문·반품·재입고 문의는?", a: "주문 상태 변경 한 번이 고객 My Page와 알림까지 이어집니다. 마진·캠페인은 보이지 않습니다." },
          ].map((x) => <div key={x.r} className="rounded-2xl border border-neutral-border bg-white p-4"><Badge tone="dark" size="sm">{x.r}</Badge><p className="mt-2 font-bold leading-snug">{x.q}</p><p className="mt-1.5 text-[0.88rem] leading-relaxed text-neutral-text2">{x.a}</p></div>)}
        </div>
        <ImageSlot asset="why_ax_02_improved.jpg" label="AX 적용 후 — 한 화면에서 KPI · 근거 · Action · 결과를 따라가는 MD" gradient={BRAND_BY_ID["b-aerno"].gradient} caption="개선된 업무 장면" />
        <Tailor>설정에서 역할을 바꾸면 메뉴와 KPI가 즉시 달라집니다. 운영직원에게는 손익이, MD에게는 담당 브랜드 마진만 보입니다. 이 권한 구조는 Supabase RLS로 그대로 옮길 수 있습니다.</Tailor>
      </WhySection>

      {/* 11 */}
      <WhySection id="why-11" no="11" title="Demand Signal 구조" lead="'이 옵션을 원하는 정도'를 0~100 점수로 만듭니다. 다섯 가지 신호를 비율로 합치는 단순한 수식이라 누구나 검증할 수 있습니다.">
        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_300px] gap-3 items-start">
          <div className="rounded-2xl bg-neutral-canvas p-4 space-y-2 min-w-0">
            <p className="font-bold">Demand Score =</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-[0.9rem]">
              {[["판매속도 변화 (7일 vs 직전 7일)", "30%"], ["찜 증가율", "20%"], ["재고 압박 (재고일수 14일 기준)", "25%"], ["재입고 알림 신청", "15%"], ["장바구니 담김", "10%"]].map(([k, v]) => <li key={k} className="flex items-baseline justify-between gap-3 border-b border-neutral-border/70 pb-1"><span className="min-w-0">{k}</span><span className="font-bold tabular shrink-0">{v}</span></li>)}
            </ul>
            <p className="text-[0.82rem] text-neutral-text2 leading-relaxed">재입고 우선순위 = 품절 위험(리드타임 대비 재고일수) 45% + 수요점수 25% + 마진 15% + 알림 신청 15%. 추천 수량 = 하루 판매량 × (30일 + 리드타임) × 상승분 − 현재고 − 입고 예정.</p>
          </div>
          <div className="rounded-2xl border border-theme-primary/30 bg-white p-4 min-w-0 sm:flex sm:items-center sm:gap-6 2xl:block">
            <div className="shrink-0">
              <p className="text-[0.78rem] font-bold text-neutral-text2">지금 계산값 · 옥스포드 셔츠 블랙 M</p>
              <p className="mt-1 text-[2.2rem] font-bold tabular leading-none text-theme-primary">{d.aScore}<span className="text-[1rem] text-neutral-text2 font-semibold"> / 100</span></p>
            </div>
            <div className="min-w-0 flex-1 mt-3 sm:mt-0 2xl:mt-3">
              <dl className="space-y-1 text-[0.85rem]">
                <div className="flex justify-between gap-3"><dt className="text-neutral-text2">재입고 우선순위</dt><dd className="font-bold tabular">{d.aPrio.score}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-neutral-text2">추천 수량</dt><dd className="font-bold tabular">{num(d.aPrio.suggestedQty)}개</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-neutral-text2">재고일수 / 리드타임</dt><dd className="font-bold tabular">{d.aPrio.daysOfStock}일 / {d.aPrio.leadTime}일</dd></div>
              </dl>
              <p className="mt-2 text-[0.75rem] text-neutral-text2">고객 화면에서 찜·알림을 누르면 이 숫자가 바뀝니다.</p>
            </div>
          </div>
        </div>
        <Tailor>점수는 Demand Radar에서 옵션마다 매일 계산됩니다. 점수가 높다고 자동 발주하지 않습니다. 점수는 "먼저 볼 순서"이고, 수량과 시점은 MD가 리드타임·브랜드 정책을 보고 결정합니다.</Tailor>
      </WhySection>

      {/* 12 */}
      <WhySection id="why-12" no="12" title="Fit Signal 구조" lead="핏 추천은 세 가지 재료로 만듭니다. 고객 프로필, 상품의 사이징 경향, 그리고 비슷한 고객의 선택·반품 데이터. 결과에는 항상 '이유'와 '주의점'이 붙습니다.">
        <FlowChips steps={[{ label: "고객 프로필", sub: "키·몸무게·평소 사이즈·선호 핏" }, { label: "상품 사이징 경향", sub: "작게 / 정사이즈 / 크게" }, { label: "반품 데이터", sub: "사이즈 관련 반품 비율" }, { label: "보정 규칙", sub: "±1 사이즈" }, { label: "추천 + 이유 + 주의", sub: "신뢰도 high/mid/low" }]} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-neutral-canvas p-4 text-[0.9rem] leading-relaxed">
            <p className="font-bold">Fit Risk = 사이즈 관련 반품 ÷ 판매 수량</p>
            <p className="mt-1 text-neutral-text2">옵션별로 계산해 어느 사이즈에서 반품이 몰리는지 봅니다. 데님은 M·L에서 '작음' 반품이 집중되어 있습니다.</p>
          </div>
          <div className="rounded-2xl bg-neutral-canvas p-4 text-[0.9rem] leading-relaxed">
            <p className="font-bold">고객의 최종 선택 책임을 명시</p>
            <p className="mt-1 text-neutral-text2">추천은 참고이며, 신뢰도가 낮으면 낮다고 표시합니다. 반품이 많은 상품은 신뢰도를 일부러 낮춰 보여줍니다.</p>
          </div>
        </div>
        <Tailor>와이드 데님은 "작게 나옴" 경향과 반품 데이터 때문에 한 치수 크게 추천합니다. 핏 안내 강화 Action(act-004)이 완료되면 상세 문구가 바뀌고 +1 보정이 확정됩니다. 반품률 변화는 실증에서 비교합니다.</Tailor>
      </WhySection>

      {/* 13 */}
      <WhySection id="why-13" no="13" title="AI와 사람이 나누어 맡는 판단" lead="시스템은 계산하고 정렬하고 알립니다. 사람은 승인하고 예외를 결정합니다. AI(LLM)는 그 사이에서 '왜'를 문장으로 설명하는 역할만 맡습니다.">
        <div className="overflow-x-auto rounded-2xl border border-neutral-border bg-white">
          <table className="w-full min-w-[520px] text-[0.88rem]">
            <thead><tr className="bg-neutral-canvas text-neutral-text2"><th className="px-4 py-2.5 text-left font-semibold">누가</th><th className="px-4 py-2.5 text-left font-semibold">무엇을</th><th className="px-4 py-2.5 text-left font-semibold">MORFIT 예시</th></tr></thead>
            <tbody>
              {[
                ["시스템 (코드·수식)", "계산 · 정렬 · 상태 변경 · 알림 발송", "Demand Score, 재고일수, 재입고 우선순위, 주문 상태 → 고객 알림"],
                ["사람 (MD·운영·대표)", "승인 · 실행 · 보류 · 예외 판단", "재입고 60개 승인, 할인율 20% 확정, 브랜드 정책 확인"],
                ["AI (LLM · AI Ready)", "여러 지표를 읽고 우선순위를 문장으로 설명", "경영 대시보드 AI 브리핑 — 지금은 규칙 문장, 연결 시 자연어"],
              ].map((r) => <tr key={r[0]} className="border-t border-neutral-border"><td className="px-4 py-3 font-bold whitespace-nowrap">{r[0]}</td><td className="px-4 py-3">{r[1]}</td><td className="px-4 py-3 text-neutral-text2">{r[2]}</td></tr>)}
            </tbody>
          </table>
        </div>
        <P><Term term="L2">L2</Term>는 시스템이 추천만 하고 실행은 사람이, <Term term="L3">L3</Term>는 시스템이 준비하고 사람이 최종 승인하는 단계입니다. 재입고·할인은 L3, 핏 안내·재구매 캠페인은 L2. 자동실행 L4는 브랜드 정책과 현금흐름에 영향을 주므로 범위 밖입니다.</P>
        <Tailor>Action 카드에는 항상 무엇을 / 왜(근거 2~4개) / 데이터 / 주의 / 누가 승인 / 다음 행동이 함께 표시됩니다. 근거 없는 추천은 화면에 나오지 않습니다.</Tailor>
      </WhySection>

      {/* 14 */}
      <WhySection id="why-14" no="14" title="고객행동 → Action → 결과의 Closed Loop" lead="한 바퀴를 실제로 따라가 봅니다. 고객이 재입고 알림을 누르고, MD가 Action을 완료하고, 고객에게 알림이 돌아오고, 그 기록이 Evidence로 남습니다.">
        <DataLoop nodes={[
          { tag: "고객", title: "재입고 알림 신청", desc: "블랙 M 품절 임박 → 알림 신청 (subscribeRestock)" },
          { tag: "AX 신호", title: "Demand Radar 반영", desc: "restockRequests +1 · Demand Score 상승" },
          { tag: "Action", title: "act-001 재입고 검토", desc: "확인 → 실행중 → 완료 (MD 승인)" },
          { tag: "결과", title: "재고 +수량 반영", desc: "옵션 상태 '입고 완료' · Evidence RESULT 기록" },
          { tag: "고객", title: "재입고 알림 도착", desc: "알림함 + 옵션 상태 변경 → 구매" },
        ]} />
        {d.act001 && (
          <div className="rounded-2xl border border-neutral-border bg-white p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent" size="sm">Action 사례 · {d.act001.id}</Badge>
              <UrgencyBadge urgency={d.act001.urgency} />
              <ActionStatusBadge status={d.act001.status} size="sm" />
              <span className="ml-auto text-[0.78rem] text-neutral-text2">{d.act001.automation} · Error Cost {d.act001.errorCost} · 담당 {d.act001.ownerName}</span>
            </div>
            <p className="mt-2 font-bold text-[1.05rem] leading-snug">{d.act001.title}</p>
            <p className="mt-1 text-[0.85rem] text-neutral-text2">트리거 · {d.act001.trigger}</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[0.88rem]">
              <div><p className="font-bold mb-1">왜 (근거)</p><ul className="space-y-1 text-neutral-text2">{d.act001.reasons.map((r) => <li key={r} className="flex gap-2"><span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-theme-primary" />{r}</li>)}</ul></div>
              <div className="space-y-2">
                <p><span className="font-bold">기대효과</span> <span className="text-neutral-text2">{d.act001.expectedImpact}</span></p>
                {d.act001.caution && <p><span className="font-bold">주의</span> <span className="text-neutral-text2">{d.act001.caution}</span></p>}
                <p><span className="font-bold">추천 수량</span> <span className="text-neutral-text2 tabular">{num(d.act001.quantity ?? 0)}개</span> · <span className="font-bold">다음 행동</span> <span className="text-neutral-text2">Action Center에서 확인 → 실행 → 완료</span></p>
              </div>
            </div>
            <div className="mt-3"><Button size="sm" variant="outline" href="/ax/actions" icon={<ArrowRight size={14} />}>Action Center에서 처리하기</Button></div>
          </div>
        )}
        <div>
          <p className="font-bold mb-2 flex items-center gap-2"><Term term="Evidence">Evidence</Term> 예시 <Badge tone="demo" size="sm">DEMO / SIMULATION</Badge></p>
          <ul className="space-y-2">
            {evidenceExamples.map((e) => (
              <li key={e.id} className="rounded-2xl border border-neutral-border bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-2"><Badge tone={e.type === "RESULT" || e.type === "CUSTOMER" ? "success" : e.type === "RISK" ? "error" : "info"} size="sm">{e.type}</Badge><span className="font-bold text-[0.92rem]">{e.title}</span><span className="ml-auto text-[0.75rem] text-neutral-text2">{relTime(e.at)} · {e.actor}</span></div>
                <p className="mt-1 text-[0.85rem] text-neutral-text2 leading-relaxed">{e.detail}{e.kpiDelta && <span className="ml-1 font-semibold text-neutral-text">({e.kpiDelta})</span>}</p>
              </li>
            ))}
          </ul>
        </div>
        <Tailor>네 개의 Loop(재입고·주문→배송·반품→핏·구매주기→재구매)가 모두 Demo에서 실제로 돌아갑니다. 시연 모드는 재입고와 주문 Loop를 고객 화면과 AX를 오가며 보여줍니다.</Tailor>
      </WhySection>

      {/* 15 */}
      <WhySection id="why-15" no="15" title="12개월 후 쌓이는 데이터 자산" lead="질문은 하나입니다. 12개월 뒤 이 시스템을 껐을 때, 회사에 무엇이 남는가? 남는 것은 기술이 아니라 데이터·업무방식·판단 기록입니다.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { g: "Data Asset", tone: "accent" as const, items: ["옵션(색상×사이즈) 단위 수요 신호 이력 — 조회·찜·장바구니·재입고 신청이 날짜별로", "옵션 단위 판매속도·재고일수·품절 이력 — 무엇이 언제 얼마나 빨리 팔렸는지", "구조화된 반품 사유 × 사이즈 × 실측 — Fit Signal의 원천", "고객 핏 프로필과 실제 선택·반품 결과의 연결", "고객 구매주기·브랜드 선호 세그먼트 이력"] },
            { g: "Workflow Asset", tone: "info" as const, items: ["Action Lifecycle 기록 — 추천 → 승인 → 실행 → 결과, 누가 언제 왜", "캠페인·할인 전후 비교 기록 (Before / After)"] },
            { g: "Decision Asset", tone: "success" as const, items: ["Evidence Log — Baseline·결과·예외가 같은 형식으로 남아 실증과 투자 설명의 재료가 됨"] },
          ].map((c) => (
            <div key={c.g} className="rounded-2xl border border-neutral-border bg-white p-4">
              <Badge tone={c.tone}>{c.g}</Badge>
              <ol className="mt-3 space-y-2 text-[0.88rem] leading-relaxed list-decimal pl-4">{c.items.map((it) => <li key={it}>{it}</li>)}</ol>
            </div>
          ))}
        </div>
        <P>여덟 가지 모두 다른 회사가 복제할 수 없는 MORFIT만의 기록입니다. 기술 스택은 바꿀 수 있어도 12개월치 옵션 단위 수요×반품×핏 데이터와 MD의 판단 이력은 다시 만들 수 없습니다.</P>
        <Tailor>Demo에서도 모든 Action과 고객 이벤트는 Evidence Log에 같은 형식으로 남습니다. 실데이터가 연결되는 순간부터 같은 표에 실제 기록이 쌓입니다.</Tailor>
      </WhySection>

      {/* 16 */}
      <WhySection id="why-16" no="16" title="실증과 단계별 확장" lead="과장하지 않습니다. 먼저 12주 실증으로 Baseline을 재고, 효과가 확인된 것만 다음 단계로 넘깁니다.">
        <Timeline items={[
          { tag: "1단계", title: "효율 + 매출 (지금 → 12주 실증)", desc: "Action Center · Demand Radar · 핏 안내 · 재입고 알림. Baseline(주간 분석시간, 품절 손실, 찜→구매, 사이즈 반품률)을 1~2주차에 측정하고 12주차에 비교합니다." },
          { tag: "2단계", title: "개인화 · 재구매 · 파트너", desc: "재구매 세그먼트 고도화, 브랜드 파트너센터(Preview → 실제), 멤버십. 1단계 실증 결과가 있을 때만 시작합니다." },
          { tag: "3단계", title: "데이터 리포트 · B2B", desc: "브랜드별 옵션 수요 리포트, B2B 단체구매. 12개월 데이터 자산이 쌓인 뒤의 확장이며 지금은 범위 밖입니다.", tone: "next" },
        ]} />
        <div className="rounded-2xl bg-neutral-canvas p-4 text-[0.88rem] leading-relaxed">
          <p className="font-bold">2026 정책환경</p>
          <p className="mt-1 text-neutral-text2">정책자금·정부지원 설명은 실증 이후 Growth Story에서만 연결합니다 (보장 표현 금지). 이 페이지는 사업 자체의 비용·매출 논리만 다룹니다 — 품절 손실·과잉재고·분석시간·사이즈 반품·재구매 누락은 외부 자금 없이도 비용과 매출로 직접 연결되기 때문입니다.</p>
        </div>
        <ImageSlot asset="why_ax_03_growth.jpg" label="확장 방향 — 데이터가 쌓일수록 브랜드와 고객이 함께 늘어나는 구조" gradient={CATEGORIES[0].gradient} caption="성장 단계" />
        <Tailor>Demo의 모든 숫자는 SIMULATION이며 개선율을 말하지 않습니다. Evidence의 BASELINE 항목은 "REQUIRED / UNKNOWN"으로 남겨두었습니다 — 실증에서 채울 빈칸입니다.</Tailor>
        <div className="rounded-cardlg bg-brand-black text-white p-5 md:p-6">
          <p className="text-[0.78rem] font-bold tracking-wider text-theme-highlight">다음 행동</p>
          <p className="mt-1 text-[1.1rem] md:text-[1.25rem] font-bold leading-snug">직접 한 바퀴 돌려보세요. 고객 화면에서 재입고 알림을 누르고, Business AX에서 Action을 완료하면 알림이 돌아옵니다.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="primary" href="/ax" icon={<LayoutDashboard size={16} />} className="sm:flex-1">대시보드로</Button>
            <Button variant="outline" href="/" icon={<ExternalLink size={16} />} className="sm:flex-1 !bg-white !text-brand-black">고객 화면으로</Button>
            <Button variant="accent" onClick={() => { start(); toast("시연 모드 시작", "화면 하단 컨트롤러로 16단계를 이동합니다.", "info"); }} icon={<Play size={16} />} className="sm:flex-1 !bg-theme-highlight !text-brand-black">시연 시작</Button>
          </div>
          <p className="mt-3 text-[0.78rem] text-white/60 flex items-center gap-1.5"><Sparkles size={12} /> 시연 모드 로비: <Link href="/ax/present" className="underline hover:text-white">/ax/present</Link> · 기획의도 원문 구조: MORFIT §42 <BookOpen size={12} /></p>
                  </div>
      </WhySection>
    </div>
  );
}
