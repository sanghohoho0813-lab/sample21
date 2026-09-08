"use client";
/* ------------------------------------------------------------------
   ActionCard — Growth & Action Center card.
   Explainability: 무엇 / 왜(근거) / 데이터(live strip) / 주의 / 누가 승인 / 다음 행동.
   Lifecycle: 추천됨 → 확인 → 실행중 → 완료 / 보류 · 무시 (L2/L3, 사람이 최종 승인).
------------------------------------------------------------------- */
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Clock, Cpu, FileCheck2, PauseCircle, Play, RotateCcw, XCircle, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp, ROLE_NAME } from "@/lib/store";
import { PRODUCT_BY_ID, VARIANT_BY_ID } from "@/lib/demo/seed";
import { effVariant, restockPriority, markdownReview, daysOfStock, effPrice } from "@/lib/kpi";
import { fmtDate, relTime } from "@/lib/dates";
import { krw, num, pct } from "@/lib/format";
import type { ActionStatus, AXAction } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Overlay";
import { Input, Textarea } from "@/components/ui/Form";
import { Term } from "@/components/ui/Misc";
import { toast } from "@/components/ui/Toast";
import { AIReadyBadge } from "@/components/ax/AIReady";
import { ActionStatusBadge, UrgencyBadge, ACTION_STATUS_LABEL } from "@/components/ax/StatusBadges";
import { ACTION_TYPE_LABEL, ActionEntityChips, ENGINE_LABEL, ERROR_COST_LABEL, StatPill } from "./shared";

type Live = { label: string; value: ReactNode; sub?: ReactNode; tone?: "neutral" | "warning" | "error" | "success" | "accent" }[];

/** 현재 상태 데이터 — Action 추천 시점이 아니라 지금(seed + store delta) 계산. */
function useLiveStrip(action: AXAction): Live | null {
  const app = useApp();
  return useMemo(() => {
    if ((action.type === "restock" || action.type === "rebalance") && action.variantId && VARIANT_BY_ID[action.variantId]) {
      const v = effVariant(VARIANT_BY_ID[action.variantId], app);
      const rp = restockPriority(v, app);
      const dos = daysOfStock(v);
      return [
        { label: "현재고", value: `${num(v.stock)}개`, sub: v.incoming > 0 ? `입고 예정 ${v.incoming}` : undefined, tone: v.stock <= 0 ? "error" : dos <= 4 ? "warning" : "neutral" },
        { label: "예상 소진일", value: v.stock <= 0 ? "품절" : `${dos}일`, tone: v.stock <= 0 ? "error" : dos <= rp.leadTime ? "warning" : "neutral" },
        { label: "추천 수량", value: `${num(action.quantity ?? rp.suggestedQty)}개`, sub: `우선순위 ${rp.score}점` },
        { label: "리드타임", value: `${rp.leadTime}일`, sub: `재입고 신청 ${num(v.restockRequests)}건` },
      ];
    }
    if (action.type === "markdown" && action.productId && PRODUCT_BY_ID[action.productId]) {
      const p = PRODUCT_BY_ID[action.productId];
      const m = markdownReview(p, app);
      return [
        { label: "재고일수", value: m.dos <= 0 ? "-" : `${m.dos}일`, sub: `재고 ${num(m.stock)}개`, tone: m.shouldReview ? "warning" : "neutral" },
        { label: "현재 할인", value: pct(m.currentRate, 0), sub: krw(effPrice(p, app)) },
        { label: "제안 할인", value: pct(action.discountRate ?? m.suggestedRate, 0), sub: `마진 ${pct(m.margin, 0)} 유지`, tone: "accent" },
        { label: "시즌 종료까지", value: `${p.seasonEndsInDays}일` },
      ];
    }
    if (action.type === "fit-guide" && action.productId && PRODUCT_BY_ID[action.productId]) {
      const p = PRODUCT_BY_ID[action.productId];
      const vs = p ? Object.values(VARIANT_BY_ID).filter((v) => v.productId === p.id).map((v) => effVariant(v, app)) : [];
      const s30 = vs.reduce((s, v) => s + v.sales30d, 0), r = vs.reduce((s, v) => s + v.returns30d, 0), f = vs.reduce((s, v) => s + v.fitReturns30d, 0);
      return [
        { label: "30일 판매", value: `${num(s30)}개` },
        { label: "반품", value: `${num(r)}건`, sub: `반품률 ${pct(s30 ? r / s30 : 0, 1)}`, tone: r / Math.max(1, s30) > 0.1 ? "error" : "neutral" },
        { label: "사이즈 관련", value: `${num(f)}건`, sub: `반품 중 ${pct(r ? f / r : 0, 0)}`, tone: "warning" },
        { label: "핏 안내", value: app.fitNoteOverride[p.id] ? "변경됨" : "원본", tone: app.fitNoteOverride[p.id] ? "success" : "neutral" },
      ];
    }
    return null;
  }, [action, app]);
}

