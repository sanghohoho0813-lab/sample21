import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, hover, pad = "md", ...rest }: HTMLAttributes<HTMLDivElement> & { hover?: boolean; pad?: "none" | "sm" | "md" | "lg" }) {
  const pads = { none: "", sm: "p-4", md: "p-5 md:p-6", lg: "p-6 md:p-8" };
  return (
    <div className={cn("rounded-cardlg bg-neutral-raised border border-neutral-border shadow-card", pads[pad], hover && "hover-lift cursor-pointer", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, desc, right, className, as: Tag = "h2" }: { title: ReactNode; desc?: ReactNode; right?: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-4", className)}>
      <div className="min-w-0">
        <Tag className={cn("font-bold tracking-tight text-neutral-text", Tag === "h1" ? "text-[1.7rem] md:text-[1.9rem]" : Tag === "h2" ? "text-[1.25rem] md:text-[1.4rem]" : "text-[1.05rem]")}>{title}</Tag>
        {desc && <p className="mt-1 text-neutral-text2 text-[0.92rem] leading-relaxed">{desc}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
