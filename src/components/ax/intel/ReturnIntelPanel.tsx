"use client";
/* ------------------------------------------------------------------
   반품 Intelligence — 반품을 '비율'이 아니라 '패턴'으로 본다.
   · 발견: 사이즈 집중 / 상품 / 고객군 / 핏 프로필 효과 — 표본 수·기준 대비 배수 함께
   · Fit Closed Loop: 반품 사유 → 패턴 → 핏 안내 개선 과제 → 상세·추천 규칙 변경 → 재측정
------------------------------------------------------------------- */
import Link from "next/link";
import { useMemo } from "react";
import { Check, CircleDashed, Microscope, Plus, RefreshCcw, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp, ROLE_NAME } from "@/lib/store";
import { PRODUCT_BY_ID, RETURN_REASON_LABEL, SCENARIO } from "@/lib/demo/seed";
import { fitGuideImpact, returnIntel, type ReturnFinding } from "@/lib/intel/returns";
import { engineCandidates } from "@/lib/intel/candidates";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { ACTION_STATUS_LABEL } from "@/components/ax/StatusBadges";
import { Assumption, Panel, TD, TH } from "./Signals";
import { useIntelState } from "./useIntel";

const KIND_LABEL: Record<ReturnFinding["kind"], string> = {
  size: "사이즈 집중",
  product: "상품",
  segment: "고객군",
  "fit-profile": "핏 프로필 효과",
};
const p1 = (x: number) => `${(x * 100).toFixed(1)}%`;

export function ReturnIntelPanel() {
  const d = useIntelState();
  const actions = useApp((s) => s.actions);
  const role = useApp((s) => s.role);
  const create = useApp((s) => s.createActionFromCandidate);
  const actor = ROLE_NAME[role === "customer" ? "owner" : role];
  const ri = useMemo(() => returnIntel(d), [d]);
  const cands = useMemo(() => engineCandidates(d, actions), [d, actions]);
  const fitAction = (productId?: string) =>
    productId
      ? actions.find((a) => a.type === "fit-guide" && a.productId === productId && a.status !== "dismissed")
      : undefined;

  const register = (productId: string) => {
    const c = cands.find((x) => x.key === `fit:${productId}`);
    if (!c) return;
    create(c, actor);
    toast("핏 안내 개선 과제 등록", `${c.title} — 실행 센터에서 검토합니다.`, "success");
  };

  return (
    <Panel
      id="findings"
      tour="return-intel"
      className="mt-6"
      title={
        <span className="inline-flex items-center gap-1.5">
          <Microscope size={15} className="text-theme-primary" aria-hidden />
          반품 패턴 판독
        </span>
      }
      sub={`90일 전체 기록 · 반품 ${ri.totalReturns}건 ÷ 판매 ${ri.totalUnits.toLocaleString("ko-KR")}개 = ${p1(ri.overallRate)} · 사이즈·핏 사유 ${p1(ri.sizeRate)} — 표본이 기준 미만이면 패턴으로 말하지 않습니다`}
    >
      {/* 사유 분포 한 줄 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-neutral-border px-4 py-2 text-[0.78rem]">
        {ri.byReason.map((r) => (
          <span key={r.reason} className="tabular whitespace-nowrap">
            <span className="text-neutral-text2">{RETURN_REASON_LABEL[r.reason]}</span> <b>{r.count}</b>
            <span className="text-neutral-text2"> ({Math.round(r.share * 100)}%)</span>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="bg-neutral-canvas/40">
              <th className={TH}>유형</th>
              <th className={TH}>발견 · 근거</th>
              <th className={cn(TH, "text-right")}>표본</th>
              <th className={cn(TH, "text-right")}>비율 / 기준</th>
              <th className={cn(TH, "text-right")}>기준 대비</th>
              <th className={TH}>권장 · 다음 행동</th>
            </tr>
          </thead>
          <tbody>
            {ri.findings.map((f) => {
              const a = fitAction(f.productId);
              const canRegister =
                f.kind === "size" && f.productId && !a && cands.some((c) => c.key === `fit:${f.productId}`);
              return (
                <tr
                  key={f.id}
                  className="border-t border-neutral-border/70 hover:bg-neutral-canvas/40"
                  data-finding={f.id}
                >
                  <td className={cn(TD, "whitespace-nowrap text-[0.78rem] font-semibold text-neutral-text2")}>
                    {KIND_LABEL[f.kind]}
                  </td>
                  <td className={cn(TD, "min-w-[18rem]")}>
                    <p className="font-semibold leading-snug">{f.title}</p>
                    <p className="text-[0.78rem] leading-snug text-neutral-text2">{f.evidence}</p>
                  </td>
                  <td className={cn(TD, "tabular text-right")}>{f.support}건</td>
                  <td className={cn(TD, "tabular whitespace-nowrap text-right")}>
                    {p1(f.rate)} <span className="text-neutral-text2">/ {p1(f.baseline)}</span>
                  </td>
                  <td
                    className={cn(
                      TD,
                      "tabular whitespace-nowrap text-right font-bold",
                      f.kind === "fit-profile"
                        ? "text-semantic-success"
                        : f.lift >= 2
                          ? "text-semantic-error"
                          : "text-[#b45309]",
                    )}
                  >
                    {f.kind === "fit-profile"
                      ? `−${Math.round((1 - f.rate / f.baseline) * 100)}%`
                      : `${f.lift.toFixed(1)}×`}
                  </td>
                  <td className={cn(TD, "min-w-[15rem] text-[0.8rem] leading-snug")}>
                    {f.recommendation}
                    <span className="mt-1 block">
                      {a ? (
                        <Link
                          href={`/ax/actions?open=${a.id}`}
                          className="inline-flex min-h-11 items-center gap-1 font-semibold text-theme-primary hover:underline md:min-h-0"
                        >
                          <Zap size={12} aria-hidden />핏 안내 과제 · {ACTION_STATUS_LABEL[a.status]}
                        </Link>
                      ) : canRegister ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="!h-11 md:!h-8"
                          icon={<Plus size={13} />}
                          onClick={() => register(f.productId!)}
                        >
                          핏 안내 개선 과제 등록
                        </Button>
                      ) : null}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid border-t border-neutral-border lg:grid-cols-[1.5fr_1fr]">
        <FitLoop />
        <ProfileEffect e={ri.profileEffect} />
      </div>
    </Panel>
  );
}

/** 시나리오 B의 Fit Closed Loop — 단계마다 지금 상태를 데이터로 판정한다 */
function FitLoop() {
  const d = useIntelState();
  const actions = useApp((s) => s.actions);
  const pid = SCENARIO.B_PRODUCT;
  const p = PRODUCT_BY_ID[pid];
  const ri = useMemo(() => returnIntel(d), [d]);
  const imp = useMemo(() => fitGuideImpact(pid, d), [d, pid]);
  const finding = ri.findings.find((f) => f.kind === "size" && f.productId === pid);
  const a = actions.find((x) => x.type === "fit-guide" && x.productId === pid && x.status !== "dismissed");
  const changed = !!d.fitNoteOverride[pid];
  const steps = [
    { label: "반품 사유 구조화", detail: `사이즈 사유 반품 ${imp.sizeReturns}건 기록`, done: imp.sizeReturns > 0 },
    {
      label: "패턴 발견",
      detail: finding
        ? `${finding.size} '${finding.direction === "small" ? "작음" : "큼"}' · ${finding.lift.toFixed(1)}×`
        : "표본 부족",
      done: !!finding,
    },
    {
      label: "핏 안내 개선 과제",
      detail: a ? ACTION_STATUS_LABEL[a.status] : "미등록",
      done: !!a && a.status === "done",
      active: !!a && a.status !== "done",
    },
    { label: "상세·추천 규칙 변경", detail: changed ? "안내 변경 · 추천 +1 보정" : "원본 안내", done: changed },
    {
      label: "반품률 재측정",
      detail: changed ? `${p1(imp.before)} → 목표 ${p1(imp.target)} (D+30)` : `현재 ${p1(imp.before)}`,
      done: false,
      active: changed,
    },
  ];
  return (
    <div className="min-w-0 p-4" data-tour="fit-loop">
      <p className="mb-2.5 flex flex-wrap items-center gap-x-2 text-[0.84rem] font-bold">
        <RefreshCcw size={14} className="text-theme-primary" aria-hidden />핏 개선 순환{" "}
        <span className="font-normal text-neutral-text2">— {p.name}</span>
      </p>
      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={cn(
              "rounded-lg border p-2",
              s.done
                ? "border-semantic-success/40 bg-[#ecf8f0]"
                : s.active
                  ? "border-theme-primary/40 bg-theme-soft"
                  : "border-neutral-border",
            )}
          >
            <p className="flex items-center gap-1 text-[0.72rem] font-semibold text-neutral-text2">
              {s.done ? (
                <Check size={12} className="text-semantic-success" aria-label="완료" />
              ) : (
                <CircleDashed size={12} aria-label={s.active ? "진행 중" : "대기"} />
              )}
              {i + 1}
            </p>
            <p className="text-[0.8rem] font-bold leading-snug">{s.label}</p>
            <p className="tabular text-[0.72rem] leading-snug text-neutral-text2">{s.detail}</p>
          </li>
        ))}
      </ol>
      <Assumption className="mt-2">{imp.assumption}</Assumption>
    </div>
  );
}

