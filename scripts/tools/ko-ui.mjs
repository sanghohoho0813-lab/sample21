/* scripts/tools/ko-ui.mjs — 화면 영문 → 한글 변환기 (UI/UX 안정화 §7)
   TypeScript 구문 트리로 '사용자에게 보이는 텍스트'만 고른다:
     · JSX 텍스트 전부
     · 한글이 섞인 문자열/템플릿 리터럴 (단, 비교식·case·타입·import·객체 키는 제외)
     · 화면용 속성(title/label/desc/placeholder/aria-label …) 값
   데이터 코드("DEMO" | "SIMULATION" 같은 타입 값, className, href, tone 등)는 건드리지 않는다.
   바뀐 단어 뒤 조사(을/를·이/가·은/는·과/와·으로/로)는 받침에 맞게 고친다.
   사용: node scripts/tools/ko-ui.mjs [--write] [파일…]   (기본: src 전체, 미리보기) */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const WRITE = process.argv.includes("--write");
const argFiles = process.argv.slice(2).filter((a) => !a.startsWith("--"));

// 순서가 중요하다: 긴 구절 → 짧은 단어
const DICT = [
  ["기획의도 (Why AX)", "기획의도"],
  ["Business AX 화면", "AX 운영화면"],
  ["Guided Journey", "안내형 시연"],
  ["Canonical Theme", "기본 테마"],
  ["Supabase Auth", "Supabase 인증"],
  ["My Page", "마이페이지"],
  ["DEMO/SIMULATION", "데모/시뮬레이션"],
  ["DEMO / SIMULATION", "데모 / 시뮬레이션"],
  ["BASELINE: UNKNOWN / REQUIRED", "기준값: 미측정 · 실증 필요"],
  ["BASELINE: REQUIRED / UNKNOWN", "기준값: 미측정 · 실증 필요"],
  ["UNKNOWN / REQUIRED", "미측정 · 실증 필요"],
  ["REQUIRED / UNKNOWN", "미측정 · 실증 필요"],
  ["RULE+STAT", "규칙+통계"],
  ["RULE+OPT", "규칙+최적화"],
  ["Data Asset", "데이터 자산"],
  ["Decision Asset", "의사결정 자산"],
  ["Workflow Asset", "업무흐름 자산"],
  ["BASELINE 대비 변화: VALIDATE LATER", "기준값 대비 변화: 실증 후 확인"],
  ["VALIDATE LATER", "실증 후 확인"],
  ["Growth & Action Center", "실행 센터"],
  ["Action Center", "실행 센터"],
  ["Action Lifecycle", "과제 처리 과정"],
  ["Action History", "과제 이력"],
  ["Action Execution Rate", "과제 실행률"],
  ["Business AX", "AX 운영화면"],
  ["Customer Platform", "고객 플랫폼"],
  ["Customer Front", "고객 플랫폼"],
  ["Customer Event", "고객 행동"],
  ["Customer Feedback", "고객 반영"],
  ["AX Evidence", "AX 성과 증빙"],
  ["Evidence Pack", "증빙 리포트"],
  ["Evidence Log", "증빙 기록"],
  ["Demand & Restock Engine", "수요·재입고 엔진"],
  ["Demand & Restock", "수요·재입고"],
  ["Demand Radar", "수요 레이더"],
  ["Demand Signal", "수요 신호"],
  ["Demand Score", "수요 점수"],
  ["Demand Engine", "수요 엔진"],
  ["Fit Engine", "핏 엔진"],
  ["Markdown Engine", "할인 엔진"],
  ["Repeat Engine", "재구매 엔진"],
  ["Fit Signal", "핏 시그널"],
  ["Fit Risk", "핏 위험도"],
  ["Fit Return Rate", "사이즈 반품률"],
  ["Closed Loop Timeline", "데이터 순환 타임라인"],
  ["Closed Data Loop", "데이터 순환 고리"],
  ["Closed Loop", "데이터 순환"],
  ["Why AX", "기획의도"],
  ["AI·Logic Insight", "AI·규칙 인사이트"],
  ["AI READY", "AI 준비"],
  ["AI Ready", "AI 준비"],
  ["AI LIVE", "AI 연결됨"],
  ["Unit Economics", "단위 경제성"],
  ["Money KPI", "재무 KPI"],
  ["KPI Delta", "KPI 변화"],
  ["DEMO DATA", "데모 데이터"],
  ["DEMO CHECKOUT", "데모 주문서"],
  ["Demo Repository", "데모 저장소"],
  ["Role Preview", "역할 미리보기"],
  ["Permission Matrix", "권한표"],
  ["RULE + STAT", "규칙 + 통계"],
  ["RULE + OPT", "규칙 + 최적화"],
  ["Event 수집 Adapter", "행동 수집 어댑터"],
  ["Pilot 준비", "실증 준비"],
  // 증빙 유형 코드가 문장 안에 나올 때
  ["RESULT·REVENUE·EFFICIENCY", "결과·매출·효율"],
  ["ADOPTION·SCALE", "채택·확장"],
  ["RISK·EXCEPTION", "위험·예외"],
  ["ACTION·EXCEPTION", "실행·예외"],
  // 단어
  [/\bLoop\s?(\d)/g, "순환 $1"],
  ["Loop", "순환"],
  ["Evidence", "증빙"],
  ["Actions", "과제"],
  ["Action", "과제"],
  ["Insight", "인사이트"],
  ["Baseline", "기준값"],
  ["BASELINE", "기준값"],
  ["Pilot", "실증"],
  ["SIMULATION", "시뮬레이션"],
  ["DEMO", "데모"],
  ["Demo", "데모"],
  ["READY", "연결 준비"],
  ["Ready", "준비"],
  ["LIVE", "연결됨"],
  ["Live", "연결됨"],
  ["NEXT", "예정"],
  ["Preview", "미리보기"],
  ["Engine", "엔진"],
  ["Payback", "회수 기간"],
  ["Provenance", "데이터 출처"],
  ["Trigger", "발생 조건"],
  ["Recommendation", "추천"],
  ["Approval", "승인"],
  ["Result", "결과"],
  ["Timeline", "타임라인"],
  ["Repository", "저장소"],
  ["Adapter", "어댑터"],
  ["Journey", "여정"],
  ["Flow", "흐름"],
  ["Scenario", "시나리오"],
  ["Growth", "성장"],
  ["Signal", "신호"],
  ["Score", "점수"],
  ["Markdown", "할인"],
  ["Repeat", "재구매"],
  ["Tutorial", "튜토리얼"],
  ["Theme", "테마"],
  ["Customer", "고객"],
  ["Demand", "수요"],
  ["Fit", "핏"],
  ["RULE", "규칙"],
  ["STAT", "통계"],
  ["Event", "행동"],
  ["Cost", "비용"],
  ["Revenue", "매출"],
  ["Scale", "확장"],
  ["Log", "기록"],
];

