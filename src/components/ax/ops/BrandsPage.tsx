"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Store, Handshake, Boxes, Undo2, ChevronRight, Clock, UserRound, Lock, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ax/AxShell";
import { Hydrated } from "@/components/system/Hydrated";
import { useApp } from "@/lib/store";
import { BRANDS, PRODUCT_BY_ID, RETURN_REASON_LABEL } from "@/lib/demo/seed";
import { allOrders, allProductAgg, allReturns, inventoryStatus, INVENTORY_STATUS_LABEL, type ProductAgg } from "@/lib/kpi";
import { can } from "@/lib/roles";
import type { Brand, InventoryStatus, ReturnReason } from "@/lib/types";
import { krwShort, num, pct, safeDiv } from "@/lib/format";
import { fmtDate } from "@/lib/dates";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Form";
import { KpiCard, Stat } from "@/components/ui/Kpi";
import { Term } from "@/components/ui/Misc";
import { GradientImage } from "@/components/ui/ProductImage";
import { Drawer } from "@/components/ui/Overlay";
import { InventoryStatusBadge } from "@/components/ax/StatusBadges";
import { KV, LiveFreshness, NoteCard, PageSkeleton, SectionBlock } from "./shared";
import { cn } from "@/lib/cn";

const CONTRACT_LABEL: Record<Brand["contractStatus"], string> = { active: "계약중", renewal: "갱신 예정", new: "신규 입점" };
const CONTRACT_TONE: Record<Brand["contractStatus"], Tone> = { active: "success", renewal: "warning", new: "info" };
const SOURCING_LABEL = { purchase: "사입", consignment: "입점·위탁" } as const;
const STATUS_ORDER: InventoryStatus[] = ["soldout", "low", "rising", "overstock", "slow", "restock-review", "restock-progress", "restocked", "normal"];

interface BrandStat { brand: Brand; products: number; revenue30d: number; orders30d: number; marginRate: number; returnRate: number; sales30d: number; returns30d: number; riskOptions: number; statusCounts: Partial<Record<InventoryStatus, number>>; top: ProductAgg[]; topReasons: { reason: ReturnReason; count: number }[] }

export function BrandsPage() {
  return (
    <>
      <PageHeader title="브랜드·파트너" desc="브랜드별 매출·마진(또는 수수료)·반품·품절위험을 한 화면에서 비교합니다. 파트너가 직접 로그인하는 파트너센터는 NEXT 단계입니다."
        badge={<Badge tone="demo">DEMO</Badge>} right={<LiveFreshness />} />
      <Hydrated fallback={<PageSkeleton kpis={4} />}><BrandsBody /></Hydrated>
    </>
  );
}

