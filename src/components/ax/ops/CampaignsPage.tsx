"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Megaphone, CalendarDays, Plus, Trash2, ChevronRight, Zap, Eye, MousePointerClick, ShoppingCart, PackageCheck, CheckCircle2, Search } from "lucide-react";
import { PageHeader } from "@/components/ax/AxShell";
import { Hydrated } from "@/components/system/Hydrated";
import { useApp, campaignStatus, ROLE_NAME } from "@/lib/store";
import { BRAND_BY_ID, CAMPAIGNS, PRODUCTS, PRODUCT_BY_ID, SEGMENT_LABEL } from "@/lib/demo/seed";
import { can } from "@/lib/roles";
import type { Campaign, SegmentId } from "@/lib/types";
import { krwShort, num, pct, pctDelta, safeDiv, signed } from "@/lib/format";
import { fmtDate, todayKey } from "@/lib/dates";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input, Segmented, Select } from "@/components/ui/Form";
import { KpiCard, Stat } from "@/components/ui/Kpi";
import { Drawer, Modal } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { ActionStatusBadge } from "@/components/ax/StatusBadges";
import { LiveFreshness, NoteCard, PageSkeleton, SectionBlock, useLocalJson } from "./shared";
import { cn } from "@/lib/cn";

interface CampaignDraft { id: string; name: string; segment: SegmentId | "all"; productIds: string[]; discountRate: number; startAt: string; endAt: string; createdAt: string; createdBy: string }
type Row = Campaign & { effStatus: Campaign["status"]; isDraft: boolean };

const TYPE_LABEL: Record<Campaign["type"], string> = { sale: "세일", brand: "브랜드", segment: "세그먼트", restock: "재입고", new: "신규 런칭" };
const STATUS_LABEL: Record<Campaign["status"], string> = { draft: "초안", scheduled: "예정", running: "진행중", ended: "종료" };
const STATUS_TONE: Record<Campaign["status"], Tone> = { draft: "neutral", scheduled: "info", running: "success", ended: "neutral" };
const SEGMENTS: (SegmentId | "all")[] = ["all", "first-purchase", "wish-no-buy", "restock-waiting", "cycle-due", "brand-loyal", "post-return-drop", "vip"];
const segLabel = (s: SegmentId | "all") => (s === "all" ? "전체 고객" : SEGMENT_LABEL[s]);

function draftToRow(d: CampaignDraft): Row {
  return { id: d.id, name: d.name, type: d.segment === "all" ? "sale" : "segment", startAt: d.startAt, endAt: d.endAt, status: "draft", productIds: d.productIds, segment: d.segment, discountRate: d.discountRate, impressions: 0, clicks: 0, carts: 0, orders: 0, revenue: 0, discountCost: 0, estMargin: 0, returns: 0, beforeRevenue: 0, effStatus: "draft", isDraft: true };
}

function verdict(c: Row): { label: string; tone: Tone; why: string } {
  if (c.isDraft) return { label: "초안", tone: "neutral", why: "저장된 초안입니다. 실제 발송·노출은 연동 예정(READY)." };
  if (c.orders === 0 || c.revenue === 0) return { label: c.effStatus === "scheduled" ? "예정" : "데이터 없음", tone: "neutral", why: "아직 성과 데이터가 없습니다." };
  const marginRate = safeDiv(c.estMargin, c.revenue);
  const retRate = safeDiv(c.returns, c.orders);
  if (marginRate < 0.2 || retRate > 0.12) return { label: "마진·반품 주의", tone: "warning", why: `추정 마진율 ${pct(marginRate, 0)} · 주문 대비 반품 ${pct(retRate, 0)} — 할인 폭·대상 상품 재검토` };
  if (c.beforeRevenue === 0) return { label: "관찰", tone: "info", why: "캠페인 전 매출 기준이 없어(신규) 비교하지 않습니다." };
  if (c.revenue > c.beforeRevenue * 1.2) return { label: "효과", tone: "success", why: `캠페인 전 대비 ${signed(pctDelta(c.revenue, c.beforeRevenue), 0)} (SIMULATION · 실제 효과는 실증에서 검증)` };
  return { label: "관찰", tone: "info", why: "전후 차이가 20% 미만입니다." };
}

