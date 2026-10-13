"use client";
/* ------------------------------------------------------------------
   상품 단위 Intelligence — 상품 상세(AX)에 붙는 세 가지 판단 도구
   · ReadingBar: 이 상품을 왜 봐야 하는가 (관심·전환 추세 + 원인 한 문장)
   · OptionMatrixView: 색상×사이즈 재고·판매·판독 + 사이즈 커브(판매 비중 vs 재고 비중)
   · MarkdownSimulator: 할인 근거 체크 → 할인율별 시즌 손익 시뮬레이션 → 과제 등록
------------------------------------------------------------------- */
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgePercent, Grid3x3, Plus, ScanSearch, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp, ROLE_NAME } from "@/lib/store";
import type { Product } from "@/lib/types";
import { INVENTORY_STATUS_LABEL } from "@/lib/kpi";
import { optionMatrix, productReading } from "@/lib/intel/options";
import { PATTERN_META } from "@/lib/intel/signals";
import { bestRate, currentRate, markdownDecision, seasonNet, SIM_ASSUMPTIONS } from "@/lib/intel/markdown";
import { markdownRequestFor, restockRequestFor } from "@/lib/intel/candidates";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Assumption, Panel, PatternTag, TD, TH } from "./Signals";
import { useIntelState } from "./useIntel";

const pctS = (x: number) => `${x >= 0 ? "+" : "−"}${Math.round(Math.abs(x) * 100)}%`;
const wonS = (n: number) =>
  Math.abs(n) >= 10_000
    ? `${Math.round(n / 10_000).toLocaleString("ko-KR")}만`
    : `${Math.round(n).toLocaleString("ko-KR")}`;

