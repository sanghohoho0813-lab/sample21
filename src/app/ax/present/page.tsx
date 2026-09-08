"use client";
/* 13 시연 모드 로비 — 3~5분 Guided Journey. 슬라이드가 아니라 실제 화면을 이동한다.
   시작 → usePresentation().start() → 하단 컨트롤러가 route를 옮긴다. 특정 단계부터 = start() 후 goto(i). */
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Check, ChevronRight, Clock3, GraduationCap, Keyboard, MousePointerClick, Play, RotateCcw, Settings, TriangleAlert, Users } from "lucide-react";
import { useApp, ROLE_LABEL, ROLE_NAME } from "@/lib/store";
import { SEED_ACTIONS } from "@/lib/demo/seed";
import { THEMES } from "@/lib/theme";
import { relTime } from "@/lib/dates";
import { num } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { PRESENT_STEPS, usePresentation } from "@/components/system/Presentation";
import { PageHeader, RoleSwitcher } from "@/components/ax/AxShell";
import { DemoResetModal } from "@/components/ax/system/DemoResetModal";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Freshness } from "@/components/ui/Misc";
import { SkeletonCard } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

/** 단계별 데모 포인트 · Loop 매핑 · 예상 소요(초) */
const STEP_META: { loop: string; tone: Tone; shows: string; sec: number }[] = [
  { loop: "문제 정의", tone: "neutral", shows: "왜 AX인가 — 끊긴 데이터가 품절·과잉재고를 만든다", sec: 25 },
  { loop: "Discovery", tone: "neutral", shows: "고객 화면 첫인상 — 멀티브랜드 탐색 (Editorial Commerce)", sec: 15 },
  { loop: "Discovery", tone: "neutral", shows: "랭킹에서 반응이 빠른 상품 발견", sec: 15 },
  { loop: "Loop 3 · 핏", tone: "info", shows: "핏 프로필 → 추천 사이즈 + 이유 + 주의점 (규칙 기반, AI Ready)", sec: 25 },
  { loop: "Loop 1 · 시작", tone: "accent", shows: "품절 임박 옵션에 재입고 알림 신청 → 수요신호 발생", sec: 20 },
  { loop: "Surface 전환", tone: "neutral", shows: "같은 데이터가 Business AX KPI·브리핑으로 보임", sec: 15 },
  { loop: "Loop 1 · 신호", tone: "accent", shows: "Demand Radar에 방금 신청한 알림이 +1 반영", sec: 20 },
  { loop: "Loop 1 · Action", tone: "accent", shows: "재입고 Action 카드 — 무엇/왜/데이터/주의/승인자", sec: 25 },
  { loop: "Loop 1 · 실행", tone: "accent", shows: "확인 → 실행중 → 완료 시 재고 증가 + 고객 알림 발송", sec: 20 },
  { loop: "Loop 1 · 환류", tone: "success", shows: "고객 알림함과 옵션 상태 '입고 완료' — 한 바퀴 완성", sec: 15 },
  { loop: "Loop 2 · 시작", tone: "warning", shows: "장바구니 → 주문정보 → DEMO 결제예정 → 주문완료", sec: 30 },
  { loop: "Loop 2 · 반영", tone: "warning", shows: "주문 목록·매출·재고에 즉시 반영", sec: 15 },
  { loop: "Loop 2 · Action", tone: "warning", shows: "운영직원이 상품준비 → 출고 → 배송중으로 상태 변경", sec: 20 },
  { loop: "Loop 2 · 환류", tone: "success", shows: "고객 My Page에서 같은 주문의 배송상태 확인", sec: 15 },
  { loop: "Evidence", tone: "info", shows: "추천 → 승인 → 실행 → 결과 → 고객 상태가 한 줄로 남음", sec: 20 },
  { loop: "확장", tone: "neutral", shows: "12개월 데이터 자산과 단계별 확장 (Loop 4 재구매는 고객·재구매 화면)", sec: 20 },
];
const TOTAL_SEC = STEP_META.reduce((s, m) => s + m.sec, 0);
const LOOP_SUMMARY: { loop: string; tone: Tone; steps: string; desc: string }[] = [
  { loop: "Loop 1 · 관심 급증 → 재입고", tone: "accent", steps: "5 → 7 → 8 → 9 → 10", desc: "재입고 알림 → Demand Radar → Action 완료 → 재고 반영 + 고객 알림" },
  { loop: "Loop 2 · 주문 → 재고·배송", tone: "warning", steps: "11 → 12 → 13 → 14", desc: "DEMO 주문 → 주문·매출·재고 반영 → 상태 변경 → My Page" },
  { loop: "Loop 3 · 사이즈 반품 → 핏 개선", tone: "info", steps: "4 (+ 핏·반품 화면)", desc: "핏 추천 근거 · act-004 완료 시 상세 핏 안내 변경" },
  { loop: "Loop 4 · 구매주기 → 재구매", tone: "success", steps: "16 (+ 고객·재구매 화면)", desc: "cycle-due 42명 → act-005 캠페인 → My Page 추천 + 알림" },
];

