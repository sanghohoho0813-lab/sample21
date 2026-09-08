"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Users, ShoppingBag, UserPlus, Ruler, Repeat, Heart, ShoppingCart, BellRing, PackageCheck, Undo2, ChevronRight, Sparkles, Search, Clock, Store, Zap, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ax/AxShell";
import { Hydrated } from "@/components/system/Hydrated";
import { useIsMobile } from "@/components/system/hooks";
import { useApp, type AppState } from "@/lib/store";
import { BRANDS, BRAND_BY_ID, CATEGORY_NAME, CUSTOMERS, CUSTOMER_BY_ID, DEMO_CUSTOMER_ID, DEMO_CUSTOMER_NAME, PRODUCT_BY_ID, SCENARIO, SEED_ORDERS, SEGMENT_LABEL, VARIANT_BY_ID } from "@/lib/demo/seed";
import { allOrders, customerKpi, salesKpi } from "@/lib/kpi";
import { can } from "@/lib/roles";
import type { Customer, Role, SegmentId } from "@/lib/types";
import { krw, krwShort, num, pct } from "@/lib/format";
import { daysBetween, fmtDate, relTime } from "@/lib/dates";
import { ICON_ACCENTS } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input, Select } from "@/components/ui/Form";
import { KpiCard, Stat } from "@/components/ui/Kpi";
import { Term } from "@/components/ui/Misc";
import { Drawer, Modal } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { OrderStatusBadge } from "@/components/ax/StatusBadges";
import { displayName, FilterBar, KV, LiveFreshness, MoreButton, NoteCard, PageSkeleton, SectionBlock, useMore } from "./shared";

type Row = Customer & { daysSince: number | null; live: boolean };
const SEGMENTS: SegmentId[] = ["first-purchase", "wish-no-buy", "restock-waiting", "cycle-due", "brand-loyal", "post-return-drop", "vip"];

const SEGMENT_META: Record<SegmentId, { meaning: string; icon: ReactNode; accent: string }> = {
  "first-purchase": { meaning: "가입은 했지만 아직 첫 구매가 없는 고객. 첫 구매 혜택이 가장 잘 통합니다.", icon: <UserPlus size={18} />, accent: ICON_ACCENTS.customer },
  "wish-no-buy": { meaning: "찜은 많은데 구매가 없는 고객. 찜·장바구니 리마인드 대상입니다.", icon: <Heart size={18} />, accent: "#C76C86" },
  "restock-waiting": { meaning: "품절 옵션의 재입고 알림을 기다리는 고객. 입고가 곧 매출입니다.", icon: <BellRing size={18} />, accent: ICON_ACCENTS.risk },
  "cycle-due": { meaning: "평균 구매주기가 돌아온 고객. 지금 추천하면 재구매 확률이 높습니다.", icon: <Repeat size={18} />, accent: ICON_ACCENTS.overview },
  "brand-loyal": { meaning: "한 브랜드를 반복 구매하는 고객. 브랜드 신상품 소식이 효과적입니다.", icon: <Store size={18} />, accent: "#148C8C" },
  "post-return-drop": { meaning: "반품을 겪은 뒤 구매가 줄어든 고객. 이탈 위험이 있어 케어가 필요합니다.", icon: <Undo2 size={18} />, accent: "#D96D32" },
  vip: { meaning: "고가치 반복구매 고객. 감사 메시지·선공개 혜택으로 관계를 지킵니다.", icon: <Sparkles size={18} />, accent: ICON_ACCENTS.sales },
};

