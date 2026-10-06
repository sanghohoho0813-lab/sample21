"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { ChipLabel } from "@/components/ui/chipLabel";

/** Keyboard-accessible filter chip: real <button>, aria-pressed, ≥44px on mobile. */
export function FilterChip({
  active,
  onClick,
  children,
  className,
  swatch,
  size = "md",
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  swatch?: [string, string];
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={cn(
        "inline-flex max-w-full select-none items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold transition-all duration-fast active:scale-[0.97]",
        size === "sm"
          ? "h-11 px-3.5 text-[0.88rem] md:h-9 md:px-3 md:text-[0.85rem]"
          : "h-11 px-4 text-[0.92rem] md:h-10",
        active
          ? "border-brand-black bg-brand-black text-white"
          : "border-neutral-border bg-white text-neutral-text hover:border-neutral-text2 hover:bg-neutral-canvas",
        className,
      )}
    >
      {swatch && (
        <span
          aria-hidden
          className={cn(
            "h-3.5 w-3.5 shrink-0 rounded-full border",
            active ? "border-white/60" : "border-neutral-border",
          )}
          style={{ background: `linear-gradient(135deg, ${swatch[0]}, ${swatch[1]})` }}
        />
      )}
      <ChipLabel>{children}</ChipLabel>
      {active && <Check size={14} aria-hidden className="shrink-0" />}
    </button>
  );
}

/** Link-styled chip (anchor) for navigation lists such as 추천 검색어. */
export function ChipLink({
  href,
  children,
  className,
  active,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-11 max-w-full items-center gap-1 whitespace-nowrap rounded-full border px-4 text-[0.9rem] font-semibold transition-all duration-fast active:scale-[0.97] md:h-10",
        active
          ? "border-brand-black bg-brand-black text-white"
          : "border-neutral-border bg-white text-neutral-text hover:border-neutral-text2 hover:bg-neutral-canvas",
        className,
      )}
    >
      {children}
    </Link>
  );
}