const UI_ATTRS = new Set(["title", "label", "placeholder", "alt", "aria-label", "desc", "description", "badge", "text", "caption", "headline", "sub", "deltaLabel", "moreLabel", "emptyText"]);
const UI_KEYS = new Set(["method", "title", "label", "desc", "description", "body", "sub", "detail", "text", "headline", "caption", "note", "trigger", "expectedImpact", "caution", "resultNote", "kpiDelta", "meaning", "reads", "does", "why", "cta", "items", "reasons", "point", "metric", "formula", "now", "needs", "item", "tagline", "summary", "reason", "hint", "empty", "placeholder", "t", "b", "tag"]);
const CODE_KEYS = new Set(["className", "href", "key", "tone", "size", "variant", "id", "name", "type", "value", "role", "htmlFor", "src", "target", "rel", "status", "source", "slug", "icon", "engine", "automation", "errorCost", "kind", "segment", "owner", "mode", "route", "tour", "group", "placement", "accent", "gradient", "data-tour", "inputMode", "autoComplete", "method", "sizing", "fit", "sourcing"]);

const hangul = /[가-힣]/;
const batchim = (ch) => { const c = ch.charCodeAt(0); if (c < 0xac00 || c > 0xd7a3) return null; return (c - 0xac00) % 28; };
function fixParticle(word, particle) {
  const last = [...word].reverse().find((c) => /[가-힣]/.test(c));
  if (!last || !particle) return particle ?? "";
  const b = batchim(last); const has = b !== null && b !== 0; const rieul = b === 8;
  const pairs = { "을": ["을", "를"], "를": ["을", "를"], "이": ["이", "가"], "가": ["이", "가"], "은": ["은", "는"], "는": ["은", "는"], "과": ["과", "와"], "와": ["과", "와"] };
  if (particle === "으로" || particle === "로") return has && !rieul ? "으로" : "로";
  const p = pairs[particle]; return p ? (has ? p[0] : p[1]) : particle;
}
const PART = "(으로|로|을|를|이|가|은|는|과|와)?";
function translate(text) {
  let out = text;
  for (const [from, to] of DICT) {
    if (from instanceof RegExp) { out = out.replace(from, to); continue; }
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![A-Za-z0-9_\\-])${esc}(?![A-Za-z0-9_])${PART}`, "g");
    out = out.replace(re, (m, part, offset, whole) => {
      if (!part) return to;
      const next = whole[offset + m.length] ?? "";
      // 조사 뒤에 한글이 이어지면 조사가 아니다(이며·이다·가능·과정…) — 단 '으로/로'는 복합조사(으로서·로는)도 받침 규칙을 따른다
      if (/[가-힣]/.test(next) && part !== "으로" && part !== "로") return to + part;
      return to + fixParticle(to, part);
    });
  }
  return out;
}

function isCodeContext(node) {
  const p = node.parent;
  if (!p) return true;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return true;
  if (ts.isLiteralTypeNode(p)) return true;
  if (ts.isCaseClause(p)) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isPropertyAssignment(p) && p.name === node) return true;
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(p.operatorToken.kind)) return true;
  if (ts.isCallExpression(p)) { const callee = p.expression.getText(); if (/^(require|import|cn|clsx|localStorage\.\w+|JSON\.\w+|new Date|Date|searchParams\.get|params\.get|sp\.get|router\.push|router\.replace|getByRole|querySelector)/.test(callee)) return true; }
  return false;
}
function uiByPlacement(node) {
  // JSX 속성: <X title="…"> 
  let p = node.parent;
  if (p && ts.isJsxAttribute(p)) { const n = p.name.getText(); return UI_ATTRS.has(n) ? "ui" : (CODE_KEYS.has(n) || n.startsWith("data-") || n.startsWith("on")) ? "code" : "unknown"; }
  if (p && ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent)) { const n = p.parent.name.getText(); return UI_ATTRS.has(n) ? "ui" : "code"; }
  // 객체 속성: { title: "…" } / 배열 요소 { items: ["…"] }
  let q = node; let hops = 0;
  while (q.parent && hops < 4) {
    const par = q.parent;
    if (ts.isPropertyAssignment(par) && par.initializer === q) { const k = par.name.getText().replace(/["']/g, ""); return UI_KEYS.has(k) ? "ui" : CODE_KEYS.has(k) ? "code" : "unknown"; }
    if (ts.isArrayLiteralExpression(par) || ts.isParenthesizedExpression(par) || ts.isConditionalExpression(par) || (ts.isBinaryExpression(par) && par.operatorToken.kind === ts.SyntaxKind.BarBarToken) || (ts.isBinaryExpression(par) && par.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) { q = par; hops++; continue; }
    break;
  }
  // JSX 자식 표현식 안의 조건 문자열 {cond ? "AI LIVE" : "AI Ready"}
  let r = node; hops = 0;
  while (r.parent && hops < 4) { const par = r.parent; if (ts.isJsxExpression(par) && !ts.isJsxAttribute(par.parent)) return "ui"; if (ts.isConditionalExpression(par) || ts.isParenthesizedExpression(par) || ts.isBinaryExpression(par)) { r = par; hops++; continue; } break; }
  // toast("…", "…")
  if (p && ts.isCallExpression(p) && /^(toast|alert|confirm)$/.test(p.expression.getText())) return "ui";
  return "unknown";
}

const files = argFiles.length ? argFiles : [...walk("src")].filter((f) => /\.(tsx?|mts)$/.test(f) && !f.endsWith("lib/types.ts"));
function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) yield* walk(f); else yield f; } }

let changedFiles = 0, changedNodes = 0; const samples = [];
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const t = node.getText(sf); const nt = translate(t); if (nt !== t) edits.push([node.getStart(sf), node.getEnd(), nt]);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const host = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node : node.parent && ts.isTemplateSpan(node.parent) ? node.parent.parent : node.parent;
      if (!isCodeContext(host)) {
        const place = uiByPlacement(host);
        const fullText = host.getText(sf);
        const ok = place === "ui" || (place !== "code" && hangul.test(fullText));
        if (ok) { const raw = node.getText(sf); const nt = translate(raw); if (nt !== raw) edits.push([node.getStart(sf), node.getEnd(), nt]); }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) continue;
  edits.sort((a, b) => b[0] - a[0]);
  let out = src; for (const [s, e, t] of edits) { if (samples.length < 400) samples.push(`${path.basename(file)}: ${src.slice(s, e).replace(/\s+/g, " ").slice(0, 70)}  →  ${t.replace(/\s+/g, " ").slice(0, 70)}`); out = out.slice(0, s) + t + out.slice(e); }
  changedFiles++; changedNodes += edits.length;
  if (WRITE) fs.writeFileSync(file, out);
}
console.log(`${WRITE ? "WROTE" : "DRY-RUN"} — files ${changedFiles}, text nodes ${changedNodes}`);
if (!WRITE) for (const s of samples) console.log("  " + s);
