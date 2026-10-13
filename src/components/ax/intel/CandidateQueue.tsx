"use client";
/* ------------------------------------------------------------------
   신호 엔진 후보 큐 — 지금 데이터에서 '새로' 찾은 과제 후보.
   자동 실행하지 않는다: 운영자가 근거를 보고 '과제로 등록'해야 실행 센터로 들어간다.
------------------------------------------------------------------- */
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Radar } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp, ROLE_NAME } from "@/lib/store";
import { engineCandidates, type Candidate } from "@/lib/intel/candidates";
import { PATTERN_META, type PatternCode } from "@/lib/intel/signals";
import { ACTION_TYPE_LABEL } from "@/components/ax/core/shared";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Panel, PatternTag, ScoreBar, scoreTone, TD, TH } from "./Signals";
import { useIntelState } from "./useIntel";

const patternLabel = (c: Candidate) =>
  c.pattern === "return-pattern" ? "반품 패턴" : c.pattern === "markdown-decision" ? "할인 근거 통과" : null;

export function CandidateQueue({ onCreated }: { onCreated?: (id: string) => void }) {
  const d = useIntelState();
  const actions = useApp((s) => s.actions);
  const role = useApp((s) => s.role);
  const create = useApp((s) => s.createActionFromCandidate);
  const cands = useMemo(() => engineCandidates(d, actions), [d, actions]);
  const [open, setOpen] = useState<string | null>(null);
  const actor = ROLE_NAME[role === "customer" ? "owner" : role];

  const register = (c: Candidate) => {
    const id = create(c, actor);
    toast("과제로 등록", `${c.title} — 실행 센터에서 검토·승인·실행합니다.`, "success");
    onCreated?.(id);
  };

  return (
    <Panel
      tour="engine-candidates"
      title={
        <span className="inline-flex items-center gap-1.5">
          <Radar size={15} className="text-theme-primary" aria-hidden />
          신호 엔진이 새로 찾은 후보
        </span>
      }
      sub="고객 행동(조회·찜·장바구니·재입고 신청·반품)에서 나온 후보 · 등록 전에는 아무것도 실행되지 않습니다"
      right={<span className="tabular text-[0.8rem] font-bold">{cands.length}건</span>}
    >
      {cands.length === 0 ? (
        <p className="px-4 py-4 text-[0.84rem] text-neutral-text2">
          새 후보가 없습니다 — 신호가 강한 SKU는 모두 과제로 다루고 있습니다.
        </p>
      ) : (
        <>
          {/* 데스크톱: 표 */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-canvas/40">
                  <th className={TH}>심각도</th>
                  <th className={TH}>판독</th>
                  <th className={TH}>후보 과제 · 왜 지금</th>
                  <th className={cn(TH, "text-right")}>영향</th>
                  <th className={cn(TH, "text-right")}>처리</th>
                </tr>
              </thead>
              <tbody>
                {cands.map((c) => (
                  <tr
                    key={c.key}
                    className="border-t border-neutral-border/70 hover:bg-neutral-canvas/40"
                    data-candidate={c.key}
                  >
                    <td className={TD}>
                      <ScoreBar
                        value={c.severity}
                        tone={scoreTone(c.severity)}
                        label={`심각도 ${Math.round(c.severity)}`}
                      />
                    </td>
                    <td className={cn(TD, "whitespace-nowrap")}>
                      {patternLabel(c) ? (
                        <span className="text-[0.8rem] font-semibold text-[#b45309]">{patternLabel(c)}</span>
                      ) : (
                        <PatternTag code={c.pattern as PatternCode} />
                      )}
                      <span className="mt-0.5 block text-[0.75rem] text-neutral-text2">
                        {ACTION_TYPE_LABEL[c.type]}
                      </span>
                    </td>
                    <td className={TD}>
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-[0.8rem] leading-snug text-neutral-text2">{c.why}</p>
                      {open === c.key && (
                        <ul className="mt-1.5 space-y-0.5 text-[0.78rem] text-neutral-text2">
                          {c.reasons.slice(1).map((r) => (
                            <li key={r}>· {r}</li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpen(open === c.key ? null : c.key)}
                        className="mt-0.5 inline-flex items-center gap-0.5 text-[0.76rem] font-semibold text-theme-primary hover:underline"
                        aria-expanded={open === c.key}
                      >
                        {open === c.key ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        근거 {open === c.key ? "접기" : "더 보기"}
                      </button>
                    </td>
                    <td className={cn(TD, "tabular whitespace-nowrap text-right text-[0.8rem]")}>{c.impactLabel}</td>
                    <td className={cn(TD, "whitespace-nowrap text-right")}>
                      <Button size="sm" className="!h-9" icon={<Plus size={14} />} onClick={() => register(c)}>
                        과제로 등록
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 모바일: 행 카드 */}
          <ul className="divide-y divide-neutral-border md:hidden">
            {cands.map((c) => (
              <li key={c.key} className="space-y-1.5 px-4 py-3" data-candidate={c.key}>
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreBar value={c.severity} tone={scoreTone(c.severity)} />
                  {patternLabel(c) ? (
                    <span className="text-[0.8rem] font-semibold text-[#b45309]">{patternLabel(c)}</span>
                  ) : (
                    <PatternTag code={c.pattern as PatternCode} />
                  )}
                  <span className="text-[0.76rem] text-neutral-text2">{ACTION_TYPE_LABEL[c.type]}</span>
                </div>
                <p className="text-[0.9rem] font-semibold">{c.title}</p>
                <p className="text-[0.82rem] leading-snug text-neutral-text2">{c.why}</p>
                <p className="tabular text-[0.8rem]">{c.impactLabel}</p>
                <Button size="md" className="w-full" icon={<Plus size={16} />} onClick={() => register(c)}>
                  과제로 등록
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="border-t border-neutral-border px-4 py-2 text-[0.75rem] text-neutral-text2">
        판독 기준:{" "}
        {Object.values(PATTERN_META)
          .slice(0, 5)
          .map((m) => m.label)
          .join(" · ")}{" "}
        —{" "}
        <Link
          href="/ax/inventory#signals"
          className="inline-flex min-h-11 items-center font-semibold text-theme-primary hover:underline md:min-h-0"
        >
          전체 SKU 신호 판독 보기
        </Link>
      </p>
    </Panel>
  );
}
