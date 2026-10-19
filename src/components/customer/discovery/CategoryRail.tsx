"use client";
/* ------------------------------------------------------------------
   카테고리 바로가기 — 글자 칩 대신 '옷 모양'으로 고른다.
   홈(링크)과 목록(필터 버튼) 두 곳에서 같은 모양을 쓴다.
   실루엣은 상품 이미지와 같은 Garment 컴포넌트 — 사진이 들어와도 아이콘 역할은 그대로다.
------------------------------------------------------------------- */
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { CategoryId } from "@/lib/types";
import { CATEGORIES } from "@/lib/demo/seed";
import { cn } from "@/lib/cn";
import { Garment, type GarmentKind } from "@/components/ui/Garment";

const KIND: Record<CategoryId, GarmentKind> = {
  outer: "coat",
  top: "tee",
  bottom: "pants",
  dress: "dress",
  shoes: "shoe",
  bag: "bag",
  acc: "cap",
};
/** 짧은 이름 — 원 아래 한 줄 */
const SHORT: Partial<Record<CategoryId, string>> = { dress: "원피스", acc: "잡화" };

function Tile({ id, label, active }: { id: CategoryId | null; label: string; active: boolean }) {
  return (
    <>
      <span
        className={cn(
          "relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full transition-all duration-fast md:h-[68px] md:w-[68px]",
          active
            ? "bg-brand-black ring-2 ring-brand-black ring-offset-2"
            : "bg-[#f1efea] group-hover:bg-[#e8e5de] group-active:scale-95",
        )}
      >
        {id ? (
          <span className="absolute inset-[9%]">
            <Garment
              kind={KIND[id]}
              color={active ? "#f5f3ee" : "#2b2b2b"}
              shade={active ? "#d9d5cc" : "#4a4a4a"}
              id={`cat-${id}-${active ? "on" : "off"}`}
            />
          </span>
        ) : (
          <LayoutGrid size={22} className={active ? "text-white" : "text-neutral-text"} aria-hidden />
        )}
      </span>
      <span
        className={cn(
          "mt-1.5 block whitespace-nowrap text-center text-[0.8rem]",
          active ? "font-bold text-neutral-text" : "font-medium text-neutral-text2 group-hover:text-neutral-text",
        )}
      >
        {label}
      </span>
    </>
  );
}

const ITEM = "group flex w-[64px] shrink-0 flex-col items-center md:w-[76px]";

/** 목록 필터용 — 누르면 같은 화면에서 카테고리만 바뀐다 */
export function CategoryRail({
  value,
  onSelect,
  className,
}: {
  value: CategoryId | null;
  onSelect: (c: CategoryId | null) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("hide-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4", className)}
      role="group"
      aria-label="카테고리 빠른 선택"
    >
      <button type="button" className={ITEM} aria-pressed={!value} onClick={() => onSelect(null)}>
        <Tile id={null} label="전체" active={!value} />
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          className={ITEM}
          aria-pressed={value === c.id}
          onClick={() => onSelect(value === c.id ? null : c.id)}
        >
          <Tile id={c.id} label={SHORT[c.id] ?? c.name} active={value === c.id} />
        </button>
      ))}
    </div>
  );
}

/** 홈용 — 카테고리 목록 화면으로 이동 */
export function CategoryLinks({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "hide-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:justify-between md:px-0",
        className,
      )}
      aria-label="카테고리"
    >
      {CATEGORIES.map((c) => (
        <Link key={c.id} href={`/shop?category=${c.id}`} className={ITEM}>
          <Tile id={c.id} label={SHORT[c.id] ?? c.name} active={false} />
        </Link>
      ))}
      <Link href="/shop" className={ITEM}>
        <Tile id={null} label="전체" active={false} />
      </Link>
    </nav>
  );
}
