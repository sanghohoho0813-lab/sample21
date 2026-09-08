"use client";
import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "brand" | "accent";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  loading?: boolean;
  full?: boolean;
  icon?: ReactNode;
}

const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl whitespace-nowrap select-none transition-all duration-fast ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-offset-2";
const variants: Record<Variant, string> = {
  primary: "bg-theme-primary text-white hover:brightness-110 hover:shadow-raised",
  brand: "bg-brand-black text-white hover:bg-[#2a2a2a] hover:shadow-raised",
  accent: "bg-brand-accent text-white hover:brightness-110 hover:shadow-raised",
  secondary: "bg-theme-soft text-neutral-text hover:brightness-95",
  outline: "border border-neutral-border bg-white text-neutral-text hover:bg-neutral-canvas hover:border-neutral-text2",
  ghost: "text-neutral-text hover:bg-neutral-canvas",
  danger: "bg-semantic-error text-white hover:brightness-110",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[0.85rem]",
  md: "h-11 px-4 text-[0.95rem]",
  lg: "h-[52px] px-6 text-[1rem]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", href, loading, full, icon, children, ...rest }, ref) {
  const cls = cn(base, variants[variant], sizes[size], full && "w-full", className);
  if (href) {
    return (
      <Link href={href} className={cls} aria-disabled={rest.disabled}>
        {icon}{children}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} {...rest} disabled={rest.disabled || loading}>
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : icon}
      {children}
    </button>
  );
});