export function CampaignsPage() {
  return (
    <>
      <PageHeader title="캠페인·기획전" desc="세그먼트·상품·할인율을 조합한 캠페인의 노출→클릭→장바구니→주문 흐름과 마진·반품을 함께 봅니다. 매출만 보고 판단하지 않습니다."
        badge={<Badge tone="demo">DEMO</Badge>} right={<LiveFreshness />} />
      <Hydrated fallback={<PageSkeleton kpis={4} />}><CampaignsBody /></Hydrated>
    </>
  );
}

function CampaignsBody() {
  const store = useApp();
  const role = store.role;
  const canCreate = can(role, "campaign-create");
  const showMargin = can(role, "brand-margin");
  const [drafts, setDrafts] = useLocalJson<CampaignDraft[]>("morfit-campaigns-draft", []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | Campaign["status"]>("all");

  const rows = useMemo<Row[]>(() => [
    ...drafts.map(draftToRow),
    ...CAMPAIGNS.map((c) => ({ ...c, effStatus: campaignStatus(c.id, store.campaignStatusOverride), isDraft: false })),
  ], [drafts, store.campaignStatusOverride]);
  const visible = filter === "all" ? rows : rows.filter((r) => r.effStatus === filter);
  const counts = { running: rows.filter((r) => r.effStatus === "running").length, scheduled: rows.filter((r) => r.effStatus === "scheduled").length, ended: rows.filter((r) => r.effStatus === "ended").length, draft: drafts.length };
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const cp06 = rows.find((r) => r.id === "cp-06")!;
  const act005 = store.actions.find((a) => a.id === "act-005");
  const loop4Changed = !!store.campaignStatusOverride["cp-06"];

  const columns: Column<Row>[] = [
    { key: "name", header: "캠페인", primary: true, cell: (r) => (
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold">{r.name}</span><Badge tone={STATUS_TONE[r.effStatus]} size="sm">{STATUS_LABEL[r.effStatus]}</Badge>{r.id === "cp-06" && <Badge tone={loop4Changed ? "success" : "accent"} size="sm"><Zap size={11} />Loop 4</Badge>}{r.isDraft && <Badge tone="ready" size="sm">READY · 연동 예정</Badge>}</div>
        <p className="text-[0.78rem] text-neutral-text2 mt-0.5">{r.id}</p>
      </div>
    ) },
    { key: "period", header: "기간", cell: (r) => <span className="tabular whitespace-nowrap">{fmtDate(r.startAt)} ~ {fmtDate(r.endAt)}</span> },
    { key: "type", header: "유형", cell: (r) => TYPE_LABEL[r.type] },
    { key: "target", header: "대상", cell: (r) => <span>{segLabel(r.segment)} · 상품 {r.productIds.length}</span> },
    { key: "rate", header: "할인율", align: "right", cell: (r) => pct(r.discountRate, 0) },
    { key: "imp", header: "노출", align: "right", cell: (r) => num(r.impressions) },
    { key: "clicks", header: "클릭", align: "right", cell: (r) => num(r.clicks) },
    { key: "carts", header: "장바구니", align: "right", cell: (r) => num(r.carts) },
    { key: "orders", header: "주문", align: "right", cell: (r) => num(r.orders) },
    { key: "revenue", header: "매출", align: "right", cell: (r) => krwShort(r.revenue) },
    { key: "cost", header: "할인비용", align: "right", cell: (r) => krwShort(r.discountCost) },
    ...(showMargin ? [{ key: "margin", header: "추정 마진", align: "right" as const, cell: (r: Row) => <span>{krwShort(r.estMargin)}{r.revenue > 0 && <span className="text-neutral-text2 text-[0.8rem] ml-1">({pct(safeDiv(r.estMargin, r.revenue), 0)})</span>}</span> }] : []),
    { key: "returns", header: "반품", align: "right", cell: (r) => num(r.returns) },
    { key: "delta", header: "전후 비교", align: "right", cell: (r) => (r.beforeRevenue > 0 && r.revenue > 0 ? <span className={cn("font-semibold tabular", r.revenue >= r.beforeRevenue ? "text-semantic-success" : "text-semantic-error")}>{signed(pctDelta(r.revenue, r.beforeRevenue), 0)}</span> : <span className="text-neutral-text2">-</span>) },
    { key: "verdict", header: "판정", cell: (r) => { const v = verdict(r); return <Badge tone={v.tone} size="sm">{v.label}</Badge>; } },
  ];

  const open = openId ? rows.find((r) => r.id === openId) ?? null : null;

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="진행중" value={num(counts.running)} icon={<Megaphone size={18} />} accent="#D96D32" sub={`예정 ${counts.scheduled} · 종료 ${counts.ended}`} />
        <KpiCard label="캠페인 매출 합계" value={krwShort(totalRevenue)} icon={<PackageCheck size={18} />} accent="#D79A43" sub="전체 캠페인 · SIMULATION" />
        <KpiCard label="평균 클릭→주문" value={pct(safeDiv(rows.reduce((s, r) => s + r.orders, 0), Math.max(1, rows.reduce((s, r) => s + r.clicks, 0))), 1)} icon={<MousePointerClick size={18} />} accent="#5B8DEF" sub="주문 ÷ 클릭" />
        <KpiCard label="내 초안" value={num(counts.draft)} icon={<CalendarDays size={18} />} accent="#A66BBE" sub="이 브라우저에 저장 · READY" />
      </div>

      {/* Loop 4 banner */}
      <Card className={cn("mt-6", loop4Changed ? "border-semantic-success" : "border-theme-primary/30")} pad="md">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <span className="h-11 w-11 rounded-2xl bg-theme-soft text-theme-primary flex items-center justify-center shrink-0"><Zap size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap"><p className="font-bold">Loop 4 · 구매주기 → 재구매 캠페인 (cp-06 AERNO 재구매 감사 쿠폰)</p><Badge tone={STATUS_TONE[cp06.effStatus]}>{STATUS_LABEL[cp06.effStatus]}</Badge>{loop4Changed && <Badge tone="success" size="sm"><CheckCircle2 size={12} />Action에서 상태 변경됨</Badge>}</div>
            <p className="text-[0.88rem] text-neutral-text2 mt-1 leading-relaxed">act-005(구매주기 도래 고객 재구매 캠페인)를 <b>실행중</b>으로 바꾸면 이 캠페인이 <b>진행중</b>이 되고 고객 My Page에 추천·알림이 나타납니다. <b>완료</b>하면 <b>종료</b>로 바뀝니다. 현재 Action 상태: {act005 ? <ActionStatusBadge status={act005.status} /> : "-"}</p>
          </div>
          <div className="flex gap-2 shrink-0"><Button variant="outline" onClick={() => setOpenId("cp-06")}>캠페인 상세</Button><Button href="/ax/actions?open=act-005" icon={<ChevronRight size={16} />}>act-005 보기</Button></div>
        </div>
      </Card>

      <SectionBlock title="캠페인 목록" desc={`${num(rows.length)}건 · 행을 누르면 퍼널·상품·전후 비교를 볼 수 있습니다.`}
        right={<>
          <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: "all", label: "전체" }, { value: "running", label: "진행중" }, { value: "scheduled", label: "예정" }, { value: "ended", label: "종료" }, { value: "draft", label: "초안" }]} />
          {canCreate && <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>캠페인 만들기</Button>}
        </>}>
        {!canCreate && <NoteCard className="mb-4">운영 역할은 캠페인 조회만 가능합니다. 생성·마진 확인은 MD·대표 권한입니다 (설정 &gt; 권한 매트릭스).</NoteCard>}
        <DataTable rows={visible} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} dense
          empty={<EmptyState title="해당 상태의 캠페인이 없습니다" desc={filter === "draft" ? "'캠페인 만들기'로 초안을 저장하면 여기에 표시됩니다." : "다른 상태를 선택해 보세요."} action={canCreate && filter === "draft" ? <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>캠페인 만들기</Button> : undefined} />} />
        <NoteCard className="mt-4"><b>판정 규칙:</b> 추정 마진율 20% 미만 또는 주문 대비 반품 12% 초과 → 마진·반품 주의 · 캠페인 전 대비 매출 +20% 초과 → 효과 · 그 외 → 관찰. 모든 성과는 SIMULATION이며 실제 개선율을 뜻하지 않습니다.</NoteCard>
      </SectionBlock>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ""} width="max-w-lg">
        {open && <CampaignDetail c={open} showMargin={showMargin} loop4Changed={loop4Changed} onDelete={open.isDraft ? () => { setDrafts((d) => d.filter((x) => x.id !== open.id)); setOpenId(null); toast("초안을 삭제했습니다"); } : undefined} />}
      </Drawer>

      {canCreate && <CreateCampaignModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={(d) => { setDrafts((p) => [d, ...p]); setCreateOpen(false); toast("캠페인 초안이 저장되었습니다", "실제 발송·노출은 연동 예정(READY)입니다. 목록의 '초안' 필터에서 확인하세요.", "success"); }} actor={ROLE_NAME[role]} />}
    </div>
  );
}

