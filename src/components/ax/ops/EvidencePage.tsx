"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ListTree,
  GitBranch,
  Download,
  ChevronRight,
  Package,
  Zap,
  CheckCircle2,
  Circle,
  UserRound,
  Lightbulb,
  ThumbsUp,
  Play,
  Flag,
  MessageSquare,
  Search,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/ax/AxShell";
import { Hydrated } from "@/components/system/Hydrated";
import { useApp, type AppState } from "@/lib/store";
import { PRODUCT_BY_ID } from "@/lib/demo/seed";
import type { AXAction, DataSource, EvidenceLog, EvidenceType } from "@/lib/types";
import { num, pct, safeDiv } from "@/lib/format";
import { fmtDate, relTime } from "@/lib/dates";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, Segmented, Select } from "@/components/ui/Form";
import { KpiTile } from "@/components/ui/Kpi";
import { Term } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { ActionStatusBadge } from "@/components/ax/StatusBadges";
import {
  EVIDENCE_TYPE_LABEL,
  EVIDENCE_TYPES,
  EvidenceTypeBadge,
  FilterBar,
  LiveFreshness,
  MoreButton,
  NoteCard,
  PageSkeleton,
  SectionBlock,
  SOURCE_LABEL,
  useMore,
} from "./shared";
import { cn } from "@/lib/cn";

const STATUS_LABEL: Record<EvidenceLog["status"], string> = {
  demo: "데모",
  "pilot-ready": "실증 준비",
  live: "실제 데이터",
};

const PACK_PHASES: { weeks: string; title: string; items: string[] }[] = [
  {
    weeks: "1~2주",
    title: "기준값 측정",
    items: [
      "구매전환율·찜→구매·재입고알림→구매 측정 지점 고정",
      "반품률·사이즈 반품률·재고일수 현재값 기록",
      "MD 주간 분석시간·수기 보고서 수 측정",
    ],
  },
  {
    weeks: "3~6주",
    title: "과제 운영·채택률",
    items: [
      "수요·핏·할인·재구매 엔진 추천 실제 승인 비율",
      "과제 발견→확인 시간 기록",
      "예외·보류 사유 구조화 (EXCEPTION)",
    ],
  },
  {
    weeks: "7~10주",
    title: "결과 비교",
    items: [
      "재입고 과제 전후 품절 손실·알림→구매 비교",
      "핏 안내 변경 상품의 사이즈 반품률 전후 비교",
      "세그먼트 캠페인 재구매율 vs 기준값",
    ],
  },
  {
    weeks: "11~12주",
    title: "리포트·확장 판단",
    items: [
      "재무 KPI (비용 · 매출 · 확장) 정리",
      "증빙 리포트 생성 · 대표 보고",
      "브랜드·SKU 확장 여부와 AI API 연결 순서 결정",
    ],
  },
];

