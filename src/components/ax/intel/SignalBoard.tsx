"use client";
/* ------------------------------------------------------------------
   SKU 신호 판독 보드 — 조회·찜·장바구니·구매전환·반품·재고 신호의 '조합'을
   하나의 판독(패턴)으로 바꾸고, 왜 지금 봐야 하는지 숫자 한 문장으로 말한다.
   점수 하나로 줄 세우는 레이더와 달리, 운영자가 '무슨 문제인가'를 먼저 읽는다.
------------------------------------------------------------------- */
import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, ScanSearch, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp, ROLE_NAME } from "@/lib/store";
import { BRAND_BY_ID, PRODUCT_BY_ID } from "@/lib/demo/seed";
import { ATTENTION_CODES, PATTERN_META, type PatternCode } from "@/lib/intel/signals";
import { restockRequestFor } from "@/lib/intel/candidates";
import type { ActionType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Assumption, Panel, PatternTag, ScoreBar, scoreTone, SignalChips, TD, TH } from "./Signals";
import { useIntelState, useReadings } from "./useIntel";

const won = (n: number) => `${Math.round(n / 10_000).toLocaleString("ko-KR")}만`;
const PAGE = 12;

export function SignalBoard() {
  const readings = useReadings();
  const d = useIntelState();
  const actions = useApp((s) => s.actions);
  const role = useApp((s) => s.role);
  const create = useApp((s) => s.createActionFromCandidate);
  const actor = ROLE_NAME[role === "customer" ? "owner" : role];
  const [code, setCode] = useState<PatternCode | "all">("all");
  const [limit, setLimit] = useState(PAGE);

  const attention = useMemo(() => readings.filter((r) => ATTENTION_CODES.includes(r.pattern.code)), [readings]);
  const summary = useMemo(
    () =>
      ATTENTION_CODES.map((c) => {
        const rows = attention.filter((r) => r.pattern.code === c);
        return { code: c, n: rows.length, impact: rows.reduce((s, r) => s + r.pattern.impactKrw, 0) };
      }),
    [attention],
  );
  const rows = code === "all" ? attention : attention.filter((r) => r.pattern.code === code);
  const openAction = (variantId: string, productId: string, type: string | null) =>
    actions.find(
      (a) =>
        a.status !== "dismissed" &&
        a.status !== "done" &&
        (a.variantId === variantId || (type !== "restock" && a.productId === productId && a.type === type)),
    );

  const register = (variantId: string) => {
    const c = restockRequestFor(variantId, d, actor);
    if (!c) return;
    create(c, actor);
    toast("과제로 등록", `${c.title} — 실행 센터에서 검토·승인합니다.`, "success");
  };

  return (
    <Panel
      id="signals"
      tour="signal-board"
      title={
        <span className="inline-flex items-center gap-1.5">
          <ScanSearch size={15} className="text-theme-primary" aria-hidden />
          SKU 신호 판독
        </span>
      }
      sub="조회·찜·장바구니·구매전환·반품·재고의 조합 → 무슨 문제인가 · 왜 지금인가 · 무엇을 할까"
      right={
        <span className="tabular text-[0.8rem] text-neutral-text2">
          전체 {readings.length}개 옵션 중 주의 {attention.length}개
        </span>
      }
    >
      {/* 패턴 요약 — 누르면 필터 */}
      <div
        className="grid grid-cols-2 border-b border-neutral-border sm:grid-cols-3 lg:grid-cols-5"
        role="group"
        aria-label="판독 패턴 필터"
      >
        {summary.map((s, i) => {
          const m = PATTERN_META[s.code];
          const active = code === s.code;
          return (
            <button
              key={s.code}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCode(active ? "all" : s.code);
                setLimit(PAGE);
              }}
              className={cn(
                "min-h-[64px] border-neutral-border px-3 py-2 text-left transition-colors hover:bg-neutral-canvas",
                i > 0 && "border-l",
                active && "bg-theme-soft hover:bg-theme-soft",
              )}
            >
              <PatternTag code={s.code} />
              <span className="mt-0.5 flex items-baseline gap-2">
                <span className="tabular text-[1.1rem] font-bold">{s.n}</span>
                <span className="tabular text-[0.75rem] text-neutral-text2">
                  {s.impact > 0 ? `영향 ${won(s.impact)} 원` : ""}
                </span>
              </span>
              <span className="block text-[0.72rem] leading-tight text-neutral-text2">{m.desc}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-5 text-[0.84rem] text-neutral-text2">이 패턴에 해당하는 옵션이 없습니다.</p>
      ) : (
        <>
          {/* 데스크톱 표 */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-canvas/40">
                  <th className={TH}>심각도</th>
                  <th className={TH}>상품 · 옵션</th>
                  <th className={TH}>판독</th>
                  <th className={TH}>신호 조합 (7일, 직전 7일 대비)</th>
                  <th className={TH}>왜 지금 봐야 하나</th>
                  <th className={cn(TH, "text-right")}>영향</th>
                  <th className={cn(TH, "text-right")}>다음 행동</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map(({ signals: s, pattern: pt }) => {
                  const v = s.variant;
                  const p = PRODUCT_BY_ID[v.productId];
                  const a = openAction(v.id, p.id, pt.action);
                  return (
                    <tr
                      key={v.id}
                      className="border-t border-neutral-border/70 hover:bg-neutral-canvas/40"
                      data-signal-row={v.id}
                    >
                      <td className={TD}>
                        <ScoreBar value={pt.severity} tone={scoreTone(pt.severity)} />
                      </td>
                      <td className={cn(TD, "min-w-[11rem]")}>
                        <Link
                          href={`/ax/products/${p.id}?tab=options`}
                          className="font-semibold leading-snug hover:text-theme-primary"
                        >
                          {p.name}
                        </Link>
                        <span className="block text-[0.76rem] text-neutral-text2">
                          {v.color} · {v.size} · {BRAND_BY_ID[p.brandId].name}
                        </span>
                      </td>
                      <td className={cn(TD, "whitespace-nowrap")}>
                        <PatternTag code={pt.code} />
                      </td>
                      <td className={cn(TD, "min-w-[15rem]")}>
                        <SignalChips chips={pt.chips} />
                      </td>
                      <td className={cn(TD, "min-w-[16rem] text-[0.8rem] leading-snug")}>{pt.why}</td>
                      <td className={cn(TD, "tabular whitespace-nowrap text-right text-[0.78rem]")}>
                        {pt.impactLabel}
                      </td>
                      <td className={cn(TD, "whitespace-nowrap text-right")}>
                        <NextStep
                          actionId={a?.id}
                          actionLabel={pt.actionLabel}
                          type={pt.action}
                          productId={p.id}
                          onRegister={() => register(v.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* 모바일·태블릿 카드 */}
          <ul className="divide-y divide-neutral-border lg:hidden">
            {rows.slice(0, limit).map(({ signals: s, pattern: pt }) => {
              const v = s.variant;
              const p = PRODUCT_BY_ID[v.productId];
              const a = openAction(v.id, p.id, pt.action);
              return (
                <li key={v.id} className="space-y-1.5 px-4 py-3" data-signal-row={v.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <ScoreBar value={pt.severity} tone={scoreTone(pt.severity)} />
                    <PatternTag code={pt.code} />
                  </div>
                  <Link
                    href={`/ax/products/${p.id}?tab=options`}
                    className="flex min-h-11 flex-wrap items-center gap-x-1 text-[0.92rem] font-semibold hover:text-theme-primary"
                  >
                    {p.name}{" "}
                    <span className="font-normal text-neutral-text2">
                      · {v.color} · {v.size}
                    </span>
                  </Link>
                  <SignalChips chips={pt.chips} />
                  <p className="text-[0.82rem] leading-snug">{pt.why}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular text-[0.78rem] text-neutral-text2">{pt.impactLabel}</span>
                    <NextStep
                      actionId={a?.id}
                      actionLabel={pt.actionLabel}
                      type={pt.action}
                      productId={p.id}
                      onRegister={() => register(v.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {rows.length > limit && (
            <div className="border-t border-neutral-border px-4 py-2 text-center">
              <Button size="sm" variant="ghost" className="!h-11 md:!h-9" onClick={() => setLimit((n) => n + PAGE)}>
                더 보기 ({rows.length - limit}개 남음)
              </Button>
            </div>
          )}
        </>
      )}
      <div className="border-t border-neutral-border px-4 py-2">
        <Assumption>
          증감률은 조회 30회·찜/장바구니 6건 이상일 때만 신호로 봅니다(적은 물량의 % 변화는 우연). 영향 금액은 리드타임
          동안 놓칠 매출·묶인 재고·반품 처리비(건당 7,000원 가정)의 추정입니다.
        </Assumption>
      </div>
    </Panel>
  );
}

const NEXT_HREF: Partial<Record<ActionType, (productId: string) => string>> = {
  "fit-guide": () => "/ax/fit-returns#findings",
  "cart-reminder": () => "/ax/actions?type=cart-reminder",
  markdown: (id) => `/ax/products/${id}?tab=markdown`,
};

function NextStep({
  actionId,
  actionLabel,
  type,
  productId,
  onRegister,
}: {
  actionId?: string;
  actionLabel: string;
  type: ActionType | null;
  productId: string;
  onRegister: () => void;
}) {
  if (actionId)
    return (
      <Link
        href={`/ax/actions?open=${actionId}`}
        className="inline-flex min-h-11 items-center gap-1 text-[0.8rem] font-semibold text-theme-primary hover:underline lg:min-h-0"
      >
        <Zap size={13} aria-hidden />
        과제 진행 중
      </Link>
    );
  if (type === "restock")
    return (
      <Button size="sm" variant="outline" className="!h-11 lg:!h-8" icon={<Plus size={13} />} onClick={onRegister}>
        {actionLabel}
      </Button>
    );
  const href = (type && NEXT_HREF[type]?.(productId)) ?? `/ax/products/${productId}?tab=options`;
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center text-[0.8rem] font-semibold text-theme-primary hover:underline lg:min-h-0"
    >
      {actionLabel}
    </Link>
  );
}
