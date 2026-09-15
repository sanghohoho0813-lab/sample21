/* ------------------------------------------------------------------
   AI READY — LLM service interface (연결 지점).
   - 계산·추천·우선순위는 전부 코드(engine.ts / kpi.ts)가 담당한다.
   - LLM은 '설명'만 맡는다. 서버 Route /api/ai/explain 이 ANTHROPIC_API_KEY 가
     있을 때만 Claude를 호출하고, 없으면 규칙 기반 텍스트를 그대로 돌려준다.
   - 브라우저는 절대 LLM API를 직접 호출하지 않는다 (키 노출 금지 · Unified §42).
------------------------------------------------------------------- */
export type AIStatus = "AI_READY" | "LIVE";

export interface AIExplainRequest {
  kind: "briefing" | "action-reason" | "fit-explain";
  structured: Record<string, unknown>;
}
export interface AIExplainResponse {
  status: AIStatus;
  text: string;
  model: string;
  note?: string;
  usage?: { input: number; output: number };
}

/** 빌드 시점 기본값. 실제 연결 여부는 aiStatus()(서버 Route GET)로 확인한다. */
export const AI_STATUS: AIStatus = "AI_READY";

const RULE_RESPONSE = (fallback: string, note?: string): AIExplainResponse => ({ status: "AI_READY", text: fallback, model: "rule-based (LLM 연결 예정)", note });

/** 서버 Route에 연결 상태를 묻는다. 실패하면 AI_READY. */
export async function aiStatus(): Promise<{ status: AIStatus; model: string; configured: boolean }> {
  try {
    const r = await fetch("/api/ai/explain", { method: "GET", cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as { status: AIStatus; model: string; configured: boolean };
  } catch {
    return { status: "AI_READY", model: "rule-based", configured: false };
  }
}

/** 구조화된 숫자 + 규칙 텍스트를 보내고 설명을 받는다. 키가 없거나 실패하면 규칙 텍스트가 그대로 돌아온다. */
export async function explain(req: AIExplainRequest, fallback: string): Promise<AIExplainResponse> {
  if (typeof window === "undefined") return RULE_RESPONSE(fallback);
  try {
    const r = await fetch("/api/ai/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...req, fallback }) });
    if (!r.ok) return RULE_RESPONSE(fallback, `서버 응답 ${r.status} — 규칙 기반 텍스트를 표시합니다.`);
    const data = (await r.json()) as Partial<AIExplainResponse>;
    return { status: data.status === "LIVE" ? "LIVE" : "AI_READY", text: data.text || fallback, model: data.model ?? "rule-based", note: data.note, usage: data.usage };
  } catch {
    return RULE_RESPONSE(fallback, "네트워크 오류 — 규칙 기반 텍스트를 표시합니다.");
  }
}

export const AI_READY_COPY = {
  briefing: {
    title: "경영 브리핑 AI",
    reads: ["기간별 매출·마진·주문", "품절위험·관심상승 옵션", "저회전 재고 원가", "반품·핏 지표", "미처리 Action"],
    does: ["여러 지표를 함께 읽고 우선순위를 정리", "대표·MD가 이해하기 쉬운 문장으로 설명", "다음 행동과 이유를 제안"],
    why: "대표가 여러 화면을 직접 비교하는 시간을 줄이고, 놓치기 쉬운 위험과 기회를 빠르게 발견하기 위함입니다.",
  },
  demand: {
    title: "Demand Signal 설명",
    reads: ["옵션별 판매속도", "찜·장바구니·재입고 신청", "현재고·리드타임", "시즌 잔여기간"],
    does: ["재입고 우선순위와 수량의 근거를 자연어로 설명", "MD의 승인 판단을 돕는 주의사항 정리"],
    why: "숫자만 보고는 '왜 지금인지'를 설명하기 어렵습니다. 근거를 문장으로 만들어 승인 속도를 높입니다.",
  },
  fit: {
    title: "핏 추천 설명",
    reads: ["고객 키·몸무게·평소 사이즈·선호 핏", "상품 실측·사이징 경향", "비슷한 체형 고객의 선택·반품 데이터"],
    does: ["추천 사이즈의 이유와 주의점을 고객 언어로 설명"],
    why: "사이즈 반품을 줄이려면 '왜 이 사이즈인지'를 고객이 납득해야 합니다.",
  },
} as const;
