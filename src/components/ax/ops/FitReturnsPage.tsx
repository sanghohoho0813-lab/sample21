"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ruler, Undo2, Inbox, Clock, Zap, ChevronRight, CheckCircle2, ArrowRight, Scale } from "lucide-react";
import { PageHeader } from "@/components/ax/AxShell";
import { Hydrated } from "@/components/system/Hydrated";
import { useIsMobile } from "@/components/system/hooks";
import { useApp, ROLE_NAME } from "@/lib/store";
import { BRANDS, BRAND_BY_ID, PRODUCT_BY_ID, RETURN_REASON_LABEL, SCENARIO, VARIANT_BY_ID, CUSTOMER_BY_ID } from "@/lib/demo/seed";
import { allOrders, allProductAgg, allReturns, effFitNote, salesKpi, type ProductAgg } from "@/lib/kpi";
import type { ReturnReason, ReturnRequest, SizingTendency } from "@/lib/types";
import { num, pct, safeDiv } from "@/lib/format";
import { fmtDate, relTime } from "@/lib/dates";
import { ICON_ACCENTS } from "@/lib/theme";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { KpiCard, Stat } from "@/components/ui/Kpi";
import { Freshness, Progress, Term } from "@/components/ui/Misc";
import { Drawer } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { ActionStatusBadge } from "@/components/ax/StatusBadges";
import { displayName, KV, MoreButton, NoteCard, PageSkeleton, SectionBlock, useLocalJson, useMore } from "./shared";
import { cn } from "@/lib/cn";

const SIZING_LABEL: Record<SizingTendency, string> = { small: "작게 나옴", true: "정사이즈", large: "크게 나옴" };
const SIZING_TONE: Record<SizingTendency, Tone> = { small: "warning", true: "neutral", large: "info" };
const RETURN_STATUS_LABEL: Record<ReturnRequest["status"], string> = { requested: "접수됨", approved: "승인", completed: "완료", rejected: "거절" };
const RETURN_STATUS_TONE: Record<ReturnRequest["status"], Tone> = { requested: "warning", approved: "info", completed: "success", rejected: "neutral" };
const REASONS: ReturnReason[] = ["size-small", "size-large", "fit", "color", "material", "delivery", "change-of-mind", "other"];
const isSizeReason = (r: ReturnReason) => r === "size-small" || r === "size-large" || r === "fit";
/* Loop 3 preview text — same wording the store applies when act-004 completes (shown as 미리보기 until then). */
const B_IMPROVED_PREVIEW = "⚠️ 허리가 타이트하게 나온 상품입니다. 최근 구매 고객의 82%가 '사이즈 작음'으로 교환했습니다. 평소 사이즈보다 한 치수 크게 선택하세요. 논워시 원단이라 첫 세탁 후 약 1cm 추가로 줄어듭니다.";

type Processed = Record<string, "approved" | "completed">;

function recommendation(a: ProductAgg, topReason: ReturnReason | null): { label: string; tone: Tone; why: string } {
  if (a.fitReturnRate > 0.15) return { label: "핏 안내 강화", tone: "error", why: `사이즈 관련 반품률 ${pct(a.fitReturnRate, 0)} — 상세 핏 안내를 상단에 강조` };
  if (a.product.sizing === "small" && topReason === "size-small") return { label: "추천 규칙 +1 보정", tone: "warning", why: "작게 나오는 상품에 '사이즈 작음' 반복 — 핏 추천 한 치수 상향" };
  return { label: "관찰", tone: "neutral", why: "카테고리 평균 범위 — 별도 조치 없이 추이 관찰" };
}

export function FitReturnsPage() {
  return (
    <>
      <PageHeader title="핏·반품" desc="반품 사유를 구조화해 어떤 상품이 사이즈·핏 때문에 돌아오는지 찾고, 핏 안내와 추천 규칙을 고칩니다 (Engine 2 · Fit · RULE). 반품률이 높다고 자동으로 불이익을 주지 않습니다 — 판단은 사람이 합니다."
        badge={<Badge tone="demo">DEMO</Badge>} right={<Freshness source="DEMO" />} />
      <Hydrated fallback={<PageSkeleton kpis={4} />}><FitBody /></Hydrated>
    </>
  );
}

