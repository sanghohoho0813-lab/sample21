"use client";
import { create } from "zustand";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ToastItem { id: string; title: string; body?: string; tone?: "success" | "info" | "warning"; href?: string }
interface ToastState { items: ToastItem[]; push: (t: Omit<ToastItem, "id">) => void; dismiss: (id: string) => void }

export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ items: [...s.items, { ...t, id }].slice(-3) }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export const toast = (title: string, body?: string, tone: ToastItem["tone"] = "success") => useToast.getState().push({ title, body, tone });

export function Toaster() {
  const { items, dismiss } = useToast();
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-6 z-[100] flex flex-col gap-2 w-[calc(100%-32px)] max-w-md pointer-events-none">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto rounded-2xl bg-brand-black text-white shadow-lift px-4 py-3 flex items-start gap-3 animate-fadeUp" role="status">
          {t.tone === "warning" ? <AlertTriangle size={20} className="text-[#f5c451] mt-0.5 shrink-0" /> : t.tone === "info" ? <Info size={20} className="text-[#8fb4ff] mt-0.5 shrink-0" /> : <CheckCircle2 size={20} className="text-[#6ee7a2] mt-0.5 shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[0.95rem] leading-snug">{t.title}</p>
            {t.body && <p className={cn("text-[0.85rem] text-white/75 mt-0.5 leading-snug")}>{t.body}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} aria-label="닫기" className="text-white/60 hover:text-white"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}
