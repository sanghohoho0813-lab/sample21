"use client";
/* [AI] AI Ready 상태 — 4개 규칙 기반 엔진 + LLM 연결 가이드. 계산은 코드가 하고, LLM은 설명만 맡는다 (DECISIONS D-04). */
import { Cpu, KeyRound, Sparkles } from "lucide-react";
import { AI_STATUS } from "@/lib/ai";
import { AIReadyBadge } from "@/components/ax/AIReady";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Term } from "@/components/ui/Misc";

export const ENGINES: { no: string; name: string; method: string; automation: "L2" | "L3"; errorCost: "LOW" | "MID" | "HIGH"; does: string; inputs: string; actionTypes: string }[] = [
  { no: "1", name: "Demand & Restock", method: "RULE + STAT", automation: "L3", errorCost: "MID", does: "옵션(색상×사이즈)별 수요점수와 재입고 우선순위·수량을 계산", inputs: "판매속도 변화 · 찜 증가 · 재고일수 · 재입고 신청 · 장바구니 · 리드타임", actionTypes: "재입고 · 물량 재배분" },
  { no: "2", name: "Fit", method: "RULE", automation: "L2", errorCost: "MID", does: "고객 프로필과 상품 사이징 경향으로 추천 사이즈·이유·주의점을 제시", inputs: "키·몸무게·평소 사이즈·선호 핏 · 사이징 경향 · 반품 데이터", actionTypes: "핏 안내 강화" },
  { no: "3", name: "Markdown", method: "RULE + OPT", automation: "L3", errorCost: "MID", does: "시즌 잔여일·재고일수·마진 여유로 할인 검토 대상과 할인율 제안", inputs: "재고일수 · 시즌 종료일 · 원가율 · 판매 추세 · 현재 할인율", actionTypes: "할인 검토" },
  { no: "4", name: "Repeat", method: "RULE + STAT", automation: "L2", errorCost: "LOW", does: "구매주기·관심 브랜드·이탈 신호로 재구매·리마인드 세그먼트를 만듦", inputs: "구매이력 · 평균 구매주기 · 찜/장바구니 · 반품 후 행동", actionTypes: "세그먼트 캠페인 · 장바구니 리마인드" },
];
const COST_TONE: Record<"LOW" | "MID" | "HIGH", Tone> = { LOW: "success", MID: "warning", HIGH: "error" };

export function AIEngines() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-neutral-canvas px-4 py-3">
        <Cpu size={18} className="text-theme-primary" />
        <span className="font-bold">현재: 규칙 기반 동작</span>
        <span className="text-neutral-text2">·</span>
        <span className="font-bold">LLM: 미연결</span>
        <Badge tone="ready" className="ml-auto">{AI_STATUS === "LIVE" ? "AI LIVE" : "AI READY"}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ENGINES.map((e) => (
          <div key={e.no} className="rounded-2xl border border-neutral-border bg-white p-4 hover-lift">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="h-8 w-8 rounded-lg bg-theme-soft text-theme-primary font-bold text-[0.9rem] inline-flex items-center justify-center tabular">{e.no}</span>
              <span className="font-bold">Engine {e.no} · {e.name}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="accent" size="sm">{e.method}</Badge>
              <Badge tone="info" size="sm"><Term term={e.automation}>{e.automation}</Term></Badge>
              <Badge tone={COST_TONE[e.errorCost]} size="sm">Error Cost {e.errorCost}</Badge>
            </div>
            <p className="mt-2 text-[0.9rem] leading-relaxed">{e.does}</p>
            <dl className="mt-2 space-y-1 text-[0.82rem] text-neutral-text2">
              <div className="flex gap-2"><dt className="shrink-0 font-semibold w-14">입력</dt><dd>{e.inputs}</dd></div>
              <div className="flex gap-2"><dt className="shrink-0 font-semibold w-14">Action</dt><dd>{e.actionTypes}</dd></div>
            </dl>
          </div>
        ))}
      </div>
      <p className="text-[0.85rem] text-neutral-text2 leading-relaxed">
        L2 = 시스템이 추천만 하고 실행은 사람이, L3 = 시스템이 준비하고 사람이 최종 승인. 자동발주(L4)는 만들지 않았습니다. 네 엔진 모두 <span className="font-semibold text-neutral-text">코드·수식</span>으로 동작하며, 근거 문장도 계산값에서 생성됩니다.
      </p>

      <div className="rounded-2xl border border-neutral-border bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <KeyRound size={18} className="text-theme-primary" />
          <span className="font-bold">LLM 연결 가이드</span>
          <span className="ml-auto inline-flex items-center gap-2 text-[0.85rem] font-semibold"><Sparkles size={14} className="text-theme-primary" />1순위 연결 = AI Briefing (경영 대시보드)</span>
        </div>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-[0.82rem] font-bold text-neutral-text2 mb-1.5">.env.example 키 (없으면 전체 DEMO 모드)</p>
            <pre className="overflow-x-auto rounded-xl bg-neutral-canvas px-4 py-3 text-[0.82rem] leading-relaxed"><code>{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=`}</code></pre>
          </div>
          <ol className="space-y-1.5 text-[0.9rem] list-decimal pl-5">
            <li><code className="rounded bg-neutral-canvas px-1.5 py-0.5 text-[0.82rem]">ANTHROPIC_API_KEY</code>를 서버 환경변수로 설정 (브라우저 노출 금지)</li>
            <li>서버 Route <code className="rounded bg-neutral-canvas px-1.5 py-0.5 text-[0.82rem]">/api/ai/explain</code> 추가 — 구조화된 KPI만 전달</li>
            <li><code className="rounded bg-neutral-canvas px-1.5 py-0.5 text-[0.82rem]">src/lib/ai.ts</code>의 <code className="rounded bg-neutral-canvas px-1.5 py-0.5 text-[0.82rem]">explain()</code> fallback을 fetch로 교체</li>
            <li>경영 대시보드 AI Briefing <span className="font-semibold">1곳만</span> 먼저 연결 → 계산은 그대로 코드가 담당</li>
          </ol>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <AIReadyBadge kind="briefing" />
          <span className="text-[0.82rem] text-neutral-text2">배지를 누르면 무엇을 읽고 · 무엇을 하고 · 왜 필요한지 설명이 열립니다.</span>
        </div>
      </div>
    </div>
  );
}
