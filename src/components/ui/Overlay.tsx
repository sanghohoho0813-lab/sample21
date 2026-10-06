"use client";
/* Modal / Drawer / BottomSheet with full lifecycle integrity:
   backdrop removal, scroll-lock restore, focus restore, ESC, backdrop click. */
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

let lockCount = 0;
// <html data-overlay-open> — 열린 창이 있는 동안 토스트는 위로 올리고, 화면 위에 떠 있는 보조 버튼(미래AI랩 이동 버튼)은 숨긴다
function lockScroll() { lockCount++; if (lockCount === 1) { document.body.dataset.prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; document.documentElement.dataset.overlayOpen = ""; } }
function unlockScroll() { lockCount = Math.max(0, lockCount - 1); if (lockCount === 0) { document.body.style.overflow = document.body.dataset.prevOverflow ?? ""; delete document.body.dataset.prevOverflow; delete document.documentElement.dataset.overlayOpen; } }

interface BaseProps { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; className?: string; hideClose?: boolean; footer?: ReactNode; z?: number; }

function useOverlayLifecycle(open: boolean, onClose: () => void) {
  const restoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    lockScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      unlockScroll();
      const el = restoreRef.current; if (el && typeof el.focus === "function") setTimeout(() => el.focus(), 0);
    };
  }, [open, onClose]);
}

function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function Modal({ open, onClose, title, children, className, hideClose, footer, z = 60, size = "md" }: BaseProps & { size?: "sm" | "md" | "lg" | "xl" }) {
  useOverlayLifecycle(open, onClose);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <Portal>
      <div className="fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-6" style={{ zIndex: z }} role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-[#0b1830]/55 animate-fadeIn" onClick={onClose} aria-hidden />
        <div className={cn("relative w-full bg-white rounded-t-cardlg md:rounded-cardlg shadow-lift animate-scaleIn max-h-[92vh] md:max-h-[88vh] flex flex-col", widths[size], className)}>
          {(title || !hideClose) && (
            <div className="flex items-center justify-between gap-3 px-5 md:px-6 pt-5 pb-3 border-b border-neutral-border">
              <h3 className="text-[1.1rem] font-bold text-neutral-text">{title}</h3>
              {!hideClose && <button onClick={onClose} aria-label="닫기" className="h-10 w-10 -mr-2 inline-flex items-center justify-center rounded-full hover:bg-neutral-canvas text-neutral-text2"><X size={20} /></button>}
            </div>
          )}
          <div className="px-5 md:px-6 py-4 overflow-y-auto flex-1">{children}</div>
          {footer && <div className="px-5 md:px-6 py-4 border-t border-neutral-border bg-white rounded-b-cardlg safe-bottom">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/** Drawer — 모바일 메뉴 공통. 기본: 화면의 86%, 최대 380px (전체를 덮지 않음).
 *  상단(로고·닫기) / 중단(독립 스크롤, 배경 페이지는 잠김) / 하단(footer 고정) 3단 구조. */
export function Drawer({ open, onClose, title, children, className, side = "right", footer, z = 50, width = "w-[86vw] max-w-[380px]", headerClassName, bodyClassName, footerClassName, closeClassName }: BaseProps & { side?: "left" | "right"; width?: string; headerClassName?: string; bodyClassName?: string; footerClassName?: string; closeClassName?: string }) {
  useOverlayLifecycle(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0" style={{ zIndex: z }} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "메뉴"}>
        <div className="absolute inset-0 bg-[#0b1830]/55 animate-fadeIn" onClick={onClose} aria-hidden />
        <div className={cn("absolute top-0 bottom-0 bg-white shadow-lift flex flex-col", width, side === "right" ? "right-0 animate-slideLeft" : "left-0 animate-slideRight", className)}>
          <div className={cn("flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-neutral-border safe-top", headerClassName)}>
            <div className="min-w-0 text-[1.1rem] font-bold">{title}</div>
            <button onClick={onClose} aria-label="닫기" className={cn("h-11 w-11 -mr-2 shrink-0 inline-flex items-center justify-center rounded-full hover:bg-neutral-canvas text-neutral-text2", closeClassName)}><X size={20} /></button>
          </div>
          <div className={cn("px-5 py-4 overflow-y-auto overscroll-contain flex-1", bodyClassName)}>{children}</div>
          {footer && <div className={cn("px-5 py-4 border-t border-neutral-border safe-bottom", footerClassName)}>{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

export function BottomSheet({ open, onClose, title, children, className, footer, z = 50 }: BaseProps) {
  useOverlayLifecycle(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0" style={{ zIndex: z }} role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-[#0b1830]/55 animate-fadeIn" onClick={onClose} aria-hidden />
        <div className={cn("absolute left-0 right-0 bottom-0 bg-white rounded-t-cardlg shadow-lift animate-slideUp max-h-[88vh] flex flex-col", className)}>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-neutral-border" />
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-3">
            <h3 className="text-[1.05rem] font-bold">{title}</h3>
            <button onClick={onClose} aria-label="닫기" className="h-10 w-10 -mr-2 inline-flex items-center justify-center rounded-full hover:bg-neutral-canvas text-neutral-text2"><X size={20} /></button>
          </div>
          <div className="px-5 pb-4 overflow-y-auto flex-1">{children}</div>
          {footer && <div className="px-5 py-3 border-t border-neutral-border safe-bottom">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/** Responsive: BottomSheet on mobile, Modal on desktop */
export function Responsive({ open, onClose, title, children, footer, size }: BaseProps & { size?: "sm" | "md" | "lg" | "xl" }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  if (isMobile) return <BottomSheet open={open} onClose={onClose} title={title} footer={footer}>{children}</BottomSheet>;
  return <Modal open={open} onClose={onClose} title={title} footer={footer} size={size}>{children}</Modal>;
}
