"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { create } from "zustand";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ToastItem { id: string; title: string; body?: string; tone?: "success" | "info" | "warning"; href?: string }
interface ToastState { items: ToastItem[]; push: (t: Omit<ToastItem, "id">) => void; dismiss: (id: string) => void }

export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    // 같은 문구가 연달아 오면 하나만, 동시에 최대 2개(모바일은 CSS로 마지막 1개만)
    set((s) => ({ items: [...s.items.filter((i) => i.title !== t.title), { ...t, id }].slice(-2) }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3000);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export const toast = (title: string, body?: string, tone: ToastItem["tone"] = "success") => useToast.getState().push({ title, body, tone });

/* 위치: 창(모달·시트)이 열려 있으면 화면 위쪽, 하단 고정 버튼(구매·주문 바)이 있으면 그 바로 위 — 버튼을 가리지 않게 */
function useToastPosition(lastId: string | undefined): CSSProperties | undefined {
  const [pos, setPos] = useState<CSSProperties>();
  useEffect(() => {
    if (!lastId) return;
    // 한 프레임 뒤에 잰다 — '담기'처럼 토스트와 동시에 시트가 닫히는 경우, 닫힌 뒤의 화면 기준으로 자리 잡게
    const id = requestAnimationFrame(() => {
      if (document.documentElement.hasAttribute("data-overlay-open")) { setPos({ top: "calc(env(safe-area-inset-top) + 16px)", bottom: "auto" }); return; }
      const tops = Array.from(document.querySelectorAll<HTMLElement>("[data-buy-bar],[data-checkout-bar]")).map((el) => el.getBoundingClientRect()).filter((r) => r.height > 0 && r.top < window.innerHeight).map((r) => r.top);
      setPos(tops.length ? { bottom: window.innerHeight - Math.min(...tops) + 8 } : undefined);
    });
    return () => cancelAnimationFrame(id);
  }, [lastId]);
  return pos;
}

export function Toaster() {
  const { items, dismiss } = useToast();
  const pos = useToastPosition(items[items.length - 1]?.id);
  return (
    <div data-toaster style={pos} className="fixed left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-32px)] max-w-md pointer-events-none max-md:[&>*:not(:last-child)]:hidden">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto rounded-2xl bg-brand-black text-white shadow-lift px-4 py-3 flex items-start gap-3 animate-fadeUp" role="status">
          {t.tone === "warning" ? <AlertTriangle size={20} className="text-[#f5c451] mt-0.5 shrink-0" /> : t.tone === "info" ? <Info size={20} className="text-[#8fb4ff] mt-0.5 shrink-0" /> : <CheckCircle2 size={20} className="text-[#6ee7a2] mt-0.5 shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[0.95rem] leading-snug">{t.title}</p>
            {t.body && <p className={cn("text-[0.85rem] text-white/75 mt-0.5 leading-snug")}>{t.body}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} aria-label="알림 닫기" className="-my-2 -mr-2 h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full text-white/60 hover:text-white"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}