function segmentCta(seg: SegmentId, role: Role): { label: string; href?: string; next?: boolean } | null {
  switch (seg) {
    case "cycle-due": return { label: "재구매 캠페인 Action 보기", href: "/ax/actions?open=act-005" };
    case "wish-no-buy": return { label: "리마인드 Action 보기", href: "/ax/actions?open=act-006" };
    case "restock-waiting": return { label: "재입고 현황 보기", href: "/ax/inventory" };
    case "post-return-drop": return { label: "케어 Action 보기", href: "/ax/actions?open=act-011" };
    case "vip": return { label: "VIP 감사 메시지", next: true };
    case "first-purchase": return can(role, "campaign-create") ? { label: "첫 구매 캠페인 보기", href: "/ax/campaigns" } : null;
    case "brand-loyal": return can(role, "brand-margin") ? { label: "브랜드 현황 보기", href: "/ax/brands" } : null;
  }
}

function liveCustomer(c: Customer, s: AppState): Row {
  if (c.id !== DEMO_CUSTOMER_ID) return { ...c, daysSince: c.lastPurchaseAt ? daysBetween(c.lastPurchaseAt, new Date()) : null, live: false };
  const waiting = s.restockSubs.filter((r) => r.status === "waiting").length;
  const seedMine = SEED_ORDERS.filter((o) => o.customerId === DEMO_CUSTOMER_ID).length;
  const lastOrder = s.orders[0]?.createdAt ?? c.lastPurchaseAt;
  const fp = s.fitProfile;
  return {
    ...c, wishlistCount: s.wishlist.length, cartCount: s.cart.reduce((a, x) => a + x.qty, 0), restockWaiting: waiting,
    orderCount: seedMine + s.orders.length, returnCount: s.returns.length, lastPurchaseAt: lastOrder,
    hasFitProfile: !!(fp.height && fp.weight) || !!fp.topSize || !!fp.bottomSize,
    daysSince: lastOrder ? daysBetween(lastOrder, new Date()) : null, live: true,
  };
}

function churnRisk(c: Row): { level: "high" | "mid" | "low"; note: string } {
  if (c.segment === "post-return-drop") return { level: "high", note: "반품 경험 후 구매가 줄었습니다. 케어 메시지를 먼저 검토하세요." };
  if (c.daysSince !== null && c.avgCycleDays && c.daysSince > c.avgCycleDays * 1.6) return { level: "mid", note: `평균 주기(${c.avgCycleDays}일)보다 ${c.daysSince - c.avgCycleDays}일 더 지났습니다.` };
  if (c.orderCount === 0 && daysBetween(c.joinedAt, new Date()) > 60) return { level: "mid", note: "가입 후 60일 넘게 구매가 없습니다." };
  return { level: "low", note: "정상 범위입니다. 별도 조치 없이 관찰합니다." };
}

function suggestionsFor(c: Row, role: Role): { title: string; reason: string; href?: string; next?: boolean }[] {
  const out: { title: string; reason: string; href?: string; next?: boolean }[] = [];
  if (c.restockWaiting > 0) out.push({ title: "재입고 알림 우선 발송", reason: `재입고 대기 ${c.restockWaiting}건 — 입고 완료 시 자동 알림(Loop 1)`, href: "/ax/inventory" });
  if (c.segment === "cycle-due" || (c.avgCycleDays && c.daysSince !== null && c.daysSince >= c.avgCycleDays)) out.push({ title: "재구매 추천 메시지", reason: `평균 주기 ${c.avgCycleDays ?? "-"}일 · 경과 ${c.daysSince ?? "-"}일 — 지금이 재구매 타이밍`, href: "/ax/actions?open=act-005" });
  if (c.wishlistCount >= 3 && c.orderCount === 0) out.push({ title: "찜 상품 리마인드", reason: `찜 ${c.wishlistCount}개, 구매 없음 — 찜 상품 소폭 할인 안내`, href: "/ax/actions?open=act-006" });
  else if (c.cartCount > 0) out.push({ title: "장바구니 리마인드", reason: `장바구니 ${c.cartCount}개 보관 중 — 재고 소진 전 안내`, href: "/ax/actions?open=act-006" });
  if (!c.hasFitProfile) out.push({ title: "핏 프로필 작성 유도", reason: "사이즈 반품 예방 · 추천 정확도 향상 (고객 화면 마이 > 핏 프로필)", href: "/my/profile" });
  if (c.returnCount >= 2) out.push({ title: "핏 안내 강화 상품 우선 노출", reason: `반품 ${c.returnCount}회 — 사이즈 안내가 명확한 상품부터 추천`, href: "/ax/fit-returns" });
  if (c.segment === "vip") out.push({ title: "VIP 감사 메시지", reason: `누적 ${krwShort(c.totalSpend)} · ${c.orderCount}회 구매 — 감사·선공개 혜택`, next: true });
  if (c.segment === "brand-loyal" && c.favoriteBrandId) out.push({ title: `${BRAND_BY_ID[c.favoriteBrandId]?.name ?? "선호 브랜드"} 신상품 소식`, reason: "선호 브랜드 반복 구매 — 신상품 알림이 효과적", href: can(role, "brand-margin") ? "/ax/brands" : undefined });
  if (out.length < 2) out.push({ title: "브랜드 신상품 소식", reason: `관심 카테고리 ${c.favoriteCategory ? CATEGORY_NAME[c.favoriteCategory] : "미확인"} 기준 신상품 추천`, href: "/ax/products" });
  return out.slice(0, 3);
}

