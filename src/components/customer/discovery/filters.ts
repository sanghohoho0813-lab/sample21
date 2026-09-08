/* ------------------------------------------------------------------
   Discovery filters — URL ↔ filter state ↔ product list.
   Shared by /shop and /search. Pure functions only (no React).
------------------------------------------------------------------- */
import type { CategoryId, Fit, Product } from "@/lib/types";
import { BRAND_BY_ID, CATEGORY_NAME, PRODUCTS } from "@/lib/demo/seed";
import type { ProductAgg } from "@/lib/kpi";

export type SortKey = "recommend" | "popular" | "newest" | "priceAsc" | "priceDesc";
export const SORT_OPTIONS: { value: SortKey; label: string; desc: string }[] = [
  { value: "recommend", label: "추천순", desc: "판매·찜·조회를 합친 점수에 베스트·신상품 가중" },
  { value: "popular", label: "인기순", desc: "최근 7일 판매 수량" },
  { value: "newest", label: "최신순", desc: "등록일이 최근인 순서" },
  { value: "priceAsc", label: "낮은가격순", desc: "판매가 낮은 순서" },
  { value: "priceDesc", label: "높은가격순", desc: "판매가 높은 순서" },
];
export const SORT_LABEL: Record<SortKey, string> = Object.fromEntries(SORT_OPTIONS.map((s) => [s.value, s.label])) as Record<SortKey, string>;

export type GenderFilter = "men" | "women" | null;

export interface ListingFilters {
  gender: GenderFilter;
  category: CategoryId | null;
  brands: string[];
  colors: string[];
  sizes: string[];
  min: number | null;
  max: number | null;
  sale: boolean;
  free: boolean; // 무료배송(5만원 이상)만
  fit: Fit | null;
  sort: SortKey;
  q: string;
}

export const EMPTY_FILTERS: ListingFilters = { gender: null, category: null, brands: [], colors: [], sizes: [], min: null, max: null, sale: false, free: false, fit: null, sort: "recommend", q: "" };

export const FREE_SHIPPING_MIN = 50000;

export const PRICE_RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: "5만원 이하", min: null, max: 50000 },
  { label: "5~10만원", min: 50000, max: 100000 },
  { label: "10~20만원", min: 100000, max: 200000 },
  { label: "20만원 이상", min: 200000, max: null },
];

export const FIT_LABEL: Record<Fit, string> = { slim: "슬림", regular: "레귤러", relaxed: "릴랙스", oversized: "오버사이즈" };
export const FITS: Fit[] = ["slim", "regular", "relaxed", "oversized"];

const CATEGORY_IDS = new Set(Object.keys(CATEGORY_NAME));
const SORT_KEYS = new Set(SORT_OPTIONS.map((s) => s.value));

/** Colors ordered by how many products use them. */
export const ALL_COLORS: string[] = (() => {
  const count = new Map<string, number>();
  for (const p of PRODUCTS) for (const c of p.colors) count.set(c, (count.get(c) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
})();

export const APPAREL_SIZES: string[] = ["S", "M", "L", "XL"];
export const SHOE_SIZES: string[] = (() => {
  const s = new Set<string>();
  for (const p of PRODUCTS) if (p.categoryId === "shoes") for (const z of p.sizes) s.add(z);
  return [...s].sort((a, b) => Number(a) - Number(b));
})();

const list = (v: string | null) => (v ? v.split(",").map((x) => x.trim()).filter(Boolean) : []);
const int = (v: string | null) => { if (!v) return null; const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n) : null; };

export function parseFilters(sp: URLSearchParams): ListingFilters {
  const gender = sp.get("gender");
  const category = sp.get("category");
  const sort = sp.get("sort");
  const fit = sp.get("fit");
  return {
    gender: gender === "men" || gender === "women" ? gender : null,
    category: category && CATEGORY_IDS.has(category) ? (category as CategoryId) : null,
    brands: list(sp.get("brand")).filter((b) => !!BRAND_BY_ID[b]),
    colors: list(sp.get("color")),
    sizes: list(sp.get("size")),
    min: int(sp.get("min")),
    max: int(sp.get("max")),
    sale: sp.get("sale") === "1",
    free: sp.get("free") === "1",
    fit: fit && (FITS as string[]).includes(fit) ? (fit as Fit) : null,
    sort: sort && SORT_KEYS.has(sort as SortKey) ? (sort as SortKey) : "recommend",
    q: (sp.get("q") ?? "").trim(),
  };
}

/** Serialize to a query string (no leading "?"). Defaults are omitted so URLs stay short. */
export function toQueryString(f: ListingFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.gender) sp.set("gender", f.gender);
  if (f.category) sp.set("category", f.category);
  if (f.brands.length) sp.set("brand", f.brands.join(","));
  if (f.colors.length) sp.set("color", f.colors.join(","));
  if (f.sizes.length) sp.set("size", f.sizes.join(","));
  if (f.min !== null) sp.set("min", String(f.min));
  if (f.max !== null) sp.set("max", String(f.max));
  if (f.sale) sp.set("sale", "1");
  if (f.free) sp.set("free", "1");
  if (f.fit) sp.set("fit", f.fit);
  if (f.sort !== "recommend") sp.set("sort", f.sort);
  return sp.toString();
}

