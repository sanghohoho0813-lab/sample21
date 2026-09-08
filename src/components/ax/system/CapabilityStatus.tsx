/* [데모] CAPABILITY STATUS — LIVE / DEMO / READY / NEXT 를 숨기지 않고 보여준다 (Demo honesty). */
import { Badge, type Tone } from "@/components/ui/Badge";

export const CAPABILITY_GROUPS: { status: "LIVE" | "DEMO" | "READY" | "NEXT"; tone: Tone; title: string; desc: string; items: string[] }[] = [
  { status: "LIVE", tone: "live", title: "실제 연결됨", desc: "외부 시스템과 실제로 연결된 기능", items: [] },
  { status: "DEMO", tone: "demo", title: "실동작 (가상 데이터)", desc: "지금 화면에서 실제로 동작하지만 데이터는 Demo Repository", items: ["Customer Platform 핵심 Journey (탐색·핏·찜·재입고·주문·마이)", "Business AX 핵심 Flow (KPI → Insight → Action → Evidence)", "4개 Closed Data Loop (재입고·주문·핏·재구매)", "규칙 기반 엔진 4개 · 역할 · 9 테마 · Device Preview"] },
  { status: "READY", tone: "ready", title: "연결 지점 준비됨", desc: "인터페이스는 있고, 키·계약이 생기면 연결", items: ["Supabase (Auth · DB · RLS)", "Analytics (Event 수집 Adapter)", "AI API (AI Briefing 1순위)", "알림 (이메일 · 카카오)", "외부 채널 연동", "배송 API", "결제 (PG)"] },
  { status: "NEXT", tone: "next", title: "향후 확장", desc: "이번 범위 밖 — Preview 페이지로만 노출", items: ["브랜드 파트너센터", "멤버십", "광고 · 기획전 상품", "개인화 고도화", "수요예측 모델", "Push 알림", "Native App", "B2B 단체구매"] },
];

export function CapabilityStatus() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {CAPABILITY_GROUPS.map((g) => (
        <div key={g.status} className="rounded-2xl border border-neutral-border bg-white p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={g.tone}>{g.status}</Badge>
            <span className="font-bold">{g.title}</span>
            <span className="ml-auto text-[0.78rem] text-neutral-text2 tabular">{g.items.length}개</span>
          </div>
          <p className="mt-1 text-[0.82rem] text-neutral-text2">{g.desc}</p>
          {g.items.length ? (
            <ul className="mt-3 space-y-1.5 text-[0.9rem]">
              {g.items.map((it) => <li key={it} className="flex items-start gap-2"><span className="mt-[0.55em] h-1.5 w-1.5 rounded-full bg-neutral-text2/50 shrink-0" />{it}</li>)}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-neutral-canvas px-3 py-2.5 text-[0.88rem] text-neutral-text2">없음 — 실제 외부 연결은 아직 없습니다. 이 화면의 모든 숫자는 가상 데이터입니다.</p>
          )}
        </div>
      ))}
    </div>
  );
}
