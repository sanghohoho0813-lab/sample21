"use client";
/* ------------------------------------------------------------------
   과제 운영 통제 — 누가(담당) · 언제까지(기한·SLA) · 누구 승인으로(정책) ·
   무엇을 바꿨나(변경 이력) · 실행 전/후 무엇이 달라졌나(성과 비교).
   추천 → 검토 → 승인 → 실행 → 결과 측정 → 증빙이 한 카드 안에서 추적된다.
------------------------------------------------------------------- */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CalendarClock, FileCheck2, History, ShieldAlert, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp, ROLE_NAME } from "@/lib/store";
import { PRODUCT_BY_ID } from "@/lib/demo/seed";
import { fmtDate } from "@/lib/dates";
import type { AXAction, Role } from "@/lib/types";
import { approvalOf, assigneeOf, canApprove, dueInDays, dueOf, POLICY, priorityOf } from "@/lib/intel/policy";
import { compareRows } from "@/lib/intel/measure";
import { markdownDecision } from "@/lib/intel/markdown";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { ScoreBar, scoreTone, TD, TH } from "./Signals";
import { useIntelState, useReadings } from "./useIntel";

export const ASSIGNEES = ["박지원 MD", "이도윤 MD", "최서준 MD", "김민재 운영", "운영팀"];

const isOpen = (a: AXAction) => a.status === "recommended" || a.status === "confirmed" || a.status === "in-progress";

export function dueText(a: AXAction) {
  const left = dueInDays(a);
  if (left === null) return null;
  if (left < 0) return { text: `기한 ${-left}일 지남`, tone: "error" as const };
  if (left === 0) return { text: "오늘 마감", tone: "warning" as const };
  return { text: `D-${left}`, tone: left <= 1 ? ("warning" as const) : ("neutral" as const) };
}

/** 카드 머리의 한 줄 통제 정보 — 우선순위 · 담당 · 기한 · 승인 */
export function ControlStrip({ action }: { action: AXAction }) {
  const readings = useReadings();
  const pr = useMemo(() => priorityOf(action, readings), [action, readings]);
  const ap = approvalOf(action);
  const due = dueText(action);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] text-neutral-text2" data-control-strip>
      {isOpen(action) && (
        <span className="inline-flex items-center gap-1">
          <span>우선순위</span>
          <ScoreBar value={pr.score} tone={scoreTone(pr.score)} label={`우선순위 ${pr.score}점`} />
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <UserRound size={12} aria-hidden />
        <span className="font-semibold text-neutral-text">{assigneeOf(action)}</span>
      </span>
      {due && (
        <span
          className={cn(
            "tabular inline-flex items-center gap-1 font-semibold",
            due.tone === "error" ? "text-semantic-error" : due.tone === "warning" ? "text-[#b45309]" : "",
          )}
        >
          <CalendarClock size={12} aria-hidden />
          {due.text}
        </span>
      )}
      {ap.required && isOpen(action) && (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-semibold",
            ap.approvedBy ? "text-semantic-success" : "text-[#b45309]",
          )}
        >
          {ap.approvedBy ? <ShieldCheck size={12} aria-hidden /> : <ShieldAlert size={12} aria-hidden />}
          {ap.approvedBy ? "승인됨" : `${ap.approverRole === "owner" ? "대표" : "MD"} 승인 필요`}
        </span>
      )}
      {action.origin === "engine" && <span className="font-semibold text-theme-primary">엔진 후보에서 등록</span>}
    </div>
  );
}

