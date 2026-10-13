"use client";
/* 핏 추천에 더하는 데이터 — 내 구매·반품 기록(핏 학습)과 이 상품을 산 고객의 반품 신호 */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useApp } from "@/lib/store";
import { DEMO_CUSTOMER_ID } from "@/lib/demo/seed";
import { fitHistory, productReturnSignal } from "@/lib/intel/lifecycle";
import type { FitContext } from "@/lib/engine";

export function useFitContext(productId: string): FitContext {
  const d = useApp(
    useShallow((s) => ({
      orders: s.orders,
      returns: s.returns,
      orderStatusOverride: s.orderStatusOverride,
      restockSubs: s.restockSubs,
      fitProfile: s.fitProfile,
    })),
  );
  const history = useMemo(() => fitHistory(DEMO_CUSTOMER_ID, d), [d]);
  const returnSignal = useMemo(() => productReturnSignal(productId, d), [productId, d]);
  return useMemo(() => ({ history, returnSignal }), [history, returnSignal]);
}
