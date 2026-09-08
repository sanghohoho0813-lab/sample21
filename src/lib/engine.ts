/* ------------------------------------------------------------------
   Rule-based engines (RULE / STATISTICAL). No LLM is called.
   Fit Recommendation · Repeat Recommendation · AI Briefing (rule text).
   LLM is "AI READY": interface prepared in src/lib/ai.ts.
------------------------------------------------------------------- */
import type { FitProfile, Product } from "./types";
import { PRODUCTS, PRODUCT_BY_ID, BRAND_BY_ID, SCENARIO } from "./demo/seed";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL"];

export interface FitResult {
  size: string | null;
  confidence: "high" | "mid" | "low";
  confidenceScore: number;
  reasons: string[];
  cautions: string[];
  peerNote: string;
  ready: boolean; // false → 프로필 부족
}

function baseTopSizeByHW(height: number | null, weight: number | null, gender: Product["gender"]) {
  if (!height || !weight) return null;
  const bmiish = weight / ((height / 100) ** 2);
  const adj = gender === "women" ? -0.3 : 0;
  const idx = bmiish + adj < 19 ? 1 : bmiish + adj < 22.5 ? 2 : bmiish + adj < 26 ? 3 : 4;
  return SIZE_ORDER[Math.min(4, Math.max(0, idx))];
}

export function recommendFit(p: Product, profile: FitProfile, fitNoteOverride?: string): FitResult {
  const hasBasic = !!(profile.height && profile.weight) || !!profile.topSize || !!profile.bottomSize;
  if (p.categoryId === "bag" || p.categoryId === "acc") return { size: "FREE", confidence: "high", confidenceScore: 0.99, reasons: ["단일 사이즈 상품입니다."], cautions: [], peerNote: "", ready: true };
  if (p.categoryId === "shoes") {
    return { size: null, confidence: "low", confidenceScore: 0.4, reasons: ["신발은 평소 신는 mm 사이즈 기준으로 선택하세요."], cautions: [p.sizing === "small" ? "발볼이 좁게 나온 상품입니다. 5mm 크게 권장합니다." : p.sizing === "large" ? "크게 나온 상품입니다. 5mm 작게 권장합니다." : "정사이즈입니다."], peerNote: "", ready: true };
  }
  if (!hasBasic) return { size: null, confidence: "low", confidenceScore: 0, reasons: [], cautions: [], peerNote: "", ready: false };

  const isBottom = p.categoryId === "bottom" || p.categoryId === "dress";
  const usual = isBottom ? profile.bottomSize ?? profile.topSize : profile.topSize ?? profile.bottomSize;
  const fromHW = baseTopSizeByHW(profile.height, profile.weight, p.gender);
  let base = usual ?? fromHW ?? "M";
  const reasons: string[] = [];
  const cautions: string[] = [];
  if (usual) reasons.push(`평소 ${isBottom ? "하의" : "상의"} 사이즈 ${usual} 기준`);
  if (fromHW) reasons.push(`키 ${profile.height}cm · 몸무게 ${profile.weight}kg 체형 기준 ${fromHW}`);
  let shift = 0;
  // Sizing tendency rule
  if (p.sizing === "small") { shift += 1; reasons.push("이 상품은 작게 나와 한 치수 크게 보정"); }
  if (p.sizing === "large") { shift -= 1; reasons.push("이 상품은 크게 나와 한 치수 작게 보정"); }
  // Preferred fit rule
  if (profile.preferredFit === "oversized" && p.fit !== "oversized") { shift += 1; reasons.push("선호 핏(오버핏) 반영 +1"); }
  if (profile.preferredFit === "slim" && (p.fit === "relaxed" || p.fit === "oversized")) { shift -= 1; reasons.push("선호 핏(슬림) 반영 −1"); }
  // Loop 3: fit-guide action applied → stronger correction for Scenario B
  if (p.id === SCENARIO.B_PRODUCT && fitNoteOverride) { shift = Math.max(shift, 1); reasons.push("반품 데이터 반영: 허리 타이트 → +1 사이즈 보정 (핏 안내 개선 적용)"); }
  // body type
  if (profile.bodyType === "inverted" && !isBottom) { shift += 0; cautions.push("어깨가 넓은 체형은 어깨 실측을 확인하세요."); }
  if (profile.bodyType === "pear" && isBottom) { cautions.push("엉덩이 둘레 실측을 확인하세요."); }
  let idx = SIZE_ORDER.indexOf(base);
  if (idx < 0) idx = 2;
  idx = Math.max(0, Math.min(SIZE_ORDER.length - 1, idx + shift));
  base = SIZE_ORDER[idx];
  if (!p.sizes.includes(base)) base = p.sizes.includes("M") ? "M" : p.sizes[Math.floor(p.sizes.length / 2)];
  let score = 0.55;
  if (usual) score += 0.2;
  if (fromHW) score += 0.15;
  if (profile.preferredFit) score += 0.05;
  if (p.id === SCENARIO.B_PRODUCT && !fitNoteOverride) { score -= 0.2; cautions.push("이 상품은 최근 '사이즈 작음' 반품이 많아 추천 신뢰도를 낮췄습니다."); }
  if (p.fit === "oversized") cautions.push("오버핏 상품은 한 치수 작게 선택해도 여유가 있습니다.");
  score = Math.max(0.3, Math.min(0.95, score));
  const confidence = score >= 0.8 ? "high" : score >= 0.6 ? "mid" : "low";
  const peerNote = profile.height ? `키 ${Math.floor(profile.height / 5) * 5}~${Math.floor(profile.height / 5) * 5 + 4}cm 고객의 ${p.id === SCENARIO.B_PRODUCT ? 61 : 68}%가 ${base} 사이즈를 선택했습니다 (Demo 집계).` : "";
  return { size: base, confidence, confidenceScore: score, reasons, cautions, peerNote, ready: true };
}

