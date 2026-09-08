import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "info" | "warning" | "error" | "success" | "accent" | "primary" | "dark" | "demo" | "next" | "ready" | "live";

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-canvas text-neutral-text2 border border-neutral-border",
  info: "bg-[#e8f0fe] text-[#1d4ed8]",
  warning: "bg-[#fff1e6] text-[#b45309]",
  error: "bg-[#fdecec] text-[#b91c1c]",
  success: "bg-[#e6f6ec] text-[#15803d]",
  accent: "bg-theme-soft text-theme-primary",
  primary: "bg-theme-primary text-white",
  dark: "bg-brand-black text-white",
  demo: "bg-[#fff7d6] text-[#8a6d00] border border-[#f3e4a6]",
  next: "bg-[#f1f1f4] text-[#5b6472] border border-dashed border-[#c9ccd3]",
  ready: "bg-[#eef2ff] text-[#4338ca] border border-[#dfe3ff]",
  live: "bg-[#e6f6ec] text-[#15803d] border border-[#bfe8cc]",
};

export function Badge({ tone = "neutral", className, children, size = "md" }: { tone?: Tone; className?: string; children: ReactNode; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-semibold leading-none whitespace-nowrap", size === "sm" ? "px-2 py-1 text-[0.72rem]" : "px-2.5 py-1.5 text-[0.8rem]", tones[tone], className)}>
      {children}
    </span>
  );
}

export function DemoBadge({ label = "DEMO" }: { label?: string }) {
  return <Badge tone="demo" size="sm">{label}</Badge>;
}