function Funnel({ c }: { c: Row }) {
  const steps = [
    { label: "노출", value: c.impressions, icon: <Eye size={14} /> },
    { label: "클릭", value: c.clicks, icon: <MousePointerClick size={14} /> },
    { label: "장바구니", value: c.carts, icon: <ShoppingCart size={14} /> },
    { label: "주문", value: c.orders, icon: <PackageCheck size={14} /> },
  ];
  const max = Math.max(1, c.impressions);
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const prev = i === 0 ? null : steps[i - 1].value;
        const conv = prev === null ? null : safeDiv(s.value, Math.max(1, prev));
        const w = Math.max(6, Math.round((s.value / max) * 100));
        return (
          <li key={s.label}>
            <div className="flex items-center justify-between text-[0.85rem] mb-1"><span className="inline-flex items-center gap-1.5 font-semibold">{s.icon}{s.label}</span><span className="tabular">{num(s.value)}{conv !== null && <span className="text-neutral-text2 ml-1.5">(전환 {pct(conv, 1)})</span>}</span></div>
            <div className="h-3 rounded-full bg-neutral-canvas overflow-hidden"><div className="h-full rounded-full bg-theme-primary transition-all duration-normal" style={{ width: `${w}%`, opacity: 1 - i * 0.18 }} /></div>
          </li>
        );
      })}
    </ol>
  );
}

