"use client";
/* Presentation Mode — 16-step Guided Product Demo across Customer ↔ AX.
   Not a slideshow: it navigates the real routes and explains what to click. */
import { create } from "zustand";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { SCENARIO } from "@/lib/demo/seed";

export interface PresentStep { title: string; body: string; route: string; cta?: string }
export const PRESENT_STEPS: PresentStep[] = [
  { title: "MORFIT이 해결하려는 문제", body: "고객의 조회·찜·사이즈·구매·반품이 내부 재고·MD 판단과 끊겨 있어 품절과 과잉재고가 동시에 생깁니다.", route: "/ax/why" },
  { title: "Customer Front 진입", body: "멀티브랜드 탐색 경험. 랭킹·브랜드·스타일로 상품을 발견합니다.", route: "/" },
  { title: "고객이 상품을 탐색", body: "랭킹에서 반응이 빠른 상품을 확인합니다.", route: "/ranking", cta: "랭킹 1위 상품을 눌러보세요" },
  { title: "Fit 추천 확인", body: "핏 프로필을 입력하면 추천 사이즈와 이유·주의점이 나타납니다 (규칙 기반, AI Ready).", route: `/products/${SCENARIO.A_PRODUCT}`, cta: "사이즈 옆 '핏 추천'을 눌러보세요" },
  { title: "품절 옵션 재입고 알림 신청", body: "블랙 M은 재고가 얼마 없습니다. 재입고 알림을 신청하면 Business AX 수요신호가 됩니다.", route: `/products/${SCENARIO.A_PRODUCT}?color=블랙&size=M`, cta: "'재입고 알림' 버튼" },
  { title: "Business AX로 전환", body: "같은 데이터가 내부 운영 화면에서 KPI·Action으로 보입니다.", route: "/ax" },
  { title: "Demand Radar에 고객 Event 반영", body: "옵션 단위 수요신호. 방금 신청한 재입고 알림이 숫자에 더해졌습니다.", route: "/ax/inventory", cta: "옥스포드 셔츠 블랙 M 행 확인" },
  { title: "재입고 Action과 추천이유", body: "판매속도·재고·찜·알림·리드타임을 근거로 추천 수량을 제시합니다.", route: "/ax/actions", cta: "첫 번째 Action 카드 열기" },
  { title: "담당자가 Action 승인·실행", body: "확인 → 실행중 → 완료. 완료되면 재고가 늘고 대기 고객에게 알림이 갑니다.", route: "/ax/actions", cta: "'완료' 버튼" },
  { title: "고객 화면에 재입고 상태 반영", body: "알림 아이콘에 '재입고' 알림이 도착하고, 옵션 상태가 바뀝니다.", route: "/my/restock" },
  { title: "주문 완료", body: "장바구니 → 주문정보 → DEMO 결제예정 → 주문완료.", route: "/cart", cta: "장바구니 담고 주문하기" },
  { title: "내부 주문·재고 반영", body: "주문 목록·매출·재고에 즉시 반영됩니다.", route: "/ax/orders" },
  { title: "주문상태 변경", body: "운영직원이 상품준비 → 출고 → 배송중으로 바꿉니다.", route: "/ax/orders", cta: "주문 행의 상태 버튼" },
  { title: "고객 My Page 반영", body: "고객은 같은 주문의 배송상태를 바로 확인합니다.", route: "/my/orders" },
  { title: "Evidence 확인", body: "추천 → 승인 → 실행 → 결과 → 고객 상태까지 한 줄로 남습니다. 실증의 재료입니다.", route: "/ax/evidence" },
  { title: "Why AX와 확장방향", body: "12개월 뒤 쌓이는 데이터 자산과 다음 단계.", route: "/ax/why" },
];

interface PState { active: boolean; step: number; start: () => void; stop: () => void; next: () => void; prev: () => void; goto: (i: number) => void }
export const usePresentation = create<PState>((set, get) => ({
  active: false, step: 0,
  start: () => set({ active: true, step: 0 }),
  stop: () => set({ active: false }),
  next: () => set({ step: Math.min(PRESENT_STEPS.length - 1, get().step + 1) }),
  prev: () => set({ step: Math.max(0, get().step - 1) }),
  goto: (i) => set({ step: i }),
}));

export function PresentationController() {
  const { active, step, stop, next, prev } = usePresentation();
  const router = useRouter();
  const pathname = usePathname();
  const s = PRESENT_STEPS[step];
  useEffect(() => {
    if (!active) return;
    const target = s.route.split("?")[0];
    if (pathname !== target) router.push(s.route);
  }, [active, step, s.route, pathname, router]);
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); if (e.key === "Escape") stop(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [active, next, prev, stop]);
  if (!active) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(72px+env(safe-area-inset-bottom))] md:bottom-5 z-[85] w-[calc(100%-24px)] max-w-2xl animate-fadeUp no-print">
      <div className="rounded-cardlg bg-brand-black text-white shadow-lift px-4 py-3 md:px-5 md:py-4 flex items-center gap-3">
        <div className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-theme-highlight text-brand-black"><Play size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.72rem] font-bold tracking-wide text-theme-highlight">시연 모드 · {step + 1} / {PRESENT_STEPS.length}</p>
          <p className="font-bold text-[0.95rem] leading-snug truncate">{s.title}</p>
          <p className="text-[0.82rem] text-white/75 leading-snug line-clamp-2">{s.body}{s.cta && <span className="text-theme-highlight"> · 👉 {s.cta}</span>}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={prev} disabled={step === 0} aria-label="이전 단계" className="h-10 w-10 rounded-full hover:bg-white/10 disabled:opacity-30 inline-flex items-center justify-center"><ChevronLeft size={20} /></button>
          <button onClick={next} disabled={step === PRESENT_STEPS.length - 1} aria-label="다음 단계" className="h-10 w-10 rounded-full bg-white text-brand-black hover:scale-105 transition-transform disabled:opacity-30 inline-flex items-center justify-center"><ChevronRight size={20} /></button>
          <button onClick={stop} aria-label="시연 종료" className="h-10 w-10 rounded-full hover:bg-white/10 inline-flex items-center justify-center"><X size={20} /></button>
        </div>
      </div>
    </div>
  );
}
