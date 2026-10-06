"use client";
/* 04-1 상품 상세 (AX) — 옵션별 판매·재고 / 고객행동 / 판매추세 / 반품·핏 / 캠페인 / AI·Logic Insight / Action History / Evidence */
import Link from "next/link";
import { Suspense, useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink, Zap, FileCheck2, ArrowLeft } from "lucide-react";
import { useApp, campaignStatus } from "@/lib/store";
import {
  BRAND_BY_ID,
  CAMPAIGNS,
  CATEGORY_NAME,
  PRODUCT_BY_ID,
  RETURN_REASON_LABEL,
  SEGMENT_LABEL,
} from "@/lib/demo/seed";
import {
  allReturns,
  daysOfStock,
  demandScore,
  discountRate,
  effFitNote,
  effPrice,
  effVariants,
  inventoryStatus,
  markdownReview,
  productAgg,
  productSeries,
  restockPriority,
  velocityDelta,
} from "@/lib/kpi";
import { can } from "@/lib/roles";
import { krw, krwShort, num, pct, signed } from "@/lib/format";
import { fmtDate, relTime } from "@/lib/dates";
import type { ReturnReason, Role } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { PageHeader } from "@/components/ax/AxShell";
import { AIReadyBadge } from "@/components/ax/AIReady";
import { ActionStatusBadge, InventoryStatusBadge, UrgencyBadge } from "@/components/ax/StatusBadges";
import { ActionCard } from "@/components/ax/core/ActionCard";
import {
  AxLink,
  CHART,
  ChartTip,
  InfoNote,
  MiniBar,
  PageSkeleton,
  SectionCard,
  StatPill,
  UnitDelta,
  dayLabel,
  demandTone,
} from "@/components/ax/core/shared";
import { Segmented } from "@/components/ui/Form";
import { Freshness, Term, Price } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { Stat } from "@/components/ui/Kpi";
import { EVIDENCE_TYPE_LABEL, SOURCE_LABEL } from "@/components/ax/ops/shared";

type Tab = "info" | "options" | "behavior" | "trend" | "returns" | "campaigns" | "insight" | "actions" | "evidence";
const TABS: { value: Tab; label: string }[] = [
  { value: "info", label: "기본정보" },
  { value: "options", label: "옵션별 판매·재고" },
  { value: "behavior", label: "고객행동" },
  { value: "trend", label: "판매추세" },
  { value: "returns", label: "반품·핏" },
  { value: "campaigns", label: "캠페인" },
  { value: "insight", label: "AI·규칙 인사이트" },
  { value: "actions", label: "과제 이력" },
  { value: "evidence", label: "증빙" },
];
const isTab = (v: string | null): v is Tab => !!v && TABS.some((t) => t.value === v);
const FIT_LABEL = { slim: "슬림", regular: "레귤러", relaxed: "릴랙스", oversized: "오버" };
const SIZING_LABEL = { small: "작게 나옴", true: "정사이즈", large: "크게 나옴" };

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={2} />}>
      <Hydrated fallback={<PageSkeleton rows={2} />}>
        <DetailInner />
      </Hydrated>
    </Suspense>
  );
}