/** 승인 · 담당 · 기한 · 수량/할인율 · 변경 이력 */
export function ControlPanel({ action, role }: { action: AXAction; role: Role }) {
  const updateParams = useApp((s) => s.updateActionParams);
  const approve = useApp((s) => s.approveAction);
  const actor = ROLE_NAME[role];
  const ap = approvalOf(action);
  const editable = isOpen(action);
  const due = dueOf(action);

  const [assignee, setAssignee] = useState(assigneeOf(action));
  const [dueDate, setDueDate] = useState(due.toISOString().slice(0, 10));
  const [qty, setQty] = useState(action.quantity ?? 0);
  const [rate, setRate] = useState(Math.round((action.discountRate ?? 0) * 100));
  const [note, setNote] = useState("");
  // 다른 곳(승인·상태 변경)에서 과제가 바뀌면 입력값을 맞춘다
  useEffect(() => {
    setAssignee(assigneeOf(action));
    setDueDate(dueOf(action).toISOString().slice(0, 10));
    setQty(action.quantity ?? 0);
    setRate(Math.round((action.discountRate ?? 0) * 100));
  }, [action]);

  const hasQty = action.type === "restock" || action.type === "rebalance";
  const hasRate = action.type === "markdown";
  const product = action.productId ? PRODUCT_BY_ID[action.productId] : null;
  const dirty =
    assignee !== assigneeOf(action) ||
    dueDate !== due.toISOString().slice(0, 10) ||
    (hasQty && qty !== (action.quantity ?? 0)) ||
    (hasRate && rate !== Math.round((action.discountRate ?? 0) * 100));

  const save = () => {
    const d = new Date(`${dueDate}T18:00:00`);
    updateParams(
      action.id,
      {
        assigneeName: assignee !== assigneeOf(action) ? assignee : undefined,
        dueAt: dueDate !== due.toISOString().slice(0, 10) ? d.toISOString() : undefined,
        quantity: hasQty && qty !== action.quantity ? qty : undefined,
        discountRate: hasRate && rate / 100 !== action.discountRate ? rate / 100 : undefined,
      },
      actor,
      note.trim() || undefined,
    );
    setNote("");
    toast("변경 저장 · 이력 기록", "변경 내용과 사유가 과제 이력과 증빙에 남았습니다.", "info");
  };

  const field =
    "h-11 w-full rounded-lg border border-neutral-border bg-white px-2.5 text-[0.86rem] focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20 disabled:bg-neutral-canvas disabled:text-neutral-text2 md:h-9";
  const label = "mb-1 block text-[0.75rem] font-semibold text-neutral-text2";
  const orderCost = hasQty && product ? qty * product.cost : 0;

  return (
    <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]" data-control-panel>
      <div className="rounded-lg border border-neutral-border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[0.82rem] font-bold">
          <UserRound size={14} aria-hidden />
          운영 통제
          {!editable && <span className="font-normal text-neutral-text2">· 종료된 과제는 수정할 수 없습니다</span>}
        </p>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-[1fr_1.25fr_0.8fr_1.2fr]">
          <label className="min-w-0">
            <span className={label}>담당자</span>
            <select
              className={field}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              disabled={!editable}
            >
              {[...new Set([assigneeOf(action), ...ASSIGNEES])].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span className={label}>기한 (기준 {POLICY.slaDays[action.urgency]}일)</span>
            <input
              type="date"
              className={cn(field, "tabular")}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!editable}
            />
          </label>
          {hasQty && (
            <label className="min-w-0">
              <span className={label}>발주 수량</span>
              <input
                type="number"
                min={0}
                step={5}
                inputMode="numeric"
                className={cn(field, "tabular")}
                value={qty}
                onChange={(e) => setQty(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                disabled={!editable}
              />
            </label>
          )}
          {hasRate && (
            <label className="min-w-0">
              <span className={label}>할인율</span>
              <select
                className={cn(field, "tabular")}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                disabled={!editable}
              >
                {[5, 10, 15, 20, 25, 30].map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={cn("min-w-0", hasQty || hasRate ? "" : "col-span-2")}>
            <span className={label}>변경 사유 (선택)</span>
            <input
              className={field}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 리드타임 단축"
              disabled={!editable}
            />
          </label>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.78rem] text-neutral-text2">
          {hasQty && product && (
            <span className="tabular">
              발주 금액(원가){" "}
              <b className="text-neutral-text">{Math.round(orderCost / 10_000).toLocaleString("ko-KR")}만 원</b> ·{" "}
              {Math.round(POLICY.restockApprovalKrw / 10_000)}만 원 이상은 대표 승인
            </span>
          )}
          {hasRate && <span>할인 {Math.round(POLICY.markdownApprovalRate * 100)}% 이상은 대표 승인 (마진 영향)</span>}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto !h-11 md:!h-9"
            disabled={!editable || !dirty}
            onClick={save}
          >
            변경 저장
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[0.82rem] font-bold">
          {ap.approvedBy ? (
            <ShieldCheck size={14} className="text-semantic-success" aria-hidden />
          ) : (
            <ShieldAlert size={14} aria-hidden />
          )}
          승인
        </p>
        <p className="text-[0.84rem] leading-snug">{ap.reason}</p>
        {ap.required ? (
          ap.approvedBy ? (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[0.82rem] font-semibold text-semantic-success">
              <BadgeCheck size={14} aria-hidden />
              {ap.approvedBy} 승인 · <span className="tabular font-normal">{fmtDate(ap.approvedAt!, "datetime")}</span>
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {editable && canApprove(role, action) ? (
                <Button
                  size="sm"
                  className="!h-11 md:!h-9"
                  icon={<ShieldCheck size={15} />}
                  onClick={() => {
                    approve(action.id, actor);
                    toast("승인 완료", `${action.title} — 이제 실행을 시작할 수 있습니다.`, "success");
                  }}
                >
                  승인
                </Button>
              ) : (
                <span className="text-[0.8rem] font-semibold text-[#b45309]">
                  {ap.approverRole === "owner" ? "대표" : "MD"} 승인 대기 — 현재 역할({actor})로는 승인할 수 없습니다
                </span>
              )}
              <span className="text-[0.78rem] text-neutral-text2">승인 전에는 실행을 시작할 수 없습니다</span>
            </div>
          )
        ) : (
          <p className="mt-1.5 text-[0.8rem] text-neutral-text2">별도 승인 없이 담당자가 실행합니다.</p>
        )}
      </div>

      {(action.changes?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-neutral-border p-3 lg:col-span-2">
          <p className="mb-1.5 flex items-center gap-1.5 text-[0.82rem] font-bold">
            <History size={14} aria-hidden />
            변경 이력 <span className="font-normal text-neutral-text2">{action.changes!.length}건</span>
          </p>
          <ol className="space-y-1 text-[0.8rem]">
            {[...action.changes!].reverse().map((c, i) => (
              <li key={i} className="flex flex-wrap gap-x-2">
                <span className="tabular text-neutral-text2">{fmtDate(c.at, "datetime")}</span>
                <span className="font-semibold">{c.actor}</span>
                <span>
                  {{ quantity: "수량", discountRate: "할인율", assignee: "담당자", dueAt: "기한" }[c.field]} {c.from} →{" "}
                  <b>{c.to}</b>
                </span>
                {c.note && <span className="text-neutral-text2">“{c.note}”</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** 성과 전/후 — 검토 확정 시점(전) vs 완료 시점·지금(후) */
export function OutcomePanel({ action }: { action: AXAction }) {
  const d = useIntelState();
  const rows = useMemo(() => compareRows(action, d), [action, d]);
  return (
    <div className="rounded-lg border border-neutral-border" data-outcome>
      <p className="flex flex-wrap items-center gap-x-2 border-b border-neutral-border px-3 py-2 text-[0.82rem] font-bold">
        성과 전/후
        <span className="font-normal text-neutral-text2">
          {action.baseline
            ? `기준 ${fmtDate(action.baseline.at, "datetime")} (검토 확정)`
            : "검토를 확정하면 그 시점 지표가 '전'으로 기록됩니다"}
        </span>
        {action.status === "done" && (
          <Link
            href={`/ax/evidence?actionId=${action.id}`}
            className="ml-auto inline-flex min-h-11 items-center gap-1 text-[0.8rem] font-semibold text-theme-primary hover:underline md:min-h-0"
          >
            <FileCheck2 size={13} aria-hidden />
            증빙
          </Link>
        )}
      </p>
      {rows ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px]">
            <thead>
              <tr className="bg-neutral-canvas/60">
                <th className={TH}>지표</th>
                <th className={cn(TH, "text-right")}>전</th>
                <th className={cn(TH, "text-right")}>후</th>
                <th className={TH}>메모</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-neutral-border/70">
                  <td className={cn(TD, "font-semibold")}>{r.label}</td>
                  <td className={cn(TD, "tabular text-right text-neutral-text2")}>{r.before}</td>
                  <td
                    className={cn(
                      TD,
                      "tabular text-right font-semibold",
                      !r.measured ? "text-neutral-text2" : r.better ? "text-semantic-success" : "",
                    )}
                  >
                    {r.after}
                  </td>
                  <td className={cn(TD, "text-[0.78rem] text-neutral-text2")}>
                    {r.note ?? (r.measured ? "" : "시간이 지나야 측정")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-3 py-3 text-[0.8rem] text-neutral-text2">
          {action.status === "done"
            ? "데모 시작 전에 끝난 시나리오 기록이라 전/후 스냅샷이 없습니다 — 성과를 꾸미지 않기 위해 비워 둡니다."
            : "아직 기준값이 없습니다 — 추천 상태에서는 비교하지 않습니다."}
        </p>
      )}
    </div>
  );
}

/** 할인 과제에 붙는 엔진 판단 — 사람이 만든 할인 과제도 근거를 통과했는지 보여준다 */
export function MarkdownGuard({ action }: { action: AXAction }) {
  const d = useIntelState();
  const p = action.productId ? PRODUCT_BY_ID[action.productId] : null;
  const md = useMemo(() => (p ? markdownDecision(p, d) : null), [p, d]);
  if (!md || action.type !== "markdown") return null;
  const agrees = md.verdict === "markdown";
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-[0.82rem]",
        agrees ? "border-neutral-border" : "border-semantic-warning/50 bg-[#fff8ef]",
      )}
      data-markdown-guard
    >
      <p className="mb-1.5 flex flex-wrap items-center gap-2 font-bold">
        할인 판단 엔진: <span className={agrees ? "text-semantic-success" : "text-[#b45309]"}>{md.verdictLabel}</span>
        {!agrees && <span className="font-normal text-[#b45309]">· 이 과제의 할인율과 다릅니다 — 실행 전 검토</span>}
        <Link
          href={`/ax/products/${p!.id}?tab=markdown`}
          className="ml-auto inline-flex min-h-11 items-center text-[0.78rem] font-semibold text-theme-primary hover:underline md:min-h-0"
        >
          시뮬레이터
        </Link>
      </p>
      <ul className="grid gap-x-4 gap-y-0.5 md:grid-cols-2">
        {md.checks.map((c) => (
          <li key={c.label} className="flex gap-1.5 leading-snug">
            <span
              className={cn("font-bold", c.ok ? "text-semantic-success" : "text-semantic-error")}
              aria-label={c.ok ? "통과" : "불통과"}
            >
              {c.ok ? "✓" : "✗"}
            </span>
            <span>
              {c.label} <span className="text-neutral-text2">— {c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      {md.guards.length > 0 && <p className="mt-1.5 text-[#b45309]">{md.guards[0]}</p>}
    </div>
  );
}
