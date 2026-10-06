"use client";
/* Modal / Drawer / BottomSheet — 열고 닫는 전 과정을 책임진다.
   - 배경 스크롤 잠금·복원(여러 창이 겹쳐도 마지막 창이 닫힐 때 한 번만 복원)
   - 열리면 창 안으로 포커스 이동, Tab은 창 밖으로 나가지 않음, 닫히면 연 버튼으로 포커스 복귀
   - ESC·브라우저 뒤로는 맨 위 창 하나만 닫음, 배경 클릭으로 닫기
   - role="dialog"는 실제 창(패널)에 두고 제목과 aria-labelledby로 연결 */
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useIsMobile } from "@/components/system/hooks";
import { cn } from "@/lib/cn";

let lockCount = 0;
// <html data-overlay-open> — 열린 창이 있는 동안 토스트는 위로 올리고, 화면 위에 떠 있는 보조 버튼(미래AI랩 이동 버튼)은 숨긴다
function lockScroll() { lockCount++; if (lockCount === 1) { document.body.dataset.prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; document.documentElement.dataset.overlayOpen = ""; } }
function unlockScroll() { lockCount = Math.max(0, lockCount - 1); if (lockCount === 0) { document.body.style.overflow = document.body.dataset.prevOverflow ?? ""; delete document.body.dataset.prevOverflow; delete document.documentElement.dataset.overlayOpen; } }

/** 지금 열려 있는 창들(마지막이 맨 위) — 키 입력은 맨 위 창만 처리한다 */
const openStack: symbol[] = [];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapTab(e: KeyboardEvent, panel: HTMLElement) {
  const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
  if (items.length === 0) { e.preventDefault(); panel.focus(); return; }
  const first = items[0], last = items[items.length - 1], active = document.activeElement;
  if (e.shiftKey && (active === first || active === panel)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (active === last || !panel.contains(active))) { e.preventDefault(); first.focus(); }
}

interface BaseProps { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; className?: string; hideClose?: boolean; footer?: ReactNode; z?: number; }

function useOverlayLifecycle(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement | null>) {
  // onClose가 렌더마다 새 함수여도 효과를 다시 걸지 않는다(다시 걸리면 '포커스 복귀 대상'이 창 안 요소로 바뀌던 문제)
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const id = Symbol("overlay");
    openStack.push(id);
    const isTop = () => openStack[openStack.length - 1] === id;
    const restoreTo = document.activeElement as HTMLElement | null;
    lockScroll();
    const raf = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); }
      else if (e.key === "Tab" && panelRef.current) trapTab(e, panelRef.current);
    };
    const onPop = () => { if (isTop()) closeRef.current(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      cancelAnimationFrame(raf);
      openStack.splice(openStack.indexOf(id), 1);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      unlockScroll();
      if (restoreTo?.isConnected) setTimeout(() => restoreTo.focus({ preventScroll: true }), 0);
    };
  }, [open, panelRef]);
}

function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function Modal({ open, onClose, title, children, className, hideClose, footer, z = 60, size = "md" }: BaseProps & { size?: "sm" | "md" | "lg" | "xl" }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayLifecycle(open, onClose, panelRef);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <Portal>
      <div className="fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-6" style={{ zIndex: z }}>
        <div className="absolute inset-0 bg-[#0b1830]/55 animate-fadeIn" onClick={onClose} aria-hidden />
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} tabIndex={-1} className={cn("relative w-full bg-white rounded-t-cardlg md:rounded-cardlg shadow-lift animate-scaleIn max-h-[92vh] md:max-h-[88vh] flex flex-col outline-none", widths[size], className)}>
          {(title || !hideClose) && (
            <div className="flex items-center justify-between gap-3 px-5 md:px-6 pt-5 pb-3 border-b border-neutral-border">
              <h2 id={titleId} className="text-[1.1rem] font-bold text-neutral-text">{title}</h2>
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
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayLifecycle(open, onClose, panelRef);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0" style={{ zIndex: z }}>
        <div className="absolute inset-0 bg-[#0b1830]/55 animate-fadeIn" onClick={onClose} aria-hidden />
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "메뉴"} tabIndex={-1} className={cn("absolute top-0 bottom-0 bg-white shadow-lift flex flex-col outline-none", width, side === "right" ? "right-0 animate-slideLeft" : "left-0 animate-slideRight", className)}>
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
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayLifecycle(open, onClose, panelRef);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0" style={{ zIndex: z }}>
        <div className="absolute inset-0 bg-[#0b1830]/55 animate-fadeIn" onClick={onClose} aria-hidden />
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} tabIndex={-1} className={cn("absolute left-0 right-0 bottom-0 bg-white rounded-t-cardlg shadow-lift animate-slideUp max-h-[88vh] flex flex-col outline-none", className)}>
          <div aria-hidden className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-neutral-border" />
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-3">
            <h2 id={titleId} className="text-[1.05rem] font-bold">{title}</h2>
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
  const isMobile = useIsMobile();
  if (isMobile) return <BottomSheet open={open} onClose={onClose} title={title} footer={footer}>{children}</BottomSheet>;
  return <Modal open={open} onClose={onClose} title={title} footer={footer} size={size}>{children}</Modal>;
}
