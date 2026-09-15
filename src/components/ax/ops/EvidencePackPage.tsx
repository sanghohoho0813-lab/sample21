"use client";
/* Evidence Pack — 대표 보고용 인쇄 리포트 (DEMO 미리보기).
   구조: 표지 → Baseline → Trigger → Recommendation → Approval → Action → Result → KPI Delta → Unit Economics → Provenance → Log.
   원칙: Baseline 없이는 개선율을 쓰지 않는다. 모든 값은 DEMO/SIMULATION 으로 표기한다 (Unified §27 · MORFIT §33). */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, FileJson, Flag, Layers, Printer, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ax/AxShell";
import { Hydrated } from "@/components/system/Hydrated";
import { useApp, ROLE_LABEL, ROLE_NAME } from "@/lib/store";
import { actionKpi, customerKpi, inventoryKpi, restockFunnel, salesKpi } from "@/lib/kpi";
import { unitEconomics, unitEconomicsRows, UnitEconomicsPanel } from "./UnitEconomics";
import { BRANDS, CUSTOMERS, PRODUCT_BY_ID, RETURNS, SEED_ORDERS, VARIANTS, VARIANT_BY_ID } from "@/lib/demo/seed";
import { can } from "@/lib/roles";
import { aiStatus } from "@/lib/ai";
import type { AXAction, EvidenceLog, Role } from "@/lib/types";
import { krwShort, num, pct } from "@/lib/format";
import { fmtDate, todayKey } from "@/lib/dates";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Kpi";
import { toast } from "@/components/ui/Toast";
import { ActionStatusBadge } from "@/components/ax/StatusBadges";
import { ACTION_TYPE_LABEL, ENGINE_LABEL } from "@/components/ax/core/shared";
import { EVIDENCE_TYPE_LABEL, EvidenceTypeBadge, NoteCard, PageSkeleton, SourceBadge } from "./shared";
import { cn } from "@/lib/cn";

const STATUS_ORDER: Record<AXAction["status"], number> = { done: 0, "in-progress": 1, confirmed: 2, recommended: 3, hold: 4, dismissed: 5 };
const HIST_LABEL: Record<AXAction["status"], string> = { recommended: "추천", confirmed: "확인(승인)", "in-progress": "실행 시작", done: "완료", hold: "보류", dismissed: "무시" };

export function EvidencePackPage() {
  return <Hydrated fallback={<PageSkeleton kpis={4} />}><PackBody /></Hydrated>;
}

function PackSection({ no, title, desc, children, id }: { no: string; title: string; desc?: ReactNode; children: ReactNode; id: string }) {
  return (
    <Card id={id} pad="lg" className="print-avoid print:shadow-none scroll-mt-24">
      <div className="mb-4 flex items-start gap-3">
        <span className="h-9 w-9 shrink-0 rounded-xl bg-theme-soft text-theme-primary font-bold inline-flex items-center justify-center tabular">{no}</span>
        <div className="min-w-0"><h2 className="text-[1.2rem] md:text-[1.3rem] font-bold tracking-tight">{title}</h2>{desc && <p className="mt-1 text-[0.9rem] text-neutral-text2 leading-relaxed">{desc}</p>}</div>
      </div>
      {children}
    </Card>
  );
}

