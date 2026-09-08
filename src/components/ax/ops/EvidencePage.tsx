"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FileCheck2, ListTree, GitBranch, Download, ChevronRight, Package, Zap, CheckCircle2, Circle, Clock, UserRound, Lightbulb, ThumbsUp, Play, Flag, MessageSquare, Search, Lock } from "lucide-react";
import { PageHeader } from "@/components/ax/AxShell";
import { Hydrated } from "@/components/system/Hydrated";
import { useApp, type AppState } from "@/lib/store";
import { PRODUCT_BY_ID } from "@/lib/demo/seed";
import type { AXAction, DataSource, EvidenceLog, EvidenceType } from "@/lib/types";
import { num, pct, safeDiv } from "@/lib/format";
import { fmtDate, relTime } from "@/lib/dates";
import { ICON_ACCENTS } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, Segmented, Select } from "@/components/ui/Form";
import { KpiCard } from "@/components/ui/Kpi";
import { Term } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { ActionStatusBadge } from "@/components/ax/StatusBadges";
import { EVIDENCE_TYPE_LABEL, EVIDENCE_TYPES, EvidenceTypeBadge, FilterBar, LiveFreshness, MoreButton, NoteCard, PageSkeleton, SectionBlock, SourceBadge, useMore } from "./shared";
import { cn } from "@/lib/cn";

const STATUS_LABEL: Record<EvidenceLog["status"], string> = { demo: "Demo", "pilot-ready": "Pilot 준비", live: "Live" };
const STATUS_TONE = { demo: "demo", "pilot-ready": "ready", live: "live" } as const;

const PACK_PHASES: { weeks: string; title: string; items: string[] }[] = [
  { weeks: "1~2주", title: "Baseline 측정", items: ["구매전환율·찜→구매·재입고알림→구매 측정 지점 고정", "반품률·사이즈 반품률·재고일수 현재값 기록", "MD 주간 분석시간·수기 보고서 수 측정"] },
  { weeks: "3~6주", title: "Action 운영·채택률", items: ["Demand·Fit·Markdown·Repeat Engine 추천 실제 승인 비율", "Action 발견→확인 시간 기록", "예외·보류 사유 구조화 (EXCEPTION)"] },
  { weeks: "7~10주", title: "결과 비교", items: ["재입고 Action 전후 품절 손실·알림→구매 비교", "핏 안내 변경 상품의 사이즈 반품률 전후 비교", "세그먼트 캠페인 재구매율 vs Baseline"] },
  { weeks: "11~12주", title: "리포트·확장 판단", items: ["Money KPI (Cost · Revenue · Scale) 정리", "Evidence Pack 생성 · 대표 보고", "브랜드·SKU 확장 여부와 AI API 연결 순서 결정"] },
];

export function EvidencePage() {
  return (
    <>
      <PageHeader title="AX Evidence" desc={<span><Term term="Evidence">Evidence</Term>는 추천 → 승인 → 실행 → 결과 → 고객 반영을 시간 순서로 남긴 기록입니다. 나중에 "정말 효과가 있었나"를 증명하는 재료가 됩니다 (Loop 5 · 실증).</span>}
        badge={<Badge tone="demo">DEMO</Badge>} right={<LiveFreshness />} />
      <Hydrated fallback={<PageSkeleton kpis={4} />}><EvidenceBody /></Hydrated>
    </>
  );
}

