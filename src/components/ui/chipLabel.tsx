import { Children, type ReactNode } from "react";

/** 칩·버튼 안 라벨 — 글자만 있으면 칸을 넘지 않게 말줄임, 아이콘이 섞여 있으면 기존 가로 정렬을 유지한다. */
export function ChipLabel({ children, gap = "gap-1.5" }: { children: ReactNode; gap?: string }) {
  const textOnly = Children.toArray(children).every((c) => typeof c === "string" || typeof c === "number");
  return textOnly ? <span className="min-w-0 truncate">{children}</span> : <span className={`inline-flex min-w-0 items-center ${gap}`}>{children}</span>;
}