function ProfileEffect({ e }: { e: ReturnType<typeof returnIntel>["profileEffect"] }) {
  const rows = [
    { label: "핏 프로필 있음", rate: e.withProfile, units: e.unitsWith, good: true },
    { label: "프로필 없는 회원", rate: e.withoutProfile, units: e.unitsWithout },
    { label: "비회원(첫 구매)", rate: e.guest, units: e.unitsGuest },
  ];
  const max = Math.max(0.001, ...rows.map((r) => r.rate));
  return (
    <div className="min-w-0 border-t border-neutral-border p-4 lg:border-l lg:border-t-0" data-tour="profile-effect">
      <p className="mb-2 text-[0.84rem] font-bold">
        핏 프로필과 사이즈 반품 <span className="font-normal text-neutral-text2">— 핏 추천의 근거</span>
      </p>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[7.5rem_1fr_3.2rem] items-center gap-2 text-[0.78rem]">
            <span className={cn(r.good && "font-semibold")}>{r.label}</span>
            <span className="h-2 rounded-full bg-neutral-canvas" aria-hidden>
              <span
                className={cn("block h-full rounded-full", r.good ? "bg-semantic-success" : "bg-neutral-text2/50")}
                style={{ width: `${(r.rate / max) * 100}%` }}
              />
            </span>
            <span className="tabular text-right font-semibold">{p1(r.rate)}</span>
          </li>
        ))}
      </ul>
      <p className="tabular mt-1.5 text-[0.72rem] text-neutral-text2">
        판매 {e.unitsWith} · {e.unitsWithout} · {e.unitsGuest}개 기준
      </p>
      <Assumption className="mt-1">
        데모 데이터의 가설입니다 — 실증에서 같은 기간·같은 상품군으로 비교해 검증합니다.
      </Assumption>
    </div>
  );
}