export function CustomersPage() {
  return (
    <>
      <PageHeader title="고객·재구매" desc="구매이력·관심·구매주기 데이터를 세그먼트로 나누고, 지금 할 수 있는 행동을 제안합니다. 모든 고객은 가상 데이터이며 전화번호·이메일 같은 개인정보는 존재하지 않습니다."
        badge={<Badge tone="demo">개인정보 없음 · 가상 고객</Badge>} right={<LiveFreshness />} />
      <Hydrated fallback={<PageSkeleton kpis={5} />}><CustomersBody /></Hydrated>
    </>
  );
}

function CustomersBody() {
  const store = useApp();
  const role = store.role;
  const params = useSearchParams();
  const mobile = useIsMobile();
  const [segment, setSegment] = useState<SegmentId | "all">((params.get("segment") as SegmentId) ?? "all");
  const [brand, setBrand] = useState("all");
  const [profile, setProfile] = useState<"all" | "yes" | "no">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"ltv" | "recent" | "orders" | "elapsed">("ltv");
  const [openId, setOpenId] = useState<string | null>(params.get("customer"));
  const [nextOpen, setNextOpen] = useState(false);
  useEffect(() => { const c = params.get("customer"); if (c && CUSTOMER_BY_ID[c]) setOpenId(c); }, [params]);

  const kpi = useMemo(() => customerKpi(store), [store]);
  const repeat = useMemo(() => salesKpi(store, "90d").repeat, [store]);
  const rows = useMemo(() => CUSTOMERS.map((c) => liveCustomer(c, store)), [store]);
  const me = rows.find((r) => r.id === DEMO_CUSTOMER_ID)!;
  const orders = useMemo(() => allOrders(store), [store]);

  const scenarioD = useMemo(() => rows.filter((r) => r.id !== DEMO_CUSTOMER_ID && r.segment === "cycle-due" && r.favoriteBrandId === SCENARIO.D_BRAND && r.orderCount >= 2 && r.avgCycleDays === 45 && r.daysSince !== null && r.daysSince >= 40 && r.daysSince <= 52), [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (segment !== "all") list = list.filter((r) => r.segment === segment);
    if (brand !== "all") list = list.filter((r) => r.favoriteBrandId === brand);
    if (profile !== "all") list = list.filter((r) => (profile === "yes" ? r.hasFitProfile : !r.hasFitProfile));
    if (q.trim()) list = list.filter((r) => r.name.includes(q.trim()) || r.id.includes(q.trim()));
    const by: Record<typeof sort, (a: Row, b: Row) => number> = {
      ltv: (a, b) => b.ltv - a.ltv,
      recent: (a, b) => (b.lastPurchaseAt ?? "").localeCompare(a.lastPurchaseAt ?? ""),
      orders: (a, b) => b.orderCount - a.orderCount,
      elapsed: (a, b) => (b.daysSince ?? -1) - (a.daysSince ?? -1),
    };
    return [...list].sort(by[sort]);
  }, [rows, segment, brand, profile, q, sort]);
  const { limit, hasMore, more } = useMore(filtered.length, 40);
  const activeFilters = (segment !== "all" ? 1 : 0) + (brand !== "all" ? 1 : 0) + (profile !== "all" ? 1 : 0) + (q ? 1 : 0);

  const columns: Column<Row>[] = [
    { key: "name", header: "고객", primary: true, cell: (r) => (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{displayName(r.name, role)}</span>
        {r.live && <Badge tone="primary" size="sm">시연 고객</Badge>}
        {mobile && <Badge tone="neutral" size="sm">{SEGMENT_LABEL[r.segment]}</Badge>}
      </div>
    ) },
    { key: "segment", header: "세그먼트", hideOnMobile: true, cell: (r) => <Badge tone={r.segment === "cycle-due" ? "accent" : r.segment === "post-return-drop" ? "warning" : r.segment === "vip" ? "success" : "neutral"} size="sm">{SEGMENT_LABEL[r.segment]}</Badge> },
    { key: "brand", header: "선호 브랜드", cell: (r) => (r.favoriteBrandId ? BRAND_BY_ID[r.favoriteBrandId].name : "-") },
    { key: "orders", header: "주문", align: "right", cell: (r) => num(r.orderCount) },
    { key: "last", header: "최근 구매", cell: (r) => (r.lastPurchaseAt ? fmtDate(r.lastPurchaseAt) : "-") },
    { key: "elapsed", header: "경과일", align: "right", cell: (r) => (r.daysSince === null ? "-" : `${r.daysSince}일`) },
    { key: "signals", header: "찜·장바구니·대기", align: "right", cell: (r) => <span className="tabular">{r.wishlistCount} · {r.cartCount} · {r.restockWaiting}</span> },
    { key: "profile", header: "핏 프로필", cell: (r) => <Badge tone={r.hasFitProfile ? "success" : "neutral"} size="sm">{r.hasFitProfile ? "완료" : "미작성"}</Badge> },
    { key: "ltv", header: "추정 가치", align: "right", cell: (r) => krwShort(r.ltv) },
  ];

  const dColumns: Column<Row>[] = [
    { key: "name", header: "이름", primary: true, cell: (r) => <span className="font-semibold">{displayName(r.name, role)}</span> },
    { key: "last", header: "최근 구매", cell: (r) => (r.lastPurchaseAt ? fmtDate(r.lastPurchaseAt) : "-") },
    { key: "cycle", header: "평균 주기", align: "right", cell: (r) => `${r.avgCycleDays ?? "-"}일` },
    { key: "elapsed", header: "경과일", align: "right", cell: (r) => <span className="font-semibold">{r.daysSince ?? "-"}일</span> },
    { key: "brand", header: "선호 브랜드", cell: (r) => (r.favoriteBrandId ? BRAND_BY_ID[r.favoriteBrandId].name : "-") },
    { key: "ltv", header: "추정 가치", align: "right", cell: (r) => krwShort(r.ltv) },
    { key: "state", header: "상태", cell: (r) => <Badge tone={(r.daysSince ?? 0) >= (r.avgCycleDays ?? 45) ? "warning" : "info"} size="sm">{(r.daysSince ?? 0) >= (r.avgCycleDays ?? 45) ? "주기 도래" : "도래 임박"}</Badge> },
  ];

  const open = openId ? rows.find((r) => r.id === openId) ?? null : null;

  return (
    <div className="animate-fadeIn">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4">
        <KpiCard label="전체 고객" value={num(kpi.total)} icon={<Users size={18} />} accent={ICON_ACCENTS.customer} sub="가상 고객 (DEMO)" />
        <KpiCard label="구매 고객" value={num(kpi.buyers)} icon={<ShoppingBag size={18} />} accent={ICON_ACCENTS.sales} sub="90일 내 1회 이상 주문" />
        <KpiCard label="신규 30일" value={num(kpi.newCust30)} icon={<UserPlus size={18} />} accent={ICON_ACCENTS.overview} sub="최근 30일 가입" />
        <KpiCard label="사이즈 프로필 완성률" value={pct(kpi.profileRate, 0)} icon={<Ruler size={18} />} accent="#C76C86" sub="핏 프로필 입력 고객 비율" />
        <KpiCard label="재구매율 (90일)" value={pct(repeat, 1)} icon={<Repeat size={18} />} accent={ICON_ACCENTS.evidence} sub={<span><Term term="재구매율">2회 이상 구매</Term> 고객 비율</span>} />
      </div>

      {/* 현재 시연 고객 */}
      <Card className="mt-6 border-theme-primary/30" pad="md">
        <div className="flex items-start gap-3 min-w-0">
          <span className="h-12 w-12 shrink-0 rounded-2xl bg-theme-soft text-theme-primary flex items-center justify-center font-black text-[1.1rem]">{DEMO_CUSTOMER_NAME[0]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap"><p className="font-bold text-[1.05rem]">현재 시연 고객 · {DEMO_CUSTOMER_NAME}</p><Badge tone="primary" size="sm">LIVE 상태</Badge><Badge tone="accent" size="sm">{SEGMENT_LABEL[me.segment]}</Badge></div>
            <p className="text-[0.88rem] text-neutral-text2 mt-1 leading-relaxed">고객 화면에서 찜·장바구니·재입고 신청·주문을 하면 아래 숫자가 바로 바뀝니다 (Closed Loop). 개인정보 없음 · 가상 고객.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 flex-1 min-w-0">
            <Stat label="찜" value={<span className="inline-flex items-center gap-1"><Heart size={16} className="text-neutral-text2" />{me.wishlistCount}</span>} />
            <Stat label="장바구니" value={<span className="inline-flex items-center gap-1"><ShoppingCart size={16} className="text-neutral-text2" />{me.cartCount}</span>} />
            <Stat label="재입고 대기" value={<span className="inline-flex items-center gap-1"><BellRing size={16} className="text-neutral-text2" />{me.restockWaiting}</span>} />
            <Stat label="주문" value={<span className="inline-flex items-center gap-1"><PackageCheck size={16} className="text-neutral-text2" />{me.orderCount}</span>} sub={`DEMO 주문 ${store.orders.length}건`} />
            <Stat label="반품" value={<span className="inline-flex items-center gap-1"><Undo2 size={16} className="text-neutral-text2" />{me.returnCount}</span>} />
          </div>
          <Button variant="outline" onClick={() => setOpenId(DEMO_CUSTOMER_ID)} icon={<ChevronRight size={16} />} className="sm:shrink-0">상세 보기</Button>
        </div>
      </Card>

      {/* Segments */}
      <SectionBlock title="세그먼트 7" desc="규칙으로 나눈 고객 그룹입니다. 각 그룹마다 지금 할 수 있는 행동이 다릅니다 (Engine 4 · Repeat · RULE+STAT).">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {SEGMENTS.map((s) => {
            const meta = SEGMENT_META[s];
            const cta = segmentCta(s, role);
            return (
              <Card key={s} className="flex flex-col gap-3" pad="md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.accent}1f`, color: meta.accent }}>{meta.icon}</span>
                    <p className="font-bold leading-tight">{SEGMENT_LABEL[s]}</p>
                  </div>
                  <span className="text-[1.6rem] font-bold tabular leading-none">{num(kpi.segments[s])}<span className="text-[0.85rem] text-neutral-text2 font-semibold ml-0.5">명</span></span>
                </div>
                <p className="text-[0.88rem] text-neutral-text2 leading-relaxed flex-1">{meta.meaning}</p>
                <div className="flex flex-wrap gap-2">
                  {cta && (cta.next ? (
                    <Button size="sm" variant="secondary" onClick={() => setNextOpen(true)} className="!whitespace-normal !h-auto min-h-[36px] py-1.5 max-w-full">{cta.label}<Badge tone="next" size="sm">NEXT</Badge></Button>
                  ) : (
                    <Button size="sm" variant="primary" href={cta.href} className="!whitespace-normal !h-auto min-h-[36px] py-1.5 max-w-full text-center">{cta.label}</Button>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => { setSegment(s); document.getElementById("customer-list")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>목록 보기</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </SectionBlock>

      {/* Scenario D */}
      <SectionBlock title={<span className="inline-flex items-center gap-2"><Zap size={20} className="text-theme-primary" />Scenario D · AERNO 구매주기 도래 {num(scenarioD.length)}명</span>}
        desc="AERNO를 2회 이상 구매한 고객 중 평균 구매주기(45일)가 돌아온 고객입니다. 이 세그먼트가 act-005 재구매 캠페인 Action의 근거가 되고, Action 실행 시 캠페인 cp-06이 진행 상태로 바뀌며 고객 My Page에 추천이 나타납니다 (Loop 4)." tour="segment-d"
        right={<Button href="/ax/actions?open=act-005" icon={<ChevronRight size={16} />}>재구매 캠페인 Action 보기</Button>}>
        <Card pad="md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Stat label="대상 고객" value={`${num(scenarioD.length)}명`} sub="주기 40~52일 경과" />
            <Stat label="평균 구매주기" value="45일" sub="AERNO 2회 이상 구매" />
            <Stat label="과거 재구매 전환율" value="18%" sub="Demo 집계 (SIMULATION)" />
            <Stat label="예상 재구매" value="7~9건" sub="객단가 12만원 기준 · VALIDATE LATER" />
          </div>
          <p className="text-[0.85rem] text-neutral-text2 mb-3">샘플 6명 (전체 {num(scenarioD.length)}명 중) · 이름은 가상 데이터입니다.</p>
          <DataTable rows={scenarioD.slice(0, 6)} columns={dColumns} rowKey={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} dense />
          <NoteCard className="mt-4">캠페인 발송 여부는 MD가 승인합니다 (L2 · 시스템은 추천만). 발송 후 실제 재구매율은 실증 단계에서 Baseline과 비교합니다 — 지금 숫자는 시뮬레이션입니다.</NoteCard>
        </Card>
      </SectionBlock>

      {/* Customer list */}
      <SectionBlock title="고객 목록" desc={`${num(filtered.length)}명 · 행을 누르면 구매이력과 제안 행동을 볼 수 있습니다.`} id="customer-list">
        <FilterBar activeCount={activeFilters} className="mb-4">
          <div className="w-full md:w-64"><Input label="검색" placeholder="이름 또는 고객 ID" value={q} onChange={(e) => setQ(e.target.value)} name="cust-q" /></div>
          <div className="w-full md:w-52"><Select label="세그먼트" name="cust-seg" value={segment} onChange={(e) => setSegment(e.target.value as SegmentId | "all")}>
            <option value="all">전체 세그먼트</option>{SEGMENTS.map((s) => <option key={s} value={s}>{SEGMENT_LABEL[s]} ({kpi.segments[s]})</option>)}
          </Select></div>
          <div className="w-full md:w-48"><Select label="선호 브랜드" name="cust-brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="all">전체 브랜드</option>{BRANDS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select></div>
          <div className="w-full md:w-40"><Select label="핏 프로필" name="cust-profile" value={profile} onChange={(e) => setProfile(e.target.value as "all" | "yes" | "no")}>
            <option value="all">전체</option><option value="yes">작성 완료</option><option value="no">미작성</option>
          </Select></div>
          <div className="w-full md:w-44"><Select label="정렬" name="cust-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="ltv">추정 가치 높은 순</option><option value="recent">최근 구매 순</option><option value="orders">주문 많은 순</option><option value="elapsed">경과일 긴 순</option>
          </Select></div>
          {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={() => { setSegment("all"); setBrand("all"); setProfile("all"); setQ(""); }}>초기화</Button>}
        </FilterBar>
        <DataTable rows={filtered.slice(0, limit)} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => setOpenId(r.id)}
          empty={<EmptyState title="조건에 맞는 고객이 없습니다" desc="필터를 바꾸거나 초기화해 보세요." icon={<Search size={22} />} action={<Button variant="outline" onClick={() => { setSegment("all"); setBrand("all"); setProfile("all"); setQ(""); }}>필터 초기화</Button>} />} />
        <MoreButton hasMore={hasMore} onClick={more} remaining={filtered.length - limit} />
        <p className="mt-3 text-[0.8rem] text-neutral-text2">개인정보 없음 · 가상 고객 · 이름은 {role === "owner" ? "대표 권한으로 전체 표시" : "권한에 따라 가운데 글자를 가립니다"}.</p>
      </SectionBlock>

      {/* Detail drawer */}
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `${displayName(open.name, role)} 고객` : ""} width="max-w-lg">
        {open && <CustomerDetail c={open} role={role} orders={orders.filter((o) => o.customerId === open.id)} onNext={() => setNextOpen(true)} />}
      </Drawer>

      <Modal open={nextOpen} onClose={() => setNextOpen(false)} title="VIP 감사 메시지 · NEXT" size="sm">
        <div className="space-y-3 text-[0.92rem] leading-relaxed">
          <div className="flex items-center gap-2"><Badge tone="next">NEXT</Badge><span className="font-bold">아직 구현되지 않은 기능입니다</span></div>
          <p className="text-neutral-text2">VIP 고객에게 감사 메시지·선공개 혜택을 보내는 기능은 멤버십(NEXT 5) 단계에서 알림톡·이메일 연동과 함께 제공될 예정입니다. 지금은 세그먼트 규칙과 대상 인원만 계산합니다.</p>
          <p className="text-neutral-text2">Demo에서 할 수 있는 것: 고객 목록에서 VIP 세그먼트를 확인하고, 캠페인·기획전에서 세그먼트 캠페인 초안을 만들어 볼 수 있습니다.</p>
          <div className="flex gap-2 pt-1"><Button variant="outline" href="/next/membership" size="sm">멤버십 Preview</Button><Button size="sm" onClick={() => setNextOpen(false)}>확인</Button></div>
        </div>
      </Modal>
    </div>
  );
}

function CustomerDetail({ c, role, orders, onNext }: { c: Row; role: Role; orders: ReturnType<typeof allOrders>; onNext: () => void }) {
  const risk = churnRisk(c);
  const sug = suggestionsFor(c, role);
  const spent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const riskTone = risk.level === "high" ? "error" : risk.level === "mid" ? "warning" : "success";
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone="accent">{SEGMENT_LABEL[c.segment]}</Badge>
        {c.live && <Badge tone="primary">시연 고객 · LIVE</Badge>}
        <Badge tone="demo" size="sm">개인정보 없음 · 가상 고객</Badge>
      </div>
      <dl className="rounded-xl border border-neutral-border px-4">
        <KV label="고객 ID">{c.id}</KV>
        <KV label="성별 · 나이대">{c.gender === "women" ? "여성" : "남성"} · {Math.floor(c.age / 10) * 10}대</KV>
        <KV label="가입">{fmtDate(c.joinedAt)} ({daysBetween(c.joinedAt, new Date())}일 전)</KV>
        <KV label="선호 브랜드">{c.favoriteBrandId ? BRAND_BY_ID[c.favoriteBrandId].name : "-"}</KV>
        <KV label="관심 카테고리">{c.favoriteCategory ? CATEGORY_NAME[c.favoriteCategory] : "-"}</KV>
        <KV label="핏 프로필"><Badge tone={c.hasFitProfile ? "success" : "neutral"} size="sm">{c.hasFitProfile ? "작성 완료" : "미작성"}</Badge></KV>
      </dl>

      <div>
        <p className="font-bold mb-2">구매이력 요약</p>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="누적 주문" value={`${num(c.orderCount)}회`} sub={`누적 ${krwShort(c.totalSpend)}`} />
          <Stat label="평균 구매주기" value={c.avgCycleDays ? `${c.avgCycleDays}일` : "-"} sub={c.daysSince !== null ? `최근 구매 후 ${c.daysSince}일` : "구매 없음"} />
          <Stat label="90일 주문" value={`${num(orders.length)}건`} sub={krwShort(spent)} />
          <Stat label="추정 가치" value={krwShort(c.ltv)} sub="규칙 계산 (DEMO)" />
        </div>
        {orders.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="rounded-xl border border-neutral-border p-3 text-[0.88rem]">
                <div className="flex items-center justify-between gap-2 flex-wrap"><Link href={`/ax/orders?q=${o.id}`} className="font-semibold hover:text-theme-primary">{o.id}</Link><OrderStatusBadge status={o.status} /></div>
                <p className="text-neutral-text2 mt-1">{o.items.map((i) => { const p = PRODUCT_BY_ID[i.productId]; const v = VARIANT_BY_ID[i.variantId]; return `${p?.name ?? i.productId} ${v ? `${v.color}/${v.size}` : ""}`; }).join(", ")}</p>
                <p className="text-neutral-text2 mt-0.5 tabular">{fmtDate(o.createdAt, "datetime")} · {krw(o.total)}</p>
              </li>
            ))}
            {orders.length > 5 && <li className="text-[0.82rem] text-neutral-text2">외 {orders.length - 5}건 · <Link href="/ax/orders" className="underline">주문 화면에서 보기</Link></li>}
          </ul>
        ) : <p className="mt-3 text-[0.85rem] text-neutral-text2 rounded-xl bg-neutral-canvas px-4 py-3">최근 90일 주문 기록이 없습니다.</p>}
      </div>

      <div>
        <p className="font-bold mb-2">관심 신호</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="찜" value={c.wishlistCount} />
          <Stat label="장바구니" value={c.cartCount} />
          <Stat label="재입고 대기" value={c.restockWaiting} />
          <Stat label="반품" value={c.returnCount} />
        </div>
      </div>

      <NoteCard tone={risk.level === "high" ? "warning" : "neutral"} icon={<ShieldAlert size={16} />}>
        <span className="font-bold mr-1.5">이탈 위험 <Badge tone={riskTone} size="sm">{risk.level === "high" ? "높음" : risk.level === "mid" ? "중간" : "낮음"}</Badge></span>
        <span className="block mt-1">{risk.note}</span>
      </NoteCard>

      <div>
        <p className="font-bold mb-2">이 고객에게 할 수 있는 것</p>
        <ul className="space-y-2">
          {sug.map((s) => (
            <li key={s.title} className="rounded-xl border border-neutral-border p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-[0.95rem] inline-flex items-center gap-1.5">{s.title}{s.next && <Badge tone="next" size="sm">NEXT</Badge>}</span>
                {s.next ? <Button size="sm" variant="secondary" onClick={onNext}>설명 보기</Button> : s.href ? <Button size="sm" variant="outline" href={s.href}>{s.href.startsWith("/my") ? "고객 화면" : "이동"}</Button> : null}
              </div>
              <p className="text-[0.85rem] text-neutral-text2 mt-1">이유: {s.reason}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[0.8rem] text-neutral-text2 inline-flex items-center gap-1"><Clock size={12} />규칙 기반 제안 · 실행은 담당자가 결정합니다 (L2).</p>
      </div>
      <p className="text-[0.78rem] text-neutral-text2">{relTime(c.joinedAt)} 가입 · 가상 고객 · DEMO</p>
    </div>
  );
}