function BrandsBody() {
  const store = useApp();
  const showMargin = can(store.role, "brand-margin");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState<"revenue" | "returns" | "risk">("revenue");

  const stats = useMemo<BrandStat[]>(() => {
    const aggs = allProductAgg(store);
    const orders = allOrders(store).filter((o) => o.status !== "cancelled" && Date.now() - new Date(o.createdAt).getTime() <= 30 * 86400000);
    const returns = allReturns(store);
    return BRANDS.map((b) => {
      const as = aggs.filter((a) => a.product.brandId === b.id);
      const revenue30d = as.reduce((s, a) => s + a.revenue30d, 0);
      const sales30d = as.reduce((s, a) => s + a.sales30d, 0);
      const returns30d = as.reduce((s, a) => s + a.returns30d, 0);
      const marginRate = safeDiv(as.reduce((s, a) => s + a.margin30d, 0), Math.max(1, revenue30d));
      const statusCounts: Partial<Record<InventoryStatus, number>> = {};
      let risk = 0;
      for (const a of as) for (const v of a.variants) { const st = inventoryStatus(v, store); statusCounts[st] = (statusCounts[st] ?? 0) + 1; if (st === "low" || st === "soldout") risk++; }
      const cnt: Partial<Record<ReturnReason, number>> = {};
      for (const r of returns) if (PRODUCT_BY_ID[r.productId]?.brandId === b.id) cnt[r.reason] = (cnt[r.reason] ?? 0) + 1;
      const topReasons = (Object.entries(cnt) as [ReturnReason, number][]).map(([reason, count]) => ({ reason, count })).sort((x, y) => y.count - x.count).slice(0, 3);
      return { brand: b, products: as.length, revenue30d, sales30d, returns30d, orders30d: orders.filter((o) => o.items.some((i) => PRODUCT_BY_ID[i.productId]?.brandId === b.id)).length, marginRate, returnRate: safeDiv(returns30d, Math.max(1, sales30d)), riskOptions: risk, statusCounts, top: [...as].sort((x, y) => y.revenue30d - x.revenue30d).slice(0, 5), topReasons };
    });
  }, [store]);

  const sorted = useMemo(() => [...stats].sort((a, b) => (sort === "revenue" ? b.revenue30d - a.revenue30d : sort === "returns" ? b.returnRate - a.returnRate : b.riskOptions - a.riskOptions)), [stats, sort]);
  const totals = { revenue: stats.reduce((s, x) => s + x.revenue30d, 0), purchase: BRANDS.filter((b) => b.sourcing === "purchase").length, consignment: BRANDS.filter((b) => b.sourcing === "consignment").length, renewal: BRANDS.filter((b) => b.contractStatus === "renewal").length, newB: BRANDS.filter((b) => b.contractStatus === "new").length, risk: stats.reduce((s, x) => s + x.riskOptions, 0) };
  const open = openId ? stats.find((s) => s.brand.id === openId) ?? null : null;

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="브랜드" value={num(BRANDS.length)} icon={<Store size={18} />} accent="#148C8C" sub={`사입 ${totals.purchase} · 입점·위탁 ${totals.consignment}`} />
        <KpiCard label="브랜드 매출 합계 (30일)" value={krwShort(totals.revenue)} icon={<Building2 size={18} />} accent="#D79A43" sub="판매수량 × 판매가 (DEMO)" />
        <KpiCard label="계약 갱신·신규" value={`${totals.renewal} · ${totals.newB}`} icon={<Handshake size={18} />} accent="#5B8DEF" sub="갱신 예정 · 신규 입점" />
        <KpiCard label="품절위험 옵션" value={num(totals.risk)} icon={<Boxes size={18} />} accent="#D66A5E" sub={<span><Term term="옵션">옵션</Term> 기준 품절 임박+품절</span>} />
      </div>

      <SectionBlock title="브랜드 현황" desc="카드를 누르면 상위 상품·옵션 상태·반품 사유·담당 MD를 볼 수 있습니다."
        right={<Segmented size="sm" value={sort} onChange={setSort} options={[{ value: "revenue", label: "매출순" }, { value: "returns", label: "반품률순" }, { value: "risk", label: "품절위험순" }]} />}>
        {!showMargin && <NoteCard className="mb-4" icon={<Lock size={16} />}>운영 역할에서는 마진·수수료율이 표시되지 않습니다 (설정 &gt; 권한 매트릭스).</NoteCard>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((s) => (
            <Card key={s.brand.id} hover pad="none" onClick={() => setOpenId(s.brand.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenId(s.brand.id); } }} className="overflow-hidden active:bg-neutral-canvas">
              <GradientImage gradient={s.brand.gradient} ratio="aspect-[5/1]" label={s.brand.name} overlay>
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-2.5"><span className="text-white font-black tracking-tight text-[1.15rem]">{s.brand.name}</span><span className="flex gap-1.5"><Badge tone="dark" size="sm">{SOURCING_LABEL[s.brand.sourcing]}</Badge><Badge tone={CONTRACT_TONE[s.brand.contractStatus]} size="sm">{CONTRACT_LABEL[s.brand.contractStatus]}</Badge></span></div>
              </GradientImage>
              <div className="p-4 md:p-5">
                <p className="text-[0.85rem] text-neutral-text2">{s.brand.tagline}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Stat label="상품" value={num(s.products)} />
                  <Stat label="매출 30일" value={<span className="text-[1.05rem]">{krwShort(s.revenue30d)}</span>} />
                  <Stat label="주문 30일" value={num(s.orders30d)} />
                  <Stat label={s.brand.sourcing === "purchase" ? "마진율" : "수수료율"} value={showMargin ? pct(s.brand.sourcing === "purchase" ? s.marginRate : s.brand.commissionRate, 0) : <span className="inline-flex items-center gap-1 text-neutral-text2 text-[0.95rem]"><Lock size={14} />비공개</span>} sub={s.brand.sourcing === "purchase" ? "사입 · 원가 기준" : "입점·위탁"} />
                  <Stat label="반품률" value={<span className={cn(s.returnRate > 0.1 && "text-semantic-error")}>{pct(s.returnRate, 1)}</span>} sub={`${s.returns30d} / ${s.sales30d}`} />
                  <Stat label="품절위험" value={<span className={cn(s.riskOptions > 0 && "text-semantic-warning")}>{s.riskOptions}</span>} sub="옵션" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[0.82rem] text-neutral-text2">
                  <span className="inline-flex items-center gap-1"><UserRound size={14} />{s.brand.manager}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={14} />리드타임 {s.brand.leadTimeDays}일</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </SectionBlock>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.brand.name ?? ""} width="max-w-lg">
        {open && <BrandDetail s={open} showMargin={showMargin} />}
      </Drawer>
    </div>
  );
}

