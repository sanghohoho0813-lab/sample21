"use client";
/* ------------------------------------------------------------------
   상품 상세 섹션 바로가기 — 긴 상세에서 "리뷰 어디 있지?"를 없앤다.
   헤더 바로 아래에 붙고, 지금 보고 있는 섹션을 밑줄로 따라간다(스크롤 추적).
------------------------------------------------------------------- */
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface SectionNavItem {
  id: string;
  label: string;
  count?: number;
}

/** 헤더(64/72px) + 이 바(48px) + 여백 — 섹션 머리가 바에 붙지 않게 */
const OFFSET = () => (window.innerWidth >= 768 ? 73 : 65) + 49 + 16;

/** 섹션 머리가 헤더·바로가기 바 아래에 오도록 이동 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduced = document.documentElement.dataset.motion === "reduced";
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - OFFSET(),
    behavior: reduced ? "auto" : "smooth",
  });
  return true;
}

export function SectionNav({ items, className }: { items: SectionNavItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const ids = items.map((i) => i.id).join(",");

  useEffect(() => {
    const list = ids.split(",");
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = OFFSET() + 8;
        let cur = list[0];
        for (const id of list) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top - y <= 0) cur = id;
        }
        // 페이지 끝에 닿으면 마지막 섹션
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4)
          cur = list[list.length - 1];
        setActive(cur);
      });
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [ids]);

  const go = (id: string) => {
    if (scrollToSection(id)) setActive(id);
  };

  return (
    <nav
      aria-label="상품 정보 바로가기"
      data-section-nav
      className={cn(
        "sticky top-[65px] z-20 -mx-4 border-b border-neutral-border bg-white/95 backdrop-blur md:top-[73px] md:mx-0",
        className,
      )}
    >
      <ul className="flex">
        {items.map((it) => {
          const on = active === it.id;
          return (
            <li key={it.id} className="min-w-0 flex-1">
              <a
                href={`#${it.id}`}
                aria-current={on ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(it.id);
                }}
                className={cn(
                  "relative flex h-12 items-center justify-center gap-1 whitespace-nowrap px-1 text-[0.92rem] transition-colors",
                  on ? "font-bold text-neutral-text" : "font-medium text-neutral-text2 hover:text-neutral-text",
                )}
              >
                {it.label}
                {it.count != null && (
                  <span className={cn("tabular text-[0.8rem]", on ? "text-neutral-text2" : "text-neutral-text2/80")}>
                    {it.count.toLocaleString("ko-KR")}
                  </span>
                )}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-brand-black transition-opacity duration-200",
                    on ? "opacity-100" : "opacity-0",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
