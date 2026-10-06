"use client";
/* AutoFit — 숫자·금액·날짜처럼 '한 줄이어야 하는' 값을 칸 폭에 맞춰 글자 크기를 줄인다.
   줄바꿈 0 · 박스 이탈 0 (UI/UX Stabilization §16~17). 최소 62%까지만 줄이고, 그래도 넘치면 말줄임.
   ResizeObserver 콜백 안에서 곧바로 레이아웃을 바꾸지 않도록 rAF로 한 번 미룬다. */
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AutoFit({
  children,
  className,
  min = 0.62,
}: {
  children: ReactNode;
  className?: string;
  min?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    let raf = 0;
    const fit = () => {
      el.style.fontSize = "";
      const base = parseFloat(getComputedStyle(el).fontSize);
      const need = el.scrollWidth,
        have = el.clientWidth;
      if (have > 0 && need > have + 1) {
        const next = Math.max(base * min, base * (have / need) - 0.3);
        el.style.fontSize = `${next.toFixed(2)}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    });
    ro.observe(parent);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  });
  return (
    <span
      ref={ref}
      className={cn("inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-bottom", className)}
    >
      {children}
    </span>
  );
}