function FitBody() {
  const store = useApp();
  const mobile = useIsMobile();
  const [processed, setProcessed] = useLocalJson<Processed>("morfit-returns-processed", {});
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [queueFilter, setQueueFilter] = useState<"open" | "all">("open");

  const returns = useMemo(() => allReturns(store), [store]);
  const orders = useMemo(() => allOrders(store), [store]);
  const kpi = useMemo(() => salesKpi(store, "30d"), [store]);
  const aggs = useMemo(() => allProductAgg(store), [store]);
  const effStatus = (r: ReturnRequest) => processed[r.id] ?? r.status;
  const pendingCount = returns.filter((r) => effStatus(r) === "requested").length;

  const reasonDist = useMemo(() => REASONS.map((r) => ({ reason: r, name: RETURN_REASON_LABEL[r], value: returns.filter((x) => x.reason === r).length })), [returns]);
  const brandRates = useMemo(() => BRANDS.map((b) => { const as = aggs.filter((a) => a.product.brandId === b.id); const s = as.reduce((x, a) => x + a.sales30d, 0); const r = as.reduce((x, a) => x + a.returns30d, 0); return { name: b.name, rate: Math.round(safeDiv(r, Math.max(1, s)) * 1000) / 10, returns: r, sales: s }; }).sort((a, b) => b.rate - a.rate), [aggs]);

  const topReasonOf = useMemo(() => {
    const m = new Map<string, ReturnReason | null>();
    for (const a of aggs) {
      const cnt: Partial<Record<ReturnReason, number>> = {};
      for (const r of returns) if (r.productId === a.product.id) cnt[r.reason] = (cnt[r.reason] ?? 0) + 1;
      const top = (Object.entries(cnt) as [ReturnReason, number][]).sort((x, y) => y[1] - x[1])[0];
      m.set(a.product.id, top ? top[0] : null);
    }
    return m;
  }, [aggs, returns]);

  const fitRows = useMemo(() => aggs.filter((a) => a.sales30d > 0 && a.product.categoryId !== "bag" && a.product.categoryId !== "acc").sort((a, b) => b.fitReturnRate - a.fitReturnRate || b.returns30d - a.returns30d), [aggs]);
  const fitVisible = showAll ? fitRows : fitRows.slice(0, 12);

  const fitActionOf = (productId: string) => store.actions.find((a) => a.productId === productId && a.type === "fit-guide") ?? null;

  const queue = useMemo(() => {
    const order: Record<ReturnRequest["status"], number> = { requested: 0, approved: 1, completed: 2, rejected: 3 };
    const list = [...returns].sort((a, b) => order[effStatus(a)] - order[effStatus(b)] || b.createdAt.localeCompare(a.createdAt));
    return queueFilter === "open" ? list.filter((r) => effStatus(r) !== "completed" && effStatus(r) !== "rejected") : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returns, processed, queueFilter]);
  const { limit, hasMore, more } = useMore(queue.length, 20);
  const isCustomerCreated = (id: string) => store.returns.some((r) => r.id === id);

  const process = (r: ReturnRequest, to: "approved" | "completed") => {
    setProcessed((p) => ({ ...p, [r.id]: to }));
    const p = PRODUCT_BY_ID[r.productId];
    toast(`반품 ${r.id} ${to === "approved" ? "승인" : "완료 처리"} (Demo)`, `${p?.name ?? r.productId} · ${RETURN_REASON_LABEL[r.reason]} · 처리자 ${ROLE_NAME[store.role]}. 실제 회수·환불은 택배·PG 연동 후 (READY).`, "success");
    if (to === "completed") store.addEvidence({ type: "ACTION", title: `반품 ${r.id} 처리 완료`, detail: `${ROLE_NAME[store.role]}이(가) 반품 요청을 완료 처리했습니다 (사유: ${RETURN_REASON_LABEL[r.reason]}). 환불·회수는 연동 예정.`, actor: ROLE_NAME[store.role], productId: r.productId, orderId: r.orderId, source: "DEMO", status: "demo" });
  };

  // Scenario B
  const B = aggs.find((a) => a.product.id === SCENARIO.B_PRODUCT)!;
  const bOverride = store.fitNoteOverride[SCENARIO.B_PRODUCT];
  const act004 = store.actions.find((a) => a.id === "act-004");

  const fitColumns: Column<ProductAgg>[] = [
    { key: "product", header: "상품", primary: true, cell: (a) => (
      <div className="min-w-0">
        <p className="font-semibold leading-snug">{a.product.name}</p>
        <p className="text-[0.8rem] text-neutral-text2">{BRAND_BY_ID[a.product.brandId].name}{a.product.id === SCENARIO.B_PRODUCT && <Badge tone="accent" size="sm" className="ml-1.5">Scenario B</Badge>}</p>
      </div>
    ) },
    { key: "sales", header: "판매 30일", align: "right", cell: (a) => num(a.sales30d) },
    { key: "returns", header: "반품", align: "right", cell: (a) => num(a.returns30d) },
    { key: "fit", header: "사이즈 반품", align: "right", cell: (a) => num(a.fitReturns30d) },
    { key: "risk", header: <Term term="Fit Risk">Fit Risk</Term>, width: "150px", cell: (a) => (
      <div className="min-w-[110px]"><div className="flex items-center justify-between text-[0.8rem] mb-1"><span className={cn("font-semibold tabular", a.fitReturnRate > 0.15 ? "text-semantic-error" : a.fitReturnRate > 0.08 ? "text-semantic-warning" : "text-neutral-text2")}>{pct(a.fitReturnRate, 1)}</span></div><Progress value={Math.min(1, a.fitReturnRate / 0.3)} tone={a.fitReturnRate > 0.15 ? "error" : a.fitReturnRate > 0.08 ? "warning" : "primary"} /></div>
    ) },
    { key: "reason", header: "반복 사유", cell: (a) => { const r = topReasonOf.get(a.product.id); return r ? <Badge tone={isSizeReason(r) ? "warning" : "neutral"} size="sm">{RETURN_REASON_LABEL[r]}</Badge> : <span className="text-neutral-text2">-</span>; } },
    { key: "sizing", header: "사이징 경향", cell: (a) => <Badge tone={SIZING_TONE[a.product.sizing]} size="sm">{SIZING_LABEL[a.product.sizing]}</Badge> },
    { key: "note", header: "현재 핏 안내", hideOnMobile: true, width: "260px", cell: (a) => (
      <div className="max-w-[260px]"><p className="text-[0.82rem] text-neutral-text2 leading-snug line-clamp-2">{effFitNote(a.product, store)}</p>{store.fitNoteOverride[a.product.id] && <Badge tone="success" size="sm" className="mt-1">개선됨</Badge>}</div>
    ) },
    { key: "reco", header: "권장 조치", cell: (a) => { const r = recommendation(a, topReasonOf.get(a.product.id) ?? null); return <Badge tone={r.tone} size="sm">{r.label}</Badge>; } },
    { key: "action", header: "Action", cell: (a) => { const act = fitActionOf(a.product.id); return act ? <Link href={`/ax/actions?open=${act.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[0.85rem] font-semibold text-theme-primary hover:underline">{act.id}<ChevronRight size={14} /></Link> : <Badge tone="neutral" size="sm">검토 필요</Badge>; } },
  ];

  const queueColumns: Column<ReturnRequest>[] = [
    { key: "id", header: "접수", primary: true, cell: (r) => (
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold">{r.id}</span>{isCustomerCreated(r.id) && <Badge tone="primary" size="sm">고객 화면에서 접수</Badge>}{mobile && <Badge tone={RETURN_STATUS_TONE[effStatus(r)]} size="sm">{RETURN_STATUS_LABEL[effStatus(r)]}</Badge>}</div>
        {mobile && <div className="mt-2 flex gap-2"><QueueButtons r={r} status={effStatus(r)} onProcess={process} /></div>}
      </div>
    ) },
    { key: "at", header: "접수 시각", cell: (r) => <span title={fmtDate(r.createdAt, "datetime")}>{relTime(r.createdAt)}</span> },
    { key: "order", header: "주문번호", cell: (r) => <Link href={`/ax/orders?q=${r.orderId}`} onClick={(e) => e.stopPropagation()} className="hover:text-theme-primary underline-offset-2 hover:underline">{r.orderId}</Link> },
    { key: "customer", header: "고객", cell: (r) => displayName(CUSTOMER_BY_ID[r.customerId]?.name ?? r.customerId, store.role) },
    { key: "product", header: "상품·옵션", cell: (r) => { const p = PRODUCT_BY_ID[r.productId]; const v = VARIANT_BY_ID[r.variantId]; return <span>{p?.name ?? r.productId}{v && <span className="text-neutral-text2"> · {v.color} / {v.size}</span>}</span>; } },
    { key: "reason", header: "사유", cell: (r) => <Badge tone={isSizeReason(r.reason) ? "warning" : "neutral"} size="sm">{RETURN_REASON_LABEL[r.reason]}</Badge> },
    { key: "status", header: "상태", hideOnMobile: true, cell: (r) => <Badge tone={RETURN_STATUS_TONE[effStatus(r)]} size="sm">{RETURN_STATUS_LABEL[effStatus(r)]}</Badge> },
    { key: "act", header: "처리", hideOnMobile: true, cell: (r) => <div className="flex gap-1.5"><QueueButtons r={r} status={effStatus(r)} onProcess={process} /></div> },
  ];

  const openAgg = openId ? aggs.find((a) => a.product.id === openId) ?? null : null;

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="반품률 (30일)" value={pct(kpi.returnRate, 1)} icon={<Undo2 size={18} />} accent={ICON_ACCENTS.risk} sub={`반품 ${num(kpi.returns)}건 ÷ 판매 ${num(kpi.cur.units)}개`} />
        <KpiCard label="사이즈 관련 반품률" value={pct(kpi.fitReturnRate, 1)} icon={<Ruler size={18} />} accent="#C76C86" sub="사이즈 작음·큼·핏 불만족" />
        <KpiCard label="반품 요청 (30일)" value={num(kpi.returns)} icon={<Inbox size={18} />} accent={ICON_ACCENTS.operations} sub={`전체 기록 ${num(returns.length)}건 (90일)`} />
        <KpiCard label="처리 대기" value={num(pendingCount)} icon={<Clock size={18} />} accent={ICON_ACCENTS.sales} sub="접수됨 상태 · 승인 필요" />
      </div>

      {/* Scenario B */}
      <SectionBlock title={<span className="inline-flex items-center gap-2"><Zap size={20} className="text-theme-primary" />Scenario B · 와이드 스트레이트 데님 — 사이즈 작음 반품</span>}
        desc="고객 반품 요청(사이즈 작음)이 구조화되어 Fit Risk가 오르고, 핏 안내 강화 Action(act-004)이 추천됩니다. Action 완료 시 상품 상세 핏 안내가 바뀌고 핏 추천 규칙에 +1 사이즈 보정이 적용됩니다 (Loop 3)." tour="fit-scenario-b"
        right={<Button href="/ax/actions?open=act-004" icon={<ChevronRight size={16} />}>핏 안내 강화 Action 보기</Button>}>
        <Card pad="md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="판매 30일" value={`${num(B.sales30d)}개`} />
            <Stat label="반품 30일" value={`${num(B.returns30d)}건`} sub={`반품률 ${pct(B.returnRate, 0)} (카테고리 평균 6%)`} />
            <Stat label="사이즈 관련" value={`${num(B.fitReturns30d)}건`} sub={`반품 중 ${pct(safeDiv(B.fitReturns30d, Math.max(1, B.returns30d)), 0)}`} />
            <Stat label="Action 상태" value={act004 ? <ActionStatusBadge status={act004.status} size="md" /> : "-"} sub="act-004 · 이도윤 MD" />
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
            <div className="rounded-xl border border-neutral-border p-4">
              <p className="text-[0.8rem] font-bold text-neutral-text2 mb-1.5">변경 전 · 기존 핏 안내</p>
              <p className="text-[0.92rem] leading-relaxed">{B.product.fitNote}</p>
            </div>
            <div className="hidden lg:flex items-center justify-center text-neutral-text2"><ArrowRight size={22} /></div>
            <div className={cn("rounded-xl border p-4", bOverride ? "border-semantic-success bg-[#f2faf5]" : "border-dashed border-neutral-border bg-neutral-canvas")}>
              <p className="text-[0.8rem] font-bold text-neutral-text2 mb-1.5 flex items-center gap-2">변경 후 · {bOverride ? <Badge tone="success" size="sm"><CheckCircle2 size={12} />적용됨 (고객 화면 반영)</Badge> : <Badge tone="neutral" size="sm">미리보기 · act-004 완료 시 적용</Badge>}</p>
              <p className="text-[0.92rem] leading-relaxed">{bOverride ?? B_IMPROVED_PREVIEW}</p>
            </div>
          </div>
          <NoteCard className="mt-4">사이즈 반품 -40%는 <b>목표</b>이지 결과가 아닙니다. 변경 후 반품률 비교는 실증 단계에서 Baseline과 비교합니다 (Fit Return Rate: VALIDATE LATER).</NoteCard>
        </Card>
      </SectionBlock>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card pad="md">
          <div className="flex items-center justify-between mb-2"><p className="font-bold">반품 사유 분포</p><Badge tone="demo" size="sm">90일 · {num(returns.length)}건</Badge></div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonDist} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--neutral-border)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "var(--neutral-text-secondary)" }} allowDecimals={false} label={{ value: "건수", position: "insideBottomRight", offset: -2, fontSize: 11, fill: "var(--neutral-text-secondary)" }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: "var(--neutral-text)" }} />
                <Tooltip cursor={{ fill: "var(--neutral-canvas)" }} formatter={(v: number) => [`${v}건`, "반품"]} contentStyle={{ borderRadius: 12, borderColor: "var(--neutral-border)", fontSize: 13 }} />
                <Bar dataKey="value" fill="var(--theme-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card pad="md">
          <div className="flex items-center justify-between mb-2"><p className="font-bold">브랜드별 반품률 (30일)</p><Badge tone="demo" size="sm">반품 ÷ 판매수량</Badge></div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandRates} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--neutral-border)" />
                <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: "var(--neutral-text-secondary)" }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: "var(--neutral-text)" }} />
                <Tooltip cursor={{ fill: "var(--neutral-canvas)" }} formatter={(v: number, _n, item) => [`${v}% (반품 ${item.payload.returns} / 판매 ${item.payload.sales})`, "반품률"]} contentStyle={{ borderRadius: 12, borderColor: "var(--neutral-border)", fontSize: 13 }} />
                <Bar dataKey="rate" fill="var(--theme-secondary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Fit Risk table */}
      <SectionBlock title={<span>Fit Risk 상품</span>} desc="사이즈 관련 반품 ÷ 판매수량 기준으로 정렬했습니다 (가방·액세서리 제외). 행을 누르면 반품 상세와 핏 안내 전문을 볼 수 있습니다."
        right={<Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>{showAll ? "상위 12개만" : `전체 ${fitRows.length}개 보기`}</Button>}>
        <DataTable rows={fitVisible} columns={fitColumns} rowKey={(a) => a.product.id} onRowClick={(a) => setOpenId(a.product.id)} dense />
        <NoteCard className="mt-4" icon={<Scale size={16} />}><b>규칙:</b> Fit Risk 15% 초과 → 핏 안내 강화 · 작게 나오는 상품에 '사이즈 작음' 반복 → 추천 규칙 +1 보정 · 그 외 → 관찰. 반품률이 높다고 상품·브랜드에 자동 불이익은 없습니다. MD가 근거를 보고 판단합니다.</NoteCard>
      </SectionBlock>

      {/* Return queue */}
      <SectionBlock title="반품·교환 요청 처리" desc="접수된 요청을 승인 → 완료 순서로 처리합니다. 고객 화면에서 접수된 요청은 표시가 붙습니다. 처리 상태는 이 브라우저(Demo)에만 저장됩니다."
        right={<div className="inline-flex rounded-xl bg-neutral-canvas p-1 border border-neutral-border">{(["open", "all"] as const).map((k) => <button key={k} onClick={() => setQueueFilter(k)} className={cn("h-9 px-3 rounded-lg text-[0.85rem] font-semibold transition-all duration-fast", queueFilter === k ? "bg-white shadow-card" : "text-neutral-text2 hover:text-neutral-text")}>{k === "open" ? `미처리 (${returns.filter((r) => effStatus(r) === "requested" || effStatus(r) === "approved").length})` : `전체 (${returns.length})`}</button>)}</div>}>
        <DataTable rows={queue.slice(0, limit)} columns={queueColumns} rowKey={(r) => r.id} dense
          empty={<EmptyState title="처리할 요청이 없습니다" desc="모든 반품·교환 요청이 완료되었습니다. 고객 화면 My Page > 주문에서 반품을 요청하면 여기에 접수됩니다." icon={<CheckCircle2 size={22} />} action={<Button variant="outline" href="/my/orders">고객 화면에서 반품 요청해 보기</Button>} />} />
        <MoreButton hasMore={hasMore} onClick={more} remaining={queue.length - limit} />
      </SectionBlock>

      <Drawer open={!!openAgg} onClose={() => setOpenId(null)} title={openAgg?.product.name ?? ""} width="max-w-lg">
        {openAgg && <ProductFitDetail a={openAgg} returns={returns.filter((r) => r.productId === openAgg.product.id)} topReason={topReasonOf.get(openAgg.product.id) ?? null} override={store.fitNoteOverride[openAgg.product.id]} action={fitActionOf(openAgg.product.id)} orderCount={orders.length} />}
      </Drawer>
    </div>
  );
}

function QueueButtons({ r, status, onProcess }: { r: ReturnRequest; status: ReturnRequest["status"]; onProcess: (r: ReturnRequest, to: "approved" | "completed") => void }) {
  if (status === "requested") return <Button size="sm" onClick={(e) => { e.stopPropagation(); onProcess(r, "approved"); }}>승인</Button>;
  if (status === "approved") return <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onProcess(r, "completed"); }}>완료</Button>;
  return <span className="text-[0.82rem] text-neutral-text2 inline-flex items-center gap-1"><CheckCircle2 size={14} />{RETURN_STATUS_LABEL[status]}</span>;
}

function ProductFitDetail({ a, returns, topReason, override, action, orderCount }: { a: ProductAgg; returns: ReturnRequest[]; topReason: ReturnReason | null; override?: string; action: { id: string; status: "recommended" | "confirmed" | "in-progress" | "done" | "hold" | "dismissed"; title: string } | null; orderCount: number }) {
  const reco = recommendation(a, topReason);
  const sizeCount = returns.filter((r) => isSizeReason(r.reason)).length;
  void orderCount;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap"><Badge tone="neutral">{BRAND_BY_ID[a.product.brandId].name}</Badge><Badge tone={SIZING_TONE[a.product.sizing]}>{SIZING_LABEL[a.product.sizing]}</Badge><Badge tone={reco.tone}>{reco.label}</Badge></div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="판매 30일" value={`${num(a.sales30d)}개`} />
        <Stat label="반품 30일" value={`${num(a.returns30d)}건`} sub={`반품률 ${pct(a.returnRate, 1)}`} />
        <Stat label="사이즈 반품" value={`${num(a.fitReturns30d)}건`} sub={`Fit Risk ${pct(a.fitReturnRate, 1)}`} />
        <Stat label="90일 반품 기록" value={`${num(returns.length)}건`} sub={`사이즈 관련 ${sizeCount}건`} />
      </div>
      <div>
        <p className="font-bold mb-1.5">권장 조치 · 왜?</p>
        <p className="text-[0.9rem] text-neutral-text2 leading-relaxed">{reco.why}</p>
        <div className="mt-2 flex gap-2 flex-wrap">
          {action ? <Button size="sm" href={`/ax/actions?open=${action.id}`} icon={<ChevronRight size={14} />}>{action.id} Action 보기</Button> : <Badge tone="neutral">연결된 Action 없음 · 검토 필요</Badge>}
          <Button size="sm" variant="outline" href={`/ax/products/${a.product.id}`}>상품 상세 (AX)</Button>
          <Button size="sm" variant="ghost" href={`/products/${a.product.id}`}>고객 화면</Button>
        </div>
      </div>
      <div>
        <p className="font-bold mb-1.5 flex items-center gap-2">현재 핏 안내 {override && <Badge tone="success" size="sm">개선됨</Badge>}</p>
        <p className="rounded-xl bg-neutral-canvas px-4 py-3 text-[0.9rem] leading-relaxed">{override ?? a.product.fitNote}</p>
        {override && <p className="mt-1.5 text-[0.82rem] text-neutral-text2">변경 전: {a.product.fitNote}</p>}
      </div>
      <div>
        <p className="font-bold mb-1.5">최근 반품 사유</p>
        {returns.length === 0 ? <p className="text-[0.88rem] text-neutral-text2">90일 내 반품 기록이 없습니다.</p> : (
          <dl className="rounded-xl border border-neutral-border px-4">
            {returns.slice(0, 6).map((r) => { const v = VARIANT_BY_ID[r.variantId]; return <KV key={r.id} label={<span>{fmtDate(r.createdAt)} · {v ? `${v.color}/${v.size}` : ""}</span>}><Badge tone={isSizeReason(r.reason) ? "warning" : "neutral"} size="sm">{RETURN_REASON_LABEL[r.reason]}</Badge></KV>; })}
          </dl>
        )}
      </div>
      <p className="text-[0.8rem] text-neutral-text2">DEMO 데이터 · 반품률이 높아도 자동 불이익 없음 · 판단은 MD</p>
    </div>
  );
}
