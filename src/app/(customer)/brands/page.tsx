"use client";
/* /brands — 브랜드 인덱스. 성격(무드) 필터 + 팔로우(localStorage). 사입/입점 구분은 고객에게 보이지 않는다. */
import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { BRANDS } from "@/lib/demo/seed";
import { Hydrated } from "@/components/system/Hydrated";
import { Skeleton, EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Container, PageTitle } from "@/components/customer/Section";
import { FilterChip } from "@/components/customer/discovery/FilterChip";
import { BrandCard, BRAND_MOOD, MOOD_OPTIONS, type BrandMood } from "@/components/customer/discovery/BrandCard";
import { useBrandFollow } from "@/components/customer/discovery/useBrandFollow";

function BrandsBody() {
  const [mood, setMood] = useState<BrandMood | "all">("all");
  const [onlyFollowing, setOnlyFollowing] = useState(false);
  const { following, isFollowing, toggle, ready } = useBrandFollow();
  const list = useMemo(() => BRANDS.filter((b) => (mood === "all" || (BRAND_MOOD[b.id] ?? []).includes(mood)) && (!onlyFollowing || following.includes(b.id))), [mood, onlyFollowing, following]);

  if (!ready) return <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] md:aspect-[3/4] rounded-cardlg" />)}</div>;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6" role="group" aria-label="브랜드 성격 필터">
        {MOOD_OPTIONS.map((m) => <FilterChip key={m.value} size="sm" active={mood === m.value} onClick={() => setMood(m.value)}>{m.label}</FilterChip>)}
        <span className="hidden sm:block h-6 w-px bg-neutral-border mx-1" aria-hidden />
        <FilterChip size="sm" active={onlyFollowing} onClick={() => setOnlyFollowing((v) => !v)}><Heart size={14} fill={onlyFollowing ? "currentColor" : "none"} />팔로잉만 {following.length > 0 && <span className="tabular">({following.length})</span>}</FilterChip>
      </div>
      {list.length === 0 ? (
        <EmptyState title={onlyFollowing ? "아직 팔로우한 브랜드가 없어요" : "해당 성격의 브랜드가 없습니다"} desc={onlyFollowing ? "마음에 드는 브랜드의 팔로우 버튼을 눌러보세요. 신상품·세일 소식을 먼저 알려드려요." : "다른 성격을 선택해보세요."} action={<Button variant="brand" onClick={() => { setOnlyFollowing(false); setMood("all"); }}>전체 브랜드 보기</Button>} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
          {list.map((b) => <BrandCard key={b.id} brand={b} following={isFollowing(b.id)} onToggle={toggle} />)}
        </div>
      )}
    </>
  );
}

export default function BrandsPage() {
  useEffect(() => { document.title = "브랜드 | MORFIT"; }, []);
  return (
    <Container className="py-6 md:py-10 animate-fadeIn">
      <PageTitle title="브랜드" desc={`${BRANDS.length}개 브랜드, 네 가지 무드. 팔로우하면 신상품과 세일 소식을 먼저 받아요.`} />
      <Hydrated fallback={<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] md:aspect-[3/4] rounded-cardlg" />)}</div>}>
        <BrandsBody />
      </Hydrated>
    </Container>
  );
}
