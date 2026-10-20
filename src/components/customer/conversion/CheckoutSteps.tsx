/* 주문 단계 표시 — 장바구니 → 주문서 → 주문 완료. 지금 어디쯤인지, 몇 단계 남았는지 */
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = ["장바구니", "주문서", "주문 완료"] as const;

export function CheckoutSteps({ current, className }: { current: 0 | 1 | 2; className?: string }) {
  return (
    <ol className={cn("flex items-center gap-2 text-[0.82rem]", className)} aria-label="주문 단계">
      {STEPS.map((label, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={now ? "step" : undefined}>
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.78rem] font-bold",
                now
                  ? "bg-brand-black text-white"
                  : done
                    ? "bg-brand-black/10 text-brand-black"
                    : "bg-neutral-canvas text-neutral-text2",
              )}
            >
              {done ? <Check size={13} strokeWidth={3} aria-label="완료" /> : i + 1}
            </span>
            <span className={cn("whitespace-nowrap", now ? "font-bold text-neutral-text" : "text-neutral-text2")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-neutral-border sm:w-8" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