/* ------------------------------ 판독 헤드라인 ------------------------------ */
export function ReadingBar({ product }: { product: Product }) {
  const d = useIntelState();
  const r = useMemo(() => productReading(product, d), [product, d]);
  const items = [
    { label: "조회", t: r.views, good: r.views.delta >= 0 },
    { label: "찜", t: r.wishlist, good: r.wishlist.delta >= 0 },
    { label: "장바구니", t: r.cart, good: r.cart.delta >= 0 },
    { label: "구매전환", t: r.conversion, good: r.conversion.delta >= 0, rate: true },
  ];
  const tone = r.top ? PATTERN_META[r.top.pattern.code].tone : "neutral";
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-white px-4 py-3 md:flex-row md:items-center",
        tone === "error" ? "border-semantic-error/40" : "border-neutral-border",
      )}
      data-tour="product-reading"
    >
      <p className="flex min-w-0 flex-1 items-start gap-2 text-[0.9rem] font-semibold leading-snug">
        <ScanSearch size={16} className="mt-0.5 shrink-0 text-theme-primary" aria-hidden />
        <span className="min-w-0">
          <span className="mr-1.5 text-[0.75rem] font-bold text-neutral-text2">판독</span>
          {r.headline}
        </span>
      </p>
      <dl className="tabular grid shrink-0 grid-cols-2 gap-x-4 gap-y-1.5 text-[0.76rem] sm:grid-cols-4 sm:gap-3">
        {items.map((it) => (
          <div key={it.label} className="min-w-0">
            <dt className="text-neutral-text2">{it.label}</dt>
            <dd className="whitespace-nowrap">
              <b className="text-[0.86rem]">
                {it.rate ? `${(it.t.now * 100).toFixed(1)}%` : it.t.now.toLocaleString("ko-KR")}
              </b>{" "}
              <span
                className={cn(
                  "font-semibold",
                  Math.abs(it.t.delta) < 0.1
                    ? "text-neutral-text2"
                    : it.good
                      ? "text-semantic-success"
                      : "text-semantic-error",
                )}
              >
                {pctS(it.t.delta)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------ 옵션 매트릭스 ------------------------------ */
const CELL_TONE: Record<string, string> = {
  soldout: "bg-[#fdecec] border-semantic-error/40",
  low: "bg-[#fff6ea] border-semantic-warning/50",
  overstock: "bg-neutral-canvas border-neutral-border",
  slow: "bg-neutral-canvas border-neutral-border",
  rising: "bg-theme-soft border-theme-primary/30",
  "restock-review": "bg-[#eef3ff] border-semantic-info/40",
  "restock-progress": "bg-[#eef3ff] border-semantic-info/40",
  restocked: "bg-[#ecf8f0] border-semantic-success/40",
  normal: "bg-white border-neutral-border",
};

export function OptionMatrixView({ product }: { product: Product }) {
  const d = useIntelState();
  const actions = useApp((s) => s.actions);
  const role = useApp((s) => s.role);
  const create = useApp((s) => s.createActionFromCandidate);
  const actor = ROLE_NAME[role === "customer" ? "owner" : role];
  const m = useMemo(() => optionMatrix(product, d), [product, d]);
  const maxShare = Math.max(0.01, ...m.sizeCurve.flatMap((c) => [c.salesShare, c.stockShare]));

  const register = (variantId: string) => {
    const c = restockRequestFor(variantId, d, actor);
    if (!c) return;
    create(c, actor);
    toast("재입고 과제 등록", `${c.title} — 실행 센터에서 검토·승인합니다.`, "success");
  };

  return (
    <Panel
      id="options"
      tour="option-matrix"
      title={
        <span className="inline-flex items-center gap-1.5">
          <Grid3x3 size={15} className="text-theme-primary" aria-hidden />
          옵션 판단 — 색상 × 사이즈
        </span>
      }
      sub="칸마다 재고 · 7일 판매 · 재입고 신청 · 판독. 품절인데 신청이 쌓인 칸이 가장 먼저 볼 곳입니다."
    >
      <div className="grid gap-0 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 overflow-x-auto p-3">
          <table className="w-full min-w-[420px] border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="w-20 text-left text-[0.75rem] font-semibold text-neutral-text2">색상＼사이즈</th>
                {m.sizes.map((sz) => (
                  <th key={sz} className="text-center text-[0.8rem] font-bold">
                    {sz}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.colors.map((color) => (
                <tr key={color}>
                  <th scope="row" className="pr-1 text-left text-[0.8rem] font-semibold">
                    {color}
                  </th>
                  {m.sizes.map((sz) => {
                    const c = m.cells[color]?.[sz];
                    if (!c) return <td key={sz} className="rounded-lg bg-neutral-canvas/40" aria-label="옵션 없음" />;
                    const v = c.signals.variant;
                    const attention = c.pattern.severity >= 50 && c.pattern.action === "restock";
                    const open = actions.find(
                      (a) => a.variantId === v.id && a.status !== "dismissed" && a.status !== "done",
                    );
                    return (
                      <td
                        key={sz}
                        className={cn("rounded-lg border p-2 align-top", CELL_TONE[c.status] ?? CELL_TONE.normal)}
                        title={`${PATTERN_META[c.pattern.code].label} — ${c.pattern.why}`}
                        data-option-cell={v.id}
                      >
                        <div className="flex items-baseline justify-between gap-1">
                          <span className={cn("tabular text-[1rem] font-bold", v.stock <= 0 && "text-semantic-error")}>
                            {v.stock <= 0 ? "품절" : v.stock}
                          </span>
                          <span className="text-[0.68rem] text-neutral-text2">{INVENTORY_STATUS_LABEL[c.status]}</span>
                        </div>
                        <p className="tabular text-[0.72rem] text-neutral-text2">
                          판매 {v.sales7d} · 신청{" "}
                          <b className={v.restockRequests >= 5 ? "text-theme-primary" : ""}>{v.restockRequests}</b>
                        </p>
                        {c.pattern.severity >= 30 && (
                          <PatternTag code={c.pattern.code} className="mt-0.5 !text-[0.68rem]" />
                        )}
                        {attention &&
                          (open ? (
                            <Link
                              href={`/ax/actions?open=${open.id}`}
                              className="mt-1 inline-flex min-h-11 items-center gap-0.5 text-[0.72rem] font-semibold text-theme-primary hover:underline md:min-h-0"
                            >
                              <Zap size={11} aria-hidden />
                              과제 진행 중
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => register(v.id)}
                              className="mt-1 inline-flex min-h-11 items-center gap-0.5 rounded-md border border-theme-primary/40 bg-white px-1.5 text-[0.72rem] font-semibold text-theme-primary hover:bg-theme-soft md:min-h-7"
                            >
                              <Plus size={11} aria-hidden />
                              재입고 {c.suggestedQty || ""}
                            </button>
                          ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="min-w-0 border-t border-neutral-border p-4 xl:border-l xl:border-t-0">
          <p className="mb-2 text-[0.82rem] font-bold">
            사이즈 커브 <span className="font-normal text-neutral-text2">— 30일 판매 비중 vs 현재 재고 비중</span>
          </p>
          <ul className="space-y-1.5" aria-label="사이즈별 판매 비중과 재고 비중">
            {m.sizeCurve.map((c) => (
              <li key={c.size} className="grid grid-cols-[2.2rem_1fr_4.6rem] items-center gap-2 text-[0.76rem]">
                <span className="font-bold">{c.size}</span>
                <span className="space-y-0.5">
                  <span className="flex h-2 rounded-full bg-neutral-canvas" aria-hidden>
                    <span
                      className="rounded-full bg-theme-primary"
                      style={{ width: `${(c.salesShare / maxShare) * 100}%` }}
                    />
                  </span>
                  <span className="flex h-2 rounded-full bg-neutral-canvas" aria-hidden>
                    <span
                      className="rounded-full bg-neutral-text2/50"
                      style={{ width: `${(c.stockShare / maxShare) * 100}%` }}
                    />
                  </span>
                </span>
                <span
                  className={cn(
                    "tabular text-right font-semibold",
                    c.gap >= 0.12 ? "text-semantic-error" : c.gap <= -0.12 ? "text-[#b45309]" : "text-neutral-text2",
                  )}
                >
                  {c.gap >= 0 ? "+" : "−"}
                  {Math.round(Math.abs(c.gap) * 100)}%p
                  <span className="sr-only">
                    판매 {Math.round(c.salesShare * 100)}% 재고 {Math.round(c.stockShare * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 flex gap-3 text-[0.72rem] text-neutral-text2">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-3 rounded-full bg-theme-primary" aria-hidden />
              판매 비중
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-3 rounded-full bg-neutral-text2/50" aria-hidden />
              재고 비중
            </span>
            <span>+ = 재고가 수요보다 얇음</span>
          </p>
          {m.insights.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-neutral-border pt-2.5 text-[0.8rem] leading-snug">
              {m.insights.map((t) => (
                <li key={t} className="flex gap-1.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-theme-primary" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------ 할인 판단 + 시뮬레이터 ------------------------------ */
export function MarkdownSimulator({ product }: { product: Product }) {
  const d = useIntelState();
  const actions = useApp((s) => s.actions);
  const role = useApp((s) => s.role);
  const create = useApp((s) => s.createActionFromCandidate);
  const actor = ROLE_NAME[role === "customer" ? "owner" : role];
  const md = useMemo(() => markdownDecision(product, d), [product, d]);
  const sim = useMemo(
    () => bestRate(product, d, Math.max(md.maxRateByMargin, currentRate(product, d))),
    [product, d, md],
  );
  const now = sim.rows[0];
  const [sel, setSel] = useState<number | null>(null);
  const selected = sim.rows.find((r) => r.rate === sel) ?? sim.rows.find((r) => r.rate === md.suggestedRate) ?? now;
  const open = actions.find(
    (a) => a.type === "markdown" && a.productId === product.id && a.status !== "dismissed" && a.status !== "done",
  );

  const register = () => {
    const c = markdownRequestFor(product.id, d, actor);
    if (!c) return;
    const rate = selected.rate;
    create({ ...c, discountRate: rate, title: `${product.name} 할인 ${Math.round(rate * 100)}% 검토` }, actor);
    toast(
      "할인 과제 등록",
      `${product.name} ${Math.round(rate * 100)}% — 근거와 시뮬레이션이 과제에 함께 기록됩니다.`,
      "success",
    );
  };

  const verdictTone =
    md.verdict === "markdown" ? "text-theme-primary" : md.verdict === "hold" ? "text-[#b45309]" : "text-neutral-text2";
  return (
    <Panel
      id="markdown"
      tour="markdown-sim"
      title={
        <span className="inline-flex items-center gap-1.5">
          <BadgePercent size={15} className="text-theme-primary" aria-hidden />
          할인 판단 · 시뮬레이터
        </span>
      }
      sub="재고가 많다고 할인하지 않습니다 — 남은 판매일·판매 속도·관심 추세·마진·옵션 공백을 먼저 봅니다"
      right={<span className={cn("text-[0.86rem] font-bold", verdictTone)}>{md.verdictLabel}</span>}
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-2 p-4">
          <ul className="space-y-1.5 text-[0.82rem]">
            {md.checks.map((c) => (
              <li key={c.label} className="flex gap-2 leading-snug">
                <span
                  className={cn(
                    "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold text-white",
                    c.ok ? "bg-semantic-success" : "bg-semantic-error",
                  )}
                  aria-label={c.ok ? "통과" : "불통과"}
                >
                  {c.ok ? "✓" : "✕"}
                </span>
                <span>
                  {c.label}
                  <span className="block text-[0.76rem] text-neutral-text2">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {md.guards.length > 0 && (
            <div className="rounded-lg bg-[#fff6ea] p-2.5 text-[0.8rem] leading-snug text-[#b45309]">
              {md.guards.map((g) => (
                <p key={g}>· {g}</p>
              ))}
            </div>
          )}
          <p className="tabular text-[0.76rem] text-neutral-text2">
            재고 {md.stock}개 · 남은 판매일 {md.coverDays || "-"}일 · 시즌 잔여 {md.seasonDaysLeft}일 · 현재 마진{" "}
            {Math.round(md.margin * 100)}% · 마진 하한 기준 최대 할인 {Math.round(md.maxRateByMargin * 100)}%
          </p>
        </div>

        <div className="min-w-0 border-t border-neutral-border lg:border-l lg:border-t-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="bg-neutral-canvas/50">
                  <th className={TH}>할인율</th>
                  <th className={cn(TH, "text-right")}>판매가</th>
                  <th className={cn(TH, "text-right")}>시즌 내 판매</th>
                  <th className={cn(TH, "text-right")}>남는 재고</th>
                  <th className={cn(TH, "text-right")}>매출총이익</th>
                  <th className={cn(TH, "text-right")}>시즌 손익*</th>
                  <th className={cn(TH, "text-right")}>vs 현재</th>
                </tr>
              </thead>
              <tbody>
                {sim.rows.map((r) => {
                  const isSel = r.rate === selected.rate;
                  const isRec = md.verdict === "markdown" && r.rate === md.suggestedRate;
                  const diff = r.net - now.net;
                  return (
                    <tr
                      key={r.rate}
                      className={cn(
                        "cursor-pointer border-t border-neutral-border/70 hover:bg-neutral-canvas/50",
                        isSel && "bg-theme-soft hover:bg-theme-soft",
                      )}
                      onClick={() => setSel(r.rate)}
                      aria-selected={isSel}
                    >
                      <td className={cn(TD, "whitespace-nowrap font-semibold")}>
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center gap-1 hover:text-theme-primary md:min-h-0"
                          onClick={() => setSel(r.rate)}
                        >
                          {Math.round(r.rate * 100)}%
                          {r === now && <span className="text-[0.7rem] font-normal text-neutral-text2">현재</span>}
                          {isRec && <span className="text-[0.7rem] font-bold text-theme-primary">권장</span>}
                        </button>
                      </td>
                      <td className={cn(TD, "tabular text-right")}>{r.sim.price.toLocaleString("ko-KR")}</td>
                      <td className={cn(TD, "tabular text-right")}>
                        {r.sim.units}개{" "}
                        <span className="text-[0.72rem] text-neutral-text2">
                          ({Math.round(r.sim.sellThrough * 100)}%)
                        </span>
                      </td>
                      <td className={cn(TD, "tabular text-right")}>{r.sim.leftover}개</td>
                      <td className={cn(TD, "tabular text-right")}>{wonS(r.sim.grossProfit)}</td>
                      <td className={cn(TD, "tabular text-right font-semibold")}>
                        {wonS(seasonNet(r.sim, product.cost))}
                      </td>
                      <td
                        className={cn(
                          TD,
                          "tabular text-right font-semibold",
                          diff > 0 ? "text-semantic-success" : diff < 0 ? "text-semantic-error" : "text-neutral-text2",
                        )}
                      >
                        {r === now ? "-" : `${diff >= 0 ? "+" : "−"}${wonS(Math.abs(diff))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-border px-4 py-2.5">
            <p className="min-w-0 flex-1 text-[0.8rem]">
              선택 <b>{Math.round(selected.rate * 100)}%</b> · 판매가 {selected.sim.price.toLocaleString("ko-KR")}원 ·
              마진 {Math.round(selected.sim.marginRate * 100)}% · 시즌 손익{" "}
              <b className={selected.net >= now.net ? "text-semantic-success" : "text-semantic-error"}>
                {selected.net >= now.net ? "+" : "−"}
                {wonS(Math.abs(selected.net - now.net))}원
              </b>{" "}
              (현재 대비)
            </p>
            {open ? (
              <Button
                size="sm"
                variant="outline"
                className="!h-11 md:!h-9"
                href={`/ax/actions?open=${open.id}`}
                icon={<Zap size={14} />}
              >
                할인 과제 열기
              </Button>
            ) : (
              <Button
                size="sm"
                className="!h-11 md:!h-9"
                icon={<Plus size={14} />}
                onClick={register}
                disabled={selected.rate <= currentRate(product, d) + 1e-9}
              >
                {Math.round(selected.rate * 100)}% 할인 과제 등록
              </Button>
            )}
          </div>
          <div className="space-y-0.5 border-t border-neutral-border px-4 py-2">
            <Assumption>
              * 시즌 손익 = 시즌 안 매출총이익 − 남는 재고 손실(원가 × 70%, 이월·아울렛 30% 회수 가정)
            </Assumption>
            {SIM_ASSUMPTIONS.slice(0, 2).map((a) => (
              <Assumption key={a}>{a}</Assumption>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