const NEXT_ITEMS = ["파트너 직접 로그인", "상품 등록", "재고 연동", "정산", "기획전 신청", "성과 리포트"];

function BrandDetail({ s, showMargin }: { s: BrandStat; showMargin: boolean }) {
  const b = s.brand;
  return (
    <div className="space-y-5">
      <GradientImage gradient={b.gradient} ratio="aspect-[3/1]" label={b.name} overlay><div className="absolute inset-0 flex items-end px-4 pb-3"><span className="text-white font-black text-[1.3rem]">{b.name}</span></div></GradientImage>
      <div className="flex items-center gap-2 flex-wrap"><Badge tone="neutral">{SOURCING_LABEL[b.sourcing]}</Badge><Badge tone={CONTRACT_TONE[b.contractStatus]}>{CONTRACT_LABEL[b.contractStatus]}</Badge><Badge tone="demo" size="sm">DEMO</Badge></div>
      <p className="text-[0.92rem] leading-relaxed text-neutral-text2">{b.description}</p>
      <dl className="rounded-xl border border-neutral-border px-4">
        <KV label="담당 MD">{b.manager}</KV>
        <KV label="정산 기준">{b.sourcing === "purchase" ? (showMargin ? `사입 · 마진율 ${pct(s.marginRate, 0)}` : "사입 (마진 비공개)") : (showMargin ? `입점·위탁 · 수수료 ${pct(b.commissionRate, 0)}` : "입점·위탁 (수수료 비공개)")}</KV>
        <KV label="리드타임">{b.leadTimeDays}일</KV>
        <KV label="입점일">{fmtDate(b.joinedAt)}</KV>
        <KV label="팔로워">{num(b.followers)}</KV>
      </dl>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="매출 30일" value={krwShort(s.revenue30d)} sub={`주문 ${s.orders30d}건`} />
        <Stat label="반품률" value={pct(s.returnRate, 1)} sub={`${s.returns30d} / ${s.sales30d}개`} />
      </div>
      <div>
        <p className="font-bold mb-2">상위 상품 (매출 30일)</p>
        <ul className="space-y-1.5">
          {s.top.map((a) => <li key={a.product.id}><Link href={`/ax/products/${a.product.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-border px-3 py-2 hover:bg-neutral-canvas transition-colors"><span className="min-w-0"><span className="font-semibold text-[0.9rem]">{a.product.name}</span><span className="text-[0.8rem] text-neutral-text2 ml-1.5">{krwShort(a.revenue30d)}</span></span><InventoryStatusBadge status={a.worst} /></Link></li>)}
        </ul>
      </div>
      <div>
        <p className="font-bold mb-2">옵션 상태</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.filter((st) => s.statusCounts[st]).map((st) => <span key={st} className="inline-flex items-center gap-1"><InventoryStatusBadge status={st} /><span className="text-[0.82rem] tabular text-neutral-text2">{s.statusCounts[st]}</span></span>)}
        </div>
        <p className="mt-1.5 text-[0.8rem] text-neutral-text2">{INVENTORY_STATUS_LABEL.low}·{INVENTORY_STATUS_LABEL.soldout} 옵션은 재고·재입고 화면에서 Action으로 이어집니다. <Link href="/ax/inventory" className="underline">Demand Radar</Link></p>
      </div>
      <div>
        <p className="font-bold mb-2 inline-flex items-center gap-1.5"><Undo2 size={16} />반품 사유 Top</p>
        {s.topReasons.length === 0 ? <p className="text-[0.88rem] text-neutral-text2">90일 내 반품 기록이 없습니다.</p> : <dl className="rounded-xl border border-neutral-border px-4">{s.topReasons.map((r) => <KV key={r.reason} label={RETURN_REASON_LABEL[r.reason]}>{r.count}건</KV>)}</dl>}
      </div>
      <div className="rounded-xl border border-dashed border-neutral-border p-4">
        <div className="flex items-center gap-2 mb-2"><Badge tone="next">NEXT</Badge><p className="font-bold">파트너센터 (미구현)</p></div>
        <ul className="grid grid-cols-2 gap-1.5">{NEXT_ITEMS.map((n) => <li key={n} className="flex items-center gap-1.5 text-[0.88rem]"><Badge tone="next" size="sm">NEXT</Badge>{n}</li>)}</ul>
        <p className="mt-2.5 text-[0.82rem] text-neutral-text2 leading-relaxed">위 기능은 아직 구현되지 않았습니다. 지금은 MORFIT 내부 MD가 브랜드 데이터를 관리하며, 파트너가 직접 접속하는 파트너센터는 브랜드 파트너센터(NEXT 5) 단계에서 제공됩니다. <Link href="/next/partner-center" className="underline">Preview 보기</Link></p>
      </div>
    </div>
  );
}
