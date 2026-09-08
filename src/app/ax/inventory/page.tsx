"use client";
/* 05 재고·재입고 — Demand Radar (옵션 단위 수요신호) · 저회전·과잉 · 입고 예정 */
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Boxes, PackagePlus, Radar, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useApp } from "@/lib/store";
import { BRAND_BY_ID, PRODUCT_BY_ID, PRODUCTS, SCENARIO, VARIANTS } from "@/lib/demo/seed";
import { daysOfStock, demandScore, effPrice, effVariant, inventoryKpi, inventoryStatus, markdownReview, restockPriority, INVENTORY_STATUS_LABEL, INVENTORY_STATUS_TONE } from "@/lib/kpi";
import { can } from "@/lib/roles";
import { cn } from "@/lib/cn";
import { krwShort, num, pct, signed } from "@/lib/format";
import { ICON_ACCENTS } from "@/lib/theme";
import type { InventoryStatus, Role, Variant } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { PageHeader } from "@/components/ax/AxShell";
import { AIReadyBadge } from "@/components/ax/AIReady";
import { ActionStatusBadge, InventoryStatusBadge } from "@/components/ax/StatusBadges";
import { AxLink, BigLg, InfoNote, MiniBar, PageSkeleton, SectionCard, UnitDelta, demandTone } from "@/components/ax/core/shared";
import { useIsMobile } from "@/components/system/hooks";
import { KpiCard } from "@/components/ui/Kpi";
import { Freshness, Term } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

const STATUS_ORDER: InventoryStatus[] = ["normal", "rising", "low", "soldout", "overstock", "slow", "restock-review", "restock-progress", "restocked"];
type Filter = "all" | InventoryStatus;
const PARAM_FILTER: Record<string, Filter> = { slow: "slow", low: "low", rising: "rising", soldout: "soldout", overstock: "overstock" };
const PAGE = 25;

export default function InventoryPage() {
  return <Suspense fallback={<PageSkeleton rows={2} />}><Hydrated fallback={<PageSkeleton rows={2} />}><InventoryInner /></Hydrated></Suspense>;
}

type RadarRow = { v: Variant; score: number; status: InventoryStatus; rp: ReturnType<typeof restockPriority>; dos: number; price: number; actionId?: string; actionStatus?: string };

