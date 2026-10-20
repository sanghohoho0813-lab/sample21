"use client";
/* ------------------------------------------------------------------
   리뷰 — "별점이 몇 점인가"보다 "나한테 맞을까"에 답한다.
   · 평점 분포 · 사이즈 평가 분포(작아요/딱 맞아요/커요)와 한 줄 해석
   · 나와 비슷한 체형 / 내 추천 사이즈를 산 사람만 보기 · 정렬
   · 리뷰마다 사이즈 평가와 체형, '도움돼요'
   리뷰는 DEMO 예시다(실제 고객 리뷰 아님) — 화면에도 표기한다.
------------------------------------------------------------------- */
import { useMemo, useState } from "react";
import { Star, ThumbsUp, Ruler } from "lucide-react";
import type { Product, SizingTendency } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/dates";
import { DemoBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { demoReviews, type DemoReview } from "./shared";

const VERDICT: Record<SizingTendency, string> = { small: "작아요", true: "딱 맞아요", large: "커요" };
const VERDICT_TONE: Record<SizingTendency, string> = {
  small: "bg-[#fff1e6] text-[#b45309]",
  true: "bg-[#e9f7ef] text-[#15803d]",
  large: "bg-[#eef2ff] text-[#4338ca]",
};
const SEG_TONE: Record<SizingTendency, string> = {
  small: "bg-[#f59e0b]",
  true: "bg-[#16a34a]",
  large: "bg-[#6366f1]",
};
type Filter = "all" | "similar" | "mysize";
type Sort = "recent" | "helpful" | "rating";
const SORTS: { key: Sort; label: string }[] = [
  { key: "recent", label: "최신순" },
  { key: "helpful", label: "도움순" },
  { key: "rating", label: "별점순" },
];
const PAGE = 3;

/** 평균 별점에서 5~1점 비율을 만든다(데모). 평균이 표시 별점과 ±0.15 안에 들어온다. */
function ratingDist(rating: number) {
  const p5 = Math.min(0.9, Math.max(0.1, 0.2 + (rating - 4)));
  const rest = 1 - p5;
  const top = [p5, rest * 0.65, rest * 0.22, rest * 0.08];
  return [...top, Math.max(0, 1 - top.reduce((a, b) => a + b, 0))];
}

/** 구매자 사이즈 평가 비율(데모) — 상품의 사이즈 경향과 같은 방향 */
function fitDist(p: Product): Record<SizingTendency, number> {
  if (p.sizing === "small") return { small: 62, true: 33, large: 5 };
  if (p.sizing === "large") return { small: 6, true: 36, large: 58 };
  return { small: 12, true: 79, large: 9 };
}
const FIT_ADVICE: Record<SizingTendency, string> = {
  small: "작게 나와요 — 평소보다 한 치수 크게 고르는 걸 추천해요",
  true: "정사이즈예요 — 평소 사이즈 그대로 고르면 돼요",
  large: "크게 나와요 — 딱 맞게 입으려면 한 치수 작게 골라보세요",
};

function StarRow({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span role="img" className="inline-flex gap-0.5" aria-label={`별점 ${n}점`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= n ? "text-brand-black" : "text-neutral-border"}
          fill={i <= n ? "currentColor" : "none"}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function ProductReviews({ product, recommended }: { product: Product; recommended: string | null }) {
  const profile = useApp((s) => s.fitProfile);
  const reviews = useMemo(() => demoReviews(product), [product]);
  const wearable = product.categoryId !== "bag" && product.categoryId !== "acc";
  const dist = fitDist(product);
  const major = (Object.keys(dist) as SizingTendency[]).reduce((a, b) => (dist[b] > dist[a] ? b : a));
  const stars = ratingDist(product.rating);

  const similar = (r: DemoReview) =>
    !!profile.height &&
    Math.abs(r.height - profile.height) <= 5 &&
    (!profile.weight || Math.abs(r.weight - profile.weight) <= 6);
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "전체", count: reviews.length },
  ];
  if (wearable && profile.height)
    filters.push({ key: "similar", label: "나와 비슷한 체형", count: reviews.filter(similar).length });
  if (wearable && recommended && recommended !== "FREE")
    filters.push({
      key: "mysize",
      label: `${recommended} 사이즈`,
      count: reviews.filter((r) => r.size === recommended).length,
    });

  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [shown, setShown] = useState(PAGE);
  const [helped, setHelped] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    const base = reviews.filter((r) =>
      filter === "similar" ? similar(r) : filter === "mysize" ? r.size === recommended : true,
    );
    return [...base].sort((a, b) =>
      sort === "helpful" ? b.helpful - a.helpful : sort === "rating" ? b.rating - a.rating : b.at.localeCompare(a.at),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews, filter, sort, recommended, profile.height, profile.weight]);
  const visible = list.slice(0, shown);

  return (
    <div className="rounded-cardlg border border-neutral-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-border px-5 py-4 md:px-6">
        <p className="flex items-center gap-2 text-[1.05rem] font-bold">
          리뷰 <span className="tabular text-neutral-text2">{product.reviewCount.toLocaleString("ko-KR")}</span>
          <DemoBadge label="데모 리뷰" />
        </p>
        <p className="text-[0.8rem] text-neutral-text2">실제 고객 리뷰가 아닌 시연용 예시입니다.</p>
      </div>

      {/* 요약 — 별점 분포 | 사이즈 평가 */}
      <div className={cn("grid gap-6 px-5 py-5 md:px-6", wearable && "md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]")}>
        <div className="flex items-center gap-5">
          <div className="shrink-0 text-center">
            <p className="tabular text-[2.4rem] font-black leading-none">{product.rating}</p>
            <div className="mt-1.5">
              <StarRow n={Math.round(product.rating)} size={13} />
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1" aria-label="별점 분포">
            {stars.map((v, i) => (
              <li key={i} className="grid grid-cols-[1.6rem_minmax(0,1fr)_2.4rem] items-center gap-2 text-[0.78rem]">
                <span className="tabular text-neutral-text2">{5 - i}점</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-brand-ivory" aria-hidden>
                  <span className="block h-full rounded-full bg-brand-black" style={{ width: `${v * 100}%` }} />
                </span>
                <span className="tabular text-right text-neutral-text2">{Math.round(v * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>

        {wearable && (
          <div className="min-w-0 md:border-l md:border-neutral-border md:pl-6" data-review-fit>
            <p className="flex items-center gap-1.5 text-[0.85rem] font-bold">
              <Ruler size={14} aria-hidden />
              구매자 사이즈 평가
            </p>
            <p className="mt-1 text-[0.95rem] font-semibold leading-snug">
              {dist[major]}%가 ‘{VERDICT[major]}’ ·{" "}
              <span className="text-neutral-text2">{FIT_ADVICE[product.sizing]}</span>
            </p>
            <div
              className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-brand-ivory"
              role="img"
              aria-label={`작아요 ${dist.small}%, 딱 맞아요 ${dist.true}%, 커요 ${dist.large}%`}
            >
              {(["small", "true", "large"] as const).map((k) => (
                <span key={k} className={cn("h-full", SEG_TONE[k])} style={{ width: `${dist[k]}%` }} />
              ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.8rem]">
              {(["small", "true", "large"] as const).map((k) => (
                <li key={k} className={cn("inline-flex items-center gap-1.5", k === major && "font-bold")}>
                  <span className={cn("h-2 w-2 rounded-full", SEG_TONE[k])} aria-hidden />
                  {VERDICT[k]} <span className="tabular">{dist[k]}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 필터 · 정렬 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-neutral-border bg-brand-ivory/50 px-5 py-2.5 md:px-6">
        <div className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="group" aria-label="리뷰 보기">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => {
                setFilter(f.key);
                setShown(PAGE);
              }}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3.5 text-[0.85rem] font-semibold transition-colors md:h-9",
                filter === f.key
                  ? "border-brand-black bg-brand-black text-white"
                  : "border-neutral-border bg-white text-neutral-text hover:border-neutral-text2",
              )}
            >
              {f.label}
              <span className={cn("tabular", filter === f.key ? "text-white/70" : "text-neutral-text2")}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center" role="group" aria-label="리뷰 정렬">
          {SORTS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={sort === s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "inline-flex h-10 items-center px-2 text-[0.82rem] transition-colors md:h-9",
                sort === s.key ? "font-bold text-neutral-text" : "text-neutral-text2 hover:text-neutral-text",
                i > 0 && "border-l border-neutral-border",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="px-5 py-8 text-center md:px-6">
          <p className="font-semibold">조건에 맞는 리뷰가 아직 없어요</p>
          <p className="mt-1 text-[0.85rem] text-neutral-text2">전체 리뷰와 위의 사이즈 평가를 함께 참고해 주세요.</p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-3 inline-flex h-10 items-center rounded-full border border-neutral-border px-4 text-[0.85rem] font-semibold hover:bg-brand-ivory"
          >
            전체 리뷰 보기
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-border">
          {visible.map((r) => {
            const on = helped.has(r.id);
            const like = similar(r);
            return (
              <li key={r.id} className="px-5 py-4 md:px-6">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-ivory text-[0.85rem] font-bold text-neutral-text2"
                  >
                    {r.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-[0.9rem] font-semibold">
                      {r.name}
                      <StarRow n={r.rating} size={12} />
                    </p>
                    <p className="tabular text-[0.78rem] text-neutral-text2">{fmtDate(r.at)}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[0.78rem]">
                  <span className="rounded-md bg-brand-ivory px-2 py-1 font-semibold">
                    구매 {r.color} · {r.size}
                  </span>
                  {r.fit && (
                    <span className={cn("rounded-md px-2 py-1 font-bold", VERDICT_TONE[r.fit])}>
                      사이즈 {VERDICT[r.fit]}
                    </span>
                  )}
                  <span className="tabular px-1 text-neutral-text2">
                    {r.height}cm · {r.weight}kg · {r.bodyType}
                  </span>
                  {like && (
                    <span className="rounded-md border border-brand-accent/40 px-2 py-0.5 font-semibold text-brand-accent">
                      나와 비슷한 체형
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[0.95rem] leading-relaxed">{r.text}</p>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setHelped((s) => {
                      const n = new Set(s);
                      if (n.has(r.id)) n.delete(r.id);
                      else n.add(r.id);
                      return n;
                    })
                  }
                  className={cn(
                    "mt-2 inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-[0.8rem] font-semibold transition-colors md:h-8",
                    on
                      ? "border-brand-black bg-brand-black text-white"
                      : "border-neutral-border text-neutral-text2 hover:text-neutral-text",
                  )}
                >
                  <ThumbsUp size={13} aria-hidden />
                  도움돼요 <span className="tabular">{r.helpful + (on ? 1 : 0)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > shown && (
        <div className="border-t border-neutral-border p-4 md:px-6">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="h-11 w-full rounded-xl border border-neutral-border font-semibold transition-colors hover:bg-brand-ivory active:bg-brand-ivory"
          >
            리뷰 {list.length - shown}개 더 보기
          </button>
        </div>
      )}
    </div>
  );
}