function CampaignDetail({ c, showMargin, loop4Changed, onDelete }: { c: Row; showMargin: boolean; loop4Changed: boolean; onDelete?: () => void }) {
  const v = verdict(c);
  const chart = [{ name: "캠페인 전", value: c.beforeRevenue }, { name: "캠페인 중", value: c.revenue }];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap"><Badge tone={STATUS_TONE[c.effStatus]}>{STATUS_LABEL[c.effStatus]}</Badge><Badge tone="neutral">{TYPE_LABEL[c.type]}</Badge><Badge tone={v.tone}>{v.label}</Badge>{c.isDraft && <Badge tone="ready">READY · 연동 예정</Badge>}</div>
      <p className="text-[0.88rem] text-neutral-text2">{c.id} · {fmtDate(c.startAt)} ~ {fmtDate(c.endAt)} · 대상 {segLabel(c.segment)} · 할인 {pct(c.discountRate, 0)}</p>
      {c.id === "cp-06" && (
        <NoteCard tone={loop4Changed ? "info" : "neutral"} icon={<Zap size={16} />}><b>Loop 4.</b> act-005 실행중 → 이 캠페인 진행중 + 고객 알림 발송 → 완료 시 종료. {loop4Changed ? "Action Center에서 상태가 변경되어 현재 상태에 반영되었습니다." : "아직 Action이 실행되지 않아 예정 상태입니다."} <Link href="/ax/actions?open=act-005" className="underline font-semibold">act-005 보기</Link></NoteCard>
      )}
      <NoteCard>{v.why}</NoteCard>
      <div>
        <p className="font-bold mb-2">퍼널</p>
        {c.impressions > 0 ? <Funnel c={c} /> : <p className="text-[0.88rem] text-neutral-text2 rounded-xl bg-neutral-canvas px-4 py-3">아직 노출 데이터가 없습니다 ({c.isDraft ? "초안" : "예정"}).</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="매출" value={krwShort(c.revenue)} sub="SIMULATION" />
        <Stat label="할인비용" value={krwShort(c.discountCost)} />
        {showMargin && <Stat label="추정 마진" value={krwShort(c.estMargin)} sub={c.revenue > 0 ? `마진율 ${pct(safeDiv(c.estMargin, c.revenue), 0)}` : "-"} />}
        <Stat label="반품" value={`${num(c.returns)}건`} sub={c.orders > 0 ? `주문 대비 ${pct(safeDiv(c.returns, c.orders), 0)}` : "-"} />
      </div>
      {(c.beforeRevenue > 0 || c.revenue > 0) && (
        <div>
          <p className="font-bold mb-2">전후 비교 <span className="text-[0.8rem] font-normal text-neutral-text2">(같은 기간 길이 · SIMULATION)</span></p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--neutral-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--neutral-text)" }} />
                <YAxis tickFormatter={(x: number) => krwShort(x)} tick={{ fontSize: 11, fill: "var(--neutral-text-secondary)" }} width={64} />
                <Tooltip cursor={{ fill: "var(--neutral-canvas)" }} formatter={(x: number) => [krwShort(x), "매출"]} contentStyle={{ borderRadius: 12, borderColor: "var(--neutral-border)", fontSize: 13 }} />
                <Bar dataKey="value" fill="var(--theme-primary)" radius={[6, 6, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div>
        <p className="font-bold mb-2">대상 상품 {c.productIds.length}개</p>
        {c.productIds.length === 0 ? <p className="text-[0.88rem] text-neutral-text2">특정 상품 없이 세그먼트 전체에 노출되는 캠페인입니다.</p> : (
          <ul className="space-y-1.5">
            {c.productIds.map((id) => { const p = PRODUCT_BY_ID[id]; if (!p) return null; return <li key={id}><Link href={`/ax/products/${id}`} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-border px-3 py-2 hover:bg-neutral-canvas transition-colors"><span className="min-w-0"><span className="font-semibold text-[0.9rem]">{p.name}</span><span className="text-[0.8rem] text-neutral-text2 ml-1.5">{BRAND_BY_ID[p.brandId].name}</span></span><ChevronRight size={16} className="text-neutral-text2 shrink-0" /></Link></li>; })}
          </ul>
        )}
      </div>
      {onDelete && <div className="pt-2 border-t border-neutral-border"><Button variant="danger" size="sm" onClick={onDelete} icon={<Trash2 size={14} />}>초안 삭제</Button></div>}
    </div>
  );
}

function CreateCampaignModal({ open, onClose, onSave, actor }: { open: boolean; onClose: () => void; onSave: (d: CampaignDraft) => void; actor: string }) {
  const [step, setStep] = useState(1);
  const [segment, setSegment] = useState<SegmentId | "all">("cycle-due");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [rate, setRate] = useState<"0" | "0.05" | "0.07" | "0.1" | "0.15" | "0.2">("0.07");
  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState(todayKey());
  const [endAt, setEndAt] = useState(todayKey(new Date(Date.now() + 7 * 86400000)));
  const reset = () => { setStep(1); setSegment("cycle-due"); setProductIds([]); setQ(""); setRate("0.07"); setName(""); setStartAt(todayKey()); setEndAt(todayKey(new Date(Date.now() + 7 * 86400000))); };
  const close = () => { reset(); onClose(); };
  const list = PRODUCTS.filter((p) => !q.trim() || p.name.includes(q.trim()) || BRAND_BY_ID[p.brandId].name.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (id: string) => setProductIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 6 ? p : [...p, id]));
  const autoName = `${segLabel(segment)} ${Number(rate) > 0 ? `${Math.round(Number(rate) * 100)}% ` : ""}캠페인`;
  const finalName = name.trim() || autoName;
  const dateOk = startAt && endAt && endAt >= startAt;
  const save = () => {
    onSave({ id: `cp-draft-${Date.now().toString(36)}`, name: finalName, segment, productIds, discountRate: Number(rate), startAt: new Date(`${startAt}T09:00:00`).toISOString(), endAt: new Date(`${endAt}T23:59:00`).toISOString(), createdAt: new Date().toISOString(), createdBy: actor });
    reset();
  };
  const steps = ["대상 세그먼트", "상품 선택", "할인율·기간", "미리보기·저장"];
  return (
    <Modal open={open} onClose={close} title="캠페인 만들기 (Demo)" size="lg"
      footer={<div className="flex items-center justify-between gap-2">
        <span className="text-[0.82rem] text-neutral-text2">{step} / 4 · {steps[step - 1]}</span>
        <div className="flex gap-2">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>이전</Button>}
          {step < 4 ? <Button onClick={() => setStep(step + 1)} disabled={step === 3 && !dateOk}>다음</Button> : <Button onClick={save} icon={<CheckCircle2 size={16} />}>초안 저장</Button>}
        </div>
      </div>}>
      <ol className="flex items-center gap-1.5 mb-5 overflow-x-auto hide-scrollbar">
        {steps.map((s, i) => <li key={s} className={cn("flex items-center gap-1.5 whitespace-nowrap text-[0.82rem] font-semibold", i + 1 === step ? "text-theme-primary" : i + 1 < step ? "text-semantic-success" : "text-neutral-text2")}><span className={cn("h-6 w-6 rounded-full inline-flex items-center justify-center text-[0.75rem]", i + 1 === step ? "bg-theme-primary text-white" : i + 1 < step ? "bg-[#e6f6ec]" : "bg-neutral-canvas")}>{i + 1}</span>{s}{i < steps.length - 1 && <span className="w-4 h-px bg-neutral-border" />}</li>)}
      </ol>

      {step === 1 && (
        <div className="space-y-2" role="radiogroup" aria-label="대상 세그먼트">
          {SEGMENTS.map((s) => (
            <button key={s} role="radio" aria-checked={segment === s} onClick={() => setSegment(s)} className={cn("w-full text-left rounded-xl border px-4 py-3 transition-all duration-fast flex items-center justify-between gap-3", segment === s ? "border-theme-primary bg-theme-soft" : "border-neutral-border hover:border-neutral-text2 bg-white")}>
              <span className="font-semibold">{segLabel(s)}</span>{segment === s && <CheckCircle2 size={18} className="text-theme-primary" />}
            </button>
          ))}
        </div>
      )}
      {step === 2 && (
        <div>
          <div className="flex items-center gap-2 mb-3"><div className="flex-1"><Input name="cp-q" placeholder="상품명 또는 브랜드 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div><Badge tone={productIds.length >= 6 ? "warning" : "neutral"}>{productIds.length} / 6</Badge></div>
          <div className="max-h-[46vh] overflow-y-auto space-y-1.5 pr-1">
            {list.length === 0 && <EmptyState title="검색 결과가 없습니다" icon={<Search size={20} />} />}
            {list.map((p) => { const on = productIds.includes(p.id); const full = !on && productIds.length >= 6; return (
              <label key={p.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors", on ? "border-theme-primary bg-theme-soft" : "border-neutral-border hover:bg-neutral-canvas", full && "opacity-50 cursor-not-allowed")}>
                <input type="checkbox" className="h-5 w-5 accent-[var(--theme-primary)]" checked={on} disabled={full} onChange={() => toggle(p.id)} />
                <span className="min-w-0 flex-1"><span className="font-semibold text-[0.92rem]">{p.name}</span><span className="text-[0.8rem] text-neutral-text2 ml-1.5">{BRAND_BY_ID[p.brandId].name}</span></span>
              </label>
            ); })}
          </div>
          <p className="mt-2 text-[0.8rem] text-neutral-text2">상품 없이 저장하면 세그먼트 전체 노출 캠페인이 됩니다.</p>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div><p className="text-[0.9rem] font-semibold mb-1.5">할인율</p><Segmented value={rate} onChange={setRate} options={[{ value: "0", label: "0%" }, { value: "0.05", label: "5%" }, { value: "0.07", label: "7%" }, { value: "0.1", label: "10%" }, { value: "0.15", label: "15%" }, { value: "0.2", label: "20%" }]} /></div>
          <Input label="캠페인 이름" name="cp-name" placeholder={autoName} value={name} onChange={(e) => setName(e.target.value)} hint="비워두면 자동으로 이름이 붙습니다." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="시작일" name="cp-start" type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            <Input label="종료일" name="cp-end" type="date" value={endAt} min={startAt} onChange={(e) => setEndAt(e.target.value)} hint={!dateOk ? "종료일은 시작일 이후여야 합니다." : undefined} />
          </div>
          {Number(rate) >= 0.15 && <NoteCard tone="warning">할인 15% 이상은 추정 마진율이 20% 아래로 내려갈 수 있습니다. 저장 후 판정 규칙에서 '마진·반품 주의'로 표시될 수 있습니다.</NoteCard>}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-border p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap"><p className="font-bold text-[1.05rem]">{finalName}</p><Badge tone="neutral">초안</Badge><Badge tone="ready">READY · 연동 예정</Badge></div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="대상" value={segLabel(segment)} />
              <Stat label="할인율" value={`${Math.round(Number(rate) * 100)}%`} />
              <Stat label="기간" value={<span className="text-[1rem]">{startAt} ~ {endAt}</span>} />
              <Stat label="상품" value={`${productIds.length}개`} sub={productIds.length === 0 ? "세그먼트 전체 노출" : undefined} />
            </div>
            {productIds.length > 0 && <ul className="flex flex-wrap gap-1.5">{productIds.map((id) => <li key={id}><Badge tone="neutral" size="sm">{PRODUCT_BY_ID[id].name}</Badge></li>)}</ul>}
          </div>
          <NoteCard tone="info">저장하면 이 브라우저(localStorage)에 초안으로 보관됩니다. <b>실제 발송·노출은 알림톡·이메일·배너 연동 후(READY)</b> 가능하며, Demo에서는 초안 상태로만 관리합니다. 작성자: {actor}</NoteCard>
        </div>
      )}
    </Modal>
  );
}
