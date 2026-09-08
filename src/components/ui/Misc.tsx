"use client";
import { useEffect, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { krw } from "@/lib/format";

/** 용어 설명 — 중학생 가독성. */
export const GLOSSARY: Record<string, string> = {
  SKU: "색상과 사이즈까지 구분한 상품 관리번호",
  옵션: "한 상품의 색상·사이즈 조합 (예: 블랙 M)",
  재고일수: "지금 재고가 며칠 동안 팔릴 수 있는지 (현재고 ÷ 하루 평균 판매량)",
  판매소진율: "들어온 수량 중 팔린 비율 (판매수량 ÷ 판매가능수량)",
  마진: "판매가에서 원가와 할인비용을 뺀 이익",
  전환율: "상품을 본 고객 중 실제로 주문한 비율",
  재구매율: "2회 이상 구매한 고객의 비율",
  "Demand Signal": "조회·찜·장바구니·재입고 신청을 합쳐 계산한 '이 옵션을 원하는 정도'",
  "Fit Risk": "사이즈·핏 때문에 반품될 위험 (사이즈 관련 반품 ÷ 판매수량)",
  Evidence: "어떤 추천이 언제 승인·실행되고 어떤 결과가 났는지 남긴 기록",
  RLS: "사용자마다 볼 수 있는 데이터를 나누는 보안 기능",
  L3: "시스템이 준비하고 사람이 최종 승인하는 자동화 단계",
  L2: "시스템이 추천만 하고 실행은 사람이 하는 단계",
  "AI Ready": "지금은 규칙 기반으로 동작하고, 나중에 AI(LLM)를 연결할 자리",
};

export function Term({ children, term }: { children?: ReactNode; term: string }) {
  const [open, setOpen] = useState(false);
  const desc = GLOSSARY[term];
  return (
    <span className="relative inline-flex items-center gap-0.5">
      {children ?? term}
      {desc && (
        <button type="button" aria-label={`${term} 설명`} onClick={() => setOpen((v) => !v)} onBlur={() => setOpen(false)} className="text-neutral-text2 hover:text-theme-primary inline-flex"><HelpCircle size={14} /></button>
      )}
      {open && desc && <span className="absolute left-0 top-full mt-1 z-40 w-64 rounded-xl bg-brand-black text-white text-[0.82rem] px-3 py-2 shadow-lift leading-snug animate-fadeIn">{desc}</span>}
    </span>
  );
}

export function Price({ price, original, className, size = "md" }: { price: number; original?: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const rate = original && original > price ? Math.round(((original - price) / original) * 100) : 0;
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 flex-wrap", className)}>
      {rate > 0 && <span className={cn("font-bold text-semantic-error", size === "lg" ? "text-[1.15rem]" : "text-[0.95rem]")}>{rate}%</span>}
      <span className={cn("font-bold tabular", size === "lg" ? "text-[1.5rem]" : size === "sm" ? "text-[0.95rem]" : "text-[1.05rem]")}>{krw(price)}</span>
      {rate > 0 && original && <span className="text-neutral-text2 line-through text-[0.82rem] tabular">{krw(original)}</span>}
    </span>
  );
}

export function Progress({ value, className, tone = "primary" }: { value: number; className?: string; tone?: "primary" | "warning" | "error" | "success" }) {
  const colors = { primary: "bg-theme-primary", warning: "bg-semantic-warning", error: "bg-semantic-error", success: "bg-semantic-success" };
  return (
    <div className={cn("h-2 w-full rounded-full bg-neutral-canvas overflow-hidden", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-normal", colors[tone])} style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

export function Freshness({ source = "DEMO", at, className }: { source?: "DEMO" | "LIVE" | "SIMULATION"; at?: string; className?: string }) {
  // Hydration-safe: the timestamp is only rendered after mount (server renders a neutral placeholder).
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => { const d = at ? new Date(at) : new Date(); setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`); }, [at]);
  return (
    <span className={cn("inline-flex items-center gap-2 text-[0.8rem] text-neutral-text2", className)}>
      <span className={cn("rounded-md px-1.5 py-0.5 font-bold text-[0.72rem]", source === "LIVE" ? "bg-[#e6f6ec] text-[#15803d]" : "bg-[#fff7d6] text-[#8a6d00]")}>{source === "DEMO" ? "DEMO DATA" : source}</span>
      <span className="tabular">마지막 업데이트 {time ?? "--:--:--"}</span>
    </span>
  );
}

export function Divider({ className }: { className?: string }) { return <hr className={cn("border-neutral-border", className)} />; }
