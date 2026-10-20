/* 검색 자동완성 — 결과 화면과 같은 규칙으로 찾고, 띄어쓰기에 흔들리지 않는다 */
import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/lib/demo/seed";
import { matchesQuery } from "@/components/customer/discovery/filters";
import { searchSuggestions, splitMatch } from "@/components/customer/discovery/suggest";

describe("검색 자동완성", () => {
  it("빈 입력이면 추천하지 않는다", () => {
    expect(searchSuggestions("  ")).toEqual([]);
  });

  it("추천한 상품은 모두 검색 결과에도 있다", () => {
    for (const q of ["셔츠", "데님", "블랙", "코트"]) {
      const ids = searchSuggestions(q)
        .filter((s) => s.kind === "product")
        .map((s) => s.productId);
      const result = new Set(PRODUCTS.filter((p) => matchesQuery(p, q)).map((p) => p.id));
      expect(ids.length).toBeGreaterThan(0);
      ids.forEach((id) => expect(result.has(id!)).toBe(true));
    }
  });

  it("상품명에 바로 들어 있는 상품이 먼저, 최대 5개", () => {
    const products = searchSuggestions("데님").filter((s) => s.kind === "product");
    expect(products.length).toBeLessThanOrEqual(5);
    expect(products[0].label).toContain("데님");
  });

  it("띄어쓰기 없이 입력해도 찾는다 ('와이드데님' → '와이드 데님'으로 찾은 상품 안에서)", () => {
    const a = searchSuggestions("와이드데님").map((s) => s.id);
    const b = new Set(searchSuggestions("와이드 데님", { brand: 9, category: 9, product: 99 }).map((s) => s.id));
    expect(a.length).toBeGreaterThan(0);
    a.forEach((id) => expect(b.has(id)).toBe(true));
  });

  it("카테고리·브랜드 이름도 추천한다", () => {
    expect(searchSuggestions("아우터").some((s) => s.kind === "category" && s.href === "/shop?category=outer")).toBe(
      true,
    );
    expect(searchSuggestions("aerno").some((s) => s.kind === "brand")).toBe(true);
  });

  it("일치한 부분을 나눠 강조할 수 있다", () => {
    expect(splitMatch("오버핏 옥스포드 셔츠", "옥스")).toEqual(["오버핏 ", "옥스", "포드 셔츠"]);
    expect(splitMatch("셔츠", "없음")).toEqual(["셔츠", "", ""]);
  });
});