function EvidenceBody() {
  const store = useApp();
  const params = useSearchParams();
  const [view, setView] = useState<"list" | "loop">("list");
  const [period, setPeriod] = useState<"all" | "today" | "7d" | "30d">("all");
  const [types, setTypes] = useState<EvidenceType[]>([]);
  const [actor, setActor] = useState("all");
  const [productId, setProductId] = useState("all");
  const [actionId, setActionId] = useState(params.get("actionId") ?? "all");
  const [status, setStatus] = useState<"all" | EvidenceLog["status"]>("all");
  const [source, setSource] = useState<"all" | DataSource>("all");
  const [packOpen, setPackOpen] = useState(false);
  useEffect(() => { const a = params.get("actionId"); if (a) setActionId(a); }, [params]);

  const evidence = useMemo(() => [...store.evidence].sort((a, b) => b.at.localeCompare(a.at)), [store.evidence]);
  const actors = useMemo(() => Array.from(new Set(evidence.map((e) => e.actor))).sort(), [evidence]);
  const productIds = useMemo(() => Array.from(new Set(evidence.map((e) => e.productId).filter((x): x is string => !!x))), [evidence]);
  const actionIds = useMemo(() => Array.from(new Set(evidence.map((e) => e.actionId).filter((x): x is string => !!x))).sort(), [evidence]);
  const actionById = (id: string): AXAction | undefined => store.actions.find((a) => a.id === id);

  const filtered = useMemo(() => {
    const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 0;
    const since = days ? Date.now() - days * 86400000 : 0;
    return evidence.filter((e) => (!since || new Date(e.at).getTime() >= since) && (types.length === 0 || types.includes(e.type)) && (actor === "all" || e.actor === actor) && (productId === "all" || e.productId === productId) && (actionId === "all" || e.actionId === actionId) && (status === "all" || e.status === status) && (source === "all" || e.source === source));
  }, [evidence, period, types, actor, productId, actionId, status, source]);
  const { limit, hasMore, more } = useMore(filtered.length, 30);
  const active = (period !== "all" ? 1 : 0) + (types.length ? 1 : 0) + (actor !== "all" ? 1 : 0) + (productId !== "all" ? 1 : 0) + (actionId !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0) + (source !== "all" ? 1 : 0);
  const resetFilters = () => { setPeriod("all"); setTypes([]); setActor("all"); setProductId("all"); setActionId("all"); setStatus("all"); setSource("all"); };

  const week = evidence.filter((e) => Date.now() - new Date(e.at).getTime() <= 7 * 86400000).length;
  const linked = evidence.filter((e) => e.actionId).length;
  const results = evidence.filter((e) => e.type === "RESULT").length;

  // Loop candidates: act-001 always + any action with ≥2 evidence entries
  const loopActions = useMemo(() => {
    const cnt = new Map<string, number>();
    for (const e of evidence) if (e.actionId) cnt.set(e.actionId, (cnt.get(e.actionId) ?? 0) + 1);
    const ids = new Set<string>(["act-001"]);
    for (const [id, n] of cnt) if (n >= 2) ids.add(id);
    return Array.from(ids).map((id) => actionById(id)).filter((a): a is AXAction => !!a).sort((a, b) => (a.id === "act-001" ? -1 : b.id === "act-001" ? 1 : a.id.localeCompare(b.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidence, store.actions]);

  return (
    <div className="animate-fadeIn">
      <NoteCard tone="warning" icon={<Flag size={16} />}><b>BASELINE: UNKNOWN / REQUIRED</b> — 아래 모든 숫자는 DEMO 또는 SIMULATION입니다. 실제 개선율은 실증(Pilot) 단계에서 Baseline을 측정한 뒤에만 말할 수 있습니다. 이 화면은 "무엇을 어떻게 기록할지"를 보여줍니다.</NoteCard>

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Evidence 총 건수" value={num(evidence.length)} icon={<FileCheck2 size={18} />} accent={ICON_ACCENTS.evidence} sub="시드 8건 + 시연 중 생성" />
        <KpiCard label="최근 7일" value={num(week)} icon={<Clock size={18} />} accent={ICON_ACCENTS.overview} sub="고객 Event·Action 기록" />
        <KpiCard label="Action 연결 비율" value={pct(safeDiv(linked, Math.max(1, evidence.length)), 0)} icon={<Zap size={18} />} accent={ICON_ACCENTS.ai} sub={`${linked}건이 Action과 연결`} />
        <KpiCard label="RESULT 기록" value={num(results)} icon={<CheckCircle2 size={18} />} accent={ICON_ACCENTS.sales} sub="실행 결과가 남은 건수" />
      </div>

      <Card className="mt-6" pad="md">
        <p className="font-bold mb-2">Evidence 한 줄이 만들어지는 순서</p>
        <ol className="flex flex-wrap items-center gap-2 text-[0.88rem]">
          {[["CUSTOMER", "고객 Event"], ["RISK", "Insight·추천"], ["ACTION", "승인·실행"], ["RESULT", "결과"], ["CUSTOMER", "고객 반영"]].map(([t, l], i) => (
            <li key={`${t}-${i}`} className="inline-flex items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-canvas px-3 h-9 font-semibold"><span className="text-[0.72rem] text-neutral-text2">{i + 1}</span>{l}</span>{i < 4 && <ChevronRight size={14} className="text-neutral-text2" />}</li>
          ))}
        </ol>
        <p className="mt-2 text-[0.85rem] text-neutral-text2">10가지 유형: {EVIDENCE_TYPES.map((t) => `${t}(${EVIDENCE_TYPE_LABEL[t]})`).join(" · ")}</p>
      </Card>

      <SectionBlock title="기록" desc={`${num(filtered.length)}건 · 최신순`} right={<Segmented value={view} onChange={setView} options={[{ value: "list", label: <span className="inline-flex items-center gap-1.5"><ListTree size={15} />목록</span> }, { value: "loop", label: <span className="inline-flex items-center gap-1.5"><GitBranch size={15} />Loop 보기</span> }]} />}>
        <FilterBar activeCount={active} className="mb-4" right={active > 0 ? <Button variant="ghost" size="sm" onClick={resetFilters}>초기화</Button> : undefined}>
          <div><p className="text-[0.9rem] font-semibold mb-1.5">기간</p><Segmented size="sm" value={period} onChange={setPeriod} options={[{ value: "all", label: "전체" }, { value: "today", label: "오늘" }, { value: "7d", label: "7일" }, { value: "30d", label: "30일" }]} /></div>
          <div className="w-full md:w-44"><Select label="담당자" name="ev-actor" value={actor} onChange={(e) => setActor(e.target.value)}><option value="all">전체</option>{actors.map((a) => <option key={a} value={a}>{a}</option>)}</Select></div>
          <div className="w-full md:w-52"><Select label="관련 상품" name="ev-product" value={productId} onChange={(e) => setProductId(e.target.value)}><option value="all">전체</option>{productIds.map((p) => <option key={p} value={p}>{PRODUCT_BY_ID[p]?.name ?? p}</option>)}</Select></div>
          <div className="w-full md:w-44"><Select label="관련 Action" name="ev-action" value={actionId} onChange={(e) => setActionId(e.target.value)}><option value="all">전체</option>{actionIds.map((a) => <option key={a} value={a}>{a}</option>)}{actionId !== "all" && !actionIds.includes(actionId) && <option value={actionId}>{actionId} (기록 없음)</option>}</Select></div>
          <div className="w-full md:w-36"><Select label="상태" name="ev-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="all">전체</option><option value="demo">Demo</option><option value="pilot-ready">Pilot 준비</option><option value="live">Live</option></Select></div>
          <div className="w-full md:w-40"><Select label="데이터 출처" name="ev-source" value={source} onChange={(e) => setSource(e.target.value as typeof source)}><option value="all">전체</option><option value="DEMO">DEMO</option><option value="SIMULATION">SIMULATION</option><option value="LIVE">LIVE</option></Select></div>
          <div className="w-full"><p className="text-[0.9rem] font-semibold mb-1.5">유형</p><div className="flex flex-wrap gap-1.5">{EVIDENCE_TYPES.map((t) => <Chip key={t} active={types.includes(t)} onClick={() => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))} className="h-9 px-3 text-[0.82rem]">{t} · {EVIDENCE_TYPE_LABEL[t]}</Chip>)}</div></div>
        </FilterBar>

        {view === "list" ? (
          <div data-tour="evidence-list">
            {filtered.length === 0 ? (
              <EmptyState title="조건에 맞는 기록이 없습니다" desc="필터를 바꾸거나 초기화해 보세요. 고객 화면에서 찜·재입고 신청·주문을 하면 새 기록이 생깁니다." icon={<Search size={22} />} action={<Button variant="outline" onClick={resetFilters}>필터 초기화</Button>} />
            ) : (
              <ol className="relative border-l-2 border-neutral-border ml-3 md:ml-4 space-y-4">
                {filtered.slice(0, limit).map((e) => <EvidenceItem key={e.id} e={e} action={e.actionId ? actionById(e.actionId) : undefined} />)}
              </ol>
            )}
            <MoreButton hasMore={hasMore} onClick={more} remaining={filtered.length - limit} />
          </div>
        ) : (
          <div className="space-y-5" data-tour="evidence-list">
            <NoteCard icon={<GitBranch size={16} />}><b>Closed Loop Timeline</b> — Action 하나를 기준으로 고객 Event → Insight → 승인 → 실행 → 결과 → 고객 반영을 세로로 보여줍니다. 비어 있는 단계는 아직 일어나지 않은 단계입니다 (Demo에서 직접 진행해 보세요).</NoteCard>
            {loopActions.map((a) => <LoopTimeline key={a.id} action={a} evidence={evidence.filter((e) => e.actionId === a.id || (e.type === "CUSTOMER" && !!a.productId && e.productId === a.productId && !e.actionId))} store={store} />)}
          </div>
        )}
      </SectionBlock>

      {/* Evidence Pack */}
      <SectionBlock title="Evidence Pack · 12주 실증 준비" desc="MORFIT §33 실증 계획을 4단계 체크리스트로 정리했습니다. Demo에서는 준비 상태만 표시합니다."
        right={<><Badge tone="ready">READY · Pilot 전환 후</Badge><Button variant="outline" onClick={() => setPackOpen(true)} icon={<Download size={16} />} className="border-dashed text-neutral-text2" aria-describedby="pack-note">Evidence Pack 내보내기</Button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PACK_PHASES.map((p, i) => (
            <Card key={p.weeks} pad="md" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2"><span className="text-[0.78rem] font-bold tracking-wide text-theme-primary">{p.weeks}</span><Badge tone="ready" size="sm">실증 준비</Badge></div>
              <p className="font-bold text-[1.02rem]">{i + 1}. {p.title}</p>
              <ul className="space-y-1.5 text-[0.88rem] text-neutral-text2 break-words">{p.items.map((it) => <li key={it} className="flex gap-2"><Circle size={14} className="mt-1 shrink-0" />{it}</li>)}</ul>
            </Card>
          ))}
        </div>
        <NoteCard className="mt-4" icon={<Lock size={16} />}><span id="pack-note">실제 Pilot 전환 전에는 Evidence Pack을 내보낼 수 없습니다 — Baseline 없이 나가는 리포트는 개선율을 지어내게 되기 때문입니다. 버튼을 누르면 Pack에 무엇이 들어가는지 볼 수 있습니다.</span></NoteCard>
      </SectionBlock>

      <Modal open={packOpen} onClose={() => setPackOpen(false)} title="Evidence Pack에 들어갈 내용" size="md" footer={<div className="flex justify-end gap-2"><Button variant="outline" href="/ax/why" size="sm">Why AX 보기</Button><Button size="sm" onClick={() => setPackOpen(false)}>확인</Button></div>}>
        <div className="space-y-4 text-[0.92rem] leading-relaxed">
          <div className="flex items-center gap-2 flex-wrap"><Badge tone="ready">READY</Badge><span className="font-bold">Pilot 전환 후 CSV·PDF로 내보내기</span></div>
          <p className="text-neutral-text2">지금은 DEMO 데이터라 내보내기가 잠겨 있습니다. Baseline이 측정된 뒤 아래 항목이 한 묶음으로 생성됩니다.</p>
          <ol className="space-y-2">
            {[["Baseline 표", "구매전환율·찜→구매·재입고알림→구매·반품률·재고일수·MD 분석시간의 측정 시점과 값"], ["Action 로그", "추천 → 확인 → 실행 → 완료/보류/무시 이력과 담당자·사유 (ACTION·EXCEPTION)"], ["결과 비교", "Action 전후 KPI 변화 (RESULT·REVENUE·EFFICIENCY) — Baseline 대비로만 표기"], ["고객 반영", "알림·추천·상태 변경이 고객 화면에 도달한 기록과 반응 (CUSTOMER)"], ["채택·확장 지표", "Action 채택률, MD 1인당 활성 SKU, 관리 브랜드 수 (ADOPTION·SCALE)"], ["위험·예외", "Fit Risk 상승, 추천 오류, 보류 사유 (RISK·EXCEPTION)"]].map(([t, d], i) => (
              <li key={t} className="flex gap-3 rounded-xl bg-neutral-canvas px-4 py-3"><span className="h-6 w-6 shrink-0 rounded-full bg-white border border-neutral-border text-[0.78rem] font-bold inline-flex items-center justify-center">{i + 1}</span><span><span className="font-semibold">{t}</span><span className="block text-[0.85rem] text-neutral-text2">{d}</span></span></li>
            ))}
          </ol>
          <p className="text-[0.85rem] text-neutral-text2">현재 기록 {num(evidence.length)}건은 모두 DEMO/SIMULATION 출처이며 Pack에는 참고용으로만 포함됩니다.</p>
        </div>
      </Modal>
    </div>
  );
}

function EvidenceItem({ e, action }: { e: EvidenceLog; action?: AXAction }) {
  return (
    <li className="pl-5 md:pl-6 relative">
      <span className={cn("absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-white", e.type === "RESULT" || e.type === "REVENUE" ? "bg-semantic-success" : e.type === "RISK" ? "bg-semantic-error" : e.type === "CUSTOMER" ? "bg-theme-primary" : "bg-neutral-text2")} />
      <div className="rounded-cardlg border border-neutral-border bg-white p-4 hover:border-neutral-text2/40 transition-colors">
        <div className="flex items-center gap-2 flex-wrap"><EvidenceTypeBadge type={e.type} /><SourceBadge source={e.source} /><Badge tone={STATUS_TONE[e.status]} size="sm">{STATUS_LABEL[e.status]}</Badge><span className="text-[0.8rem] text-neutral-text2 tabular ml-auto" title={fmtDate(e.at, "datetime")}>{relTime(e.at)}</span></div>
        <p className="mt-2 font-bold text-[1rem] leading-snug">{e.title}</p>
        <p className="mt-1 text-[0.9rem] text-neutral-text2 leading-relaxed">{e.detail}</p>
        {e.kpiDelta && <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-neutral-canvas px-2.5 py-1 text-[0.82rem] font-semibold tabular"><Flag size={12} />{e.kpiDelta}</span>}
        <div className="mt-2.5 flex items-center gap-x-3 gap-y-1.5 flex-wrap text-[0.82rem]">
          <span className="inline-flex items-center gap-1 text-neutral-text2"><UserRound size={13} />{e.actor}</span>
          {e.actionId && <Link href={`/ax/actions?open=${e.actionId}`} className="inline-flex items-center gap-1 font-semibold text-theme-primary hover:underline"><Zap size={13} />{e.actionId}{action && <ActionStatusBadge status={action.status} />}</Link>}
          {e.productId && PRODUCT_BY_ID[e.productId] && <Link href={`/ax/products/${e.productId}`} className="inline-flex items-center gap-1 font-semibold hover:text-theme-primary hover:underline"><Package size={13} />{PRODUCT_BY_ID[e.productId].name}</Link>}
          {e.orderId && <Link href={`/ax/orders?q=${e.orderId}`} className="inline-flex items-center gap-1 font-semibold hover:text-theme-primary hover:underline"><ChevronRight size={13} />주문 {e.orderId}</Link>}
        </div>
      </div>
    </li>
  );
}

interface Stage { key: string; label: string; icon: React.ReactNode; at?: string; title?: string; detail?: string; actor?: string; done: boolean; href?: string }

function LoopTimeline({ action, evidence, store }: { action: AXAction; evidence: EvidenceLog[]; store: AppState }) {
  const sorted = [...evidence].sort((a, b) => a.at.localeCompare(b.at));
  const hist = (s: AXAction["status"]) => action.statusHistory.find((h) => h.status === s);
  const customerEvent = sorted.find((e) => e.type === "CUSTOMER" && (!e.actionId || e.actionId === action.id) && e.at <= (hist("done")?.at ?? "9"));
  const resultEv = sorted.find((e) => e.type === "RESULT" && e.actionId === action.id);
  const feedbackEv = sorted.filter((e) => e.type === "CUSTOMER" && e.actionId === action.id && (!resultEv || e.at >= resultEv.at))[0];
  const done = hist("done"); const inProg = hist("in-progress"); const conf = hist("confirmed");
  const notified = action.variantId ? store.restockSubs.filter((r) => r.variantId === action.variantId && r.status === "notified").length : 0;
  const stages: Stage[] = [
    { key: "customer", label: "Customer Event", icon: <UserRound size={16} />, done: !!customerEvent, at: customerEvent?.at, title: customerEvent?.title ?? "고객 조회·찜·재입고 신청·반품 등", detail: customerEvent?.detail ?? (action.productId ? `고객 화면에서 '${PRODUCT_BY_ID[action.productId]?.name}'을 찜하거나 재입고 알림을 신청하면 여기에 기록됩니다.` : "고객 Event 대기"), actor: customerEvent?.actor, href: action.productId ? `/products/${action.productId}` : undefined },
    { key: "insight", label: "Insight · 추천", icon: <Lightbulb size={16} />, done: true, at: action.recommendedAt, title: action.title, detail: `트리거: ${action.trigger} · 근거 ${action.reasons.length}개 · ${action.engine} engine (${action.automation})`, actor: action.statusHistory[0]?.actor, href: `/ax/actions?open=${action.id}` },
    { key: "approval", label: "Approval · 승인", icon: <ThumbsUp size={16} />, done: !!(conf || inProg || done), at: (conf ?? inProg ?? done)?.at, title: conf ? "담당자 확인" : inProg || done ? "확인 단계 생략 후 실행" : "승인 대기", detail: conf?.note ?? (conf ? `${conf.actor}이(가) 근거를 확인했습니다.` : "Action Center에서 '확인'을 누르면 기록됩니다."), actor: conf?.actor },
    { key: "action", label: "Action · 실행", icon: <Play size={16} />, done: !!(inProg || done), at: (inProg ?? done)?.at, title: inProg ? "실행중" : done ? "실행 완료" : "실행 대기", detail: inProg?.note ?? (inProg ? `${inProg.actor}이(가) 실행을 시작했습니다.` : done ? "실행 후 바로 완료 처리되었습니다." : "'실행중'으로 바꾸면 기록됩니다."), actor: inProg?.actor ?? done?.actor },
    { key: "result", label: "Result · 결과", icon: <Flag size={16} />, done: !!(done || resultEv), at: resultEv?.at ?? done?.at, title: resultEv?.title ?? (done ? action.resultNote ?? "완료" : "결과 대기"), detail: resultEv?.detail ?? (done ? "완료 기록" : "완료되면 재고·가격·핏 안내 등 실제 변화가 기록됩니다."), actor: resultEv?.actor ?? done?.actor },
    { key: "feedback", label: "Customer Feedback · 고객 반영", icon: <MessageSquare size={16} />, done: !!feedbackEv || notified > 0 || (!!done && (action.type === "segment-campaign" || action.type === "cart-reminder")), at: feedbackEv?.at ?? (notified > 0 ? done?.at : undefined), title: feedbackEv?.title ?? (notified > 0 ? `재입고 알림 ${notified}명 발송 · 옵션 상태 '입고 완료'` : done && (action.type === "segment-campaign" || action.type === "cart-reminder") ? "고객 알림·추천 발송" : "고객 반응 대기"), detail: feedbackEv?.detail ?? (notified > 0 ? "고객 화면 알림과 My Page 재입고 알림 상태가 바뀌었습니다. 이후 구매 여부는 실증에서 측정합니다." : "결과가 고객 화면(알림·상태·가격·핏 안내)에 도달하면 기록됩니다. 구매 반응은 Baseline과 비교합니다."), actor: feedbackEv?.actor },
  ];
  const doneCount = stages.filter((s) => s.done).length;
  return (
    <Card pad="md">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><Badge tone="accent">{action.id}</Badge><ActionStatusBadge status={action.status} /><span className="text-[0.8rem] text-neutral-text2">{doneCount} / 6 단계 기록됨</span></div><p className="mt-1 font-bold text-[1.02rem]">{action.title}</p></div>
        <Button size="sm" variant="outline" href={`/ax/actions?open=${action.id}`} icon={<ChevronRight size={14} />}>Action 열기</Button>
      </div>
      <ol className="relative border-l-2 border-neutral-border ml-4 space-y-4">
        {stages.map((s) => (
          <li key={s.key} className="pl-6 relative">
            <span className={cn("absolute -left-[13px] top-0 h-6 w-6 rounded-full border-2 border-white inline-flex items-center justify-center", s.done ? "bg-theme-primary text-white" : "bg-neutral-canvas text-neutral-text2")}>{s.icon}</span>
            <div className={cn("rounded-xl border p-3", s.done ? "border-neutral-border bg-white" : "border-dashed border-neutral-border bg-neutral-canvas/60")}>
              <div className="flex items-center gap-2 flex-wrap"><span className={cn("text-[0.78rem] font-bold tracking-wide", s.done ? "text-theme-primary" : "text-neutral-text2")}>{s.label}</span>{s.done ? <Badge tone="success" size="sm"><CheckCircle2 size={11} />기록됨</Badge> : <Badge tone="neutral" size="sm">대기 중</Badge>}{s.at && <span className="text-[0.78rem] text-neutral-text2 tabular ml-auto">{fmtDate(s.at, "datetime")}</span>}</div>
              <p className="mt-1 font-semibold text-[0.95rem] leading-snug">{s.title}</p>
              <p className="mt-0.5 text-[0.85rem] text-neutral-text2 leading-relaxed">{s.detail}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[0.8rem]">{s.actor && <span className="inline-flex items-center gap-1 text-neutral-text2"><UserRound size={12} />{s.actor}</span>}{s.href && <Link href={s.href} className="font-semibold text-theme-primary hover:underline">{s.href.startsWith("/products") ? "고객 화면에서 해보기" : "열기"}</Link>}</div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