/** Number of user-applied filters (excludes sort / q / gender which are page context). */
export function countActiveFilters(f: ListingFilters) {
  let n = 0;
  if (f.category) n++;
  n += f.brands.length + f.colors.length + f.sizes.length;
  if (f.min !== null || f.max !== null) n++;
  if (f.sale) n++;
  if (f.free) n++;
  if (f.fit) n++;
  return n;
}

/** Reset everything except page context (gender, q, sort). */
export function clearFilters(f: ListingFilters): ListingFilters {
  return { ...EMPTY_FILTERS, gender: f.gender, q: f.q, sort: f.sort };
}

/** Case-insensitive match on name / subtitle / brand / tags / category (+ colors, fit for convenience). All tokens must match. */
export function matchesQuery(p: Product, q: string): boolean {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const b = BRAND_BY_ID[p.brandId];
  const hay = [p.name, p.subtitle, b.name, b.tagline, ...p.tags, CATEGORY_NAME[p.categoryId], ...p.colors, FIT_LABEL[p.fit], p.material].join(" ").toLowerCase().replace(/\s+/g, " ");
  const compact = hay.replace(/\s/g, "");
  return tokens.every((t) => hay.includes(t) || compact.includes(t.replace(/\s/g, "")));
}

export const isNewProduct = (p: Product, days = 30) => Date.now() - new Date(p.createdAt).getTime() < days * 86400000;

export function applyFilters(aggs: ProductAgg[], f: ListingFilters): ProductAgg[] {
  return aggs.filter((a) => {
    const p = a.product;
    if (f.gender === "men" && !(p.gender === "men" || p.gender === "unisex")) return false;
    if (f.gender === "women" && !(p.gender === "women" || p.gender === "unisex")) return false;
    if (f.category && p.categoryId !== f.category) return false;
    if (f.brands.length && !f.brands.includes(p.brandId)) return false;
    if (f.colors.length && !p.colors.some((c) => f.colors.includes(c))) return false;
    if (f.sizes.length && !p.sizes.some((s) => f.sizes.includes(s))) return false;
    if (f.min !== null && a.price < f.min) return false;
    if (f.max !== null && a.price > f.max) return false;
    if (f.sale && !(a.price < p.price)) return false;
    if (f.free && a.price < FREE_SHIPPING_MIN) return false;
    if (f.fit && p.fit !== f.fit) return false;
    if (f.q && !matchesQuery(p, f.q)) return false;
    return true;
  });
}

export function sortAggs(aggs: ProductAgg[], sort: SortKey): ProductAgg[] {
  const arr = [...aggs];
  const created = (a: ProductAgg) => new Date(a.product.createdAt).getTime();
  const recScore = (a: ProductAgg) => a.rankScore + (a.product.tags.includes("베스트") ? 40 : 0) + (isNewProduct(a.product) ? 25 : 0) + (a.price < a.product.price ? 10 : 0) + (a.worst === "rising" ? 20 : 0);
  switch (sort) {
    case "popular": arr.sort((a, b) => b.sales7d - a.sales7d || b.views7d - a.views7d); break;
    case "newest": arr.sort((a, b) => created(b) - created(a) || b.rankScore - a.rankScore); break;
    case "priceAsc": arr.sort((a, b) => a.price - b.price || b.rankScore - a.rankScore); break;
    case "priceDesc": arr.sort((a, b) => b.price - a.price || b.rankScore - a.rankScore); break;
    default: arr.sort((a, b) => recScore(b) - recScore(a));
  }
  return arr;
}

/** Human title for a /shop context. */
export function listingTitle(f: ListingFilters): { title: string; desc: string } {
  if (f.q) return { title: `‘${f.q}’ 검색 결과`, desc: "상품명·브랜드·카테고리·태그에서 찾았습니다" };
  if (f.sale) return { title: "세일", desc: "지금 할인 중인 상품만 모았습니다" };
  if (f.brands.length === 1) return { title: BRAND_BY_ID[f.brands[0]].name, desc: BRAND_BY_ID[f.brands[0]].tagline };
  if (f.category) {
    const c = CATEGORY_NAME[f.category];
    return { title: f.gender === "men" ? `남성 ${c}` : f.gender === "women" ? `여성 ${c}` : c, desc: "브랜드를 넘어 한 번에 비교하세요" };
  }
  if (f.gender === "men") return { title: "남성", desc: "남성 · 유니섹스 상품" };
  if (f.gender === "women") return { title: "여성", desc: "여성 · 유니섹스 상품" };
  if (f.fit) return { title: `${FIT_LABEL[f.fit]} 핏`, desc: "선호 핏으로 고른 상품" };
  return { title: "전체 상품", desc: "10개 브랜드의 모든 상품" };
}