function InventoryInner() {
  const sp = useSearchParams();
  const app = useApp();
  const role: Role = app.role === "customer" ? "owner" : app.role;
  const showCost = can(role, "brand-margin");
  const [filter, setFilter] = useState<Filter>(PARAM_FILTER[sp.get("filter") ?? ""] ?? "all");
  const [limit, setLimit] = useState(PAGE);
  const mobile = useIsMobile(); // data-tour goes only on the visible (table vs card) Scenario A element
  useEffect(() => { const f = PARAM_FILTER[sp.get("filter") ?? ""]; if (f) setFilter(f); }, [sp]);

  const inv = useMemo(() => inventoryKpi(app), [app]);
  const rows = useMemo<RadarRow[]>(() => VARIANTS.map((v0) => {
    const v = effVariant(v0, app);
    const a = app.actions.find((x) => x.variantId === v.id && x.status !== "dismissed");
    return { v, score: demandScore(v), status: inventoryStatus(v, app), rp: restockPriority(v, app), dos: daysOfStock(v), price: effPrice(PRODUCT_BY_ID[v.productId], app), actionId: a?.id, actionStatus: a?.status };
  }).sort((a, b) => b.score - a.score || b.rp.score - a.rp.score), [app]);
  const counts = useMemo(() => Object.fromEntries(STATUS_ORDER.map((s) => [s, rows.filter((r) => r.status === s).length])) as Record<InventoryStatus, number>, [rows]);
  const filtered = useMemo(() => (filter === "all" ? rows : rows.filter((r) => r.status === filter)), [rows, filter]);
  const shown = filtered.slice(0, limit);

  const slow = useMemo(() => PRODUCTS.map((p) => ({ p, m: markdownReview(p, app), action: app.actions.find((a) => a.type === "markdown" && a.productId === p.id && a.status !== "dismissed") })).filter((x) => x.m.shouldReview).sort((a, b) => b.m.stockValue - a.m.stockValue), [app]);
  const incoming = useMemo(() => rows.filter((r) => r.v.incoming > 0).sort((a, b) => a.dos - b.dos), [rows]);

  const requestReview = (label: string) => toast("검토 요청 (Demo)", `${label} · MD 승인 대기 Action은 시연 시나리오에서 제공됩니다. 실제 서비스에서는 Demand Engine이 자동으로 추천을 생성합니다.`, "info");

  return (
    <div className="space-y-6">
      <PageHeader title="재고·재입고" desc="옵션(색상×사이즈) 단위 수요신호로 어떤 옵션을 언제 확보할지, 무엇을 할인할지 먼저 봅니다." badge={<Badge tone="demo" size="sm">DEMO</Badge>} right={<Freshness source="DEMO" />} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard size="lg" label="품절위험 옵션" value={<BigLg>{num(inv.lowRisk)}</BigLg>} sub={`품절 임박 ${counts.low} · 품절 ${counts.soldout} · 7일 추정손실 ${krwShort(inv.lostSales7d)}`} icon={<AlertTriangle size={18} />} accent={ICON_ACCENTS.risk} />
        <KpiCard size="lg" label="관심 상승 옵션" value={<BigLg>{num(inv.rising)}</BigLg>} sub="판매속도 +30% & 찜·재입고 신청 증가" icon={<TrendingUp size={18} />} accent={ICON_ACCENTS.customer} />
        <KpiCard size="lg" label="판매소진율 (30일)" value={<BigLg>{pct(inv.sellThrough, 1)}</BigLg>} sub={<><Term term="판매소진율">판매 ÷ (판매 + 현재고)</Term></>} icon={<Boxes size={18} />} accent={ICON_ACCENTS.overview} />
        <KpiCard size="lg" label="저회전·과잉 재고원가" value={<BigLg>{showCost ? krwShort(inv.slowValue) : "권한 없음"}</BigLg>} sub={showCost ? `총 재고원가 ${krwShort(inv.totalStockValue)} · 재입고 신청 ${num(inv.restockRequests)}건` : "원가는 대표·MD 권한"} icon={<TrendingDown size={18} />} accent={ICON_ACCENTS.settings} />
      </div>

      {/* Demand Radar */}
      <section data-tour="demand-radar" className="rounded-cardlg bg-white border border-neutral-border shadow-card p-5 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h2 className="text-[1.25rem] md:text-[1.4rem] font-bold tracking-tight inline-flex items-center gap-2"><Radar size={22} className="text-theme-primary" />Demand Radar <AIReadyBadge kind="demand" /></h2>
            <p className="mt-1 text-neutral-text2 text-[0.92rem]"><Term term="Demand Signal">Demand Score</Term> = 판매속도 변화 30% + 찜 변화 20% + 재고 압박 25% + 재입고 신청 15% + 장바구니 10% · 규칙 기반 (0~100)</p>
          </div>
          <p className="text-[0.82rem] text-neutral-text2 tabular">{num(filtered.length)}개 옵션 · 점수 높은 순</p>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setFilter("all"); setLimit(PAGE); }} className={cn("h-9 px-3 rounded-full text-[0.85rem] font-semibold border transition-colors", filter === "all" ? "bg-brand-black text-white border-brand-black" : "bg-white border-neutral-border hover:border-neutral-text2")}>전체 <span className="tabular opacity-70">{rows.length}</span></button>
          {STATUS_ORDER.map((s) => (
            <button key={s} onClick={() => { setFilter(s); setLimit(PAGE); }} aria-pressed={filter === s} className={cn("h-9 px-3 rounded-full text-[0.85rem] font-semibold border transition-colors inline-flex items-center gap-1.5", filter === s ? "bg-brand-black text-white border-brand-black" : "bg-white border-neutral-border hover:border-neutral-text2")}>
              <span className={cn("h-2 w-2 rounded-full", filter === s ? "bg-white" : INVENTORY_STATUS_TONE[s] === "error" ? "bg-semantic-error" : INVENTORY_STATUS_TONE[s] === "warning" ? "bg-semantic-warning" : INVENTORY_STATUS_TONE[s] === "success" ? "bg-semantic-success" : INVENTORY_STATUS_TONE[s] === "accent" ? "bg-theme-accent" : INVENTORY_STATUS_TONE[s] === "info" ? "bg-theme-secondary" : "bg-neutral-border")} />
              {INVENTORY_STATUS_LABEL[s]} <span className="tabular opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? <EmptyState title={`'${filter === "all" ? "전체" : INVENTORY_STATUS_LABEL[filter]}' 옵션이 없습니다`} desc="다른 상태를 선택해보세요." action={<Button variant="outline" onClick={() => setFilter("all")}>전체 보기</Button>} /> : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-cardlg border border-neutral-border">
              <table className="w-full text-[0.88rem]">
                <thead><tr className="bg-neutral-canvas text-neutral-text2 text-left">
                  {["상품 · 옵션", "Demand Score", "7일 판매", "찜 7일", "장바구니", "재입고 신청", "현재고", "예상 소진", "리드타임", "상태", "추천", "Action"].map((h, i) => <th key={h} className={cn("px-3 py-2.5 font-semibold whitespace-nowrap", i >= 2 && i <= 8 && "text-right")}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {shown.map((r) => <RadarTr key={r.v.id} r={r} onRequest={requestReview} tourable={!mobile} />)}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">{shown.map((r) => <RadarCard key={r.v.id} r={r} onRequest={requestReview} tourable={mobile} />)}</div>
            {filtered.length > limit && <div className="flex justify-center"><Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>더 보기 ({num(filtered.length - limit)}개 남음)</Button></div>}
          </>
        )}
        <InfoNote className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <span><span className="font-semibold text-neutral-text">자동발주 없음</span> · 추천 후 사람이 승인합니다 (<Term term="L3">L3</Term>). 재입고 우선순위 = 재고 위험 45% + Demand 25% + 마진 15% + 재입고 신청 15%.</span>
          <AxLink href="/ax/actions?type=restock">재입고 Action 보기</AxLink>
        </InfoNote>
      </section>

      {/* 저회전·과잉 */}
      <SectionCard title="저회전 · 과잉 재고" desc="재고일수가 시즌 잔여기간의 절반을 넘고 판매속도가 둔화된 상품 · Markdown Engine 검토 대상" right={<AxLink href="/ax/actions?type=markdown">할인 Action</AxLink>}>
        {slow.length === 0 ? <EmptyState title="할인 검토 대상이 없습니다" /> : (
          <DataTable rows={slow} rowKey={(x) => x.p.id} dense columns={[
            { key: "p", header: "상품", primary: true, cell: (x) => <Link href={`/ax/products/${x.p.id}?tab=insight`} className="font-semibold hover:text-theme-primary">{x.p.name}<span className="block text-[0.78rem] font-normal text-neutral-text2">{BRAND_BY_ID[x.p.brandId].name} · 재고 {num(x.m.stock)}개</span></Link> },
            { key: "dos", header: <Term term="재고일수">재고일수</Term>, align: "right", cell: (x) => <span className="font-semibold text-semantic-warning tabular">{x.m.dos}일</span> },
            { key: "season", header: "시즌 종료까지", align: "right", cell: (x) => `${x.p.seasonEndsInDays}일` },
            { key: "s7", header: "7일 vs 직전", align: "right", cell: (x) => <span className="tabular">{x.m.s7} / {x.m.p7}</span> },
            ...(showCost ? [{ key: "value", header: "재고원가", align: "right" as const, cell: (x: (typeof slow)[number]) => <span className="tabular font-semibold">{krwShort(x.m.stockValue)}</span> }] : []),
            { key: "cur", header: "현재 할인", align: "right", cell: (x) => pct(x.m.currentRate, 0) },
            { key: "sug", header: "제안 할인율", align: "right", cell: (x) => <span className="font-semibold text-theme-primary tabular">{pct(x.m.suggestedRate, 0)}</span> },
            { key: "act", header: "Action", cell: (x) => x.action ? <Link href={`/ax/actions?open=${x.action.id}`} className="inline-flex items-center gap-1 font-semibold text-theme-primary hover:underline underline-offset-4 text-[0.85rem]"><ActionStatusBadge status={x.action.status} size="sm" />열기</Link> : <Button size="sm" variant="outline" onClick={() => requestReview(x.p.name)}>검토 요청</Button> },
          ]} />
        )}
      </SectionCard>

      {/* 입고 예정 */}
      <SectionCard title="입고 예정" desc="브랜드 공급 예정 수량 · 예상 소진일이 리드타임보다 짧으면 주의" right={<AxLink href="/ax/brands">브랜드 리드타임</AxLink>}>
        {incoming.length === 0 ? <EmptyState title="입고 예정 옵션이 없습니다" icon={<PackagePlus size={22} />} /> : (
          <DataTable rows={incoming} rowKey={(r) => r.v.id} dense columns={[
            { key: "opt", header: "상품 · 옵션", primary: true, cell: (r) => { const p = PRODUCT_BY_ID[r.v.productId]; return <Link href={`/ax/products/${p.id}?tab=options`} className="font-semibold hover:text-theme-primary">{p.name}<span className="block text-[0.78rem] font-normal text-neutral-text2">{r.v.color} · {r.v.size} · {BRAND_BY_ID[p.brandId].name}</span></Link>; } },
            { key: "in", header: "입고 예정", align: "right", cell: (r) => <span className="font-semibold text-semantic-success tabular">+{num(r.v.incoming)}</span> },
            { key: "stock", header: "현재고", align: "right", cell: (r) => num(r.v.stock) },
            { key: "dos", header: "예상 소진", align: "right", cell: (r) => (r.v.stock <= 0 ? <span className="text-semantic-error font-semibold">품절</span> : <span className={r.dos <= r.rp.leadTime ? "text-semantic-warning font-semibold" : ""}>{r.dos}일</span>) },
            { key: "lt", header: "리드타임", align: "right", cell: (r) => `${r.rp.leadTime}일` },
            { key: "st", header: "상태", cell: (r) => <InventoryStatusBadge status={r.status} /> },
          ]} />
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------ Radar rows ------------------------------ */
function ActionCell({ r, onRequest }: { r: RadarRow; onRequest: (label: string) => void }) {
  const p = PRODUCT_BY_ID[r.v.productId];
  if (r.actionId) return <Link href={`/ax/actions?open=${r.actionId}`} className="inline-flex items-center gap-1 text-[0.82rem] font-semibold text-theme-primary hover:underline underline-offset-4 whitespace-nowrap"><Zap size={13} />Action 열기</Link>;
  return <button onClick={() => onRequest(`${p.name} ${r.v.color} ${r.v.size}`)} className="h-8 px-2.5 rounded-lg border border-neutral-border bg-white text-[0.8rem] font-semibold hover:bg-neutral-canvas whitespace-nowrap">검토 요청</button>;
}

function RadarTr({ r, onRequest, tourable }: { r: RadarRow; onRequest: (label: string) => void; tourable: boolean }) {
  const p = PRODUCT_BY_ID[r.v.productId];
  const isA = r.v.id === SCENARIO.A_VARIANT;
  return (
    <tr className={cn("border-t border-neutral-border hover-row align-middle", isA && "bg-theme-soft/60 ring-inset ring-1 ring-theme-primary/40")} data-tour={isA && tourable ? "radar-scenario-a" : undefined} data-variant-id={r.v.id}>
      <td className="px-3 py-2.5"><Link href={`/ax/products/${p.id}?tab=options`} className="font-semibold hover:text-theme-primary leading-snug">{p.name}<span className="block text-[0.78rem] text-neutral-text2 font-normal">{r.v.color} · {r.v.size} · {BRAND_BY_ID[p.brandId].name}{isA && <Badge tone="accent" size="sm" className="ml-1.5">시나리오 A</Badge>}</span></Link></td>
      <td className="px-3 py-2.5"><MiniBar value={r.score} tone={demandTone(r.score)} /></td>
      <td className="px-3 py-2.5 text-right tabular">{r.v.sales7d} <UnitDelta cur={r.v.sales7d} prev={r.v.salesPrev7d} /></td>
      <td className="px-3 py-2.5 text-right tabular">{r.v.wishlist7d} <UnitDelta cur={r.v.wishlist7d} prev={r.v.wishlistPrev7d} /></td>
      <td className="px-3 py-2.5 text-right tabular">{r.v.cart7d}</td>
      <td className={cn("px-3 py-2.5 text-right tabular", r.v.restockRequests >= 5 && "font-bold text-theme-primary")} data-field="restockRequests">{r.v.restockRequests}</td>
      <td className={cn("px-3 py-2.5 text-right tabular font-semibold", r.v.stock <= 0 ? "text-semantic-error" : r.dos <= 4 && "text-semantic-warning")}>{r.v.stock}{r.v.incoming > 0 && <span className="block text-[0.72rem] font-normal text-neutral-text2">+{r.v.incoming}</span>}</td>
      <td className="px-3 py-2.5 text-right tabular">{r.v.stock <= 0 ? <span className="text-semantic-error font-semibold">품절</span> : `${r.dos}일`}</td>
      <td className="px-3 py-2.5 text-right tabular">{r.rp.leadTime}일</td>
      <td className="px-3 py-2.5"><InventoryStatusBadge status={r.status} /></td>
      <td className="px-3 py-2.5 whitespace-nowrap"><span className="tabular font-semibold">{r.rp.score}점</span><span className="block text-[0.75rem] text-neutral-text2">{r.rp.suggestedQty > 0 ? `검토수량 ${num(r.rp.suggestedQty)}` : "수량 없음"}</span></td>
      <td className="px-3 py-2.5"><ActionCell r={r} onRequest={onRequest} /></td>
    </tr>
  );
}

function RadarCard({ r, onRequest, tourable }: { r: RadarRow; onRequest: (label: string) => void; tourable: boolean }) {
  const p = PRODUCT_BY_ID[r.v.productId];
  const isA = r.v.id === SCENARIO.A_VARIANT;
  return (
    <div className={cn("rounded-2xl border bg-white p-4", isA ? "border-theme-primary ring-2 ring-theme-primary/20" : "border-neutral-border")} data-tour={isA && tourable ? "radar-scenario-a" : undefined} data-variant-id={r.v.id}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/ax/products/${p.id}?tab=options`} className="min-w-0"><p className="font-semibold leading-snug">{p.name}</p><p className="text-[0.8rem] text-neutral-text2">{r.v.color} · {r.v.size} · {BRAND_BY_ID[p.brandId].name}</p></Link>
        <InventoryStatusBadge status={r.status} />
      </div>
      {isA && <Badge tone="accent" size="sm" className="mt-1.5">시나리오 A</Badge>}
      <div className="mt-2"><MiniBar value={r.score} tone={demandTone(r.score)} className="w-full" /></div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[0.82rem]">
        <div className="flex justify-between"><dt className="text-neutral-text2">7일 판매</dt><dd className="tabular">{r.v.sales7d} <UnitDelta cur={r.v.sales7d} prev={r.v.salesPrev7d} /></dd></div>
        <div className="flex justify-between"><dt className="text-neutral-text2">찜 7일</dt><dd className="tabular">{r.v.wishlist7d} <UnitDelta cur={r.v.wishlist7d} prev={r.v.wishlistPrev7d} /></dd></div>
        <div className="flex justify-between"><dt className="text-neutral-text2">장바구니</dt><dd className="tabular">{r.v.cart7d}</dd></div>
        <div className="flex justify-between"><dt className="text-neutral-text2">재입고 신청</dt><dd className={cn("tabular", r.v.restockRequests >= 5 && "font-bold text-theme-primary")} data-field="restockRequests">{r.v.restockRequests}</dd></div>
        <div className="flex justify-between"><dt className="text-neutral-text2">현재고</dt><dd className={cn("tabular font-semibold", r.v.stock <= 0 ? "text-semantic-error" : r.dos <= 4 && "text-semantic-warning")}>{r.v.stock}</dd></div>
        <div className="flex justify-between"><dt className="text-neutral-text2">예상 소진</dt><dd className="tabular">{r.v.stock <= 0 ? "품절" : `${r.dos}일`}</dd></div>
        <div className="flex justify-between"><dt className="text-neutral-text2">리드타임</dt><dd className="tabular">{r.rp.leadTime}일</dd></div>
        <div className="flex justify-between"><dt className="text-neutral-text2">추천</dt><dd className="tabular font-semibold">{r.rp.score}점{r.rp.suggestedQty > 0 ? ` · ${num(r.rp.suggestedQty)}개` : ""}</dd></div>
      </dl>
      <div className="mt-3 flex items-center justify-between"><span className="text-[0.75rem] text-neutral-text2">판매속도 {signed(Math.max(-1, (r.v.sales7d - r.v.salesPrev7d) / Math.max(1, r.v.salesPrev7d)), 0)} · 판매가 {krwShort(r.price)}</span><ActionCell r={r} onRequest={onRequest} /></div>
    </div>
  );
}
