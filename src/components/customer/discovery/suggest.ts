/* 검색 자동완성 — 입력하는 동안 브랜드·카테고리·상품을 바로 보여준다(순수 함수, 테스트 대상).
   결과 화면과 같은 규칙(matchesQuery)으로 상품을 찾으므로 "추천에는 있는데 결과에는 없는" 일이 없다. */
import type { CategoryId } from "@/lib/types";
import { BRANDS, CATEGORIES, PRODUCTS } from "@/lib/demo/seed";
import { matchesQuery } from "./filters";

export type SuggestKind = "brand" | "category" | "product";
export interface Suggestion {
  kind: SuggestKind;
  id: string;
  label: string;
  sub?: string;
  href: string;
  productId?: string;
  categoryId?: CategoryId;
}

const norm = (s: string) => s.toLowerCase();
const squash = (s: string) => norm(s).replace(/\s/g, "");

/** 띄어쓰기를 무시하고 포함 여부를 본다 ('와이드데님' = '와이드 데님') */
export function hits(text: string, q: string) {
  const t = norm(q).trim();
  if (!t) return false;
  return norm(text).includes(t) || squash(text).includes(squash(t));
}

export function searchSuggestions(q: string, limits = { brand: 2, category: 2, product: 5 }): Suggestion[] {
  const t = q.trim();
  if (!t) return [];
  const brands: Suggestion[] = BRANDS.filter((b) => hits(b.name, t) || hits(b.slug.replace(/-/g, " "), t))
    .slice(0, limits.brand)
    .map((b) => ({ kind: "brand", id: b.id, label: b.name, sub: b.tagline, href: `/brands/${b.slug}` }));
  const cats: Suggestion[] = CATEGORIES.filter((c) => hits(c.name, t))
    .slice(0, limits.category)
    .map((c) => ({ kind: "category", id: c.id, label: c.name, href: `/shop?category=${c.id}`, categoryId: c.id }));
  // 상품명에 바로 들어 있는 것 먼저, 그다음 리뷰 많은 순
  const products: Suggestion[] = PRODUCTS.filter((p) => matchesQuery(p, t))
    .sort((a, b) => Number(hits(b.name, t)) - Number(hits(a.name, t)) || b.reviewCount - a.reviewCount)
    .slice(0, limits.product)
    .map((p) => ({ kind: "product", id: p.id, label: p.name, href: `/products/${p.id}`, productId: p.id }));
  return [...brands, ...cats, ...products];
}

/** 일치한 부분을 앞·가운데·뒤로 나눈다(강조 표시용). 띄어쓰기가 달라 위치를 못 찾으면 통째로 돌려준다 */
export function splitMatch(text: string, q: string): [string, string, string] {
  const t = q.trim();
  const i = t ? norm(text).indexOf(norm(t)) : -1;
  if (i < 0) return [text, "", ""];
  return [text.slice(0, i), text.slice(i, i + t.length), text.slice(i + t.length)];
}