const surfaceOf = (route: string) => (route.startsWith("/ax") ? "AX" : "고객");

export default function PresentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="시연 모드"
        badge={<Badge tone="demo" size="sm">DEMO</Badge>}
        desc="슬라이드가 아니라 실제 화면을 이동하는 3~5분 Guided Journey입니다. 고객 화면과 Business AX를 오가며 Closed Data Loop가 실제로 도는 것을 보여줍니다."
        right={<Hydrated fallback={<span className="inline-block h-5 w-40 skeleton" />}><Freshness source="DEMO" /></Hydrated>}
      />
      <Hydrated fallback={<div className="space-y-4"><SkeletonCard lines={4} /><SkeletonCard lines={8} /></div>}>
        <PresentBody />
      </Hydrated>
    </div>
  );
}

function PresentBody() {
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
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
  const active = usePresentation((s) => s.active);
  const step = usePresentation((s) => s.step);
  const start = usePresentation((s) => s.start);
  const goto = usePresentation((s) => s.goto);
  const [resetOpen, setResetOpen] = useState(false);
  const closeReset = useCallback(() => setResetOpen(false), []);

  const changedActions = useMemo(() => actions.filter((a) => { const seed = SEED_ACTIONS.find((s) => s.id === a.id); return !seed || seed.status !== a.status; }).length, [actions]);
  const changes = orders.length + returns.length + restockSubs.length + cart.length + changedActions;
  const themeDef = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const effRole = role === "customer" ? "owner" : role;

  const begin = () => { start(); toast("시연 모드 시작", "1단계 '기획의도'로 이동합니다. ←/→ 키로 이동, ESC로 종료.", "info"); };
  const beginAt = (i: number) => { start(); goto(i); toast(`${i + 1}단계부터 시연 시작`, PRESENT_STEPS[i].title, "info"); };
  const markToursDone = () => { setTutorialDone(true); setCustomerTourDone(true); toast("튜토리얼을 완료로 표시했습니다", "시연 중 튜토리얼 팝업이 뜨지 않습니다."); };

  const checklist: { ok: boolean; title: string; desc: string; action?: React.ReactNode }[] = [
    { ok: changes === 0, title: "데모 초기화 여부", desc: changes === 0 ? `깨끗한 상태입니다${lastResetAt ? ` · 마지막 초기화 ${relTime(lastResetAt)}` : ""}.` : `변경 사항 ${num(changes)}건 (주문·반품·알림·장바구니·Action). 처음부터 보여주려면 초기화를 권장합니다.`, action: changes > 0 ? <Button size="sm" variant="outline" onClick={() => setResetOpen(true)} icon={<RotateCcw size={14} />}>데모 초기화</Button> : undefined },
    { ok: effRole === "owner", title: "역할 = 대표", desc: effRole === "owner" ? `${ROLE_NAME.owner}로 시작합니다. 전체 KPI와 Action이 보입니다.` : `현재 ${ROLE_LABEL[effRole]} 역할입니다. 시연은 대표 역할로 시작하는 것을 권장합니다.`, action: effRole !== "owner" ? <Button size="sm" variant="outline" onClick={() => { setRole("owner"); toast("역할을 대표로 전환했습니다"); }} icon={<Users size={14} />}>대표로 전환</Button> : undefined },
    { ok: true, title: "테마", desc: `테마 ${themeDef.no} ${themeDef.name}. 기본은 01 Deep Navy Blue이며, 설정에서 9개 모두 바꿀 수 있습니다.`, action: <Button size="sm" variant="ghost" href="/ax/settings#settings-theme" icon={<Settings size={14} />}>테마 바꾸기</Button> },
    { ok: tutorialDone && customerTourDone, title: "튜토리얼 팝업", desc: tutorialDone && customerTourDone ? "완료 상태라 시연 중 튜토리얼이 뜨지 않습니다." : "미완료 상태입니다. 시연 6단계(대시보드 진입) 또는 고객 홈에서 튜토리얼이 먼저 열릴 수 있습니다.", action: !(tutorialDone && customerTourDone) ? <Button size="sm" variant="outline" onClick={markToursDone} icon={<GraduationCap size={14} />}>완료로 표시</Button> : undefined },
  ];
  const readyCount = checklist.filter((c) => c.ok).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card pad="lg" className="!bg-brand-black text-white !border-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center">
          <div className="min-w-0">
            <p className="text-[0.78rem] font-bold tracking-wider text-theme-highlight">GUIDED JOURNEY · {PRESENT_STEPS.length} STEPS</p>
            <h2 className="mt-1 text-[1.4rem] md:text-[1.8rem] font-bold leading-tight">고객의 클릭이 MD의 Action이 되고, 다시 고객에게 돌아오는 3~5분</h2>
            <p className="mt-2 text-[0.92rem] text-white/75 leading-relaxed max-w-2xl">시작하면 화면 하단에 컨트롤러가 나타나고 단계마다 실제 route로 이동합니다. 👉 안내가 있는 단계는 직접 클릭해 보여주세요. 언제든 ESC로 종료할 수 있습니다.</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.82rem] text-white/70">
              <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />예상 {Math.floor(TOTAL_SEC / 60)}분 {TOTAL_SEC % 60}초 (설명 속도에 따라 3~5분)</span>
              <span className="inline-flex items-center gap-1.5"><Keyboard size={14} />← / → 이동 · ESC 종료</span>
              <span className="inline-flex items-center gap-1.5"><MousePointerClick size={14} />고객 화면 ↔ AX 자동 전환</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:min-w-[240px]">
            <Button size="lg" onClick={begin} icon={<Play size={18} />} className="!bg-theme-highlight !text-brand-black hover:brightness-105 w-full">시연 시작</Button>
            {active && <p className="text-center text-[0.8rem] text-theme-highlight font-semibold">진행 중 · {step + 1} / {PRESENT_STEPS.length} — 다시 시작하면 1단계부터</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setResetOpen(true)} icon={<RotateCcw size={14} />} className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 w-full">데모 초기화</Button>
              <Button variant="outline" href="/ax/settings" icon={<Settings size={14} />} className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 w-full">설정으로</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Steps */}
        <Card pad="md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="text-[1.15rem] font-bold">16단계 한눈에 보기</h3><p className="text-[0.85rem] text-neutral-text2">각 단계의 route와 무엇을 보여주는지. 번호 옆 버튼으로 특정 단계부터 시작할 수 있습니다.</p></div>
            <Badge tone="neutral" size="sm">총 {Math.floor(TOTAL_SEC / 60)}분 {TOTAL_SEC % 60}초</Badge>
          </div>
          <ol className="space-y-2">
            {PRESENT_STEPS.map((s, i) => {
              const m = STEP_META[i];
              const cur = active && step === i;
              const surface = surfaceOf(s.route);
              return (
                <li key={`${i}-${s.title}`} className={cn("rounded-2xl border p-3.5 md:p-4 transition-colors duration-fast", cur ? "border-theme-primary bg-theme-soft/40" : "border-neutral-border bg-white hover:bg-neutral-canvas/60")}>
                  <div className="flex items-start gap-3">
                    <span className={cn("h-9 w-9 shrink-0 rounded-xl inline-flex items-center justify-center font-bold tabular text-[0.9rem]", cur ? "bg-theme-primary text-white" : "bg-neutral-canvas text-neutral-text")}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-bold leading-snug">{s.title}</p>
                        <Badge tone={m.tone} size="sm">{m.loop}</Badge>
                        {cur && <Badge tone="primary" size="sm">진행 중</Badge>}
                      </div>
                      <p className="mt-1 text-[0.88rem] text-neutral-text2 leading-relaxed">{m.shows}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.75rem]">
                        <Badge tone={surface === "AX" ? "dark" : "neutral"} size="sm">{surface}</Badge>
                        <code className="rounded-md bg-neutral-canvas border border-neutral-border px-1.5 py-0.5 text-[0.75rem] break-anywhere">{s.route}</code>
                        <span className="text-neutral-text2 tabular">≈{m.sec}초</span>
                        {s.cta && <span className="text-theme-primary font-semibold">👉 {s.cta}</span>}
                      </div>
                    </div>
                    <button type="button" onClick={() => beginAt(i)} aria-label={`${i + 1}단계부터 시작`} title="이 단계부터 시작" className="shrink-0 h-10 w-10 md:w-auto md:px-3 rounded-xl border border-neutral-border bg-white inline-flex items-center justify-center gap-1 text-[0.8rem] font-semibold hover:bg-neutral-canvas hover:border-neutral-text2 active:scale-95 transition-all duration-fast">
                      <Play size={14} /><span className="hidden md:inline">여기부터</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* Side: checklist + loops + tips */}
        <div className="space-y-6 xl:sticky xl:top-20">
          <Card pad="md">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-[1.05rem] font-bold">시연 전 확인</h3>
              <Badge tone={readyCount === checklist.length ? "success" : "warning"} size="sm">{readyCount} / {checklist.length} 준비</Badge>
            </div>
            <ul className="space-y-3">
              {checklist.map((c) => (
                <li key={c.title} className="flex items-start gap-3">
                  <span className={cn("mt-0.5 h-6 w-6 shrink-0 rounded-full inline-flex items-center justify-center", c.ok ? "bg-[#e6f6ec] text-semantic-success" : "bg-[#fff1e6] text-semantic-warning")}>{c.ok ? <Check size={14} /> : <TriangleAlert size={13} />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[0.92rem]">{c.title}</p>
                    <p className="text-[0.82rem] text-neutral-text2 leading-relaxed">{c.desc}</p>
                    {c.action && <div className="mt-1.5">{c.action}</div>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-neutral-canvas p-3"><p className="text-[0.8rem] font-bold text-neutral-text2 mb-1.5">역할 빠른 전환</p><RoleSwitcher /></div>
          </Card>

          <Card pad="md">
            <h3 className="text-[1.05rem] font-bold mb-3">단계 ↔ Loop 매핑</h3>
            <ul className="space-y-2.5">
              {LOOP_SUMMARY.map((l) => (
                <li key={l.loop} className="rounded-xl border border-neutral-border p-3">
                  <div className="flex flex-wrap items-center gap-1.5"><Badge tone={l.tone} size="sm">{l.loop}</Badge><span className="text-[0.78rem] text-neutral-text2 tabular">단계 {l.steps}</span></div>
                  <p className="mt-1 text-[0.85rem] text-neutral-text2 leading-relaxed">{l.desc}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card pad="md">
            <h3 className="text-[1.05rem] font-bold mb-2">진행 팁</h3>
            <ul className="space-y-1.5 text-[0.88rem] text-neutral-text2 leading-relaxed">
              <li className="flex gap-2"><Keyboard size={16} className="shrink-0 mt-0.5 text-theme-primary" /><span><kbd className="rounded border border-neutral-border bg-neutral-canvas px-1.5 text-[0.78rem] font-bold text-neutral-text">←</kbd> <kbd className="rounded border border-neutral-border bg-neutral-canvas px-1.5 text-[0.78rem] font-bold text-neutral-text">→</kbd> 단계 이동, <kbd className="rounded border border-neutral-border bg-neutral-canvas px-1.5 text-[0.78rem] font-bold text-neutral-text">ESC</kbd> 종료</span></li>
              <li className="flex gap-2"><MousePointerClick size={16} className="shrink-0 mt-0.5 text-theme-primary" /><span>👉 안내가 있는 단계(3·4·5·7·8·9·11·13)는 직접 클릭해야 다음 단계 숫자가 바뀝니다.</span></li>
              <li className="flex gap-2"><ChevronRight size={16} className="shrink-0 mt-0.5 text-theme-primary" /><span>컨트롤러는 화면 하단에 떠 있고 페이지를 옮겨도 유지됩니다. 고객 화면에서는 하단 메뉴 위에 표시됩니다.</span></li>
              <li className="flex gap-2"><RotateCcw size={16} className="shrink-0 mt-0.5 text-theme-primary" /><span>두 번째 시연 전에는 데모 초기화로 재입고 알림·주문을 되돌리세요.</span></li>
            </ul>
            <p className="mt-3 text-[0.78rem] text-neutral-text2">모든 숫자는 DEMO / SIMULATION이며 실제 성과가 아닙니다. <Link href="/ax/why" className="font-semibold text-neutral-text hover:text-theme-primary">기획의도</Link>에서 배경을 먼저 읽을 수 있습니다.</p>
          </Card>
        </div>
      </div>

      <DemoResetModal open={resetOpen} onClose={closeReset} redirectTo={null} />
    </div>
  );
}
