"use client";
/* ------------------------------------------------------------------
   Intelligence 셀렉터 훅 — 같은 상태로 여러 카드가 판독을 요청해도
   한 번만 계산한다(전체 옵션 판독은 수백 SKU라 카드마다 돌리면 낭비).
   판독이 의존하는 상태 조각이 하나라도 바뀌면 다시 계산한다.
------------------------------------------------------------------- */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useApp, type AppState } from "@/lib/store";
import { VARIANTS } from "@/lib/demo/seed";
import { readAll, type SkuReading } from "@/lib/intel/signals";

const pickDelta = (s: AppState) => ({
  viewDelta: s.viewDelta,
  wishlistDelta: s.wishlistDelta,
  cartDelta: s.cartDelta,
  restockDelta: s.restockDelta,
  inventoryDelta: s.inventoryDelta,
  returnDelta: s.returnDelta,
  salePriceOverride: s.salePriceOverride,
  fitNoteOverride: s.fitNoteOverride,
  variantRestockState: s.variantRestockState,
  orderStatusOverride: s.orderStatusOverride,
  orders: s.orders,
  returns: s.returns,
  restockSubs: s.restockSubs,
  fitProfile: s.fitProfile,
  notifications: s.notifications,
  campaignStatusOverride: s.campaignStatusOverride,
});
export type IntelState = ReturnType<typeof pickDelta>;

/** 판독에 필요한 상태 조각만 구독 — 역할·테마 변경 같은 무관한 변화로 다시 그리지 않는다 */
export const useIntelState = (): IntelState => useApp(useShallow(pickDelta));

let cache: { key: unknown[]; value: SkuReading[] } | null = null;
export function readingsOf(d: IntelState): SkuReading[] {
  const key = Object.values(d);
  if (cache && cache.key.length === key.length && cache.key.every((k, i) => k === key[i])) return cache.value;
  const value = readAll(VARIANTS, d);
  cache = { key, value };
  return value;
}

export function useReadings() {
  const d = useIntelState();
  return useMemo(() => readingsOf(d), [d]);
}
