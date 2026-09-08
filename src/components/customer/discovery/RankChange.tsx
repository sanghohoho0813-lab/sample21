import { cn } from "@/lib/cn";

/** ▲ / ▼ / – computed from 7일 판매 velocity (sales7d vs salesPrev7d). */
export function rankChange(velocity: number): { dir: "up" | "down" | "flat"; label: string } {
  if (velocity > 0.15) return { dir: "up", label: `▲ ${Math.round(velocity * 100)}%` };
  if (velocity < -0.15) return { dir: "down", label: `▼ ${Math.abs(Math.round(velocity * 100))}%` };
  return { dir: "flat", label: "– 유지" };
}

export function RankChange({ velocity, className }: { velocity: number; className?: string }) {
  const c = rankChange(velocity);
  return (
    <span
      className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.72rem] font-bold tabular whitespace-nowrap", c.dir === "up" ? "bg-theme-soft text-theme-primary" : c.dir === "down" ? "bg-neutral-canvas text-neutral-text2" : "bg-neutral-canvas text-neutral-text2", className)}
      aria-label={c.dir === "up" ? "순위 상승" : c.dir === "down" ? "순위 하락" : "순위 유지"}
      title="직전 7일 대비 판매 변화"
    >
      {c.label}
    </span>
  );
}
