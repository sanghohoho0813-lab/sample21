"use client";
/* ------------------------------------------------------------------
   고객 Lifecycle (AX) — 첫 구매 → 핏 학습 → 재구매 → 찜·재입고 → 반품이
   고객 Profile에 어떻게 쌓였는지, 그래서 다음에 무엇을 할지.
------------------------------------------------------------------- */
import { useMemo } from "react";
import { Check, CircleDashed, Ruler } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtDate } from "@/lib/dates";
import { customerLifecycle, FIT_GROUP_LABEL } from "@/lib/intel/lifecycle";
import { useIntelState } from "./useIntel";

const KIND_DOT: Record<string, string> = {
  order: "bg-theme-primary",
  return: "bg-semantic-warning",
  restock: "bg-semantic-info",
  notice: "bg-semantic-success",
  fit: "bg-brand-accent",
};

export function LifecyclePanel({ customerId }: { customerId: string }) {
  const d = useIntelState();
  const lc = useMemo(() => customerLifecycle(customerId, d), [customerId, d]);
  return (
    <div className="space-y-3" data-tour="customer-lifecycle">
      <p className="font-bold">Lifecycle · Profile 누적</p>
      <ol className="grid grid-cols-5 gap-1" aria-label="고객 Lifecycle 단계">
        {lc.stages.map((s, i) => (
          <li
            key={s.key}
            className={cn(
              "min-w-0 rounded-lg border p-1.5",
              s.reached ? "border-theme-primary/30 bg-theme-soft" : "border-neutral-border bg-white",
            )}
            title={s.detail}
          >
            <p className="flex items-center gap-1 text-[0.68rem] font-semibold text-neutral-text2">
              {s.reached ? (
                <Check size={11} className="text-theme-primary" aria-label="도달" />
              ) : (
                <CircleDashed size={11} aria-label="미도달" />
              )}
              {i + 1}
            </p>
            <p className="truncate text-[0.74rem] font-bold">{s.label}</p>
            <p className="line-clamp-2 text-[0.66rem] leading-tight text-neutral-text2">{s.detail}</p>
          </li>
        ))}
      </ol>

      {lc.fit.length > 0 && (
        <div className="rounded-lg border border-neutral-border p-2.5">
          <p className="mb-1 flex items-center gap-1 text-[0.8rem] font-bold">
            <Ruler size={13} aria-hidden />
            학습된 사이즈
          </p>
          <ul className="space-y-1 text-[0.78rem]">
            {lc.fit.map((f) => (
              <li key={f.group}>
                <b>
                  {FIT_GROUP_LABEL[f.group]} {f.size}
                </b>
                {f.corrected && <span className="ml-1 font-semibold text-[#b45309]">반품에서 보정</span>}
                <span className="block text-neutral-text2">{f.evidence.slice(0, 2).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tabular grid grid-cols-4 gap-1.5 text-center text-[0.72rem]">
        {[
          ["주문", `${lc.metrics.orders}회`],
          ["반품률", `${Math.round(lc.metrics.returnRate * 100)}%`],
          ["구매 주기", lc.metrics.avgGapDays ? `${lc.metrics.avgGapDays}일` : "-"],
          ["마지막 구매", lc.metrics.daysSince !== null ? `${lc.metrics.daysSince}일 전` : "-"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-neutral-canvas px-1 py-1.5">
            <p className="text-neutral-text2">{k}</p>
            <p className="text-[0.82rem] font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-theme-primary/30 bg-theme-soft/50 p-2.5 text-[0.8rem]">
        <p className="font-bold">다음 행동 · {lc.next.label}</p>
        <p className="text-neutral-text2">{lc.next.reason}</p>
      </div>

      {lc.events.length > 0 && (
        <ol className="relative space-y-1.5 border-l border-neutral-border pl-3 text-[0.76rem]" aria-label="행동 기록">
          {lc.events.slice(0, 8).map((e, i) => (
            <li key={i} className="relative">
              <span
                className={cn("absolute -left-[17px] top-1.5 h-2 w-2 rounded-full", KIND_DOT[e.kind])}
                aria-hidden
              />
              <span className="tabular text-neutral-text2">{fmtDate(e.at)}</span> <b>{e.title}</b>
              {e.detail && <span className="block truncate text-neutral-text2">{e.detail}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