/* ------------------------------ Repeat / personalized recommendation ------------------------------ */
export function recommendForCustomer(opts: { favoriteBrandId?: string | null; recentlyViewed: string[]; wishlist: string[]; gender?: Product["gender"]; limit?: number }) {
  const { favoriteBrandId = "b-aerno", recentlyViewed, wishlist, gender, limit = 8 } = opts;
  const viewedCats = new Set(recentlyViewed.map((id) => PRODUCT_BY_ID[id]?.categoryId).filter(Boolean));
  const scored = PRODUCTS.filter((p) => !wishlist.includes(p.id) && !recentlyViewed.slice(0, 2).includes(p.id)).map((p) => {
    let s = 0;
    const reasons: string[] = [];
    if (p.brandId === favoriteBrandId) { s += 3; reasons.push(`자주 구매한 ${BRAND_BY_ID[p.brandId].name}`); }
    if (viewedCats.has(p.categoryId)) { s += 2; reasons.push("최근 본 카테고리"); }
    if (gender && (p.gender === gender || p.gender === "unisex")) s += 1;
    const age = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
    if (age < 30) { s += 1.5; reasons.push("신상품"); }
    if (p.tags.includes("베스트")) { s += 1; reasons.push("베스트"); }
    if (p.salePrice) { s += 0.5; reasons.push("할인 중"); }
    return { product: p, score: s, reason: reasons[0] ?? "취향 기반 추천" };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ------------------------------ AI Briefing (rule text; LLM = AI READY) ------------------------------ */
export interface BriefingInput { revenue: number; revenueDelta: number; lowRisk: number; rising: number; slowValue: number; openActions: number; highActions: number; restockRequests: number; fitReturnRate: number; topProductName: string; }
export function ruleBriefing(i: BriefingInput): { headline: string; points: string[]; next: string } {
  const dir = i.revenueDelta >= 0 ? "상승" : "하락";
  return {
    headline: `이번 주 매출은 직전 대비 ${Math.abs(Math.round(i.revenueDelta * 100))}% ${dir}했고, 지금 가장 먼저 볼 것은 품절 위험 옵션 ${i.lowRisk}개입니다.`,
    points: [
      `관심이 급상승한 옵션 ${i.rising}개 중 '${i.topProductName}'은 재입고 알림 신청이 누적되어 우선 검토 대상입니다.`,
      `저회전·과잉 재고 원가 ${Math.round(i.slowValue / 10000).toLocaleString("ko-KR")}만원은 시즌 종료 전 할인 검토가 필요합니다.`,
      `사이즈 관련 반품률 ${(i.fitReturnRate * 100).toFixed(1)}% — 핏 안내 개선 Action이 진행 중입니다.`,
      `처리 대기 Action ${i.openActions}건 (긴급 ${i.highActions}건).`,
    ],
    next: "Growth & Action Center에서 긴급 Action 2건을 먼저 승인하세요.",
  };
}