function PackTable({ head, rows, className }: { head: ReactNode[]; rows: ReactNode[][]; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-neutral-border bg-white", className)}>
      <table className="w-full text-[0.86rem]">
        <thead><tr className="bg-neutral-canvas text-neutral-text2 text-left">{head.map((h, i) => <th key={i} className="px-3 py-2.5 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-neutral-border align-top">{r.map((c, j) => <td key={j} className="px-3 py-2.5">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

const TOC = [["cover", "표지"], ["baseline", "Baseline"], ["actions", "Trigger → Result"], ["delta", "KPI Delta"], ["ue", "Unit Economics"], ["provenance", "Provenance"], ["log", "Log"]] as const;

function PackBody() {
  const store = useApp();
  const role: Role = store.role === "customer" ? "owner" : store.role;
  const showMargin = can(role, "company-pnl");
  const [llm, setLlm] = useState<{ status: string; model: string; configured: boolean } | null>(null);
  useEffect(() => { let on = true; aiStatus().then((s) => { if (on) setLlm(s); }); return () => { on = false; }; }, []);

  const k30 = useMemo(() => salesKpi(store, "30d"), [store]);
  const k90 = useMemo(() => salesKpi(store, "90d"), [store]);
  const inv = useMemo(() => inventoryKpi(store), [store]);
  const ck = useMemo(() => customerKpi(store), [store]);
  const ak = useMemo(() => actionKpi(store.actions), [store.actions]);
  const funnel = useMemo(() => restockFunnel(store.restockSubs), [store.restockSubs]);
  const ue = useMemo(() => unitEconomics(store), [store]);
  const ueRows = useMemo(() => unitEconomicsRows(ue, showMargin), [ue, showMargin]);
  const evidence = useMemo(() => [...store.evidence].sort((a, b) => a.at.localeCompare(b.at)), [store.evidence]);
  const actions = useMemo(() => [...store.actions].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.id.localeCompare(b.id)), [store.actions]);
  const generatedAt = useMemo(() => new Date().toISOString(), []);
  const sources = useMemo(() => ({ DEMO: evidence.filter((e) => e.source === "DEMO").length, SIMULATION: evidence.filter((e) => e.source === "SIMULATION").length, LIVE: evidence.filter((e) => e.source === "LIVE").length }), [evidence]);

  const baseline = useMemo(() => [
    { metric: "구매 전환율 (30일)", value: pct(k30.conversion, 2), kpi: "Revenue", point: "상품 상세 조회(view_product) → 주문 완료 이벤트" },
    { metric: "찜 → 구매 전환", value: "— (측정 지점만 정의)", kpi: "Revenue", point: "add_wishlist 후 30일 내 동일 상품 주문" },
    { metric: "재입고 알림 → 구매 (Loop 1)", value: funnel.sent ? `${funnel.purchasedAfterNotice} / ${funnel.sent} (${pct(funnel.noticeToPurchase, 0)})` : `— (이번 세션 알림 발송 0 · 대기 ${funnel.waiting})`, kpi: "Revenue", point: "restock notified → 동일 옵션 주문 완료" },
    { metric: "반품률 (30일)", value: pct(k30.returnRate, 1), kpi: "Cost", point: "반품 요청 ÷ 판매 수량" },
    { metric: "사이즈 관련 반품률 (30일)", value: pct(k30.fitReturnRate, 1), kpi: "Cost", point: "반품 사유 = size-small · size-large · fit" },
    { metric: "품절위험 옵션 · 7일 품절 추정손실", value: `${num(inv.lowRisk)}개 · ${krwShort(inv.lostSales7d)}`, kpi: "Cost", point: "재고일수 ≤ 4 또는 재고 0 · 일평균 판매 × 7 × 판매가" },
    { metric: "저회전·과잉 재고 원가", value: krwShort(inv.slowValue), kpi: "Cost", point: "저회전/과잉 판정 상품 재고 × 원가" },
    { metric: "재구매율 (90일)", value: pct(k90.repeat, 1), kpi: "Revenue", point: "2회 이상 구매 회원 ÷ 구매 회원 (비회원 제외)" },
    { metric: "Action 채택률", value: `${pct(ak.executionRate, 0)} (${ak.done} / ${ak.created})`, kpi: "Scale", point: "완료 Action ÷ 추천 Action" },
    { metric: "MD 주간 분석시간 · 수기 보고서 수", value: "— (수기 측정)", kpi: "Cost", point: "Pilot 1~2주차 MD 자기 기록 (시작·종료 시각)" },
  ], [k30, k90, inv, ak, funnel]);

  const deltaRows = useMemo(() => [
    ["Cost", "7일 품절 추정손실", krwShort(inv.lostSales7d)], ["Cost", "저회전·과잉 재고 원가", krwShort(inv.slowValue)], ["Cost", "반품률 (30일)", pct(k30.returnRate, 1)],
    ["Revenue", "30일 매출 (주문액)", krwShort(k30.cur.revenue)], ["Revenue", "재입고 알림 → 구매", funnel.sent ? `${funnel.purchasedAfterNotice}/${funnel.sent}` : "—"], ["Revenue", "재구매율 (90일)", pct(k90.repeat, 1)],
    ["Scale", "관리 옵션(SKU) 수 · 브랜드 수", `${num(VARIANTS.length)} · ${BRANDS.length}`], ["Scale", "미처리 Action / 긴급", `${ak.open} / ${ak.high}`],
  ], [inv, k30, k90, funnel, ak]);

  const resultsOf = (a: AXAction) => evidence.filter((e) => e.actionId === a.id && (e.type === "RESULT" || e.type === "REVENUE" || e.type === "EFFICIENCY"));
  const customerOf = (a: AXAction) => evidence.filter((e) => e.actionId === a.id && e.type === "CUSTOMER");
  const funnelOf = (a: AXAction) => (a.variantId ? restockFunnel(store.restockSubs.filter((r) => r.variantId === a.variantId)) : null);

  const buildPack = () => ({
    meta: { product: "MORFIT AX + Platform", stage: "DEMO", generatedAt, generatedBy: `${ROLE_NAME[role]} (${ROLE_LABEL[role]})`, baseline: "UNKNOWN / REQUIRED", disclaimer: "모든 수치는 DEMO/SIMULATION 데이터입니다. 실제 성과가 아니며, 개선율은 Pilot Baseline 측정 후에만 산출합니다." },
    baseline,
    kpiDelta: deltaRows.map(([kpi, metric, current]) => ({ kpi, metric, current, baseline: "UNKNOWN / REQUIRED", delta: "VALIDATE LATER" })),
    actions: actions.map((a) => ({ id: a.id, type: a.type, title: a.title, status: a.status, engine: a.engine, automation: a.automation, errorCost: a.errorCost, owner: a.ownerName, trigger: a.trigger, reasons: a.reasons, expectedImpact: a.expectedImpact, caution: a.caution ?? null, quantity: a.quantity ?? null, discountRate: a.discountRate ?? null, history: a.statusHistory, resultNote: a.resultNote ?? null, results: resultsOf(a).map((e) => e.id), customerFeedback: customerOf(a).map((e) => e.id), restockFunnel: funnelOf(a) })),
    unitEconomics: { computed: showMargin ? ue : { ...ue, grossMargin: null, cmPerOrder: null, marginRate: null }, rows: ueRows },
    provenance: { seed: { orders: SEED_ORDERS.length, returns: RETURNS.length, customers: CUSTOMERS.length, variants: VARIANTS.length, brands: BRANDS.length, generator: "deterministic PRNG (mulberry32)" }, session: { orders: store.orders.length, returns: store.returns.length, restockSubs: store.restockSubs.length, events: store.events.length, evidence: store.evidence.length }, engines: "RULE / STAT (code) — no ML, no LLM in calculations", llm: llm ? (llm.configured ? `LIVE · ${llm.model} (설명만)` : "AI READY · 미연결") : "AI READY", personalData: "없음 (가상 고객 · 역할별 이름 마스킹)", evidenceSources: sources },
    evidence,
  });

  const exportJson = () => {
    try {
      const pack = buildPack();
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `morfit-evidence-pack-DEMO-${todayKey()}.json`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      store.addEvidence({ type: "ADOPTION", title: "Evidence Pack (DEMO 미리보기) JSON 내보내기", detail: `${ROLE_NAME[role]}이(가) Baseline·Action·KPI Delta·Provenance·Log ${evidence.length}건을 JSON으로 내보냈습니다. Pilot 전환 후에는 실측 Baseline이 포함됩니다.`, actor: ROLE_NAME[role], source: "DEMO", status: "demo" });
      toast("Evidence Pack JSON을 내보냈습니다", "DEMO 미리보기 — Baseline 값은 UNKNOWN으로 표기됩니다.", "success");
    } catch { toast("내보내기에 실패했습니다", "브라우저 다운로드가 차단되었을 수 있습니다.", "warning"); }
  };
  const print = () => { if (typeof window !== "undefined") window.print(); };

  return (
    <div className="space-y-6">
      <PageHeader title="Evidence Pack" badge={<><Badge tone="demo" size="sm">DEMO 미리보기</Badge><Badge tone="ready" size="sm">Pilot 전환 후 실측</Badge></>}
        desc="대표 보고용 한 묶음 — Baseline → Trigger → Recommendation → Approval → Action → Result → KPI Delta → Provenance → Log. 인쇄하면 A4 리포트, JSON으로 내보내면 실증 리포트의 재료가 됩니다."
        right={<div className="flex flex-wrap items-center gap-2 print:hidden"><Button variant="outline" href="/ax/evidence" icon={<ArrowLeft size={16} />}>Evidence로</Button><Button variant="outline" onClick={exportJson} icon={<FileJson size={16} />}>JSON 내보내기</Button><Button onClick={print} icon={<Printer size={16} />}>인쇄 · PDF</Button></div>} />

      <NoteCard tone="warning" icon={<Flag size={16} />}><b>BASELINE: UNKNOWN / REQUIRED</b> — 이 Pack은 구조와 기록 방식을 보여주는 DEMO 미리보기입니다. "개선율" 칸은 모두 <b>VALIDATE LATER</b>이며, Pilot 1~2주차 Baseline이 측정된 뒤에만 채워집니다.</NoteCard>

      <nav aria-label="Pack 목차" className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap print:hidden">
        {TOC.map(([id, label], i) => <a key={id} href={`#pack-${id}`} className="inline-flex shrink-0 items-center gap-1.5 h-10 px-3.5 rounded-full border border-neutral-border bg-white text-[0.85rem] font-semibold hover:border-neutral-text2 hover:bg-neutral-canvas transition-all"><span className="text-neutral-text2 tabular">{i}</span>{label}</a>)}
      </nav>

      {/* 0 표지 */}
      <PackSection id="pack-cover" no="0" title="표지 · 생성 정보" desc="누가, 언제, 어떤 데이터로 만들었는지가 먼저 나와야 리포트를 믿을 수 있습니다.">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="생성 시각" value={<span className="text-[1rem]">{fmtDate(generatedAt, "datetime")}</span>} sub="브라우저 시각" />
          <Stat label="생성자" value={<span className="text-[1rem]">{ROLE_NAME[role]}</span>} sub={ROLE_LABEL[role]} />
          <Stat label="데이터 단계" value={<span className="text-[1rem]">DEMO</span>} sub={`Evidence ${num(evidence.length)}건 · DEMO ${sources.DEMO} · SIMULATION ${sources.SIMULATION} · LIVE ${sources.LIVE}`} />
          <Stat label="대상 기간" value={<span className="text-[1rem]">최근 30 · 90일</span>} sub="Baseline은 Pilot 1~2주차" />
        </div>
        <p className="mt-3 text-[0.85rem] text-neutral-text2 leading-relaxed">Primary Constraint — 옵션(색상×사이즈) 단위 수요신호가 MD 판단에 닿지 않아 품절 손실과 과잉재고가 동시에 생긴다. 이 Pack은 그 신호가 Action이 되고, Action이 결과가 되어 고객에게 돌아갔는지를 기록한다.</p>
      </PackSection>

      {/* 1 Baseline */}
      <PackSection id="pack-baseline" no="1" title="Baseline 표 · 측정 지점" desc="현재 값은 DEMO 세션 계산값입니다. Baseline 열은 Pilot에서 같은 지점을 같은 공식으로 측정해 채웁니다.">
        <PackTable head={["지표", "현재 값 (DEMO)", "Baseline", "KPI", "측정 지점 · 공식"]} rows={baseline.map((b) => [<span key="m" className="font-semibold whitespace-nowrap">{b.metric}</span>, <span key="v" className="tabular whitespace-nowrap">{b.value}</span>, <Badge key="b" tone="warning" size="sm">UNKNOWN / REQUIRED</Badge>, <Badge key="k" tone={b.kpi === "Cost" ? "error" : b.kpi === "Revenue" ? "success" : "info"} size="sm">{b.kpi}</Badge>, <span key="p" className="text-neutral-text2">{b.point}</span>])} />
      </PackSection>

      {/* 2 Actions */}
      <PackSection id="pack-actions" no="2" title="Trigger → Recommendation → Approval → Action → Result" desc={`Action ${actions.length}건 · 완료 ${ak.done} · 진행 ${ak.open} · 보류/무시 ${actions.length - ak.done - ak.open}. 각 Action의 근거·승인자·시각·결과·고객 반영을 한 블록으로 묶었습니다.`}>
        <div className="space-y-4">
          {actions.map((a) => {
            const results = resultsOf(a); const feedback = customerOf(a); const f = funnelOf(a);
            return (
              <div key={a.id} className="rounded-2xl border border-neutral-border bg-white p-4 md:p-5 print-avoid">
                <div className="flex items-center gap-2 flex-wrap"><Badge tone="accent">{a.id}</Badge><Badge tone="neutral" size="sm">{ACTION_TYPE_LABEL[a.type]}</Badge><ActionStatusBadge status={a.status} /><span className="text-[0.8rem] text-neutral-text2">{ENGINE_LABEL[a.engine]} · {a.automation} · Error Cost {a.errorCost}</span><span className="ml-auto text-[0.8rem] text-neutral-text2">담당 {a.ownerName}</span></div>
                <p className="mt-2 font-bold text-[1.02rem] leading-snug">{a.title}</p>
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 text-[0.88rem]">
                  <div className="rounded-xl bg-neutral-canvas p-3"><p className="text-[0.75rem] font-bold text-neutral-text2 tracking-wide">TRIGGER</p><p className="mt-0.5">{a.trigger}</p><p className="mt-2 text-[0.75rem] font-bold text-neutral-text2 tracking-wide">RECOMMENDATION · 근거 {a.reasons.length}</p><ul className="mt-0.5 list-disc pl-5 space-y-0.5">{a.reasons.map((r) => <li key={r}>{r}</li>)}</ul><p className="mt-2"><span className="font-semibold">기대 효과</span> {a.expectedImpact}{a.quantity ? ` · 수량 ${a.quantity}` : ""}{a.discountRate ? ` · 할인 ${Math.round(a.discountRate * 100)}%` : ""}</p>{a.caution && <p className="mt-1 text-neutral-text2">주의 · {a.caution}</p>}</div>
                  <div className="rounded-xl bg-neutral-canvas p-3"><p className="text-[0.75rem] font-bold text-neutral-text2 tracking-wide">APPROVAL · ACTION 이력</p>
                    <ul className="mt-0.5 space-y-1">{a.statusHistory.map((h, i) => <li key={i} className="flex flex-wrap gap-x-2"><span className="tabular text-neutral-text2 whitespace-nowrap">{fmtDate(h.at, "datetime")}</span><span className="font-semibold">{HIST_LABEL[h.status]}</span><span>{h.actor}</span>{h.note && <span className="text-neutral-text2">· {h.note}</span>}</li>)}</ul>
                    <p className="mt-2 text-[0.75rem] font-bold text-neutral-text2 tracking-wide">RESULT · 고객 반영</p>
                    {results.length === 0 && feedback.length === 0 ? <p className="mt-0.5 text-neutral-text2">아직 결과 기록 없음 — {a.status === "done" ? "완료 처리만 기록됨" : "실행 후 재고·가격·핏 안내 변화가 기록됩니다"}.</p> : (
                      <ul className="mt-0.5 space-y-1">{[...results, ...feedback].sort((x, y) => x.at.localeCompare(y.at)).map((e) => <li key={e.id} className="flex flex-wrap gap-x-2 items-baseline"><EvidenceTypeBadge type={e.type} /><span>{e.title}</span>{e.kpiDelta && <span className="text-neutral-text2 tabular">· {e.kpiDelta}</span>}</li>)}</ul>
                    )}
                    {f && f.total > 0 && <p className="mt-2 tabular">Loop 1 퍼널 (이 옵션) — 신청 {f.total} · 알림 {f.sent} · 구매 {f.purchasedAfterNotice}{f.sent ? ` (${pct(f.noticeToPurchase, 0)})` : ""}</p>}
                    {a.variantId && VARIANT_BY_ID[a.variantId] && <p className="mt-1 text-neutral-text2">옵션 · {PRODUCT_BY_ID[VARIANT_BY_ID[a.variantId].productId]?.name} {VARIANT_BY_ID[a.variantId].color} {VARIANT_BY_ID[a.variantId].size}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PackSection>

      {/* 3 KPI Delta */}
      <PackSection id="pack-delta" no="3" title="KPI Delta · Money KPI 요약" desc="Cost / Revenue / Scale 세 줄로 돈을 설명합니다. 현재 값은 있지만 Baseline이 없으므로 '변화' 칸은 비워 둡니다.">
        <PackTable head={["KPI", "지표", "현재 (DEMO)", "Baseline", "변화"]} rows={deltaRows.map(([kpi, metric, cur]) => [<Badge key="k" tone={kpi === "Cost" ? "error" : kpi === "Revenue" ? "success" : "info"} size="sm">{kpi}</Badge>, <span key="m" className="font-semibold">{metric}</span>, <span key="c" className="tabular">{cur}</span>, <span key="b" className="text-neutral-text2">UNKNOWN / REQUIRED</span>, <Badge key="d" tone="warning" size="sm">VALIDATE LATER</Badge>])} />
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="구매 회원 (90일)" value={num(ck.buyers)} sub={`비회원 구매 ${num(ck.guestBuyers)}명 별도`} />
          <Stat label="핏 프로필 보유율" value={pct(ck.profileRate, 0)} sub="회원 기준" />
          <Stat label="재입고 알림 신청 누적" value={num(inv.restockRequests)} sub="옵션 단위 수요신호" />
          <Stat label="판매소진율 (30일)" value={pct(inv.sellThrough, 1)} sub="판매 ÷ (판매 + 현재고)" />
        </div>
      </PackSection>

      {/* 4 Unit Economics */}
      <PackSection id="pack-ue" no="4" title="Unit Economics 측정 설계" desc="계산 가능한 항목만 값을 표시하고, CAC · LTV · Payback 은 실증에서 채웁니다.">
        <UnitEconomicsPanel showMargin={showMargin} compact />
      </PackSection>

      {/* 5 Provenance */}
      <PackSection id="pack-provenance" no="5" title="Provenance · 데이터 출처와 계산 방식" desc="숫자가 어디서 왔고 누가 계산했는지를 밝힙니다. AI가 계산한 숫자는 없습니다.">
        <PackTable head={["항목", "내용"]} rows={[
          [<span key="a" className="font-semibold whitespace-nowrap">시드 데이터</span>, <span key="b">결정론적 PRNG(mulberry32) · 주문 {num(SEED_ORDERS.length)} · 반품 {num(RETURNS.length)} · 고객 {num(CUSTOMERS.length)} · 옵션 {num(VARIANTS.length)} · 브랜드 {BRANDS.length} — <code className="text-[0.8rem]">src/lib/demo/seed.ts</code></span>],
          [<span key="a" className="font-semibold whitespace-nowrap">세션 변경분</span>, <span key="b">브라우저 localStorage — 주문 {store.orders.length} · 반품 {store.returns.length} · 재입고 알림 {store.restockSubs.length} · 이벤트 {store.events.length} · Evidence {store.evidence.length}</span>],
          [<span key="a" className="font-semibold whitespace-nowrap">계산 엔진</span>, <span key="b">Demand & Restock (RULE+STAT · L3) · Fit (RULE · L2) · Markdown (RULE+OPT · L3) · Repeat (RULE+STAT · L2) — 전부 코드·수식. 자동발주 없음.</span>],
          [<span key="a" className="font-semibold whitespace-nowrap">LLM</span>, <span key="b" className="inline-flex items-center gap-2 flex-wrap"><Sparkles size={14} className="text-theme-primary" />{llm === null ? "확인 중…" : llm.configured ? `연결됨 · ${llm.model} — 설명 문장만 생성, 숫자 계산에는 관여하지 않음` : "미연결 (AI READY) — 규칙 기반 문장만 표시"}</span>],
          [<span key="a" className="font-semibold whitespace-nowrap">개인정보</span>, <span key="b" className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-semantic-success" />없음 — 가상 고객, 연락처 없음, 이름은 역할별 마스킹</span>],
          [<span key="a" className="font-semibold whitespace-nowrap">Evidence 출처</span>, <span key="b">DEMO {sources.DEMO} · SIMULATION {sources.SIMULATION} · LIVE {sources.LIVE} — LIVE 0건이므로 실제 성과 주장 없음</span>],
        ]} />
      </PackSection>

      {/* 6 Log */}
      <PackSection id="pack-log" no="6" title={`Evidence Log · ${num(evidence.length)}건 (시간순)`} desc="10가지 유형의 기록 전체. 인쇄 시 여러 장으로 이어집니다.">
        <PackTable head={["시각", "유형", "제목 · 내용", "담당", "출처", "연결"]} rows={evidence.map((e: EvidenceLog) => [
          <span key="t" className="tabular whitespace-nowrap text-neutral-text2">{fmtDate(e.at, "datetime")}</span>,
          <span key="ty" className="inline-flex flex-col gap-1"><EvidenceTypeBadge type={e.type} /><span className="text-[0.72rem] text-neutral-text2">{EVIDENCE_TYPE_LABEL[e.type]}</span></span>,
          <span key="ti" className="block min-w-[16rem]"><span className="font-semibold">{e.title}</span><span className="block text-neutral-text2 text-[0.82rem] leading-snug mt-0.5">{e.detail}</span>{e.kpiDelta && <span className="block text-[0.8rem] tabular mt-0.5"><Flag size={11} className="inline mr-1" />{e.kpiDelta}</span>}</span>,
          <span key="a" className="whitespace-nowrap">{e.actor}</span>,
          <span key="s" className="inline-flex flex-col gap-1"><SourceBadge source={e.source} /><Badge tone={e.status === "live" ? "live" : e.status === "pilot-ready" ? "ready" : "demo"} size="sm">{e.status}</Badge></span>,
          <span key="l" className="text-[0.8rem] text-neutral-text2 whitespace-nowrap">{[e.actionId, e.productId ? PRODUCT_BY_ID[e.productId]?.name : null, e.orderId ? `주문 ${e.orderId}` : null].filter(Boolean).join(" · ") || "—"}</span>,
        ])} />
      </PackSection>

      <div className="rounded-2xl bg-neutral-canvas p-4 text-[0.85rem] text-neutral-text2 leading-relaxed flex items-start gap-2"><Layers size={16} className="mt-0.5 shrink-0 text-theme-primary" /><span>이 문서는 DEMO 데이터로 생성된 <b>미리보기</b>입니다. Pilot 전환 시 같은 구조에 (1) 실측 Baseline, (2) 실제 Action 이력, (3) Baseline 대비 변화가 채워지며, 그 전까지 어떤 개선율도 주장하지 않습니다.</span></div>
    </div>
  );
}