function DetailInner() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const app = useApp();
  const role: Role = app.role === "customer" ? "owner" : app.role;
  const id = params?.id ?? "";
  const product = PRODUCT_BY_ID[id];
  const [tab, setTab] = useState<Tab>(isTab(sp.get("tab")) ? (sp.get("tab") as Tab) : "info");
  useEffect(() => {
    const t = sp.get("tab");
    if (isTab(t)) setTab(t);
  }, [sp]);

  const agg = useMemo(() => (product ? productAgg(product, app) : null), [product, app]);
  const variants = useMemo(() => (product ? effVariants(product.id, app) : []), [product, app]);
  const returns = useMemo(
    () => (product ? allReturns(app).filter((r) => r.productId === product.id) : []),
    [product, app],
  );
  const actions = useMemo(
    () => app.actions.filter((a) => a.productId === id).sort((a, b) => (a.recommendedAt < b.recommendedAt ? 1 : -1)),
    [app.actions, id],
  );
  const evidence = useMemo(
    () => app.evidence.filter((e) => e.productId === id).sort((a, b) => (a.at < b.at ? 1 : -1)),
    [app.evidence, id],
  );
  const campaigns = useMemo(() => CAMPAIGNS.filter((c) => c.productIds.includes(id)), [id]);
  const series = useMemo(
    () => productSeries(id).map((s) => ({ date: dayLabel(s.date), 판매: s.units, 조회: s.views, 찜: s.wishlist })),
    [id],
  );
  const md = useMemo(() => (product ? markdownReview(product, app) : null), [product, app]);

  if (!product || !agg || !md) {
    return (
      <div className="space-y-6">
        <PageHeader title="상품 상세" />
        <EmptyState
          title="상품을 찾을 수 없습니다"
          desc={`'${id}'에 해당하는 상품이 데모 저장소에 없습니다.`}
          action={
            <Button href="/ax/products" icon={<ArrowLeft size={16} />}>
              상품 목록으로
            </Button>
          }
        />
      </div>
    );
  }

  const brand = BRAND_BY_ID[product.brandId];
  const price = effPrice(product, app);
  const fitNote = effFitNote(product, app);
  const fitChanged = !!app.fitNoteOverride[product.id];
  const showMargin = can(role, "brand-margin");
  const reasonCounts = (Object.keys(RETURN_REASON_LABEL) as ReturnReason[])
    .map((r) => ({ reason: r, label: RETURN_REASON_LABEL[r], count: returns.filter((x) => x.reason === r).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const fitReturns = returns.filter(
    (r) => r.reason === "size-small" || r.reason === "size-large" || r.reason === "fit",
  ).length;

  return (
    <div className="space-y-6">
      <Link
        href="/ax/products"
        className="tap inline-flex items-center gap-1 text-[0.88rem] font-semibold text-neutral-text2 hover:text-neutral-text"
      >
        <ArrowLeft size={16} />
        상품·옵션 목록
      </Link>
      <div className="flex flex-col gap-5 rounded-cardlg border border-neutral-border bg-white p-5 shadow-card md:flex-row md:p-6">
        <ProductImage
          colors={product.colors}
          label={product.name}
          className="hidden w-40 shrink-0 md:block"
          ratio="aspect-[3/4]"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{brand.name}</Badge>
            <Badge tone="neutral">{CATEGORY_NAME[product.categoryId]}</Badge>
            <InventoryStatusBadge status={agg.worst} size="md" />
            {discountRate(product, app) > 0 && <Badge tone="error">할인 {pct(discountRate(product, app), 0)}</Badge>}
            {fitChanged && <Badge tone="success">핏 안내 변경됨</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <ProductImage
              colors={product.colors}
              label={product.name}
              caption={false}
              className="w-14 shrink-0 !rounded-xl md:hidden"
              ratio="aspect-square"
            />
            <h1 className="min-w-0 text-[1.5rem] font-bold leading-tight tracking-tight md:text-[1.9rem]">
              {product.name}
            </h1>
          </div>
          <p className="mt-1 text-neutral-text2">
            {product.subtitle} · {product.material}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Price price={price} original={product.price} size="lg" />
            {showMargin && (
              <span className="text-[0.9rem] text-neutral-text2">
                원가 {krw(product.cost)} · <Term term="마진">마진율</Term>{" "}
                <span className="font-semibold text-neutral-text">{pct(agg.marginRate, 0)}</span>
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill
              label="7일 판매"
              value={
                <>
                  {num(agg.sales7d)}{" "}
                  <span
                    className={`text-[0.8rem] ${agg.velocity >= 0 ? "text-semantic-success" : "text-semantic-error"}`}
                  >
                    {signed(agg.velocity, 0)}
                  </span>
                </>
              }
            />
            <StatPill
              label="현재고"
              value={`${num(agg.stock)}개`}
              sub={`옵션 ${agg.variants.length} · 품절 ${agg.soldout}`}
              tone={agg.soldout > 0 ? "warning" : "neutral"}
            />
            <StatPill
              label="찜 (7일)"
              value={
                <>
                  {num(agg.wishlist7d)} <UnitDelta cur={agg.wishlist7d} prev={agg.wishlistPrev7d} />
                </>
              }
            />
            <StatPill
              label="반품률 (30일)"
              value={pct(agg.returnRate, 1)}
              sub={`사이즈 관련 ${pct(agg.fitReturnRate, 1)}`}
              tone={agg.returnRate > 0.15 ? "error" : "neutral"}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" href={`/products/${product.id}`} icon={<ExternalLink size={15} />}>
              고객 플랫폼에서 보기
            </Button>
            <Button size="sm" variant="outline" href={`/ax/actions?product=${product.id}`} icon={<Zap size={15} />}>
              관련 과제 {actions.length}건
            </Button>
            <span className="ml-auto self-center">
              <Freshness source="DEMO" />
            </span>
          </div>
        </div>
      </div>

      <Segmented value={tab} onChange={setTab} options={TABS} className="w-full md:w-auto" />

      {tab === "info" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="기본정보">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[0.92rem]">
              {[
                ["브랜드", `${brand.name} (${brand.sourcing === "purchase" ? "사입" : "입점·위탁"})`],
                ["카테고리", CATEGORY_NAME[product.categoryId]],
                ["성별", product.gender === "men" ? "남성" : product.gender === "women" ? "여성" : "공용"],
                ["핏", `${FIT_LABEL[product.fit]} · ${SIZING_LABEL[product.sizing]}`],
                ["색상", product.colors.join(" · ")],
                ["사이즈", product.sizes.join(" · ")],
                [
                  "시즌",
                  `${product.season === "ALL" ? "사계절" : product.season === "SS" ? "SS (봄·여름)" : "FW (가을·겨울)"} · 종료까지 ${product.seasonEndsInDays}일`,
                ],
                ["등록일", fmtDate(product.createdAt)],
                ["소재", product.material],
                ["세탁", product.care],
                ["평점", `${product.rating} (${num(product.reviewCount)}개 리뷰)`],
                ["리드타임", `${brand.leadTimeDays}일 (브랜드 공급)`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[0.78rem] font-semibold text-neutral-text2">{k}</dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[0.92rem] leading-relaxed text-neutral-text2">{product.description}</p>
          </SectionCard>
          <SectionCard
            title={
              <span className="inline-flex items-center gap-2">
                핏 안내{" "}
                {fitChanged && (
                  <Badge tone="success" size="sm">
                    변경됨
                  </Badge>
                )}
              </span>
            }
            desc="고객 상품 상세에 그대로 노출되는 문구"
          >
            <p className="rounded-xl bg-neutral-canvas p-4 text-[0.95rem] leading-relaxed">{fitNote}</p>
            {fitChanged && <p className="mt-2 text-[0.82rem] text-neutral-text2">원본: {product.fitNote}</p>}
            <p className="mb-2 mt-4 text-[0.8rem] font-semibold text-neutral-text2">실측 (cm)</p>
            <div className="overflow-x-auto">
              <table className="tabular w-full text-[0.85rem]">
                <thead>
                  <tr className="text-neutral-text2">
                    <th className="py-1 pr-3 text-left font-semibold">사이즈</th>
                    {Object.keys(product.measurements[product.sizes[0]] ?? {}).map((m) => (
                      <th key={m} className="px-2 py-1 text-right font-semibold">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.sizes.map((s) => (
                    <tr key={s} className="border-t border-neutral-border">
                      <td className="py-1 pr-3 font-semibold">{s}</td>
                      {Object.values(product.measurements[s] ?? {}).map((v, i) => (
                        <td key={i} className="px-2 py-1 text-right">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "options" && (
        <SectionCard
          title="옵션별 판매·재고"
          desc="색상×사이즈 단위 · 예상 소진일 = 현재고 ÷ 하루 평균 판매량"
          right={
            <Button size="sm" href={`/ax/actions?type=restock&product=${product.id}`} icon={<Zap size={15} />}>
              재입고 과제 보기
            </Button>
          }
        >
          <DataTable
            rows={variants}
            rowKey={(v) => v.id}
            dense
            columns={[
              {
                key: "opt",
                header: "옵션",
                primary: true,
                cell: (v) => (
                  <span className="font-semibold">
                    {v.color} · {v.size}
                  </span>
                ),
              },
              {
                key: "stock",
                header: "현재고",
                align: "right",
                cell: (v) => (
                  <span
                    className={`tabular font-semibold ${v.stock <= 0 ? "text-semantic-error" : daysOfStock(v) <= 4 ? "text-semantic-warning" : ""}`}
                  >
                    {num(v.stock)}
                    {v.incoming > 0 && (
                      <span className="block text-[0.78rem] font-normal text-neutral-text2">+{v.incoming} 예정</span>
                    )}
                  </span>
                ),
              },
              {
                key: "s7",
                header: "7일 / 30일 판매",
                align: "right",
                cell: (v) => (
                  <span className="tabular">
                    {v.sales7d} <UnitDelta cur={v.sales7d} prev={v.salesPrev7d} />{" "}
                    <span className="text-neutral-text2">/ {v.sales30d}</span>
                  </span>
                ),
              },
              {
                key: "dos",
                header: <Term term="재고일수">예상 소진일</Term>,
                align: "right",
                cell: (v) =>
                  v.stock <= 0 ? (
                    <span className="font-semibold text-semantic-error">품절</span>
                  ) : (
                    `${daysOfStock(v)}일`
                  ),
              },
              {
                key: "wish",
                header: "찜",
                align: "right",
                cell: (v) => (
                  <span className="tabular">
                    {v.wishlist7d} <UnitDelta cur={v.wishlist7d} prev={v.wishlistPrev7d} />
                  </span>
                ),
              },
              {
                key: "restock",
                header: "재입고 신청",
                align: "right",
                cell: (v) => (
                  <span className={`tabular ${v.restockRequests >= 5 ? "font-semibold text-theme-primary" : ""}`}>
                    {num(v.restockRequests)}
                  </span>
                ),
              },
              { key: "status", header: "상태", cell: (v) => <InventoryStatusBadge status={inventoryStatus(v, app)} /> },
              {
                key: "action",
                header: "과제",
                cell: (v) => {
                  const a = app.actions.find((x) => x.variantId === v.id);
                  return a ? (
                    <Link
                      href={`/ax/actions?open=${a.id}`}
                      className="inline-flex items-center gap-1 text-[0.85rem] font-semibold text-theme-primary underline-offset-4 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionStatusBadge status={a.status} size="sm" />
                      열기
                    </Link>
                  ) : (
                    <Link
                      href={`/ax/actions?type=restock`}
                      className="text-[0.85rem] font-semibold text-neutral-text2 hover:text-theme-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      과제 생성 →
                    </Link>
                  );
                },
              },
            ]}
          />
        </SectionCard>
      )}

      {tab === "behavior" && (
        <SectionCard title="고객행동 (30일)" desc="조회·찜·판매 일별 추이 · 고객 화면 행동이 반영됩니다">
          <div className="h-[260px] w-full md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART.border} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: CHART.text2 }}
                  tickLine={false}
                  axisLine={{ stroke: CHART.border }}
                  interval={4}
                />
                <YAxis
                  yAxisId="v"
                  tick={{ fontSize: 12, fill: CHART.text2 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <YAxis
                  yAxisId="u"
                  orientation="right"
                  tick={{ fontSize: 12, fill: CHART.text2 }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip content={<ChartTip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line
                  isAnimationActive={false}
                  yAxisId="v"
                  type="monotone"
                  dataKey="조회"
                  stroke={CHART.secondary}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  isAnimationActive={false}
                  yAxisId="v"
                  type="monotone"
                  dataKey="찜"
                  stroke={CHART.accent}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  isAnimationActive={false}
                  yAxisId="u"
                  type="monotone"
                  dataKey="판매"
                  stroke={CHART.primary}
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatPill label="조회 (7일)" value={num(agg.views7d)} />
            <StatPill label="찜 (7일)" value={num(agg.wishlist7d)} sub={`직전 ${num(agg.wishlistPrev7d)}`} />
            <StatPill label="장바구니 (7일)" value={num(agg.cart7d)} />
            <StatPill
              label="재입고 신청"
              value={num(agg.restockRequests)}
              tone={agg.restockRequests >= 5 ? "accent" : "neutral"}
            />
          </div>
        </SectionCard>
      )}

      {tab === "trend" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <SectionCard className="lg:col-span-2" title="판매추세 (30일)" desc="일별 판매 수량">
            <div className="h-[240px] w-full md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pdUnits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.border} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: CHART.text2 }}
                    tickLine={false}
                    axisLine={{ stroke: CHART.border }}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART.text2 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTip formatter={(_, v) => `${num(v)}개`} />} />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="판매"
                    stroke={CHART.primary}
                    strokeWidth={2.5}
                    fill="url(#pdUnits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
          <SectionCard title="요약">
            <div className="space-y-2">
              <Stat
                label="최근 7일 판매"
                value={`${num(agg.sales7d)}개`}
                sub={`직전 7일 ${num(agg.salesPrev7d)}개 (${signed(agg.velocity, 0)})`}
              />
              <Stat label="최근 30일 판매" value={`${num(agg.sales30d)}개`} sub={`매출 ${krwShort(agg.revenue30d)}`} />
              <Stat
                label={"재고일수 (상품 합산)"}
                value={agg.daysOfStock <= 0 ? "품절" : `${agg.daysOfStock}일`}
                sub={`시즌 종료까지 ${product.seasonEndsInDays}일`}
              />
              {showMargin && (
                <Stat label="30일 추정 마진" value={krwShort(agg.margin30d)} sub={`마진율 ${pct(agg.marginRate, 0)}`} />
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "returns" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            title={
              <span className="inline-flex items-center gap-2">
                반품 · <Term term="핏 위험도">핏 위험도</Term>
              </span>
            }
            desc="최근 30일 · 반품 사유 분포"
          >
            <div className="mb-4 grid grid-cols-3 gap-2">
              <StatPill
                label="반품률"
                value={pct(agg.returnRate, 1)}
                tone={agg.returnRate > 0.15 ? "error" : "neutral"}
              />
              <StatPill
                label="사이즈 관련 반품률"
                value={pct(agg.fitReturnRate, 1)}
                tone={agg.fitReturnRate > 0.1 ? "warning" : "neutral"}
              />
              <StatPill label="반품 건수" value={`${num(returns.length)}건`} sub={`사이즈·핏 ${num(fitReturns)}건`} />
            </div>
            {reasonCounts.length === 0 ? (
              <EmptyState title="반품 기록이 없습니다" />
            ) : (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reasonCounts} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={110}
                      tick={{ fontSize: 12, fill: CHART.text2 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<ChartTip formatter={(_, v) => `${num(v)}건`} />}
                      cursor={{ fill: "var(--theme-soft)", opacity: 0.5 }}
                    />
                    <Bar
                      isAnimationActive={false}
                      dataKey="count"
                      name="반품"
                      fill={CHART.error}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
          <SectionCard
            title={
              <span className="inline-flex items-center gap-2">
                현재 핏 안내{" "}
                {fitChanged && (
                  <Badge tone="success" size="sm">
                    변경됨
                  </Badge>
                )}
              </span>
            }
            desc="핏 안내 과제가 완료되면 여기와 고객 화면이 함께 바뀝니다"
            right={<AxLink href="/ax/fit-returns">핏·반품</AxLink>}
          >
            <p className="rounded-xl bg-neutral-canvas p-4 text-[0.95rem] leading-relaxed">{fitNote}</p>
            {fitChanged && <p className="mt-2 text-[0.82rem] text-neutral-text2">변경 전: {product.fitNote}</p>}
            <div className="mt-4">
              <p className="mb-2 text-[0.8rem] font-semibold text-neutral-text2">최근 반품</p>
              {returns.length === 0 ? (
                <p className="text-[0.88rem] text-neutral-text2">없음</p>
              ) : (
                <ul className="space-y-1.5 text-[0.88rem]">
                  {returns.slice(0, 6).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <span>
                        {RETURN_REASON_LABEL[r.reason]} · {r.variantId.split("-").slice(-1)[0]} 사이즈
                      </span>
                      <span className="tabular text-neutral-text2">{relTime(r.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "campaigns" && (
        <SectionCard title="이 상품이 포함된 캠페인" right={<AxLink href="/ax/campaigns">캠페인·기획전</AxLink>}>
          {campaigns.length === 0 ? (
            <EmptyState title="포함된 캠페인이 없습니다" />
          ) : (
            <DataTable
              rows={campaigns}
              rowKey={(c) => c.id}
              dense
              columns={[
                {
                  key: "name",
                  header: "캠페인",
                  primary: true,
                  cell: (c) => <span className="font-semibold">{c.name}</span>,
                },
                {
                  key: "status",
                  header: "상태",
                  cell: (c) => {
                    const s = campaignStatus(c.id, app.campaignStatusOverride);
                    return (
                      <Badge tone={s === "running" ? "success" : s === "scheduled" ? "info" : "neutral"} size="sm">
                        {s === "running" ? "진행 중" : s === "scheduled" ? "예정" : s === "ended" ? "종료" : "초안"}
                      </Badge>
                    );
                  },
                },
                { key: "period", header: "기간", cell: (c) => `${fmtDate(c.startAt)} ~ ${fmtDate(c.endAt)}` },
                { key: "seg", header: "대상", cell: (c) => (c.segment === "all" ? "전체" : SEGMENT_LABEL[c.segment]) },
                { key: "disc", header: "할인", align: "right", cell: (c) => pct(c.discountRate, 0) },
                { key: "rev", header: "매출", align: "right", cell: (c) => krwShort(c.revenue) },
                { key: "orders", header: "주문", align: "right", cell: (c) => `${num(c.orders)}건` },
              ]}
            />
          )}
        </SectionCard>
      )}

      {tab === "insight" && (
        <div className="space-y-5">
          <SectionCard
            title={
              <span className="inline-flex items-center gap-2">
                재입고 우선순위 <AIReadyBadge kind="demand" />
              </span>
            }
            desc="규칙: 재고 위험 45% + 수요 점수 25% + 마진 15% + 재입고 신청 15% · 추천 수량 = 하루 판매 × (30일 + 리드타임) × 판매속도 보정 − 현재고 − 입고 예정"
          >
            <DataTable
              rows={[...variants]
                .map((v) => ({ v, rp: restockPriority(v, app), ds: demandScore(v) }))
                .sort((a, b) => b.rp.score - a.rp.score)}
              rowKey={(r) => r.v.id}
              dense
              columns={[
                {
                  key: "opt",
                  header: "옵션",
                  primary: true,
                  cell: (r) => (
                    <span className="font-semibold">
                      {r.v.color} · {r.v.size}
                    </span>
                  ),
                },
                {
                  key: "score",
                  header: "재입고 우선순위",
                  cell: (r) => <MiniBar value={r.rp.score} tone={demandTone(r.rp.score)} />,
                },
                {
                  key: "ds",
                  header: <Term term="수요 신호">수요 점수</Term>,
                  cell: (r) => <MiniBar value={r.ds} tone={demandTone(r.ds)} />,
                },
                {
                  key: "why",
                  header: "설명",
                  cell: (r) => (
                    <span className="text-[0.85rem] text-neutral-text2">
                      {r.v.stock <= 0 ? "품절 상태" : `재고 ${r.rp.daysOfStock}일분 vs 리드타임 ${r.rp.leadTime}일`} ·
                      판매속도 {signed(velocityDelta(r.v), 0)} · 재입고 신청 {r.v.restockRequests}건 · 마진{" "}
                      {pct(r.rp.margin, 0)}
                    </span>
                  ),
                },
                {
                  key: "qty",
                  header: "추천 검토수량",
                  align: "right",
                  cell: (r) => (
                    <span className="tabular font-semibold">
                      {r.rp.suggestedQty > 0 ? `${num(r.rp.suggestedQty)}개` : "-"}
                    </span>
                  ),
                },
              ]}
            />
            <InfoNote className="mt-3">
              자동발주는 하지 않습니다. 추천 후 MD가 승인해야 실행됩니다 (<Term term="L3">L3</Term>).
            </InfoNote>
          </SectionCard>
          <SectionCard
            title="할인 검토 (할인 엔진)"
            desc="규칙: 재고일수가 시즌 잔여기간의 50%를 넘고 재고 8개 이상, 판매속도가 둔화되면 검토 · 마진 25% 이상 유지 · 최대 30%"
          >
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <StatPill
                label="재고일수"
                value={md.dos <= 0 ? "-" : `${md.dos}일`}
                sub={`시즌 잔여 ${product.seasonEndsInDays}일`}
                tone={md.shouldReview ? "warning" : "neutral"}
              />
              <StatPill
                label="재고 · 원가"
                value={`${num(md.stock)}개`}
                sub={showMargin ? krwShort(md.stockValue) : undefined}
              />
              <StatPill label="7일 판매 vs 직전" value={`${md.s7} / ${md.p7}`} />
              <StatPill label="현재 할인" value={pct(md.currentRate, 0)} />
              <StatPill
                label="제안 할인"
                value={pct(md.suggestedRate, 0)}
                tone={md.shouldReview ? "accent" : "neutral"}
                sub={md.shouldReview ? "검토 권장" : "검토 불필요"}
              />
            </div>
            <p className="mt-3 text-[0.88rem] text-neutral-text2">
              {md.shouldReview
                ? "저회전·과잉 조건에 해당합니다. 시즌 종료 전 할인 과제를 검토하세요."
                : "현재 판매속도와 재고로는 할인 검토 조건에 해당하지 않습니다."}
            </p>
          </SectionCard>
        </div>
      )}

      {tab === "actions" && (
        <div className="space-y-4">
          {actions.length === 0 ? (
            <EmptyState
              title="이 상품의 과제가 없습니다"
              desc="엔진이 조건을 감지하면 추천이 생성됩니다."
              action={
                <Button variant="outline" href="/ax/actions">
                  실행 센터
                </Button>
              }
            />
          ) : (
            actions.map((a) => (
              <ActionCard
                key={a.id}
                action={a}
                expanded={false}
                onToggle={undefined}
                className="[&>button]:cursor-default"
              />
            ))
          )}
          {actions.length > 0 && (
            <p className="text-[0.82rem] text-neutral-text2">
              승인·실행은{" "}
              <Link
                href={`/ax/actions?product=${product.id}`}
                className="font-semibold text-theme-primary underline-offset-4 hover:underline"
              >
                실행 센터
              </Link>
              에서 진행합니다.
            </p>
          )}
        </div>
      )}

      {tab === "evidence" && (
        <SectionCard
          title="증빙"
          desc="이 상품과 연결된 기록"
          right={<AxLink href={`/ax/evidence?productId=${product.id}`}>전체 증빙</AxLink>}
        >
          {evidence.length === 0 ? (
            <EmptyState title="기록이 없습니다" icon={<FileCheck2 size={22} />} />
          ) : (
            <ol className="relative ml-2 space-y-4 border-l border-neutral-border">
              {evidence.map((e) => (
                <li key={e.id} className="relative pl-5">
                  <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-theme-primary" />
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        e.type === "RESULT" || e.type === "REVENUE"
                          ? "success"
                          : e.type === "RISK" || e.type === "EXCEPTION"
                            ? "warning"
                            : "info"
                      }
                      size="sm"
                    >
                      {EVIDENCE_TYPE_LABEL[e.type]}
                    </Badge>
                    <Badge tone={e.source === "SIMULATION" ? "demo" : "neutral"} size="sm">
                      {SOURCE_LABEL[e.source]}
                    </Badge>
                    <span className="tabular text-[0.78rem] text-neutral-text2">
                      {fmtDate(e.at, "datetime")} · {e.actor}
                    </span>
                  </div>
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-[0.88rem] leading-snug text-neutral-text2">{e.detail}</p>
                  {e.kpiDelta && <p className="mt-1 text-[0.8rem] text-neutral-text2">KPI: {e.kpiDelta}</p>}
                  {e.actionId && (
                    <Link
                      href={`/ax/actions?open=${e.actionId}`}
                      className="text-[0.82rem] font-semibold text-theme-primary underline-offset-4 hover:underline"
                    >
                      연결 과제 열기
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      )}

      {/* Scenario hint */}
      {agg.demand >= 60 && tab !== "insight" && (
        <InfoNote tone="accent" className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-2">
            <UrgencyBadge urgency="high" />
            수요 점수가 높은 옵션이 있습니다 ({num(agg.demand)}점). 재입고 우선순위를 확인하세요.
          </span>
          <button
            onClick={() => setTab("insight")}
            className="tap text-left text-[0.9rem] font-semibold text-theme-primary underline-offset-4 hover:underline"
          >
            AI·규칙 인사이트 보기 →
          </button>
        </InfoNote>
      )}
    </div>
  );
}
