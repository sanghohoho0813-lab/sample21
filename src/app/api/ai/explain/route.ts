/* ------------------------------------------------------------------
   /api/ai/explain — LLM 설명 Route (AI READY → LIVE 전환 지점)
   - ANTHROPIC_API_KEY 가 서버 환경변수에 없으면 LLM을 호출하지 않고
     규칙 기반 텍스트(fallback)를 그대로 돌려준다 (status: AI_READY).
   - 키가 있으면 Claude 에게 '구조화된 KPI 숫자'만 전달해 자연어 설명을 받는다.
     계산은 여전히 코드가 담당한다 (DECISIONS D-04). 개인정보는 전달하지 않는다.
   - 1순위 연결 = 경영 브리핑 1곳 (kind: "briefing").
------------------------------------------------------------------- */
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5";
const ALLOWED_KINDS = new Set(["briefing", "action-reason", "fit-explain"]);

const SYSTEM = [
  "당신은 패션 멀티브랜드 플랫폼 MORFIT의 경영 브리핑 도우미입니다.",
  "입력으로 받은 KPI 숫자(JSON)만 근거로 대표·MD가 10초 안에 읽을 수 있는 한국어 브리핑을 씁니다.",
  "규칙: 숫자를 새로 만들거나 추정하지 않습니다. 입력에 없는 사실을 단정하지 않습니다. 과장·보장 표현을 쓰지 않습니다.",
  "형식: 1문장 헤드라인 → 핵심 3~4개 불릿 → '다음 행동' 1문장. 총 6줄 이내. 마크다운 기호(#, **)는 쓰지 않습니다.",
  "모든 수치는 DEMO/SIMULATION 데이터이며 실제 성과가 아님을 마지막 줄에 짧게 덧붙입니다.",
].join("\n");

const configured = () => !!process.env.ANTHROPIC_API_KEY;

/** GET — 연결 상태만 알려준다 (LLM 호출 없음). */
export async function GET() {
  return NextResponse.json({ status: configured() ? "LIVE" : "AI_READY", model: configured() ? MODEL : "rule-based", configured: configured() });
}

/** POST — { kind, structured, fallback } → { status, text, model, note? } */
export async function POST(req: Request) {
  let body: { kind?: string; structured?: Record<string, unknown>; fallback?: string } = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const kind = typeof body.kind === "string" && ALLOWED_KINDS.has(body.kind) ? body.kind : "briefing";
  const fallback = typeof body.fallback === "string" ? body.fallback.slice(0, 4000) : "";
  const structured = body.structured && typeof body.structured === "object" ? body.structured : {};

  if (!configured()) {
    return NextResponse.json({ status: "AI_READY", text: fallback, model: "rule-based (LLM 연결 예정)", note: "ANTHROPIC_API_KEY 미설정 — 규칙 기반 텍스트를 그대로 표시합니다." });
  }

  // 구조화된 숫자만 전달 (이름·연락처 등 개인정보 없음)
  const payload = JSON.stringify({ kind, data: structured, ruleSummary: fallback }, null, 0).slice(0, 12000);
  const client = new Anthropic();
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: `다음 KPI를 바탕으로 ${kind === "briefing" ? "경영 브리핑" : kind === "action-reason" ? "Action 추천 근거 설명" : "핏 추천 설명"}을 작성해 주세요.\n${payload}` }],
    });
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!text) return NextResponse.json({ status: "AI_READY", text: fallback, model: MODEL, note: "LLM 응답이 비어 있어 규칙 기반 텍스트를 표시합니다." });
    return NextResponse.json({ status: "LIVE", text, model: res.model ?? MODEL, usage: { input: res.usage.input_tokens, output: res.usage.output_tokens } });
  } catch (error) {
    // 실패해도 화면은 절대 비지 않는다 — 규칙 기반 텍스트로 폴백
    let note = "LLM 호출 실패 — 규칙 기반 텍스트를 표시합니다.";
    if (error instanceof Anthropic.AuthenticationError) note = "API 키가 유효하지 않습니다 (401). 규칙 기반 텍스트를 표시합니다.";
    else if (error instanceof Anthropic.RateLimitError) note = "요청 한도 초과 (429). 잠시 후 다시 시도하세요.";
    else if (error instanceof Anthropic.APIError) note = `API 오류 ${error.status ?? ""}: 규칙 기반 텍스트를 표시합니다.`;
    return NextResponse.json({ status: "AI_READY", text: fallback, model: "rule-based (fallback)", note });
  }
}
