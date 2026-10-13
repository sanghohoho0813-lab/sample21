"use client";
/* 내 핏 학습 — 구매하고 유지하거나 반품한 기록이 다음 추천 사이즈가 된다 (고객 화면) */
import { useMemo } from "react";
import { History, Sparkles } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useApp } from "@/lib/store";
import { DEMO_CUSTOMER_ID } from "@/lib/demo/seed";
import { fmtDate } from "@/lib/dates";
import { customerLifecycle, FIT_GROUP_LABEL } from "@/lib/intel/lifecycle";

export function FitLearningCard() {
  const d = useApp(
    useShallow((s) => ({
      orders: s.orders,
      returns: s.returns,
      orderStatusOverride: s.orderStatusOverride,
      restockSubs: s.restockSubs,
      fitProfile: s.fitProfile,
    })),
  );
  const lc = useMemo(() => customerLifecycle(DEMO_CUSTOMER_ID, d), [d]);
  const first = lc.stages[0];
  return (
    <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6" data-tour="c-fit-learning">
      <p className="flex items-center gap-2 text-[1.05rem] font-bold">
        <Sparkles size={18} className="text-brand-accent" />내 핏 학습
      </p>
      <p className="mt-1 text-[0.88rem] leading-relaxed text-neutral-text2">
        입어보고 유지한 사이즈, 사이즈 때문에 반품한 기록이 다음 추천에 반영돼요.
      </p>
      {lc.fit.length ? (
        <ul className="mt-4 space-y-3">
          {lc.fit.map((f) => (
            <li key={f.group} className="flex items-start gap-3 rounded-2xl bg-brand-ivory px-4 py-3">
              <span className="tabular flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-black text-[1.15rem] font-black text-white">
                {f.size}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.95rem] font-bold">
                  {FIT_GROUP_LABEL[f.group]} 추천 {f.size}
                  {f.corrected && (
                    <span className="ml-1.5 text-[0.8rem] font-semibold text-brand-accent">반품 기록으로 조정</span>
                  )}
                </span>
                <span className="block text-[0.85rem] leading-snug text-neutral-text2">{f.evidence[0]}</span>
                {f.evidence.length > 1 && (
                  <span className="block text-[0.8rem] text-neutral-text2">외 기록 {f.evidence.length - 1}건</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-brand-ivory px-4 py-3 text-[0.9rem] text-neutral-text2">
          아직 받아본 주문이 없어요. 첫 구매 후 유지한 사이즈부터 학습합니다.
        </p>
      )}
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-neutral-border px-2 py-2.5">
          <dt className="text-[0.78rem] text-neutral-text2">첫 구매</dt>
          <dd className="tabular text-[0.9rem] font-bold">{first.at ? fmtDate(first.at).slice(2) : "-"}</dd>
        </div>
        <div className="rounded-xl border border-neutral-border px-2 py-2.5">
          <dt className="text-[0.78rem] text-neutral-text2">구매</dt>
          <dd className="tabular text-[0.9rem] font-bold">{lc.metrics.orders}회</dd>
        </div>
        <div className="rounded-xl border border-neutral-border px-2 py-2.5">
          <dt className="text-[0.78rem] text-neutral-text2">재입고 대기</dt>
          <dd className="tabular text-[0.9rem] font-bold">{lc.metrics.restockWaiting}개</dd>
        </div>
      </dl>
      <p className="mt-3 flex items-center gap-1.5 text-[0.8rem] text-neutral-text2">
        <History size={13} />
        학습은 이 브라우저의 데모 기록으로만 계산돼요.
      </p>
    </section>
  );
}
