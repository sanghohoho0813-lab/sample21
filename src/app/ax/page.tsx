"use client";
/* 01 경영 대시보드 — 10초 안에: 무엇이 잘되고 / 어디서 돈이 새고 / 무엇을 먼저 봐야 하고 / 오늘 무엇을 결정해야 하는가 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, Boxes, FileCheck2, PackageCheck, RotateCcw, Ruler, ShoppingBag, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useApp, ROLE_NAME } from "@/lib/store";
import { BRANDS, DAILY, PRODUCT_BY_ID, VARIANTS } from "@/lib/demo/seed";
import { actionKpi, allOrders, allReturns, daysOfStock, demandScore, effVariant, inventoryStatus, inventoryKpi, periodOrders, salesKpi, PERIOD_LABEL, type Period } from "@/lib/kpi";
import { ruleBriefing } from "@/lib/engine";
import { krwShort, num, pct, pctDelta, safeDiv } from "@/lib/format";
import { relTime } from "@/lib/dates";
import { ICON_ACCENTS } from "@/lib/theme";
import type { Role } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { PageHeader } from "@/components/ax/AxShell";
import { AIReadyBadge } from "@/components/ax/AIReady";
import { InventoryStatusBadge, OrderStatusBadge } from "@/components/ax/StatusBadges";
import { ActionCard } from "@/components/ax/core/ActionCard";
import { AxLink, Big, BigLg, CHART, ChartTip, InfoNote, MiniBar, OPEN_STATUSES, PageSkeleton, RoleNote, SectionCard, axisKrw, dayLabel, demandTone, sortByUrgency, visibleActions } from "@/components/ax/core/shared";
import { KpiCard } from "@/components/ui/Kpi";
import { Segmented } from "@/components/ui/Form";
import { Freshness, Term } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";

const PERIODS: Period[] = ["today", "7d", "30d", "90d"];
const DAYS: Record<Period, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

export default function AxDashboard() {
  return <Hydrated fallback={<PageSkeleton rows={2} />}><Dashboard /></Hydrated>;
}

function Dashboard() {
  const app = useApp();
  const role: Role = app.role === "customer" ? "owner" : app.role;
  const [period, setPeriod] = useState<Period>("7d");
  const days = DAYS[period];

  /* ------------------------------ KPI (all computed in code) ------------------------------ */
  const k = useMemo(() => salesKpi(app, period), [app, period]);
  const inv = useMemo(() => inventoryKpi(app), [app]);
  const ak = useMemo(() => actionKpi(app.actions), [app.actions]);
  const orders = useMemo(() => allOrders(app), [app]);
  const returnsAll = useMemo(() => allReturns(app), [app]);

  const derived = useMemo(() => {
    const unit = safeDiv(k.cur.revenue, Math.max(1, k.cur.units));
    const unitPrev = safeDiv(k.prev.revenue, Math.max(1, k.prev.units));
    const retsPrev = returnsAll.filter((r) => { const age = Date.now() - new Date(r.createdAt).getTime(); return age > days * 86400000 && age <= 2 * days * 86400000; }).length;
    const net = k.cur.revenue - k.returns * unit;
    const netPrev = k.prev.revenue - retsPrev * unitPrev;
    const prevViews = DAILY.slice(-2 * days, -days).reduce((s, x) => s + x.views, 0);
    const convPrev = safeDiv(k.prev.orders, Math.max(1, Math.round(prevViews / 3.2)));
    const returnRatePrev = safeDiv(retsPrev, Math.max(1, k.prev.units));
    // MD: 담당 브랜드 마진 (brand manager == ROLE_NAME.md)
    const mdBrands = new Set(BRANDS.filter((b) => b.manager === ROLE_NAME.md).map((b) => b.id));
    const brandMargin = (os: typeof orders) => os.reduce((s, o) => s + o.items.reduce((a, i) => { const p = PRODUCT_BY_ID[i.productId]; return mdBrands.has(p.brandId) ? a + (i.unitPrice - p.cost) * i.qty : a; }, 0), 0);
    const cur = periodOrders(orders, period), prev = periodOrders(orders, period, 1);
    return { net, netPrev, convPrev, returnRatePrev, mdMargin: brandMargin(cur), mdMarginPrev: brandMargin(prev), mdBrandNames: BRANDS.filter((b) => mdBrands.has(b.id)).map((b) => b.name) };
  }, [k, returnsAll, days, orders, period]);

  /* ------------------------------ Demand radar preview ------------------------------ */
  const radar = useMemo(() => VARIANTS.map((v) => effVariant(v, app)).map((v) => ({ v, score: demandScore(v), status: inventoryStatus(v, app) })).sort((a, b) => b.score - a.score).slice(0, 5), [app]);

  /* ------------------------------ AI briefing (rule text) ------------------------------ */
  const briefing = useMemo(() => ruleBriefing({
    revenue: k.cur.revenue, revenueDelta: pctDelta(k.cur.revenue, k.prev.revenue), lowRisk: inv.lowRisk, rising: inv.rising, slowValue: inv.slowValue,
    openActions: ak.open, highActions: ak.high, restockRequests: inv.restockRequests, fitReturnRate: k.fitReturnRate,
    topProductName: radar[0] ? PRODUCT_BY_ID[radar[0].v.productId].name : "-",
  }), [k, inv, ak, radar]);

  /* ------------------------------ Actions / evidence ------------------------------ */
  const todayActions = useMemo(() => sortByUrgency(visibleActions(role, app.actions).filter((a) => OPEN_STATUSES.has(a.status))).slice(0, 4), [app.actions, role]);
  const evidence = useMemo(() => [...app.evidence].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 3), [app.evidence]);

  /* ------------------------------ Chart (DAILY + store orders) ------------------------------ */
  const chart = useMemo(() => {
    const n = Math.max(7, days);
    const base = DAILY.slice(-n).map((d) => ({ ...d }));
    const byDate = new Map(base.map((d) => [d.date, d]));
    for (const o of app.orders) { if (o.status === "cancelled") continue; const dp = byDate.get(o.createdAt.slice(0, 10)); if (dp) { dp.revenue += o.total; dp.orders += 1; } }
    return base.map((d) => ({ date: dayLabel(d.date), 매출: d.revenue, 주문: d.orders }));
  }, [days, app.orders]);

  /* ------------------------------ Ops view ------------------------------ */
  const ops = useMemo(() => {
    const todo = orders.filter((o) => o.status === "pending" || o.status === "preparing");
    const shipping = orders.filter((o) => o.status === "shipped" || o.status === "in-transit").length;
    const returnReq = returnsAll.filter((r) => r.status === "requested").length;
    const waitingSubs = app.restockSubs.filter((r) => r.status === "waiting").length;
    return { todo, shipping, returnReq, waitingSubs };
  }, [orders, returnsAll, app.restockSubs]);

  const revDelta = pctDelta(k.cur.revenue, k.prev.revenue);
  const periodLabel = PERIOD_LABEL[period];

  return (
    <div className="space-y-6">
      <PageHeader title="경영 대시보드" desc={role === "ops" ? "오늘 처리할 주문·반품·재입고 문의와 담당 Action을 한 화면에서 확인합니다." : "무엇이 잘되고, 어디서 돈이 새고, 무엇을 먼저 봐야 하는지 10초 안에 확인합니다."}
        badge={<Badge tone="demo" size="sm">DEMO</Badge>}
        right={<div className="flex flex-col items-start md:items-end gap-2"><Segmented value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p].replace("최근 ", "") }))} /><Freshness source="DEMO" /></div>} />

      {role === "ops" ? (
        <>
          <RoleNote>운영직원 화면 — 매출·마진 대신 오늘 처리할 업무를 우선 보여줍니다.</RoleNote>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4" data-tour="kpi-row">
            <KpiCard size="lg" label="오늘 처리할 주문" value={num(ops.todo.length)} sub={`결제대기·상품준비 · 배송 중 ${num(ops.shipping)}건`} href="/ax/orders" icon={<PackageCheck size={18} />} accent={ICON_ACCENTS.operations} />
            <KpiCard size="lg" label="반품 요청" value={num(ops.returnReq)} sub="처리 대기 반품·교환" href="/ax/fit-returns" icon={<RotateCcw size={18} />} accent={ICON_ACCENTS.risk} />
            <KpiCard size="lg" label="재입고 문의" value={num(inv.restockRequests)} sub={`고객 알림 대기 ${num(ops.waitingSubs)}건 포함`} href="/ax/inventory" icon={<Boxes size={18} />} accent={ICON_ACCENTS.sales} />
            <KpiCard size="lg" label="담당 Action" value={num(todayActions.length)} sub={`긴급 ${num(todayActions.filter((a) => a.urgency === "high").length)}건`} href="/ax/actions" icon={<Zap size={18} />} accent={ICON_ACCENTS.ai} />
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <SectionCard title="오늘 처리할 주문" desc="상태를 바꾸면 고객 My Page에 바로 반영됩니다." right={<AxLink href="/ax/orders">주문·배송</AxLink>}>
              {ops.todo.length === 0 ? <EmptyState title="처리할 주문이 없습니다" desc="새 DEMO 주문이 들어오면 여기에 표시됩니다." /> : (
                <ul className="divide-y divide-neutral-border">
                  {ops.todo.slice(0, 6).map((o) => (
                    <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0"><p className="font-semibold text-[0.95rem]">{o.id} · {o.customerName}</p><p className="text-[0.82rem] text-neutral-text2">{o.items.length}개 상품 · {krwShort(o.total)} · {relTime(o.createdAt)}</p></div>
                      <OrderStatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard title="오늘의 Action" desc="운영팀 담당 + 재입고 Action" right={<AxLink href="/ax/actions">Action Center</AxLink>}>
              {todayActions.length === 0 ? <EmptyState title="처리할 Action이 없습니다" /> : <div className="space-y-3">{todayActions.map((a) => <ActionCard key={a.id} action={a} compact />)}</div>}
            </SectionCard>
          </div>
        </>
      ) : (
        <>
          {role === "md" && <RoleNote>MD 화면 — 전체 손익 대신 담당 브랜드({derived.mdBrandNames.join(" · ")}) 마진을 보여줍니다.</RoleNote>}
          {/* Row 1 — large */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-tour="kpi-row">
            <KpiCard size="lg" label={`총 주문액 (${periodLabel})`} value={<BigLg>{krwShort(k.cur.revenue)}</BigLg>} delta={revDelta} href="/ax/sales" icon={<ShoppingBag size={18} />} accent={ICON_ACCENTS.sales} />
            <KpiCard size="lg" label="순매출 (반품 추정 차감)" value={<BigLg>{krwShort(derived.net)}</BigLg>} delta={pctDelta(derived.net, derived.netPrev)} href="/ax/sales" icon={<TrendingUp size={18} />} accent={ICON_ACCENTS.overview} />
            {role === "owner"
              ? <KpiCard size="lg" label="추정 매출총이익" value={<BigLg>{krwShort(k.cur.grossMargin)}</BigLg>} delta={pctDelta(k.cur.grossMargin, k.prev.grossMargin)} href="/ax/sales" icon={<Sparkles size={18} />} accent={ICON_ACCENTS.evidence} />
              : <KpiCard size="lg" label="담당 브랜드 마진" value={<BigLg>{krwShort(derived.mdMargin)}</BigLg>} delta={pctDelta(derived.mdMargin, derived.mdMarginPrev)} href="/ax/sales" icon={<Sparkles size={18} />} accent={ICON_ACCENTS.evidence} />}
            <KpiCard size="lg" label="구매 전환율" value={<BigLg>{pct(k.conversion, 2)}</BigLg>} delta={pctDelta(k.conversion, derived.convPrev)} href="/ax/customers" icon={<Zap size={18} />} accent={ICON_ACCENTS.customer} />
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="재구매율" value={<Big>{pct(k.repeat, 1)}</Big>} sub="2회 이상 구매 고객 비율 (90일)" href="/ax/customers" />
            <KpiCard label="판매소진율 (30일)" value={<Big>{pct(inv.sellThrough, 1)}</Big>} sub="판매 ÷ (판매 + 현재고)" href="/ax/inventory" />
            <KpiCard label="품절위험 옵션 수" value={<Big>{num(inv.lowRisk)}</Big>} sub={`관심 상승 ${num(inv.rising)}개 · 7일 품절 추정손실 ${krwShort(inv.lostSales7d)}`} href="/ax/inventory?filter=low" accent={ICON_ACCENTS.risk} />
            <KpiCard label="저회전 재고금액" value={<Big>{krwShort(inv.slowValue)}</Big>} sub={`총 재고원가 ${krwShort(inv.totalStockValue)} 중`} href="/ax/inventory?filter=slow" accent={ICON_ACCENTS.settings} />
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="반품률" value={<Big>{pct(k.returnRate, 1)}</Big>} sub={`반품 ${num(k.returns)}건 ÷ 판매 ${num(k.cur.units)}개`} href="/ax/fit-returns" />
            <KpiCard label="사이즈 관련 반품률" value={<Big>{pct(k.fitReturnRate, 1)}</Big>} sub={`반품 ${num(k.returns)}건 중 사이즈·핏 사유`} href="/ax/fit-returns" icon={<Ruler size={18} />} accent="#C76C86" />
            <KpiCard label="재입고 신청" value={<Big>{num(inv.restockRequests)}</Big>} sub="옵션별 재입고 알림 신청 누적" href="/ax/inventory" />
            <KpiCard label="미처리 Action" value={<Big>{num(ak.open)}</Big>} sub={`긴급 ${num(ak.high)}건 · 완료율 ${pct(ak.executionRate, 0)}`} href="/ax/actions" icon={<Zap size={18} />} accent={ICON_ACCENTS.ai} />
          </div>
        </>
      )}

      {/* AI 브리핑 + 오늘의 Action */}
      <div className="grid lg:grid-cols-5 gap-5">
        <SectionCard tour="ai-briefing" className="lg:col-span-3" title={<span className="inline-flex items-center gap-2">AI 브리핑 <AIReadyBadge kind="briefing" /></span>} desc="규칙 기반 요약 · LLM 연결 시 자연어 설명 추가">
          <p className="text-[1.15rem] md:text-[1.3rem] font-bold leading-snug tracking-tight">{briefing.headline}</p>
          <ul className="mt-4 space-y-2">
            {briefing.points.map((p) => <li key={p} className="flex gap-2.5 text-[0.95rem] leading-relaxed"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-theme-primary shrink-0" />{p}</li>)}
          </ul>
          <div className="mt-4 rounded-xl bg-theme-soft px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-[0.95rem] font-semibold">다음 행동 · {briefing.next}</p>
            <Button size="sm" href="/ax/actions" icon={<Zap size={16} />}>Action Center 열기</Button>
          </div>
          <p className="mt-3 text-[0.78rem] text-neutral-text2">규칙 기반 요약 · LLM 연결 시 자연어 설명 추가 · 숫자는 코드로 계산됨 (AI 아님)</p>
        </SectionCard>
        <SectionCard className="lg:col-span-2" title="오늘의 Action" desc="긴급도 순 · 미처리 4건" right={<AxLink href="/ax/actions">전체</AxLink>}>
          {todayActions.length === 0 ? <EmptyState title="처리할 Action이 없습니다" desc="새 추천이 생기면 여기에 표시됩니다." /> : <div className="space-y-3">{todayActions.map((a, i) => <ActionCard key={a.id} action={a} compact tour={i === 0 ? "dash-action-first" : undefined} />)}</div>}
        </SectionCard>
      </div>

      {/* 매출 추이 */}
      <SectionCard title="매출 추이" desc={`${period === "today" ? "오늘 포함 최근 7일" : periodLabel} · 일별 매출(면적)과 주문 수(막대)`} right={<AxLink href="/ax/sales">매출·마진</AxLink>}>
        <div className="h-[240px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART.primary} stopOpacity={0.35} /><stop offset="100%" stopColor={CHART.primary} stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke={CHART.border} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={{ stroke: CHART.border }} interval={days >= 30 ? Math.round(chart.length / 8) : 0} />
              <YAxis yAxisId="rev" tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={false} tickFormatter={axisKrw} width={54} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<ChartTip formatter={(k2, v) => (k2 === "매출" ? krwShort(v) : `${num(v)}건`)} />} cursor={{ fill: "var(--theme-soft)", opacity: 0.5 }} />
              <Bar isAnimationActive={false} yAxisId="ord" dataKey="주문" fill={CHART.secondary} opacity={0.55} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Area isAnimationActive={false} yAxisId="rev" type="monotone" dataKey="매출" stroke={CHART.primary} strokeWidth={2.5} fill="url(#dashRev)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Demand Radar preview + Evidence */}
      <div className="grid lg:grid-cols-5 gap-5">
        <SectionCard className="lg:col-span-3" title={<span className="inline-flex items-center gap-2">Demand Radar <Term term="Demand Signal">Top 5</Term></span>} desc="조회·찜·장바구니·재입고 신청을 옵션 단위 수요 점수로 계산" right={<AxLink href="/ax/inventory">재고·재입고</AxLink>}>
          <ul className="divide-y divide-neutral-border">
            {radar.map(({ v, score, status }) => {
              const p = PRODUCT_BY_ID[v.productId];
              return (
                <li key={v.id}>
                  <Link href={`/ax/products/${p.id}?tab=options`} className="py-3 flex items-center gap-3 hover:bg-neutral-canvas/70 -mx-2 px-2 rounded-xl transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[0.95rem] leading-snug">{p.name} <span className="text-neutral-text2 font-normal">· {v.color} · {v.size}</span></p>
                      <p className="text-[0.8rem] text-neutral-text2 mt-0.5 tabular">7일 판매 {v.sales7d} (직전 {v.salesPrev7d}) · 찜 {v.wishlist7d} · 재입고 신청 {v.restockRequests} · 재고 {v.stock}개{v.stock > 0 ? ` (${daysOfStock(v)}일)` : ""}</p>
                    </div>
                    <MiniBar value={score} tone={demandTone(score)} className="w-28 shrink-0" />
                    <span className="hidden sm:inline-flex"><InventoryStatusBadge status={status} /></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SectionCard>
        <SectionCard className="lg:col-span-2" title="최근 Evidence" desc="추천 → 승인 → 실행 → 결과 기록" right={<AxLink href="/ax/evidence">전체</AxLink>}>
          {evidence.length === 0 ? <EmptyState title="Evidence가 없습니다" /> : (
            <ul className="space-y-3">
              {evidence.map((e) => (
                <li key={e.id}>
                  <Link href={`/ax/evidence?id=${e.id}`} className="block rounded-xl border border-neutral-border p-3.5 hover:border-neutral-text2 transition-colors">
                    <div className="flex items-center gap-2 mb-1"><Badge tone={e.type === "RESULT" || e.type === "REVENUE" ? "success" : e.type === "RISK" || e.type === "EXCEPTION" ? "warning" : "info"} size="sm">{e.type}</Badge><Badge tone={e.source === "SIMULATION" ? "demo" : "neutral"} size="sm">{e.source}</Badge><span className="ml-auto text-[0.75rem] text-neutral-text2 tabular">{relTime(e.at)}</span></div>
                    <p className="font-semibold text-[0.92rem] leading-snug">{e.title}</p>
                    <p className="text-[0.8rem] text-neutral-text2 mt-0.5 leading-snug">{e.detail}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <InfoNote tone="accent" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[0.95rem]"><BookOpen size={18} className="text-theme-primary" />왜 이 AX를 만들었나요? 고객 행동과 재고·MD 판단이 끊겨 품절과 과잉재고가 동시에 생기는 문제를 풉니다.</span>
        <Button size="sm" variant="outline" href="/ax/why" icon={<FileCheck2 size={16} />}>기획의도 보기</Button>
      </InfoNote>
    </div>
  );
}
