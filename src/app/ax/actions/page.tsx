"use client";
/* 02 Growth & Action Center — 핵심 화면. 추천됨 → 확인 → 실행중 → 완료 / 보류·무시 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, FileCheck2, Filter, PauseCircle, Play, Sparkles, X, XCircle, Zap } from "lucide-react";
import { useApp } from "@/lib/store";
import { PRODUCT_BY_ID } from "@/lib/demo/seed";
import { actionKpi } from "@/lib/kpi";
import { num, pct } from "@/lib/format";
import { ICON_ACCENTS } from "@/lib/theme";
import type { ActionStatus, ActionType, AXAction, Role, Urgency } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { PageHeader } from "@/components/ax/AxShell";
import { ACTION_STATUS_LABEL, URGENCY_LABEL } from "@/components/ax/StatusBadges";
import { ActionCard } from "@/components/ax/core/ActionCard";
import { ACTION_TYPES, ACTION_TYPE_LABEL, ENGINE_SHORT, InfoNote, PageSkeleton, RoleNote, URGENCY_ORDER, sortByUrgency, visibleActions } from "@/components/ax/core/shared";
import { KpiCard } from "@/components/ui/Kpi";
import { Chip, Segmented, Select } from "@/components/ui/Form";
import { Freshness, Term } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type StatusFilter = "all" | ActionStatus;
const STATUS_TABS: StatusFilter[] = ["all", "recommended", "confirmed", "in-progress", "done", "hold", "dismissed"];
const ENGINES: AXAction["engine"][] = ["demand", "fit", "markdown", "repeat"];
const STATUS_ORDER: Record<ActionStatus, number> = { recommended: 0, confirmed: 1, "in-progress": 2, hold: 3, done: 4, dismissed: 5 };
const isType = (v: string | null): v is ActionType => !!v && (ACTION_TYPES as string[]).includes(v);

export default function ActionsPage() {
  return <Suspense fallback={<PageSkeleton rows={2} />}><Hydrated fallback={<PageSkeleton rows={2} />}><ActionsInner /></Hydrated></Suspense>;
}

function ActionsInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const app = useApp();
  const role: Role = app.role === "customer" ? "owner" : app.role;
  const openId = sp.get("open");
  const productParam = sp.get("product");
  const typeParam = sp.get("type");

  const [status, setStatus] = useState<StatusFilter>("all");
  const [types, setTypes] = useState<ActionType[]>(isType(typeParam) ? [typeParam] : []);
  const [urgency, setUrgency] = useState<"all" | Urgency>("all");
  const [engine, setEngine] = useState<"all" | AXAction["engine"]>("all");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(openId ? [openId] : []));

  // ?type= / ?open= from other pages
  useEffect(() => { if (isType(typeParam)) setTypes([typeParam]); }, [typeParam]);
  useEffect(() => {
    if (!openId) return;
    setExpanded((s) => new Set(s).add(openId));
    setStatus("all");
    const t = setTimeout(() => document.getElementById(`action-${openId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    return () => clearTimeout(t);
  }, [openId]);

  const visible = useMemo(() => visibleActions(role, app.actions), [app.actions, role]);
  const byProduct = useMemo(() => (productParam ? visible.filter((a) => a.productId === productParam) : visible), [visible, productParam]);
  const counts = useMemo(() => Object.fromEntries(STATUS_TABS.map((s) => [s, s === "all" ? byProduct.length : byProduct.filter((a) => a.status === s).length])) as Record<StatusFilter, number>, [byProduct]);
  const kpi = useMemo(() => actionKpi(visible), [visible]);

  const list = useMemo(() => {
    const f = byProduct.filter((a) => (status === "all" || a.status === status) && (types.length === 0 || types.includes(a.type)) && (urgency === "all" || a.urgency === urgency) && (engine === "all" || a.engine === engine));
    return status === "all"
      ? [...f].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || (a.recommendedAt < b.recommendedAt ? 1 : -1))
      : sortByUrgency(f);
  }, [byProduct, status, types, urgency, engine]);

  // first card expanded by default when nothing is opened via URL
  useEffect(() => { if (!openId && list.length && expanded.size === 0) setExpanded(new Set([list[0].id])); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [list.length]);

  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clearFilters = () => { setStatus("all"); setTypes([]); setUrgency("all"); setEngine("all"); if (productParam || typeParam) router.replace("/ax/actions"); };
  const hasFilter = status !== "all" || types.length > 0 || urgency !== "all" || engine !== "all" || !!productParam;
  const product = productParam ? PRODUCT_BY_ID[productParam] : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Growth & Action Center" desc="고객 행동·재고·반품 데이터에서 만들어진 추천을 담당자가 확인·승인·실행합니다. 완료되면 고객 화면에도 반영됩니다."
        badge={<Badge tone="demo" size="sm">DEMO</Badge>} right={<Freshness source="DEMO" />} />

      {/* Header stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="생성된 Action" value={num(kpi.created)} sub="엔진 4개가 규칙으로 생성" icon={<Sparkles size={18} />} accent={ICON_ACCENTS.ai} />
        <KpiCard label="미처리" value={num(kpi.open)} sub="추천됨 · 확인 · 실행중" icon={<Zap size={18} />} accent={ICON_ACCENTS.sales} />
        <KpiCard label="긴급" value={num(kpi.high)} sub="완료·무시 제외 긴급도 높음" icon={<Play size={18} />} accent={ICON_ACCENTS.risk} />
        <KpiCard label="완료율" value={pct(kpi.executionRate, 0)} sub={`완료 ${num(kpi.done)} / 생성 ${num(kpi.created)} · SIMULATION`} icon={<CheckCircle2 size={18} />} accent={ICON_ACCENTS.evidence} />
      </div>

      {/* Lifecycle explainer */}
      <InfoNote className="bg-white border border-neutral-border">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
          <p className="font-bold text-neutral-text shrink-0">Action Lifecycle</p>
          <ol className="flex flex-wrap items-center gap-1.5 text-[0.85rem] font-semibold">
            {([["recommended", <Sparkles key="i1" size={14} />], ["confirmed", <CheckCircle2 key="i2" size={14} />], ["in-progress", <Play key="i3" size={14} />], ["done", <FileCheck2 key="i4" size={14} />]] as [ActionStatus, React.ReactNode][]).map(([s, icon], i) => (
              <li key={s} className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-canvas border border-neutral-border px-2.5 h-8">{icon}{ACTION_STATUS_LABEL[s]}</span>
                {i < 3 && <ArrowRight size={14} className="text-neutral-text2" />}
              </li>
            ))}
            <li className="inline-flex items-center gap-1.5 ml-1 text-neutral-text2"><span className="text-neutral-border">|</span><PauseCircle size={14} />보류 · <XCircle size={14} />무시</li>
          </ol>
          <p className="text-[0.82rem] text-neutral-text2 md:ml-auto">시스템은 추천·준비만 합니다 (<Term term="L3">L3</Term>). 실행은 항상 사람이 승인합니다 · 자동발주 없음</p>
        </div>
      </InfoNote>

      {role === "ops" && <RoleNote>운영직원 화면 — 운영팀 담당 Action과 재입고 Action만 표시됩니다.</RoleNote>}
      {product && (
        <div className="flex items-center gap-2 flex-wrap text-[0.9rem]"><Badge tone="accent">상품 필터</Badge><span className="font-semibold">{product.name}</span><button onClick={clearFilters} className="inline-flex items-center gap-1 text-neutral-text2 hover:text-neutral-text text-[0.85rem]"><X size={14} />해제</button></div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <Segmented value={status} onChange={setStatus} options={STATUS_TABS.map((s) => ({ value: s, label: <span className="inline-flex items-center gap-1.5">{s === "all" ? "전체" : ACTION_STATUS_LABEL[s]}<span className={cn("tabular rounded-full px-1.5 min-w-[20px] text-center text-[0.72rem]", status === s ? "bg-theme-soft text-theme-primary" : "bg-neutral-border/60 text-neutral-text2")}>{counts[s]}</span></span> }))} className="max-w-full" />
        <div className="flex flex-wrap items-center gap-2">
          {ACTION_TYPES.map((t) => <Chip key={t} active={types.includes(t)} onClick={() => setTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}>{ACTION_TYPE_LABEL[t]}</Chip>)}
          <div className="flex items-center gap-2 md:ml-auto">
            <Select aria-label="긴급도" value={urgency} onChange={(e) => setUrgency(e.target.value as "all" | Urgency)} className="h-10 text-[0.9rem] w-auto min-w-[112px]">
              <option value="all">긴급도 전체</option>{(["high", "mid", "low"] as Urgency[]).map((u) => <option key={u} value={u}>{URGENCY_LABEL[u]}</option>)}
            </Select>
            <Select aria-label="엔진" value={engine} onChange={(e) => setEngine(e.target.value as "all" | AXAction["engine"])} className="h-10 text-[0.9rem] w-auto min-w-[112px]">
              <option value="all">엔진 전체</option>{ENGINES.map((en) => <option key={en} value={en}>{ENGINE_SHORT[en]} Engine</option>)}
            </Select>
            {hasFilter && <Button size="sm" variant="ghost" onClick={clearFilters} icon={<Filter size={14} />}>초기화</Button>}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4" data-tour="action-list">
        <p className="text-[0.85rem] text-neutral-text2 tabular">{num(list.length)}건 표시 · 긴급도 → 추천일 순</p>
        {list.length === 0 ? (
          <EmptyState title={status === "all" ? "표시할 Action이 없습니다" : `'${ACTION_STATUS_LABEL[status]}' 상태의 Action이 없습니다`} desc={hasFilter ? "필터를 바꾸거나 초기화해보세요." : "새 추천이 생성되면 여기에 나타납니다."} action={hasFilter ? <Button variant="outline" onClick={clearFilters}>필터 초기화</Button> : undefined} />
        ) : list.map((a, i) => (
          <ActionCard key={a.id} action={a} expanded={expanded.has(a.id)} onToggle={() => toggle(a.id)} tour={i === 0 ? "action-first" : undefined} highlight={a.id === openId} />
        ))}
      </div>
    </div>
  );
}