export function EvidencePage() {
  return (
    <>
      <PageHeader
        title="성과 증빙"
        desc={
          <span>
            <Term term="증빙">증빙</Term>은 추천 → 승인 → 실행 → 결과를 시간 순서로 남긴 기록입니다.
          </span>
        }
        right={<LiveFreshness />}
      />
      <Hydrated fallback={<PageSkeleton kpis={4} />}>
        <EvidenceBody />
      </Hydrated>
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
  useEffect(() => {
    const a = params.get("actionId");
    if (a) setActionId(a);
  }, [params]);

  const evidence = useMemo(() => [...store.evidence].sort((a, b) => b.at.localeCompare(a.at)), [store.evidence]);
  const actors = useMemo(() => Array.from(new Set(evidence.map((e) => e.actor))).sort(), [evidence]);
  const productIds = useMemo(
    () => Array.from(new Set(evidence.map((e) => e.productId).filter((x): x is string => !!x))),
    [evidence],
  );
  const actionIds = useMemo(
    () => Array.from(new Set(evidence.map((e) => e.actionId).filter((x): x is string => !!x))).sort(),
    [evidence],
  );
  const actionById = (id: string): AXAction | undefined => store.actions.find((a) => a.id === id);

  const filtered = useMemo(() => {
    const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 0;
    const since = days ? Date.now() - days * 86400000 : 0;
    return evidence.filter(
      (e) =>
        (!since || new Date(e.at).getTime() >= since) &&
        (types.length === 0 || types.includes(e.type)) &&
        (actor === "all" || e.actor === actor) &&
        (productId === "all" || e.productId === productId) &&
        (actionId === "all" || e.actionId === actionId) &&
        (status === "all" || e.status === status) &&
        (source === "all" || e.source === source),
    );
  }, [evidence, period, types, actor, productId, actionId, status, source]);
  const { limit, hasMore, more } = useMore(filtered.length, 30);
  const active =
    (period !== "all" ? 1 : 0) +
    (types.length ? 1 : 0) +
    (actor !== "all" ? 1 : 0) +
    (productId !== "all" ? 1 : 0) +
    (actionId !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (source !== "all" ? 1 : 0);
  const resetFilters = () => {
    setPeriod("all");
    setTypes([]);
    setActor("all");
    setProductId("all");
    setActionId("all");
    setStatus("all");
    setSource("all");
  };

  const week = evidence.filter((e) => Date.now() - new Date(e.at).getTime() <= 7 * 86400000).length;
  const linked = evidence.filter((e) => e.actionId).length;
  const results = evidence.filter((e) => e.type === "RESULT").length;

  // Loop candidates: act-001 always + any action with ≥2 evidence entries
  const loopActions = useMemo(() => {
    const cnt = new Map<string, number>();
    for (const e of evidence) if (e.actionId) cnt.set(e.actionId, (cnt.get(e.actionId) ?? 0) + 1);
    const ids = new Set<string>(["act-001"]);
    for (const [id, n] of cnt) if (n >= 2) ids.add(id);
    return Array.from(ids)
      .map((id) => actionById(id))
      .filter((a): a is AXAction => !!a)
      .sort((a, b) => (a.id === "act-001" ? -1 : b.id === "act-001" ? 1 : a.id.localeCompare(b.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidence, store.actions]);

  return (
    <div className="animate-fadeIn">
      <NoteCard tone="warning" icon={<Flag size={16} />}>
        <b>기준값: 미측정 · 실증 필요</b> — 이 화면의 숫자는 모두 데모·시뮬레이션입니다. 실제 개선율은 실증에서 기준값을
        잰 뒤에 말할 수 있습니다.
      </NoteCard>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="증빙 총 건수" value={`${num(evidence.length)}건`} sub="시드 8건 + 시연 중 생성" />
        <KpiTile label="최근 7일" value={`${num(week)}건`} sub="고객 행동·과제 기록" />
        <KpiTile
          label="과제 연결"
          value={pct(safeDiv(linked, Math.max(1, evidence.length)), 0)}
          sub={`${linked}건이 과제와 연결`}
        />
        <KpiTile label="결과 기록" value={`${num(results)}건`} sub="실행 결과가 남은 건수" />
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.88rem] text-neutral-text2">
        <span className="mr-1 font-semibold text-neutral-text">기록 순서</span>
        {["고객 행동", "인사이트·추천", "승인·실행", "결과", "고객 반영"].map((l, i) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className="text-neutral-text">{l}</span>
            {i < 4 && <ChevronRight size={13} />}
          </span>
        ))}
      </p>

      <SectionBlock
        title="기록"
        desc={`${num(filtered.length)}건 · 최신순`}
        right={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              {
                value: "list",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <ListTree size={15} />
                    목록
                  </span>
                ),
              },
              {
                value: "loop",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <GitBranch size={15} />
                    순환 보기
                  </span>
                ),
              },
            ]}
          />
        }
      >
        <FilterBar
          activeCount={active}
          className="mb-4"
          right={
            active > 0 ? (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                초기화
              </Button>
            ) : undefined
          }
        >
          <div>
            <p className="mb-1.5 text-[0.9rem] font-semibold">기간</p>
            <Segmented
              size="sm"
              value={period}
              onChange={setPeriod}
              options={[
                { value: "all", label: "전체" },
                { value: "today", label: "오늘" },
                { value: "7d", label: "7일" },
                { value: "30d", label: "30일" },
              ]}
            />
          </div>
          <div className="w-full md:w-44">
            <Select label="담당자" name="ev-actor" value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="all">전체</option>
              {actors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full md:w-52">
            <Select
              label="관련 상품"
              name="ev-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="all">전체</option>
              {productIds.map((p) => (
                <option key={p} value={p}>
                  {PRODUCT_BY_ID[p]?.name ?? p}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full md:w-44">
            <Select label="관련 과제" name="ev-action" value={actionId} onChange={(e) => setActionId(e.target.value)}>
              <option value="all">전체</option>
              {actionIds.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
              {actionId !== "all" && !actionIds.includes(actionId) && (
                <option value={actionId}>{actionId} (기록 없음)</option>
              )}
            </Select>
          </div>
          <div className="w-full md:w-36">
            <Select
              label="상태"
              name="ev-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="all">전체</option>
              <option value="demo">데모</option>
              <option value="pilot-ready">실증 준비</option>
              <option value="live">연결됨</option>
            </Select>
          </div>
          <div className="w-full md:w-40">
            <Select
              label="데이터 출처"
              name="ev-source"
              value={source}
              onChange={(e) => setSource(e.target.value as typeof source)}
            >
              <option value="all">전체</option>
              <option value="DEMO">데모</option>
              <option value="SIMULATION">시뮬레이션</option>
              <option value="LIVE">연결됨</option>
            </Select>
          </div>
          <div className="w-full">
            <p className="mb-1.5 text-[0.9rem] font-semibold">유형</p>
            <div className="flex flex-wrap gap-1.5">
              {EVIDENCE_TYPES.map((t) => (
                <Chip
                  key={t}
                  active={types.includes(t)}
                  onClick={() => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}
                  className="h-9 px-3 text-[0.82rem]"
                >
                  {EVIDENCE_TYPE_LABEL[t]}
                </Chip>
              ))}
            </div>
          </div>
        </FilterBar>

        {view === "list" ? (
          <div data-tour="evidence-list">
            {filtered.length === 0 ? (
              <EmptyState
                title="조건에 맞는 기록이 없습니다"
                desc="필터를 바꾸거나 초기화해 보세요. 고객 화면에서 찜·재입고 신청·주문을 하면 새 기록이 생깁니다."
                icon={<Search size={22} />}
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    필터 초기화
                  </Button>
                }
              />
            ) : (
              <ol className="relative ml-3 space-y-4 border-l-2 border-neutral-border md:ml-4">
                {filtered.slice(0, limit).map((e) => (
                  <EvidenceItem key={e.id} e={e} action={e.actionId ? actionById(e.actionId) : undefined} />
                ))}
              </ol>
            )}
            <MoreButton hasMore={hasMore} onClick={more} remaining={filtered.length - limit} />
          </div>
        ) : (
          <div className="space-y-5" data-tour="evidence-list">
            <NoteCard icon={<GitBranch size={16} />}>
              <b>데이터 순환 타임라인</b> — 과제 하나를 기준으로 고객 행동 → 인사이트 → 승인 → 실행 → 결과 → 고객 반영을
              세로로 보여줍니다. 비어 있는 단계는 아직 일어나지 않은 단계입니다 (데모에서 직접 진행해 보세요).
            </NoteCard>
            {loopActions.map((a) => (
              <LoopTimeline
                key={a.id}
                action={a}
                evidence={evidence.filter(
                  (e) =>
                    e.actionId === a.id ||
                    (e.type === "CUSTOMER" && !!a.productId && e.productId === a.productId && !e.actionId),
                )}
                store={store}
              />
            ))}
          </div>
        )}
      </SectionBlock>

      {/* Evidence Pack */}
      <SectionBlock
        title="증빙 리포트 · 12주 실증 준비"
        desc="MORFIT §33 실증 계획을 4단계 체크리스트로 정리했습니다. 데모에서는 준비 상태만 표시합니다."
        right={
          <>
            <Badge tone="ready">연결 준비 · 실증 전환 후 실측</Badge>
            <Button variant="ghost" size="sm" onClick={() => setPackOpen(true)} aria-describedby="pack-note">
              구성 보기
            </Button>
            <Button variant="outline" href="/ax/evidence/pack" icon={<Download size={16} />} data-tour="evidence-pack">
              증빙 리포트 미리보기
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PACK_PHASES.map((p, i) => (
            <Card key={p.weeks} pad="md" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.78rem] font-bold tracking-wide text-theme-primary">{p.weeks}</span>
                <Badge tone="ready" size="sm">
                  실증 준비
                </Badge>
              </div>
              <p className="text-[1.02rem] font-bold">
                {i + 1}. {p.title}
              </p>
              <ul className="space-y-1.5 break-words text-[0.88rem] text-neutral-text2">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <Circle size={14} className="mt-1 shrink-0" />
                    {it}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <NoteCard className="mt-4" icon={<Lock size={16} />}>
          <span id="pack-note">
            실증 전환 전에는 <b>데모 미리보기</b>만 열립니다 — 기준값 없이 나가는 리포트는 개선율을 지어내게 되기
            때문에, 미리보기의 모든 변화 칸은 실증 후 확인으로 고정됩니다. 미리보기는 인쇄(PDF)와 JSON 내보내기를
            지원합니다.
          </span>
        </NoteCard>
      </SectionBlock>

      <Modal
        open={packOpen}
        onClose={() => setPackOpen(false)}
        title="증빙 리포트에 들어갈 내용"
        size="md"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" href="/ax/why" size="sm">
              기획의도 보기
            </Button>
            <Button variant="outline" href="/ax/evidence/pack" size="sm">
              미리보기 열기
            </Button>
            <Button size="sm" onClick={() => setPackOpen(false)}>
              확인
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-[0.92rem] leading-relaxed">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="ready">연결 준비</Badge>
            <span className="font-bold">실증 전환 후 실측 기준값으로 채워지는 항목</span>
          </div>
          <p className="text-neutral-text2">
            지금은 데모 미리보기(구조·현재값·실증 후 확인)만 열립니다. 기준값이 측정된 뒤 아래 항목이 실제 값으로 한
            묶음이 됩니다.
          </p>
          <ol className="space-y-2">
            {[
              ["기준값 표", "구매전환율·찜→구매·재입고알림→구매·반품률·재고일수·MD 분석시간의 측정 시점과 값"],
              ["과제 로그", "추천 → 확인 → 실행 → 완료/보류/무시 이력과 담당자·사유 (실행·예외)"],
              ["결과 비교", "과제 전후 KPI 변화 (결과·매출·효율) — 기준값 대비로만 표기"],
              ["고객 반영", "알림·추천·상태 변경이 고객 화면에 도달한 기록과 반응 (CUSTOMER)"],
              ["채택·확장 지표", "과제 채택률, MD 1인당 활성 SKU, 관리 브랜드 수 (채택·확장)"],
              ["위험·예외", "핏 위험도 상승, 추천 오류, 보류 사유 (위험·예외)"],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3 rounded-xl bg-neutral-canvas px-4 py-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-border bg-white text-[0.78rem] font-bold">
                  {i + 1}
                </span>
                <span>
                  <span className="font-semibold">{t}</span>
                  <span className="block text-[0.85rem] text-neutral-text2">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-[0.85rem] text-neutral-text2">
            현재 기록 {num(evidence.length)}건은 모두 데모/시뮬레이션 출처이며 Pack에는 참고용으로만 포함됩니다.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function EvidenceItem({ e, action }: { e: EvidenceLog; action?: AXAction }) {
  return (
    <li className="relative pl-5 md:pl-6">
      <span
        className={cn(
          "absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-white",
          e.type === "RESULT" || e.type === "REVENUE"
            ? "bg-semantic-success"
            : e.type === "RISK"
              ? "bg-semantic-error"
              : e.type === "CUSTOMER"
                ? "bg-theme-primary"
                : "bg-neutral-text2",
        )}
      />
      <div className="rounded-cardlg border border-neutral-border bg-white p-4 transition-colors hover:border-neutral-text2/40">
        <div className="flex flex-wrap items-center gap-2">
          <EvidenceTypeBadge type={e.type} />
          <span className="tabular ml-auto text-[0.8rem] text-neutral-text2" title={fmtDate(e.at, "datetime")}>
            {SOURCE_LABEL[e.source]}
            {e.status !== "demo" ? ` · ${STATUS_LABEL[e.status]}` : ""} · {relTime(e.at)}
          </span>
        </div>
        <p className="mt-2 text-[1rem] font-bold leading-snug">{e.title}</p>
        <p className="mt-1 text-[0.9rem] leading-relaxed text-neutral-text2">{e.detail}</p>
        {e.kpiDelta && (
          <span className="tabular mt-2 inline-flex items-center gap-1.5 rounded-lg bg-neutral-canvas px-2.5 py-1 text-[0.82rem] font-semibold">
            <Flag size={12} />
            {e.kpiDelta}
          </span>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.82rem]">
          <span className="inline-flex items-center gap-1 text-neutral-text2">
            <UserRound size={13} />
            {e.actor}
          </span>
          {e.actionId && (
            <Link
              href={`/ax/actions?open=${e.actionId}`}
              className="tap inline-flex items-center gap-1 font-semibold text-theme-primary hover:underline"
            >
              <Zap size={13} />
              {e.actionId}
              {action && <ActionStatusBadge status={action.status} />}
            </Link>
          )}
          {e.productId && PRODUCT_BY_ID[e.productId] && (
            <Link
              href={`/ax/products/${e.productId}`}
              className="tap inline-flex items-center gap-1 font-semibold hover:text-theme-primary hover:underline"
            >
              <Package size={13} />
              {PRODUCT_BY_ID[e.productId].name}
            </Link>
          )}
          {e.orderId && (
            <Link
              href={`/ax/orders?q=${e.orderId}`}
              className="tap inline-flex items-center gap-1 font-semibold hover:text-theme-primary hover:underline"
            >
              <ChevronRight size={13} />
              주문 {e.orderId}
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

interface Stage {
  key: string;
  label: string;
  icon: React.ReactNode;
  at?: string;
  title?: string;
  detail?: string;
  actor?: string;
  done: boolean;
  href?: string;
}

function LoopTimeline({ action, evidence, store }: { action: AXAction; evidence: EvidenceLog[]; store: AppState }) {
  const sorted = [...evidence].sort((a, b) => a.at.localeCompare(b.at));
  const hist = (s: AXAction["status"]) => action.statusHistory.find((h) => h.status === s);
  const customerEvent = sorted.find(
    (e) => e.type === "CUSTOMER" && (!e.actionId || e.actionId === action.id) && e.at <= (hist("done")?.at ?? "9"),
  );
  const resultEv = sorted.find((e) => e.type === "RESULT" && e.actionId === action.id);
  const feedbackEv = sorted.filter(
    (e) => e.type === "CUSTOMER" && e.actionId === action.id && (!resultEv || e.at >= resultEv.at),
  )[0];
  const done = hist("done");
  const inProg = hist("in-progress");
  const conf = hist("confirmed");
  const subs = action.variantId ? store.restockSubs.filter((r) => r.variantId === action.variantId) : [];
  const purchased = subs.filter((r) => r.status === "purchased" && !!r.notifiedAt).length;
  const notified = subs.filter((r) => r.status === "notified").length + purchased;
  const purchaseEv = sorted.find((e) => e.actionId === action.id && e.title.startsWith("재입고 알림 → 구매 전환"));
  const stages: Stage[] = [
    {
      key: "customer",
      label: "고객 행동",
      icon: <UserRound size={16} />,
      done: !!customerEvent,
      at: customerEvent?.at,
      title: customerEvent?.title ?? "고객 조회·찜·재입고 신청·반품 등",
      detail:
        customerEvent?.detail ??
        (action.productId
          ? `고객 화면에서 '${PRODUCT_BY_ID[action.productId]?.name}'을 찜하거나 재입고 알림을 신청하면 여기에 기록됩니다.`
          : "고객 행동 대기"),
      actor: customerEvent?.actor,
      href: action.productId ? `/products/${action.productId}` : undefined,
    },
    {
      key: "insight",
      label: "인사이트 · 추천",
      icon: <Lightbulb size={16} />,
      done: true,
      at: action.recommendedAt,
      title: action.title,
      detail: `트리거: ${action.trigger} · 근거 ${action.reasons.length}개 · ${action.engine} engine (${action.automation})`,
      actor: action.statusHistory[0]?.actor,
      href: `/ax/actions?open=${action.id}`,
    },
    {
      key: "approval",
      label: "승인 · 승인",
      icon: <ThumbsUp size={16} />,
      done: !!(conf || inProg || done),
      at: (conf ?? inProg ?? done)?.at,
      title: conf ? "담당자 확인" : inProg || done ? "확인 단계 생략 후 실행" : "승인 대기",
      detail:
        conf?.note ?? (conf ? `${conf.actor}이(가) 근거를 확인했습니다.` : "실행 센터에서 '확인'을 누르면 기록됩니다."),
      actor: conf?.actor,
    },
    {
      key: "action",
      label: "과제 · 실행",
      icon: <Play size={16} />,
      done: !!(inProg || done),
      at: (inProg ?? done)?.at,
      title: inProg ? "실행중" : done ? "실행 완료" : "실행 대기",
      detail:
        inProg?.note ??
        (inProg
          ? `${inProg.actor}이(가) 실행을 시작했습니다.`
          : done
            ? "실행 후 바로 완료 처리되었습니다."
            : "'실행중'으로 바꾸면 기록됩니다."),
      actor: inProg?.actor ?? done?.actor,
    },
    {
      key: "result",
      label: "결과 · 결과",
      icon: <Flag size={16} />,
      done: !!(done || resultEv),
      at: resultEv?.at ?? done?.at,
      title: resultEv?.title ?? (done ? (action.resultNote ?? "완료") : "결과 대기"),
      detail: resultEv?.detail ?? (done ? "완료 기록" : "완료되면 재고·가격·핏 안내 등 실제 변화가 기록됩니다."),
      actor: resultEv?.actor ?? done?.actor,
    },
    {
      key: "feedback",
      label: "고객 반영 · 고객 반영",
      icon: <MessageSquare size={16} />,
      done:
        !!purchaseEv ||
        !!feedbackEv ||
        notified > 0 ||
        (!!done && (action.type === "segment-campaign" || action.type === "cart-reminder")),
      at: purchaseEv?.at ?? feedbackEv?.at ?? (notified > 0 ? done?.at : undefined),
      title: purchaseEv
        ? `재입고 알림 ${notified}명 발송 → 구매 전환 ${purchased}명 (순환 1 완결)`
        : (feedbackEv?.title ??
          (notified > 0
            ? `재입고 알림 ${notified}명 발송 · 옵션 상태 '입고 완료'`
            : done && (action.type === "segment-campaign" || action.type === "cart-reminder")
              ? "고객 알림·추천 발송"
              : "고객 반응 대기")),
      detail: purchaseEv
        ? purchaseEv.detail
        : (feedbackEv?.detail ??
          (notified > 0
            ? "고객 화면 알림과 마이페이지 재입고 알림 상태가 바뀌었습니다. 고객이 이 옵션을 주문하면 '구매 전환'으로 닫힙니다 (기준값 대비 비교는 실증에서)."
            : "결과가 고객 화면(알림·상태·가격·핏 안내)에 도달하면 기록됩니다. 구매 반응은 기준값과 비교합니다.")),
      actor: purchaseEv?.actor ?? feedbackEv?.actor,
    },
  ];
  const doneCount = stages.filter((s) => s.done).length;
  return (
    <Card pad="md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{action.id}</Badge>
            <ActionStatusBadge status={action.status} />
            <span className="text-[0.8rem] text-neutral-text2">{doneCount} / 6 단계 기록됨</span>
          </div>
          <p className="mt-1 text-[1.02rem] font-bold">{action.title}</p>
        </div>
        <Button size="sm" variant="outline" href={`/ax/actions?open=${action.id}`} icon={<ChevronRight size={14} />}>
          과제 열기
        </Button>
      </div>
      <ol className="relative ml-4 space-y-4 border-l-2 border-neutral-border">
        {stages.map((s) => (
          <li key={s.key} className="relative pl-6">
            <span
              className={cn(
                "absolute -left-[13px] top-0 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white",
                s.done ? "bg-theme-primary text-white" : "bg-neutral-canvas text-neutral-text2",
              )}
            >
              {s.icon}
            </span>
            <div
              className={cn(
                "rounded-xl border p-3",
                s.done ? "border-neutral-border bg-white" : "border-dashed border-neutral-border bg-neutral-canvas/60",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-[0.78rem] font-bold tracking-wide",
                    s.done ? "text-theme-primary" : "text-neutral-text2",
                  )}
                >
                  {s.label}
                </span>
                {s.done ? (
                  <Badge tone="success" size="sm">
                    <CheckCircle2 size={11} />
                    기록됨
                  </Badge>
                ) : (
                  <Badge tone="neutral" size="sm">
                    대기 중
                  </Badge>
                )}
                {s.at && (
                  <span className="tabular ml-auto text-[0.78rem] text-neutral-text2">{fmtDate(s.at, "datetime")}</span>
                )}
              </div>
              <p className="mt-1 text-[0.95rem] font-semibold leading-snug">{s.title}</p>
              <p className="mt-0.5 text-[0.85rem] leading-relaxed text-neutral-text2">{s.detail}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[0.8rem]">
                {s.actor && (
                  <span className="inline-flex items-center gap-1 text-neutral-text2">
                    <UserRound size={12} />
                    {s.actor}
                  </span>
                )}
                {s.href && (
                  <Link href={s.href} className="font-semibold text-theme-primary hover:underline">
                    {s.href.startsWith("/products") ? "고객 플랫폼에서 해보기" : "열기"}
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
