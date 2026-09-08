"use client";
/* 14 설정 — 화면 · 사용자/권한 · 데모 · 데이터 · AI · 기술·사업화 자산 · 이미지 자산.
   모든 컨트롤은 실제로 상태를 바꾼다 (빈 껍데기 없음). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Database, FileSpreadsheet, GraduationCap, Image as ImageIcon, LayoutDashboard, Palette, Play, ShieldCheck, Sparkles, Award, Users } from "lucide-react";
import { useApp, ROLE_LABEL, ROLE_NAME } from "@/lib/store";
import { BRANDS, PRODUCTS, VARIANTS, CUSTOMERS, SEED_ORDERS, RETURNS, CAMPAIGNS, SEED_ACTIONS } from "@/lib/demo/seed";
import { THEMES } from "@/lib/theme";
import { ICON_ACCENTS } from "@/lib/theme";
import { num } from "@/lib/format";
import { relTime } from "@/lib/dates";
import type { Role } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { usePresentation } from "@/components/system/Presentation";
import { PageHeader, RoleSwitcher } from "@/components/ax/AxShell";
import { ThemePicker, PreviewStrip, DisplaySettings } from "@/components/ax/system/ThemeSettings";
import { PermissionMatrix, PermissionLegend } from "@/components/ax/system/PermissionMatrix";
import { CapabilityStatus } from "@/components/ax/system/CapabilityStatus";
import { DemoResetButton } from "@/components/ax/system/DemoResetModal";
import { CsvImportModal } from "@/components/ax/system/CsvImportModal";
import { AIEngines } from "@/components/ax/system/AIEngines";
import { TechAssets } from "@/components/ax/system/TechAssets";
import { AssetRegistry } from "@/components/ax/system/AssetRegistry";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Freshness, Term } from "@/components/ui/Misc";
import { Stat } from "@/components/ui/Kpi";
import { toast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/States";

const SECTIONS: { id: string; label: string; icon: ReactNode; accent: string }[] = [
  { id: "settings-theme", label: "화면", icon: <Palette size={16} />, accent: ICON_ACCENTS.overview },
  { id: "settings-roles", label: "사용자·권한", icon: <Users size={16} />, accent: ICON_ACCENTS.customer },
  { id: "settings-demo", label: "데모", icon: <Play size={16} />, accent: ICON_ACCENTS.sales },
  { id: "settings-data", label: "데이터", icon: <Database size={16} />, accent: ICON_ACCENTS.operations },
  { id: "settings-ai", label: "AI", icon: <Sparkles size={16} />, accent: ICON_ACCENTS.ai },
  { id: "settings-tech", label: "기술·사업화 자산", icon: <Award size={16} />, accent: ICON_ACCENTS.evidence },
  { id: "settings-assets", label: "이미지 자산", icon: <ImageIcon size={16} />, accent: ICON_ACCENTS.settings },
];

function SettingsCard({ id, no, title, desc, badge, children, tour }: { id: string; no: string; title: string; desc?: ReactNode; badge?: ReactNode; children: ReactNode; tour?: string }) {
  const s = SECTIONS.find((x) => x.id === id);
  return (
    <Card id={id} data-tour={tour} className="scroll-mt-24" pad="lg">
      <div className="mb-5 flex items-start gap-3">
        <span className="h-10 w-10 shrink-0 rounded-xl inline-flex items-center justify-center" style={{ background: `${s?.accent ?? ICON_ACCENTS.settings}1f`, color: s?.accent ?? ICON_ACCENTS.settings }}>{s?.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.78rem] font-bold text-neutral-text2 tabular">{no}</span>
            <h2 className="text-[1.2rem] md:text-[1.3rem] font-bold tracking-tight">{title}</h2>
            {badge}
          </div>
          {desc && <p className="mt-1 text-[0.9rem] text-neutral-text2 leading-relaxed">{desc}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="설정"
        badge={<Badge tone="demo" size="sm">DEMO</Badge>}
        desc="테마·글자 크기·역할·데모 초기화가 실제로 동작합니다. 실제 연결이 필요한 항목은 READY로 표시했습니다."
        right={<Freshness source="DEMO" />}
      />
      <nav aria-label="설정 섹션" className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="inline-flex shrink-0 items-center gap-1.5 h-10 px-3.5 rounded-full border border-neutral-border bg-white text-[0.85rem] font-semibold text-neutral-text hover:border-neutral-text2 hover:bg-neutral-canvas active:scale-[0.98] transition-all duration-fast">
            <span style={{ color: s.accent }}>{s.icon}</span>{s.label}
          </a>
        ))}
      </nav>
      <Hydrated fallback={<div className="space-y-4"><SkeletonCard lines={4} /><SkeletonCard lines={6} /><SkeletonCard lines={3} /></div>}>
        <SettingsBody />
      </Hydrated>
    </div>
  );
}

function SettingsBody() {
  const router = useRouter();
  const role = useApp((s) => s.role);
  const theme = useApp((s) => s.theme);
  const tutorialDone = useApp((s) => s.tutorialDone);
  const customerTourDone = useApp((s) => s.customerTourDone);
  const setTutorialDone = useApp((s) => s.setTutorialDone);
  const setCustomerTourDone = useApp((s) => s.setCustomerTourDone);
  const lastResetAt = useApp((s) => s.lastResetAt);
  const orders = useApp((s) => s.orders);
  const returns = useApp((s) => s.returns);
  const restockSubs = useApp((s) => s.restockSubs);
  const cart = useApp((s) => s.cart);
  const actions = useApp((s) => s.actions);
  const start = usePresentation((s) => s.start);
  const [csvOpen, setCsvOpen] = useState(false);
  const closeCsv = useCallback(() => setCsvOpen(false), []);

  const effRole: Role = role === "customer" ? "owner" : role;
  const themeDef = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const changedActions = useMemo(() => actions.filter((a) => { const seed = SEED_ACTIONS.find((s) => s.id === a.id); return !seed || seed.status !== a.status; }).length, [actions]);
  const changes = orders.length + returns.length + restockSubs.length + cart.length + changedActions;

  const replayTutorial = () => {
    setTutorialDone(false); setCustomerTourDone(false);
    toast("튜토리얼이 다시 켜졌습니다", "다음에 경영 대시보드(/ax)에 들어가면 자동으로 시작됩니다. 고객 화면 투어도 함께 초기화됩니다.", "info");
  };
  const replayAndGo = () => { setTutorialDone(false); setCustomerTourDone(false); router.push("/ax"); };
  const startPresent = () => { start(); toast("시연 모드 시작", "화면 하단 컨트롤러로 16단계를 이동합니다. ←/→ 키, ESC 종료.", "info"); };

  const sizes: { label: string; value: number; sub?: string }[] = [
    { label: "브랜드", value: BRANDS.length, sub: `사입 ${BRANDS.filter((b) => b.sourcing === "purchase").length} · 위탁 ${BRANDS.filter((b) => b.sourcing === "consignment").length}` },
    { label: "상품", value: PRODUCTS.length },
    { label: "옵션 (SKU)", value: VARIANTS.length, sub: "색상 × 사이즈" },
    { label: "고객", value: CUSTOMERS.length, sub: "가상 · 개인정보 없음" },
    { label: "주문 (90일)", value: SEED_ORDERS.length + orders.length, sub: orders.length ? `시드 ${num(SEED_ORDERS.length)} + DEMO ${orders.length}` : "시드" },
    { label: "반품", value: RETURNS.length + returns.length, sub: returns.length ? `시드 ${RETURNS.length} + DEMO ${returns.length}` : "시드" },
    { label: "캠페인", value: CAMPAIGNS.length },
    { label: "Action", value: actions.length, sub: changedActions ? `상태 변경 ${changedActions}건` : "시드 상태" },
  ];

  return (
    <div className="space-y-6">
      {/* 01 화면 */}
      <SettingsCard id="settings-theme" no="01" title="화면" tour="settings-theme" desc={<>9개 Canonical Theme는 사이드바·버튼·강조색(6색)만 바꿉니다. <span className="font-semibold text-neutral-text">본문·표·폼의 Neutral 색은 테마와 분리</span>되어 읽기 편한 상태가 유지됩니다.</>} badge={<Badge tone="accent" size="sm">현재 {themeDef.no} {themeDef.name}</Badge>}>
        <div className="space-y-5">
          <ThemePicker />
          <PreviewStrip />
          <DisplaySettings />
        </div>
      </SettingsCard>

      {/* 02 사용자·권한 */}
      <SettingsCard id="settings-roles" no="02" title="사용자 · 권한" desc="역할을 바꾸면 메뉴·KPI·Action 담당이 즉시 달라집니다. 고객 역할은 Business AX에 접근할 수 없습니다." badge={<Badge tone="ready" size="sm">Supabase Auth · RLS READY</Badge>}>
        <div className="space-y-5">
          <div className="rounded-2xl border border-neutral-border bg-white p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold">Role Preview</p>
              <p className="text-[0.85rem] text-neutral-text2">현재 <span className="font-semibold text-neutral-text">{ROLE_NAME[effRole]}</span> ({ROLE_LABEL[effRole]}) 로 보고 있습니다.</p>
            </div>
            <RoleSwitcher />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">Permission Matrix</p>
              <PermissionLegend />
            </div>
            <PermissionMatrix highlight={effRole} />
          </div>
          <div className="rounded-2xl bg-neutral-canvas p-4 text-[0.9rem] leading-relaxed">
            <p className="flex items-center gap-2 font-bold"><ShieldCheck size={16} className="text-theme-primary" /><Term term="RLS">RLS</Term>란?</p>
            <p className="mt-1 text-neutral-text2">Row Level Security — 같은 표를 보더라도 <span className="font-semibold text-neutral-text">사용자마다 볼 수 있는 행이 다르게</span> 걸러지는 데이터베이스 보안 기능입니다. 예를 들어 운영직원은 전체 손익 행을 아예 받지 못하고, 고객은 본인 주문만 받습니다.</p>
            <p className="mt-2 text-neutral-text2">지금은 브라우저의 역할 값으로 화면만 나눕니다. 실제 Supabase Auth/RLS 연결 시 <code className="rounded bg-white px-1.5 py-0.5 text-[0.82rem] border border-neutral-border">profiles.role</code> + RLS Policy로 전환합니다 <Badge tone="ready" size="sm">READY</Badge></p>
          </div>
        </div>
      </SettingsCard>

      {/* 03 데모 */}
      <SettingsCard id="settings-demo" no="03" title="데모" desc="Demo/Live 상태와 시연 준비 도구입니다. 모든 데이터는 가상이며 실제 성과가 아닙니다." badge={<Badge tone="demo" size="sm">DEMO DATA</Badge>}>
        <div className="space-y-5">
          <CapabilityStatus />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-border bg-white p-4 flex flex-col">
              <p className="font-bold">데모 초기화</p>
              <p className="mt-1 text-[0.85rem] text-neutral-text2 flex-1">찜·장바구니·주문·Action 상태·알림·재고 변경·튜토리얼이 시드 상태로 돌아갑니다.</p>
              <p className="mt-2 text-[0.82rem] text-neutral-text2">현재 변경 사항 <span className={changes ? "font-bold text-theme-primary" : "font-bold"}>{num(changes)}건</span>{lastResetAt ? ` · 마지막 초기화 ${relTime(lastResetAt)}` : " · 초기화 기록 없음"}</p>
              <DemoResetButton variant="brand" className="mt-3" full />
            </div>
            <div className="rounded-2xl border border-neutral-border bg-white p-4 flex flex-col">
              <p className="font-bold">튜토리얼 다시 보기</p>
              <p className="mt-1 text-[0.85rem] text-neutral-text2 flex-1">AX 튜토리얼 {tutorialDone ? "완료" : "미완료"} · 고객 화면 투어 {customerTourDone ? "완료" : "미완료"}. 다시 켜면 다음 대시보드 방문 때 자동으로 시작됩니다.</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                <Button variant="outline" onClick={replayTutorial} icon={<GraduationCap size={16} />} full>다시 켜기</Button>
                <Button variant="secondary" onClick={replayAndGo} icon={<LayoutDashboard size={16} />} full>대시보드로 이동해 시작</Button>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-border bg-white p-4 flex flex-col">
              <p className="font-bold">시연 모드</p>
              <p className="mt-1 text-[0.85rem] text-neutral-text2 flex-1">고객 화면 ↔ Business AX를 오가는 16단계 Guided Journey (3~5분). 슬라이드가 아니라 실제 화면을 이동합니다.</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                <Button onClick={startPresent} icon={<Play size={16} />} full>시연 모드 시작</Button>
                <Button variant="outline" href="/ax/present" full>시연 로비 보기</Button>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* 04 데이터 */}
      <SettingsCard id="settings-data" no="04" title="데이터" desc="Demo Repository(정적 시드) + 브라우저 저장 변경분을 합쳐 화면을 만듭니다. Supabase 전환 시 store action만 교체합니다.">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-border bg-white p-4">
              <p className="text-[0.8rem] font-bold text-neutral-text2">Data Source</p>
              <div className="mt-1 flex flex-wrap items-center gap-2"><Badge tone="demo">DEMO Repository</Badge><code className="text-[0.85rem] break-anywhere">src/lib/demo/seed.ts</code></div>
              <p className="mt-2 text-[0.85rem] text-neutral-text2">결정론적 시드(PRNG). 주문 → 옵션 판매 → 일별 매출 순서로 계산해 숫자끼리 모순이 없습니다.</p>
            </div>
            <div className="rounded-2xl border border-neutral-border bg-white p-4">
              <p className="text-[0.8rem] font-bold text-neutral-text2">마지막 업데이트</p>
              <div className="mt-1.5"><Freshness source="DEMO" /></div>
              <p className="mt-2 text-[0.85rem] text-neutral-text2">변경분 저장소: 브라우저 localStorage (<code className="text-[0.82rem]">morfit-demo-v1</code>). 다른 기기와 공유되지 않습니다.</p>
            </div>
          </div>
          <div>
            <p className="font-bold mb-2">Demo 규모</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sizes.map((s) => <Stat key={s.label} label={s.label} value={num(s.value)} sub={s.sub} />)}
            </div>
          </div>
          <div className="rounded-2xl bg-neutral-canvas p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold flex items-center gap-2"><FileSpreadsheet size={18} className="text-theme-primary" />CSV 가져오기 <Badge tone="ready" size="sm">READY</Badge></p>
              <p className="mt-1 text-[0.85rem] text-neutral-text2">상품·옵션·주문 CSV 형식을 확인하고, 파일을 올려 열 구조를 미리 볼 수 있습니다. 실제 반영은 Supabase 연결 후 가능합니다.</p>
            </div>
            <Button variant="outline" onClick={() => setCsvOpen(true)} icon={<FileSpreadsheet size={16} />}>CSV 가져오기 열기</Button>
          </div>
          <CsvImportModal open={csvOpen} onClose={closeCsv} />
        </div>
      </SettingsCard>

      {/* 05 AI */}
      <SettingsCard id="settings-ai" no="05" title="AI" desc="추천·우선순위는 전부 규칙과 수식으로 계산합니다. LLM은 '설명'만 맡을 예정이며 아직 연결하지 않았습니다." badge={<Badge tone="ready" size="sm">AI READY</Badge>}>
        <AIEngines />
      </SettingsCard>

      {/* 06 기술·사업화 자산 */}
      <SettingsCard id="settings-tech" no="06" title="기술 · 사업화 자산" badge={<Badge tone="neutral" size="sm">해당없음</Badge>}>
        <TechAssets />
      </SettingsCard>

      {/* 07 이미지 자산 */}
      <SettingsCard id="settings-assets" no="07" title="이미지 자산" badge={<Badge tone="ready" size="sm">READY</Badge>}>
        <AssetRegistry />
      </SettingsCard>

      <p className="text-center text-[0.82rem] text-neutral-text2">
        <Link href="/ax" className="font-semibold text-neutral-text hover:text-theme-primary">경영 대시보드로 돌아가기</Link> · <Link href="/ax/why" className="font-semibold text-neutral-text hover:text-theme-primary">기획의도 (Why AX)</Link> · <Link href="/ax/present" className="font-semibold text-neutral-text hover:text-theme-primary">시연 모드</Link>
      </p>
    </div>
  );
}
