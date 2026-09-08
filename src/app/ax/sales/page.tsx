"use client";
/* 03 매출·마진 — 기간·채널별 매출, 브랜드/카테고리/채널 분해, 상품별 위험·기회, 프로모션 전후 비교 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Lock, ShoppingBag, TrendingUp, Tag, RotateCcw, Sparkles, Receipt } from "lucide-react";
import { useApp } from "@/lib/store";
import { BRAND_BY_ID, CAMPAIGNS, CATEGORY_NAME, PRODUCT_BY_ID } from "@/lib/demo/seed";
import { allOrders, allReturns, periodOrders, productAgg, PERIOD_LABEL, type Period } from "@/lib/kpi";
import { can } from "@/lib/roles";
import { krw, krwShort, num, pct, pctDelta, safeDiv, signed } from "@/lib/format";
import { daysAgoKey } from "@/lib/dates";
import { ICON_ACCENTS } from "@/lib/theme";
import type { CategoryId, Order, Role } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { PageHeader } from "@/components/ax/AxShell";
import { AxLink, CHART, CHART_SERIES, ChartTip, InfoNote, PageSkeleton, RoleNote, SectionCard, axisKrw, dayLabel } from "@/components/ax/core/shared";
import { KpiCard } from "@/components/ui/Kpi";
import { Segmented } from "@/components/ui/Form";
import { Freshness, Term } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

const PERIODS: Period[] = ["today", "7d", "30d", "90d"];
const DAYS: Record<Period, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };
type Channel = "all" | "web" | "mobile";
const CHANNEL_LABEL: Record<Channel, string> = { all: "전체", web: "PC 웹", mobile: "모바일" };

export default function SalesPage() {
  return <Hydrated fallback={<PageSkeleton rows={3} />}><SalesInner /></Hydrated>;
}

function agg(os: Order[]) {
  const revenue = os.reduce((s, o) => s + o.total, 0);
  const units = os.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  const discount = os.reduce((s, o) => s + o.discount, 0);
  const cost = os.reduce((s, o) => s + o.items.reduce((a, i) => a + PRODUCT_BY_ID[i.productId].cost * i.qty, 0), 0);
  const subtotal = os.reduce((s, o) => s + o.subtotal, 0);
  return { revenue, units, discount, cost, margin: subtotal - cost - discount, orders: os.length, aov: safeDiv(revenue, os.length) };
}

function SalesInner() {
  const app = useApp();
  const router = useRouter();
  const role: Role = app.role === "customer" ? "owner" : app.role;
  const [period, setPeriod] = useState<Period>("30d");
  const [channel, setChannel] = useState<Channel>("all");
  const days = DAYS[period];

  const orders = useMemo(() => allOrders(app), [app]);
  const returns = useMemo(() => allReturns(app), [app]);
  const chan = (os: Order[]) => (channel === "all" ? os : os.filter((o) => o.channel === channel));
  const cur = useMemo(() => chan(periodOrders(orders, period)), [orders, period, channel]); // eslint-disable-line react-hooks/exhaustive-deps
  const prev = useMemo(() => chan(periodOrders(orders, period, 1)), [orders, period, channel]); // eslint-disable-line react-hooks/exhaustive-deps
  const a = useMemo(() => agg(cur), [cur]);
  const p = useMemo(() => agg(prev), [prev]);

  const cancelled = useMemo(() => { const end = Date.now(), start = end - days * 86400000; return chan(orders.filter((o) => o.status === "cancelled" && new Date(o.createdAt).getTime() > start)).length; }, [orders, days, channel]); // eslint-disable-line react-hooks/exhaustive-deps
  const rets = useMemo(() => returns.filter((r) => Date.now() - new Date(r.createdAt).getTime() <= days * 86400000), [returns, days]);
  const retsPrev = useMemo(() => returns.filter((r) => { const age = Date.now() - new Date(r.createdAt).getTime(); return age > days * 86400000 && age <= 2 * days * 86400000; }), [returns, days]);

  /* ---------- Charts ---------- */
  const daily = useMemo(() => {
    if (period === "today") {
      const hours = Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, "0")}시`, 매출: 0, 주문: 0, web: 0, mobile: 0 }));
      for (const o of cur) { const h = new Date(o.createdAt).getHours(); hours[h].매출 += o.total; hours[h].주문 += 1; hours[h][o.channel] += o.total; }
      return hours.filter((_, h) => h >= 7);
    }
    const keys = Array.from({ length: days }, (_, i) => daysAgoKey(days - 1 - i));
    const map = new Map(keys.map((k) => [k, { label: dayLabel(k), 매출: 0, 주문: 0, web: 0, mobile: 0 }]));
    for (const o of cur) { const dp = map.get(o.createdAt.slice(0, 10)); if (dp) { dp.매출 += o.total; dp.주문 += 1; dp[o.channel] += o.total; } }
    return [...map.values()];
  }, [cur, days, period]);

  const byBrand = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of cur) for (const i of o.items) { const b = PRODUCT_BY_ID[i.productId].brandId; m.set(b, (m.get(b) ?? 0) + i.unitPrice * i.qty); }
    return [...m.entries()].map(([id, v]) => ({ name: BRAND_BY_ID[id].name, 매출: v })).sort((x, y) => y.매출 - x.매출);
  }, [cur]);
  const byCategory = useMemo(() => {
    const m = new Map<CategoryId, number>();
    for (const o of cur) for (const i of o.items) { const c = PRODUCT_BY_ID[i.productId].categoryId; m.set(c, (m.get(c) ?? 0) + i.unitPrice * i.qty); }
    return [...m.entries()].map(([id, v]) => ({ name: CATEGORY_NAME[id], value: v })).sort((x, y) => y.value - x.value);
  }, [cur]);
  const catTotal = byCategory.reduce((s, c) => s + c.value, 0);

  /* ---------- Product table ---------- */
  type Row = { id: string; name: string; brand: string; revenue: number; units: number; discount: number; returns: number; margin: number; marginRate: number; velocity: number; flag: "risk" | "opp" | null };
  const rows = useMemo<Row[]>(() => {
    const m = new Map<string, { revenue: number; units: number; discount: number; margin: number }>();
    for (const o of cur) for (const i of o.items) { const x = m.get(i.productId) ?? { revenue: 0, units: 0, discount: 0, margin: 0 }; const pr = PRODUCT_BY_ID[i.productId]; x.revenue += i.unitPrice * i.qty; x.units += i.qty; x.discount += i.discount * i.qty; x.margin += (i.unitPrice - pr.cost) * i.qty; m.set(i.productId, x); }
    const retCount = new Map<string, number>();
    for (const r of rets) retCount.set(r.productId, (retCount.get(r.productId) ?? 0) + 1);
    const list = [...m.entries()].map(([id, x]) => { const pr = PRODUCT_BY_ID[id]; const ag = productAgg(pr, app); return { id, name: pr.name, brand: BRAND_BY_ID[pr.brandId].name, ...x, returns: retCount.get(id) ?? 0, marginRate: safeDiv(x.margin, x.revenue), velocity: ag.velocity, flag: null as Row["flag"] }; }).sort((x, y) => y.revenue - x.revenue);
    const revTop = list[Math.floor(list.length * 0.3)]?.revenue ?? 0;
    const marginMedian = [...list].sort((x, y) => x.marginRate - y.marginRate)[Math.floor(list.length / 2)]?.marginRate ?? 0.5;
    for (const r of list) { const retRate = safeDiv(r.returns, Math.max(1, r.units)); if (r.revenue >= revTop && (r.marginRate < marginMedian || retRate > 0.15)) r.flag = "risk"; else if (r.marginRate >= marginMedian && r.velocity > 0.2) r.flag = "opp"; }
    return list;
  }, [cur, rets, app]);

  const showMargin = can(role, "brand-margin");
  const showCompanyMargin = role === "owner";
  const columns: Column<Row>[] = [
    { key: "name", header: "상품", primary: true, cell: (r) => <span className="font-semibold">{r.name}<span className="block text-[0.78rem] text-neutral-text2 font-normal">{r.brand}</span></span> },
    { key: "revenue", header: "매출", align: "right", cell: (r) => <span className="font-semibold tabular">{krwShort(r.revenue)}</span> },
    { key: "units", header: "수량", align: "right", cell: (r) => num(r.units) },
    { key: "discount", header: "할인", align: "right", cell: (r) => krwShort(r.discount) },
    { key: "returns", header: "반품", align: "right", cell: (r) => <span className={r.returns / Math.max(1, r.units) > 0.15 ? "text-semantic-error font-semibold" : ""}>{num(r.returns)}건</span> },
    ...(showMargin ? [{ key: "margin", header: "추정 마진", align: "right", cell: (r: Row) => <span className="tabular">{krwShort(r.margin)}<span className="block text-[0.75rem] text-neutral-text2">{pct(r.marginRate, 0)}</span></span> } as Column<Row>] : []),
    { key: "flag", header: "위험/기회", cell: (r) => r.flag === "risk" ? <span className="inline-flex items-center gap-1.5"><Badge tone="error" size="sm">위험</Badge><span className="hidden lg:inline text-[0.8rem] text-neutral-text2">매출 높고 마진 낮음</span></span> : r.flag === "opp" ? <span className="inline-flex items-center gap-1.5"><Badge tone="success" size="sm">기회</Badge><span className="hidden lg:inline text-[0.8rem] text-neutral-text2">마진 높고 판매 {signed(r.velocity, 0)}</span></span> : <span className="text-neutral-text2 text-[0.82rem]">-</span> },
    { key: "act", header: "", align: "right", cell: (r) => <Button size="sm" variant="outline" href={`/ax/actions?product=${r.id}`} onClick={(e) => e.stopPropagation()}>Action 보기</Button> },
  ];

  const camps = useMemo(() => CAMPAIGNS.filter((c) => c.revenue > 0 || c.beforeRevenue > 0), []);

  if (!can(role, "brand-margin") && !can(role, "company-pnl")) {
    return (
      <div className="space-y-6">
        <PageHeader title="매출·마진" badge={<Badge tone="demo" size="sm">DEMO</Badge>} right={<Freshness source="DEMO" />} />
        <EmptyState icon={<Lock size={22} />} title="권한 없음 — 운영직원은 매출·마진을 볼 수 없습니다" desc="매출·손익과 브랜드·상품 마진은 대표·MD 권한입니다. 설정 > Permission Matrix에서 역할별 권한을 확인할 수 있습니다. 상단 역할 전환으로 대표/MD로 바꾸면 이 화면을 볼 수 있습니다." action={<div className="flex gap-2"><Button variant="outline" href="/ax/settings">권한 보기</Button><Button href="/ax/orders">주문·배송으로 이동</Button></div>} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="매출·마진" desc="기간과 채널을 바꿔 매출·할인·반품·마진을 확인하고, 상품별 위험·기회를 Action으로 연결합니다." badge={<Badge tone="demo" size="sm">DEMO</Badge>}
        right={<div className="flex flex-col items-start md:items-end gap-2"><div className="flex flex-wrap gap-2"><Segmented value={period} onChange={setPeriod} options={PERIODS.map((x) => ({ value: x, label: PERIOD_LABEL[x].replace("최근 ", "") }))} /><Segmented value={channel} onChange={setChannel} options={(["all", "web", "mobile"] as Channel[]).map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))} /></div><Freshness source="DEMO" /></div>} />

      {role === "md" && <RoleNote>MD 화면 — 회사 전체 손익(추정 마진 합계)은 대표 권한이라 숨겼습니다. 상품·브랜드 마진은 표시됩니다.</RoleNote>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard size="lg" label="매출" value={krwShort(a.revenue)} delta={pctDelta(a.revenue, p.revenue)} icon={<TrendingUp size={18} />} accent={ICON_ACCENTS.sales} />
        <KpiCard label="주문 수" value={`${num(a.orders)}건`} delta={pctDelta(a.orders, p.orders)} icon={<ShoppingBag size={18} />} accent={ICON_ACCENTS.overview} />
        <KpiCard label="객단가" value={krw(a.aov)} delta={pctDelta(a.aov, p.aov)} icon={<Receipt size={18} />} accent={ICON_ACCENTS.operations} />
        <KpiCard label="할인액" value={krwShort(a.discount)} delta={pctDelta(a.discount, p.discount)} invert sub={`매출 대비 ${pct(safeDiv(a.discount, Math.max(1, a.revenue + a.discount)), 1)}`} icon={<Tag size={18} />} accent={ICON_ACCENTS.settings} />
        <KpiCard label="취소·반품" value={`${num(cancelled + rets.length)}건`} delta={pctDelta(rets.length, retsPrev.length)} invert sub={`취소 ${num(cancelled)} · 반품 ${num(rets.length)} → 핏·반품 분석`} href="/ax/fit-returns" icon={<RotateCcw size={18} />} accent={ICON_ACCENTS.risk} />
        {showCompanyMargin
          ? <KpiCard label="추정 마진 (전체)" value={krwShort(a.margin)} delta={pctDelta(a.margin, p.margin)} sub={<><Term term="마진">마진율</Term> {pct(safeDiv(a.margin, Math.max(1, a.revenue)), 1)} · 판매가 − 원가 − 할인</>} icon={<Sparkles size={18} />} accent={ICON_ACCENTS.evidence} />
          : <div className="rounded-cardlg bg-neutral-canvas border border-dashed border-neutral-border p-5 flex flex-col justify-center gap-1"><span className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-neutral-text2"><Lock size={14} />추정 마진 (전체)</span><span className="text-[0.85rem] text-neutral-text2">대표 권한 · MD는 브랜드·상품 마진만 확인</span></div>}
      </div>

      {/* 일별 매출/주문 */}
      <SectionCard title={period === "today" ? "시간대별 매출·주문" : "일별 매출·주문"} desc={`${PERIOD_LABEL[period]} · ${CHANNEL_LABEL[channel]}`}>
        {a.orders === 0 ? <EmptyState title="이 기간·채널에 주문이 없습니다" desc="기간 또는 채널을 바꿔보세요." /> : (
          <div className="h-[240px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs><linearGradient id="salesRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART.primary} stopOpacity={0.35} /><stop offset="100%" stopColor={CHART.primary} stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid stroke={CHART.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={{ stroke: CHART.border }} interval={days >= 30 ? Math.round(daily.length / 8) : 0} />
                <YAxis yAxisId="rev" tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={false} tickFormatter={axisKrw} width={54} />
                <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTip formatter={(k, v) => (k === "매출" ? krwShort(v) : `${num(v)}건`)} />} cursor={{ fill: "var(--theme-soft)", opacity: 0.5 }} />
                <Bar yAxisId="ord" dataKey="주문" fill={CHART.secondary} opacity={0.55} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Area yAxisId="rev" type="monotone" dataKey="매출" stroke={CHART.primary} strokeWidth={2.5} fill="url(#salesRev)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-5">
        <SectionCard title="브랜드별 매출" desc="상품 판매가 기준 (배송비 제외)" right={<AxLink href="/ax/brands">브랜드·파트너</AxLink>}>
          {byBrand.length === 0 ? <EmptyState title="데이터 없음" /> : (
            <div className="w-full" style={{ height: Math.max(220, byBrand.length * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byBrand} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.border} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={false} tickFormatter={axisKrw} />
                  <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip formatter={(_, v) => krwShort(v)} />} cursor={{ fill: "var(--theme-soft)", opacity: 0.5 }} />
                  <Bar dataKey="매출" fill={CHART.primary} radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
        <SectionCard title="카테고리별 매출" desc="비중 · 도넛">
          {byCategory.length === 0 ? <EmptyState title="데이터 없음" /> : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-[220px] w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="none">
                      {byCategory.map((_, i) => <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTip formatter={(_, v) => `${krwShort(v)} (${pct(safeDiv(v, catTotal), 0)})`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full sm:w-1/2 space-y-1.5 text-[0.88rem]">
                {byCategory.map((c, i) => <li key={c.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CHART_SERIES[i % CHART_SERIES.length] }} /><span className="flex-1">{c.name}</span><span className="tabular font-semibold">{pct(safeDiv(c.value, catTotal), 0)}</span><span className="tabular text-neutral-text2 w-20 text-right">{krwShort(c.value)}</span></li>)}
              </ul>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="채널별 매출 (PC 웹 / 모바일)" desc="누적 막대 · 모바일 주문 비중이 높습니다">
        {a.orders === 0 ? <EmptyState title="데이터 없음" /> : (
          <div className="h-[220px] md:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={{ stroke: CHART.border }} interval={days >= 30 ? Math.round(daily.length / 8) : 0} />
                <YAxis tick={{ fontSize: 12, fill: CHART.text2 }} tickLine={false} axisLine={false} tickFormatter={axisKrw} width={54} />
                <Tooltip content={<ChartTip formatter={(_, v) => krwShort(v)} />} cursor={{ fill: "var(--theme-soft)", opacity: 0.5 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="mobile" name="모바일" stackId="c" fill={CHART.primary} maxBarSize={28} />
                <Bar dataKey="web" name="PC 웹" stackId="c" fill={CHART.accent} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard title="상품별 매출·할인·반품·마진" desc="위험 = 매출은 높지만 마진이 낮거나 반품이 많음 · 기회 = 마진이 높고 판매속도 상승" right={<AxLink href="/ax/products">상품·SKU</AxLink>}>
        <DataTable rows={rows.slice(0, 25)} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/ax/products/${r.id}`)} dense empty={<EmptyState title="이 기간에 판매된 상품이 없습니다" />} />
        {rows.length > 25 && <p className="mt-2 text-[0.82rem] text-neutral-text2">매출 상위 25개 상품만 표시 · 전체는 상품·SKU에서 확인</p>}
      </SectionCard>

      <SectionCard title="프로모션 전후 비교" desc="캠페인 직전 기간 매출 vs 캠페인 매출 · 할인비용·추정 마진·반품 (SIMULATION)" right={<AxLink href="/ax/campaigns">캠페인·기획전</AxLink>}>
        <DataTable rows={camps} rowKey={(c) => c.id} dense onRowClick={() => router.push("/ax/campaigns")} columns={[
          { key: "name", header: "캠페인", primary: true, cell: (c) => <span className="font-semibold">{c.name}<span className="block text-[0.78rem] font-normal text-neutral-text2">할인 {pct(c.discountRate, 0)} · {c.status === "running" ? "진행 중" : c.status === "ended" ? "종료" : c.status === "scheduled" ? "예정" : "초안"}</span></span> },
          { key: "before", header: "전 매출", align: "right", cell: (c) => (c.beforeRevenue ? krwShort(c.beforeRevenue) : "-") },
          { key: "rev", header: "캠페인 매출", align: "right", cell: (c) => <span className="font-semibold tabular">{krwShort(c.revenue)}</span> },
          { key: "delta", header: "변화", align: "right", cell: (c) => (c.beforeRevenue ? <span className={pctDelta(c.revenue, c.beforeRevenue) >= 0 ? "text-semantic-success font-semibold" : "text-semantic-error font-semibold"}>{signed(pctDelta(c.revenue, c.beforeRevenue), 0)}</span> : <Badge tone="neutral" size="sm">기준 없음</Badge>) },
          { key: "cost", header: "할인비용", align: "right", cell: (c) => krwShort(c.discountCost) },
          ...(showMargin ? [{ key: "margin", header: "추정 마진", align: "right", cell: (c) => krwShort(c.estMargin) } as Column<(typeof camps)[number]>] : []),
          { key: "returns", header: "반품", align: "right", cell: (c) => `${num(c.returns)}건` },
        ]} />
        <InfoNote className="mt-3">전후 비교는 시뮬레이션 값이며 실제 개선율이 아닙니다. Baseline 측정 후 실증(12주)에서 검증합니다.</InfoNote>
      </SectionCard>
    </div>
  );
}
