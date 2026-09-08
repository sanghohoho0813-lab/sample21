"use client";
/* Guided Tutorial — runs on the REAL app screens with spotlight.
   Navigates routes per step, waits for the target element, cleans up fully on exit. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface TourStep { route: string; target: string; title: string; body: string; placement?: "bottom" | "top" | "right" | "left" }

export function Tutorial({ steps, open, onClose, storageFlag }: { steps: TourStep[]; open: boolean; onClose: (done: boolean) => void; storageFlag?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const step = steps[i];

  const clearTarget = useCallback(() => { targetRef.current?.classList.remove("tour-target"); targetRef.current = null; }, []);

  useEffect(() => { if (open) setI(0); }, [open]);

  useEffect(() => {
    if (!open || !step) return;
    if (pathname !== step.route) { router.push(step.route); return; }
    let tries = 0; let raf = 0;
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (el) {
        clearTarget();
        el.classList.add("tour-target");
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        targetRef.current = el;
        setTimeout(() => setRect(el.getBoundingClientRect()), 320);
      } else if (tries++ < 60) raf = window.setTimeout(find, 100);
      else setRect(null);
    };
    find();
    const onResize = () => { if (targetRef.current) setRect(targetRef.current.getBoundingClientRect()); };
    window.addEventListener("resize", onResize); window.addEventListener("scroll", onResize, true);
    return () => { clearTimeout(raf); window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onResize, true); };
  }, [open, step, pathname, router, clearTarget]);

  useLayoutEffect(() => () => clearTarget(), [clearTarget]);
  useEffect(() => { if (!open) { clearTarget(); setRect(null); } }, [open, clearTarget]);

  const finish = (done: boolean) => { clearTarget(); setRect(null); storageFlag?.(); onClose(done); };
  if (!open || !step || typeof document === "undefined") return null;

  const vw = window.innerWidth, vh = window.innerHeight;
  const popW = Math.min(360, vw - 24);
  let top = 0, left = 12;
  if (rect) {
    const below = rect.bottom + 12 + 190 < vh;
    top = below ? rect.bottom + 12 : Math.max(12, rect.top - 12 - 190);
    left = Math.min(Math.max(12, rect.left), vw - popW - 12);
  } else { top = vh / 2 - 90; left = vw / 2 - popW / 2; }

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="튜토리얼">
      {!rect && <div className="absolute inset-0 bg-[#0b1830]/62" onClick={() => finish(false)} aria-hidden />}
      {rect && <div className="absolute inset-0" onClick={() => finish(false)} aria-hidden />}
      <div className={cn("absolute z-[90] rounded-cardlg bg-white shadow-lift p-5 animate-scaleIn")} style={{ top, left, width: popW }}>
        <p className="text-[0.75rem] font-bold tracking-wide text-theme-primary">STEP {i + 1} / {steps.length}</p>
        <h4 className="mt-1 text-[1.1rem] font-bold">{step.title}</h4>
        <p className="mt-1.5 text-[0.9rem] text-neutral-text2 leading-relaxed">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button onClick={() => finish(false)} className="text-[0.85rem] text-neutral-text2 hover:text-neutral-text font-semibold">건너뛰기</button>
          <div className="flex gap-2">
            {i > 0 && <Button size="sm" variant="outline" onClick={() => setI(i - 1)}>이전</Button>}
            {i < steps.length - 1 ? <Button size="sm" onClick={() => setI(i + 1)}>다음</Button> : <Button size="sm" onClick={() => finish(true)}>완료</Button>}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export const AX_TOUR: TourStep[] = [
  { route: "/ax", target: "kpi-row", title: "경영 대시보드", body: "매출·마진·품절위험·재구매를 한눈에 봅니다. KPI를 누르면 상세로 이어집니다." },
  { route: "/ax", target: "ai-briefing", title: "AI 브리핑 (AI Ready)", body: "지금은 규칙 기반으로 우선순위를 요약합니다. LLM을 연결하면 자연어 설명이 붙습니다." },
  { route: "/ax/actions", target: "action-list", title: "Growth & Action Center", body: "고객 행동에서 만들어진 추천을 확인·승인·실행합니다. 완료되면 고객 화면에도 반영됩니다." },
  { route: "/ax/inventory", target: "demand-radar", title: "Demand Radar", body: "조회·찜·장바구니·재입고 신청을 옵션 단위 수요신호로 봅니다. 여기서 재입고 Action이 시작됩니다." },
  { route: "/ax/settings", target: "settings-theme", title: "설정", body: "9개 테마, 글자 크기, 역할 전환, 데모 초기화가 실제로 동작합니다." },
];

export const CUSTOMER_TOUR: TourStep[] = [
  { route: "/", target: "c-hero", title: "MORFIT 시작하기", body: "여러 브랜드를 한곳에서 탐색합니다. 랭킹·브랜드·스타일로 상품을 찾아보세요." },
  { route: "/", target: "c-fit-cta", title: "핏 프로필", body: "키·몸무게·평소 사이즈를 입력하면 상품마다 추천 사이즈와 이유를 보여줍니다." },
  { route: "/ranking", target: "c-ranking", title: "랭킹", body: "판매·조회·찜 기준 랭킹입니다. 상품 카드를 눌러 상세로 이동해보세요." },
];
