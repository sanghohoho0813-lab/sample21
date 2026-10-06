"use client";
/* LoopHint — 고객 행동이 AX 운영화면 어디에 반영되는지 알려주는 '시연용' 한 줄.
   쇼핑하는 고객(역할 = 고객)에게는 보이지 않고, 대표·MD·운영 역할로 시연할 때만 같은 모양으로 나온다.
   설명 박스·배지 대신 점 하나 + 한 문장 + 'AX에서 보기' 링크로 통일한다. */
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/components/system/hooks";
import { cn } from "@/lib/cn";

export function LoopHint({ children, href, className }: { children: ReactNode; href?: string; className?: string }) {
  const role = useApp((s) => s.role);
  const hydrated = useHydrated();
  if (!hydrated || role === "customer") return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] text-neutral-text2 leading-snug", className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0" />
      <span className="min-w-0 break-keep">{children}</span>
      {href && <Link href={href} className="tap inline-flex min-h-[40px] items-center gap-0.5 font-semibold text-brand-accent hover:underline underline-offset-2 whitespace-nowrap">AX에서 보기<ArrowUpRight size={14} /></Link>}
    </p>
  );
}