const STATUS_ICON: Record<ActionStatus, ReactNode> = { recommended: <Sparkles size={14} />, confirmed: <CheckCircle2 size={14} />, "in-progress": <Play size={14} />, done: <FileCheck2 size={14} />, hold: <PauseCircle size={14} />, dismissed: <XCircle size={14} /> };

export function ActionCard({ action, expanded = true, onToggle, compact, tour, className, highlight }: {
  action: AXAction; expanded?: boolean; onToggle?: () => void; compact?: boolean; tour?: string; className?: string; highlight?: boolean;
}) {
  const role = useApp((s) => s.role);
  const updateActionStatus = useApp((s) => s.updateActionStatus);
  const restockSubs = useApp((s) => s.restockSubs);
  const live = useLiveStrip(action);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [resultNote, setResultNote] = useState("");
  const actor = ROLE_NAME[role === "customer" ? "owner" : role];

  const effectText = (status: ActionStatus): string => {
    const waiting = action.variantId ? restockSubs.filter((r) => r.variantId === action.variantId && r.status === "waiting").length : 0;
    if ((action.type === "restock" || action.type === "rebalance") && action.variantId) {
      if (status === "confirmed") return "옵션 상태 '재입고 검토'로 변경 · 고객 상품 화면에 표시 · Evidence 기록";
      if (status === "in-progress") return "옵션 상태 '재입고 진행'으로 변경 · 고객 화면 '입고 준비 중' 표시";
      if (status === "done") return `재고 +${action.quantity ?? 20} 반영 · 재입고 알림 ${waiting}명 발송 · 고객 화면 상태 '입고 완료' 변경`;
    }
    if (action.type === "markdown" && status === "done") {
      const p = action.productId ? PRODUCT_BY_ID[action.productId] : null;
      const rate = action.discountRate ?? 0.15;
      return p ? `판매가 ${krw(p.price)} → ${krw(Math.round(p.price * (1 - rate) / 1000) * 1000)} 반영 · 세일 목록 노출 · Evidence(REVENUE) 기록` : "할인가 반영";
    }
    if (action.type === "fit-guide" && status === "done") return "상품 상세 핏 안내 변경 · 핏 추천 규칙 +1 사이즈 보정 · Evidence 기록";
    if (action.type === "segment-campaign" && (status === "in-progress" || status === "done")) return status === "done" ? "캠페인 cp-06 종료 처리 · 결과는 Evidence에서 비교" : "캠페인 cp-06 진행 시작 · 대상 고객 42명에게 추천 알림 발송";
    if (action.type === "cart-reminder" && (status === "in-progress" || status === "done")) return "장바구니 리마인드 알림 발송 · 고객 알림함에 표시";
    if (status === "hold") return "보류 처리 · Evidence(EXCEPTION) 기록 · 다시 검토 가능";
    if (status === "dismissed") return "무시 처리 · 사유가 Evidence(EXCEPTION)에 기록됨";
    return "상태 변경이 Evidence Log에 기록되었습니다";
  };

  const change = (status: ActionStatus, note?: string) => {
    const body = effectText(status);
    updateActionStatus(action.id, status, actor, note);
    toast(`${ACTION_STATUS_LABEL[status]} 처리 · ${action.title}`, body, status === "dismissed" || status === "hold" ? "info" : "success");
  };

  const defaultResult = () => {
    if (action.type === "restock" || action.type === "rebalance") return `${action.quantity ?? 20}개 입고 수량 확인 · 검수 완료`;
    if (action.type === "markdown") return `할인 ${Math.round((action.discountRate ?? 0.15) * 100)}% 적용 완료`;
    if (action.type === "fit-guide") return "상품 상세 핏 안내 수정 완료";
    return "실행 완료";
  };

  const product = action.productId ? PRODUCT_BY_ID[action.productId] : null;

  /* ---------- compact (dashboard) ---------- */
  if (compact) {
    return (
      <Link href={`/ax/actions?open=${action.id}`} className={cn("block rounded-2xl border border-neutral-border bg-white p-4 hover-lift active:bg-neutral-canvas", className)} data-tour={tour}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1"><UrgencyBadge urgency={action.urgency} /><Badge tone="neutral" size="sm">{ACTION_TYPE_LABEL[action.type]}</Badge><ActionStatusBadge status={action.status} size="sm" /></div>
            <p className="font-bold text-[0.98rem] leading-snug">{action.title}</p>
            <p className="mt-1 text-[0.82rem] text-neutral-text2 leading-snug">{action.trigger}</p>
          </div>
          <ChevronDown size={18} className="-rotate-90 text-neutral-text2 shrink-0 mt-1" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.78rem] text-neutral-text2"><span>{action.ownerName}</span><span className="tabular">{relTime(action.recommendedAt)}</span></div>
      </Link>
    );
  }

  const isOpen = OPEN(action.status);
  return (
    <article className={cn("rounded-cardlg bg-white border shadow-card transition-all duration-fast", highlight ? "border-theme-primary ring-2 ring-theme-primary/20" : "border-neutral-border", className)} data-tour={tour} data-action-id={action.id} id={`action-${action.id}`}>
      {/* Header */}
      <div role={onToggle ? "button" : undefined} tabIndex={onToggle ? 0 : undefined} onClick={onToggle} onKeyDown={onToggle ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } } : undefined}
        className={cn("w-full text-left px-5 pt-5 pb-4 flex items-start gap-3 min-w-0", onToggle && "cursor-pointer hover:bg-neutral-canvas/60 rounded-t-cardlg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/30")} aria-expanded={onToggle ? expanded : undefined} data-card-header>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <UrgencyBadge urgency={action.urgency} />
            <Badge tone="neutral" size="sm">{ACTION_TYPE_LABEL[action.type]}</Badge>
            <ActionStatusBadge status={action.status} size="sm" />
            <Badge tone="neutral" size="sm"><Term term={action.automation}>{action.automation}</Term></Badge>
            {action.engine === "demand" && <Badge tone="ready" size="sm">Demand Engine</Badge>}
          </div>
          <h3 className="font-bold text-[1.1rem] md:text-[1.2rem] leading-snug tracking-tight">{action.title}</h3>
          <p className="mt-1.5 text-[0.9rem] text-neutral-text2 leading-snug"><span className="font-semibold text-neutral-text">트리거</span> · {action.trigger}</p>
          <div className="mt-2.5"><ActionEntityChips action={action} /></div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1 text-[0.8rem] text-neutral-text2">
          {onToggle && (expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
          <span className="tabular whitespace-nowrap inline-flex items-center gap-1"><Clock size={12} />{relTime(action.recommendedAt)}</span>
          <span className="whitespace-nowrap">{action.ownerName}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 animate-fadeIn">
          {/* Live data strip */}
          {live && (
            <div>
              <p className="text-[0.8rem] font-semibold text-neutral-text2 mb-2 inline-flex items-center gap-1.5"><Cpu size={14} />지금 데이터 (seed + 고객 Event 반영)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{live.map((l) => <StatPill key={l.label} label={l.label} value={l.value} sub={l.sub} tone={l.tone} />)}</div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-border p-4">
              <p className="font-bold text-[0.92rem] mb-2">판단 근거</p>
              <ul className="space-y-1.5 text-[0.9rem] leading-snug">{action.reasons.map((r) => <li key={r} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-theme-primary shrink-0" />{r}</li>)}</ul>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-theme-soft p-4">
                <p className="font-bold text-[0.92rem] mb-1">예상 영향</p>
                <p className="text-[0.9rem] leading-snug">{action.expectedImpact}</p>
                <p className="mt-1.5 text-[0.75rem] text-neutral-text2">DEMO 추정치 · 실제 개선율은 실증에서 측정 (Baseline 필요)</p>
              </div>
              {action.caution && <div className="rounded-xl bg-[#fff1e6] p-4 text-[0.88rem] leading-snug text-[#b45309] flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /><span><span className="font-bold">주의</span> · {action.caution}</span></div>}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.82rem] text-neutral-text2">
            <span className="inline-flex items-center gap-1.5"><Cpu size={14} />{ENGINE_LABEL[action.engine]}{action.engine === "demand" && <AIReadyBadge kind="demand" className="h-7 px-2.5 text-[0.75rem]" />}</span>
            <span>자동화 <Term term={action.automation}>{action.automation}</Term> · {action.automation === "L3" ? "시스템 준비 → 사람 승인" : "추천만 · 사람이 실행"}</span>
            <span>{ERROR_COST_LABEL[action.errorCost]}</span>
            <span>담당 <span className="font-semibold text-neutral-text">{action.ownerName}</span> · 추천일 {fmtDate(action.recommendedAt, "datetime")}</span>
          </div>

          {/* Done: result + timeline + evidence */}
          {(action.status === "done" || action.status === "dismissed" || action.status === "hold" || action.statusHistory.length > 1) && (
            <div className="rounded-xl bg-neutral-canvas p-4">
              {action.resultNote && action.status === "done" && <p className="text-[0.92rem] mb-3"><span className="font-bold">결과</span> · {action.resultNote}</p>}
              <p className="text-[0.8rem] font-semibold text-neutral-text2 mb-2">상태 이력</p>
              <ol className="space-y-1.5">
                {action.statusHistory.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[0.85rem]">
                    <span className={cn("mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0", i === action.statusHistory.length - 1 ? "bg-theme-primary text-white" : "bg-white border border-neutral-border text-neutral-text2")}>{STATUS_ICON[h.status]}</span>
                    <span className="min-w-0"><span className="font-semibold">{ACTION_STATUS_LABEL[h.status]}</span> · {h.actor} · <span className="tabular text-neutral-text2">{fmtDate(h.at, "datetime")}</span>{h.note && <span className="block text-neutral-text2">“{h.note}”</span>}</span>
                  </li>
                ))}
              </ol>
              {action.status === "done" && <Link href={`/ax/evidence?actionId=${action.id}`} className="mt-3 inline-flex items-center gap-1 text-[0.88rem] font-semibold text-theme-primary hover:underline underline-offset-4"><FileCheck2 size={15} />이 Action의 Evidence 보기</Link>}
            </div>
          )}

          {/* Lifecycle buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {action.status === "recommended" && (<>
              <Button size="md" onClick={() => change("confirmed")} icon={<CheckCircle2 size={18} />}>확인</Button>
              <Button size="md" variant="outline" onClick={() => change("hold")} icon={<PauseCircle size={18} />}>보류</Button>
              <Button size="md" variant="ghost" onClick={() => setDismissOpen(true)} icon={<XCircle size={18} />}>무시</Button>
            </>)}
            {action.status === "confirmed" && <Button size="md" onClick={() => change("in-progress")} icon={<Play size={18} />}>실행 시작</Button>}
            {action.status === "in-progress" && <Button size="md" onClick={() => { setResultNote(defaultResult()); setDoneOpen(true); }} icon={<FileCheck2 size={18} />}>완료</Button>}
            {action.status === "hold" && <Button size="md" variant="outline" onClick={() => change("recommended")} icon={<RotateCcw size={18} />}>다시 검토</Button>}
            {action.status === "dismissed" && <Button size="md" variant="ghost" onClick={() => change("recommended")} icon={<RotateCcw size={18} />}>다시 검토</Button>}
            {action.status === "done" && <span className="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-semantic-success"><CheckCircle2 size={16} />완료됨 · 고객 화면 반영</span>}
            {isOpen && <span className="text-[0.78rem] text-neutral-text2 ml-auto">승인자: {actor} (현재 역할)</span>}
            {product && <Link href={`/products/${product.id}`} className="text-[0.82rem] font-semibold text-neutral-text2 hover:text-theme-primary">고객 화면 보기</Link>}
          </div>
        </div>
      )}

      {/* Dismiss modal */}
      <Modal open={dismissOpen} onClose={() => setDismissOpen(false)} title="Action 무시 — 이유를 남겨주세요" size="sm"
        footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setDismissOpen(false)}>취소</Button><Button variant="danger" disabled={!reason.trim()} onClick={() => { change("dismissed", reason.trim()); setDismissOpen(false); setReason(""); }}>무시 처리</Button></div>}>
        <p className="text-[0.9rem] text-neutral-text2 mb-3">이유는 Evidence(EXCEPTION)에 기록되어 추천 규칙을 개선하는 데 쓰입니다.</p>
        <Textarea label="무시 이유" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 브랜드 정책상 할인 불가 / CS 직접 응대로 대체" />
      </Modal>

      {/* Done modal */}
      <Modal open={doneOpen} onClose={() => setDoneOpen(false)} title="완료 처리 — 결과 메모" size="sm"
        footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setDoneOpen(false)}>취소</Button><Button disabled={!resultNote.trim()} onClick={() => { change("done", resultNote.trim()); setDoneOpen(false); }}>완료 처리</Button></div>}>
        <p className="text-[0.9rem] text-neutral-text2 mb-3">완료하면 다음이 자동으로 실행됩니다: <span className="font-semibold text-neutral-text">{effectText("done")}</span></p>
        <Input label="결과 메모" value={resultNote} onChange={(e) => setResultNote(e.target.value)} placeholder="예: 60개 입고 수량 확인" />
      </Modal>
    </article>
  );
}

const OPEN = (s: ActionStatus) => s === "recommended" || s === "confirmed" || s === "in-progress";
