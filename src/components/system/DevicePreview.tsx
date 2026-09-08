"use client";
/* DEVICE PREVIEW SAFETY CONTRACT — P0
   - Desktop shows only "스마트폰 보기"; Mobile shows only "PC 보기".
   - Preview is a true-viewport iframe of the SAME route (same data/state via localStorage).
   - Inside the iframe (window.self !== window.top) the trigger is hidden → no recursion.
   - Escape: X / backdrop / ESC. Scroll lock and focus are restored by Overlay lifecycle. */
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Monitor, Smartphone, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useIsMobile, useIsPreviewFrame } from "./hooks";
import { cn } from "@/lib/cn";

export function DevicePreviewButton({ className, light, label }: { className?: string; light?: boolean; label?: boolean }) {
  const inFrame = useIsPreviewFrame();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  if (inFrame) return null;
  const Icon = isMobile ? Monitor : Smartphone;
  const text = isMobile ? "PC 보기" : "스마트폰 보기";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} data-tour="device-preview" aria-label={text} title={text}
        className={cn("inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-[0.85rem] font-semibold transition-colors duration-fast whitespace-nowrap", light ? "text-white/90 hover:bg-white/10" : "text-neutral-text hover:bg-neutral-canvas border border-neutral-border bg-white", className)}>
        <Icon size={18} />{label !== false && <span className="hidden 2xl:inline">{text}</span>}
      </button>
      {open && <PreviewFrame mode={isMobile ? "desktop" : "mobile"} onClose={() => setOpen(false)} />}
    </>
  );
}

function PreviewFrame({ mode, onClose }: { mode: "mobile" | "desktop"; onClose: () => void }) {
  const pathname = usePathname();
  const [scale, setScale] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const fit = () => {
      if (mode === "desktop") setScale(Math.min(1, (window.innerWidth - 24) / 1280, (window.innerHeight - 120) / 820));
      else setScale(Math.min(1, (window.innerHeight - 110) / 844));
    };
    fit(); window.addEventListener("resize", fit);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); window.removeEventListener("resize", fit); };
  }, [mode, onClose]);
  const w = mode === "mobile" ? 390 : 1280, h = mode === "mobile" ? 844 : 820;
  const src = `${pathname}${pathname.includes("?") ? "&" : "?"}preview=1`;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#0b1830]/80 animate-fadeIn" role="dialog" aria-modal="true" aria-label={mode === "mobile" ? "스마트폰 미리보기" : "PC 미리보기"}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex items-center gap-3 mb-3 text-white">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 h-10 text-[0.9rem] font-semibold">{mode === "mobile" ? <Smartphone size={16} /> : <Monitor size={16} />}{mode === "mobile" ? "스마트폰 390px 실제 화면" : "PC 1280px 실제 화면"} · 같은 화면·같은 데이터</span>
        <button onClick={onClose} aria-label="미리보기 닫기" className="h-10 w-10 rounded-full bg-white text-brand-black inline-flex items-center justify-center hover:scale-105 transition-transform"><X size={20} /></button>
      </div>
      <div ref={wrapRef} className="relative z-10" style={{ width: w * scale, height: h * scale }}>
        <div className={cn("origin-top-left overflow-hidden bg-white shadow-lift", mode === "mobile" ? "rounded-[40px] border-[10px] border-[#1a1d24]" : "rounded-2xl border-[6px] border-[#1a1d24]")} style={{ width: w, height: h, transform: `scale(${scale})` }}>
          <iframe title="device-preview" src={src} className="h-full w-full bg-white" style={{ width: mode === "mobile" ? w - 20 : w - 12, height: mode === "mobile" ? h - 20 : h - 12 }} />
        </div>
      </div>
      <p className="relative z-10 mt-3 text-white/70 text-[0.8rem]">ESC 또는 바깥을 눌러 닫기</p>
    </div>,
    document.body,
  );
}
