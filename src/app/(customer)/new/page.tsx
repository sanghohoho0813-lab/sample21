"use client";
/* 신상품 — 최근 30일 등록 상품을 주 단위로 묶어 보여준다. */
import { useEffect, useMemo } from "react";
import { PRODUCTS } from "@/lib/demo/seed";
import { Hydrated } from "@/components/system/Hydrated";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Freshness } from "@/components/ui/Misc";
import { SkeletonGrid, EmptyState } from "@/components/ui/States";
import { Container, PageTitle, SectionHead } from "@/components/customer/Section";
import { ProductGrid } from "@/components/customer/ProductCard";

const DAY = 86400000;
const weekLabel = (ageDays: number) => (ageDays < 7 ? "이번 주" : ageDays < 14 ? "지난 주" : ageDays < 21 ? "2주 전" : ageDays < 28 ? "3주 전" : "4주 전");
const WEEK_ORDER = ["이번 주", "지난 주", "2주 전", "3주 전", "4주 전"];

export default function NewPage() {
  useEffect(() => { document.title = "신상품 | MORFIT"; }, []);
  const groups = useMemo(() => {
    const now = Date.now();
    const fresh = PRODUCTS.filter((p) => now - new Date(p.createdAt).getTime() < 30 * DAY).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const map = new Map<string, { products: typeof fresh; reasons: Record<string, string> }>();
    for (const p of fresh) {
      const age = Math.floor((now - new Date(p.createdAt).getTime()) / DAY);
      const label = weekLabel(age);
      const g = map.get(label) ?? { products: [], reasons: {} };
      g.products.push(p);
      g.reasons[p.id] = age <= 0 ? "오늘 등록" : `${age}일 전 등록`;
      map.set(label, g);
    }
    return WEEK_ORDER.filter((w) => map.has(w)).map((w) => ({ label: w, ...map.get(w)! }));
  }, []);
  const total = groups.reduce((s, g) => s + g.products.length, 0);

  return (
    <Container className="py-6 md:py-10 animate-fadeIn">
      <PageTitle title={<span className="inline-flex items-center gap-3">신상품 <Badge tone="dark">NEW</Badge></span>} desc={`최근 30일 안에 등록된 상품 ${total}개 · 최신순`} right={<Freshness source="DEMO" />} />
      <Hydrated fallback={<SkeletonGrid n={8} />}>
        {groups.length === 0 ? (
          <EmptyState title="최근 30일 신상품이 없습니다" desc="랭킹에서 지금 반응이 좋은 상품을 확인해보세요." action={<Button variant="brand" href="/ranking">랭킹 보기</Button>} />
        ) : (
          <div className="space-y-12 md:space-y-16">
            {groups.map((g) => (
              <section key={g.label} aria-label={`${g.label} 신상품`}>
                <SectionHead title={<span className="inline-flex items-center gap-2">{g.label}<span className="text-[0.95rem] font-semibold text-neutral-text2 tabular">{g.products.length}개</span></span>} desc={g.label === "이번 주" ? "가장 새로 들어온 상품" : undefined} />
                <ProductGrid products={g.products} reasons={g.reasons} />
              </section>
            ))}
          </div>
        )}
      </Hydrated>
      <div className="mt-12 rounded-2xl bg-brand-ivory border border-neutral-border p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div><p className="font-bold">신상품을 놓치고 싶지 않다면</p><p className="text-[0.88rem] text-neutral-text2 mt-0.5">브랜드를 팔로우하면 신상품과 세일 소식을 먼저 알려드려요.</p></div>
        <Button variant="brand" href="/brands">브랜드 팔로우하기</Button>
      </div>
    </Container>
  );
}
