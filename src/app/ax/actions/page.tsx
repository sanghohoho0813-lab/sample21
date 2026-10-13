"use client";
/* 02 Growth & Action Center — 핵심 화면. 추천됨 → 확인 → 실행중 → 완료 / 보류·무시 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Filter, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { PRODUCT_BY_ID } from "@/lib/demo/seed";
import { actionKpi } from "@/lib/kpi";
import { num, pct } from "@/lib/format";
import type { ActionStatus, ActionType, AXAction, Role, Urgency } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { PageHeader } from "@/components/ax/AxShell";
import { ACTION_STATUS_LABEL, URGENCY_LABEL } from "@/components/ax/StatusBadges";
import { ActionCard } from "@/components/ax/core/ActionCard";
import {
  ACTION_TYPES,
  ACTION_TYPE_LABEL,
  ENGINE_SHORT,
  PageSkeleton,
  RoleNote,
  URGENCY_ORDER,
  sortByUrgency,
  visibleActions,
} from "@/components/ax/core/shared";
import { KpiTile } from "@/components/ui/Kpi";
import { Chip, Segmented, Select } from "@/components/ui/Form";
import { Freshness, Term } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CandidateQueue } from "@/components/ax/intel/CandidateQueue";
import { useReadings } from "@/components/ax/intel/useIntel";
import { dueInDays, needsApproval, priorityOf } from "@/lib/intel/policy";

type StatusFilter = "all" | ActionStatus;
const STATUS_TABS: StatusFilter[] = ["all", "recommended", "confirmed", "in-progress", "done", "hold", "dismissed"];
const ENGINES: AXAction["engine"][] = ["demand", "fit", "markdown", "repeat"];
const STATUS_ORDER: Record<ActionStatus, number> = {
  recommended: 0,
  confirmed: 1,
  "in-progress": 2,
  hold: 3,
  done: 4,
  dismissed: 5,
};
const isType = (v: string | null): v is ActionType => !!v && (ACTION_TYPES as string[]).includes(v);

export default function ActionsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={2} />}>
      <Hydrated fallback={<PageSkeleton rows={2} />}>
        <ActionsInner />
      </Hydrated>
    </Suspense>
  );
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
  useEffect(() => {
    if (isType(typeParam)) setTypes([typeParam]);
  }, [typeParam]);
  useEffect(() => {
    if (!openId) return;
    setExpanded((s) => new Set(s).add(openId));
    setStatus("all");
    const t = setTimeout(
      () => document.getElementById(`action-${openId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      250,
    );
    return () => clearTimeout(t);
  }, [openId]);

  const visible = useMemo(() => visibleActions(role, app.actions), [app.actions, role]);
  const byProduct = useMemo(
    () => (productParam ? visible.filter((a) => a.productId === productParam) : visible),
    [visible, productParam],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        STATUS_TABS.map((s) => [s, s === "all" ? byProduct.length : byProduct.filter((a) => a.status === s).length]),
      ) as Record<StatusFilter, number>,
    [byProduct],
  );
  const kpi = useMemo(() => actionKpi(visible), [visible]);
  const readings = useReadings();
  const priority = useMemo(
    () => new Map(visible.map((a) => [a.id, priorityOf(a, readings).score])),
    [visible, readings],
  );
  const openActions = visible.filter(
    (a) => a.status === "recommended" || a.status === "confirmed" || a.status === "in-progress",
  );
  const waitingApproval = openActions.filter(needsApproval).length;
  const overdue = openActions.filter((a) => (dueInDays(a) ?? 0) < 0).length;
  const measured = visible.filter((a) => a.status === "done" && a.result).length;
  const evidenceCount = app.evidence.filter((e) => e.actionId && visible.some((a) => a.id === e.actionId)).length;

  const pass = (a: AXAction) =>
    (status === "all" || a.status === status) &&
    (types.length === 0 || types.includes(a.type)) &&
    (urgency === "all" || a.urgency === urgency) &&
    (engine === "all" || a.engine === engine);
  // 정렬 순서는 '필터를 바꿀 때'만 다시 정한다 — 확인·실행·완료를 누를 때마다 카드가 다른 자리로 튀지 않게
  const idsKey = byProduct.map((a) => a.id).join(",");
  const order = useMemo(() => {
    const f = byProduct.filter(pass);
    return (
      status === "all"
        ? [...f].sort(
            (a, b) =>
              STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
              (priority.get(b.id) ?? 0) - (priority.get(a.id) ?? 0) ||
              URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
              (a.recommendedAt < b.recommendedAt ? 1 : -1),
          )
        : [...sortByUrgency(f)].sort((a, b) => (priority.get(b.id) ?? 0) - (priority.get(a.id) ?? 0))
    ).map((a) => a.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 과제 상태가 바뀌어도 순서는 유지(위 주석)
  }, [idsKey, status, types, urgency, engine]);
  const list = useMemo(() => {
    const byId = new Map(byProduct.map((a) => [a.id, a]));
    const kept = order.map((id) => byId.get(id)).filter((a): a is AXAction => !!a && pass(a));
    return [...kept, ...byProduct.filter((a) => pass(a) && !order.includes(a.id))];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pass는 같은 필터 값으로 만들어진다
  }, [order, byProduct, status, types, urgency, engine]);

  // URL로 연 과제가 없으면 첫 카드를 펼친다 — 목록 길이가 바뀔 때만(사용자가 접은 상태를 덮어쓰지 않음)
  useEffect(() => {
    if (!openId && list.length && expanded.size === 0) setExpanded(new Set([list[0].id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 위 주석: 길이 변화에만 반응
  }, [list.length]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const clearFilters = () => {
    setStatus("all");
    setTypes([]);
    setUrgency("all");
    setEngine("all");
    if (productParam || typeParam) router.replace("/ax/actions");
  };
  const hasFilter = status !== "all" || types.length > 0 || urgency !== "all" || engine !== "all" || !!productParam;
  const product = productParam ? PRODUCT_BY_ID[productParam] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="MD 실행 센터"
        desc="고객 행동 신호에서 나온 과제를 우선순위대로 검토 → 승인 → 실행 → 결과 측정 → 증빙까지 추적합니다."
        right={<Freshness source="DEMO" />}
      />

      {/* 요약 — 상태 탭에도 숫자가 있으므로 작은 칸으로만 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          label="미처리"
          value={`${num(kpi.open)}건`}
          sub={`긴급 ${num(kpi.high)}건 포함`}
          tone={kpi.high > 0 ? "error" : undefined}
        />
        <KpiTile
          label="승인 대기"
          value={`${num(waitingApproval)}건`}
          sub="대량 발주·큰 할인은 대표 승인"
          tone={waitingApproval > 0 ? "warning" : undefined}
        />
        <KpiTile
          label="기한 지남"
          value={`${num(overdue)}건`}
          sub="긴급 1일 · 보통 3일 · 낮음 7일"
          tone={overdue > 0 ? "error" : undefined}
        />
        <KpiTile
          label="완료율"
          value={pct(kpi.executionRate, 0)}
          sub={`완료 ${num(kpi.done)} / 생성 ${num(kpi.created)}`}
        />
      </div>

      {/* Loop 단계 — 추천에서 증빙까지 지금 몇 건이 어디에 있는가 */}
      <ol
        className="grid grid-cols-3 overflow-hidden rounded-xl border border-neutral-border bg-white text-center md:grid-cols-6"
        aria-label="과제 처리 단계"
        data-tour="action-loop"
      >
        {[
          { label: "추천", n: counts.recommended, sub: "엔진·시나리오" },
          { label: "검토", n: counts.confirmed, sub: "기준값 기록" },
          { label: "승인 대기", n: waitingApproval, sub: "정책 기준", warn: waitingApproval > 0 },
          { label: "실행", n: counts["in-progress"], sub: "고객 화면 반영" },
          { label: "결과 측정", n: measured, sub: "전/후 비교" },
          { label: "증빙", n: evidenceCount, sub: "과제 연결 기록" },
        ].map((st, i) => (
          <li
            key={st.label}
            className={cn(
              "relative border-neutral-border px-2 py-2.5",
              i % 3 !== 0 && "border-l",
              i >= 3 && "border-t md:border-t-0",
              i === 3 && "md:border-l",
            )}
          >
            <p className="text-[0.75rem] font-semibold text-neutral-text2">
              {i + 1}. {st.label}
            </p>
            <p className={cn("tabular text-[1.15rem] font-bold", st.warn && "text-[#b45309]")}>{num(st.n)}</p>
            <p className="text-[0.7rem] text-neutral-text2">{st.sub}</p>
          </li>
        ))}
      </ol>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.82rem] text-neutral-text2">
        시스템은 후보와 근거만 만들고, 등록·승인·실행은 사람이 합니다 (<Term term="L3">L3</Term> · 자동발주 없음)
        <ArrowRight size={12} aria-hidden />
        정책: 발주 300만 원 이상·할인 20% 이상·캠페인 100명 이상은 대표 승인
      </p>

      {role !== "ops" && !productParam && (
        <CandidateQueue
          onCreated={(id) => {
            setStatus("all");
            setExpanded((s) => new Set(s).add(id));
            setTimeout(
              () => document.getElementById(`action-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
              250,
            );
          }}
        />
      )}

      {role === "ops" && <RoleNote>운영직원 화면 — 운영팀 담당 과제와 재입고 과제만 표시됩니다.</RoleNote>}
      {product && (
        <div className="flex flex-wrap items-center gap-2 text-[0.9rem]">
          <Badge tone="accent">상품 필터</Badge>
          <span className="font-semibold">{product.name}</span>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-[0.85rem] text-neutral-text2 hover:text-neutral-text"
          >
            <X size={14} />
            해제
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <Segmented
          value={status}
          onChange={setStatus}
          options={STATUS_TABS.map((s) => ({
            value: s,
            label: (
              <span className="inline-flex items-center gap-1.5">
                {s === "all" ? "전체" : ACTION_STATUS_LABEL[s]}
                <span
                  className={cn(
                    "tabular min-w-[20px] rounded-full px-1.5 text-center text-[0.78rem]",
                    status === s ? "bg-theme-soft text-theme-primary" : "bg-neutral-border/60 text-neutral-text2",
                  )}
                >
                  {counts[s]}
                </span>
              </span>
            ),
          }))}
          className="max-w-full"
        />
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {ACTION_TYPES.map((t) => (
              <Chip
                key={t}
                active={types.includes(t)}
                onClick={() => setTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}
                className="shrink-0"
              >
                {ACTION_TYPE_LABEL[t]}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            <Select
              aria-label="긴급도"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as "all" | Urgency)}
              className="h-10 w-auto min-w-[112px] text-[0.9rem]"
            >
              <option value="all">긴급도 전체</option>
              {(["high", "mid", "low"] as Urgency[]).map((u) => (
                <option key={u} value={u}>
                  {URGENCY_LABEL[u]}
                </option>
              ))}
            </Select>
            <Select
              aria-label="엔진"
              value={engine}
              onChange={(e) => setEngine(e.target.value as "all" | AXAction["engine"])}
              className="h-10 w-auto min-w-[112px] text-[0.9rem]"
            >
              <option value="all">엔진 전체</option>
              {ENGINES.map((en) => (
                <option key={en} value={en}>
                  {ENGINE_SHORT[en]} 엔진
                </option>
              ))}
            </Select>
            {hasFilter && (
              <Button size="sm" variant="ghost" onClick={clearFilters} icon={<Filter size={14} />}>
                초기화
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4" data-tour="action-list">
        <h2 className="tabular text-[0.85rem] font-normal text-neutral-text2">
          {num(list.length)}건 · 우선순위순 (긴급도 + 대상 SKU 신호 강도 + 기한 경과)
        </h2>
        {list.length === 0 ? (
          <EmptyState
            title={
              status === "all" ? "표시할 과제가 없습니다" : `'${ACTION_STATUS_LABEL[status]}' 상태의 과제가 없습니다`
            }
            desc={hasFilter ? "필터를 바꾸거나 초기화해보세요." : "새 추천이 생성되면 여기에 나타납니다."}
            action={
              hasFilter ? (
                <Button variant="outline" onClick={clearFilters}>
                  필터 초기화
                </Button>
              ) : undefined
            }
          />
        ) : (
          list.map((a, i) => (
            <ActionCard
              key={a.id}
              action={a}
              expanded={expanded.has(a.id)}
              onToggle={() => toggle(a.id)}
              tour={i === 0 ? "action-first" : undefined}
              highlight={a.id === openId}
            />
          ))
        )}
      </div>
    </div>
  );
}
