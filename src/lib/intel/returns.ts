/* ------------------------------------------------------------------
   반품 Intelligence — 반품률 숫자 하나가 아니라 '어디에 몰려 있는가'를 찾는다.
   · 특정 상품: 전체 평균보다 반품률이 높은 상품
   · 특정 사이즈: 한 상품 안에서 사이즈 사유 반품이 몰린 사이즈와 방향(작음/큼)
   · 특정 고객군: 세그먼트·비회원별 반품률
   · 핏 프로필: 프로필이 있는 고객과 없는 고객의 사이즈 반품률 차이
   각 발견은 근거 숫자(건수·비율·평균 대비 배수)와 다음 행동을 함께 돌려준다.
------------------------------------------------------------------- */
import type { ActionType, ReturnReason, ReturnRequest, SegmentId } from "../types";
import { CUSTOMER_BY_ID, DEMO_CUSTOMER_ID, PRODUCT_BY_ID, SEGMENT_LABEL, VARIANT_BY_ID } from "../demo/seed";
import { allOrders, allReturns } from "../kpi";
import { safeDiv } from "../format";

type Delta = Parameters<typeof allOrders>[0] &
  Parameters<typeof allReturns>[0] & { fitProfile?: { height: number | null; topSize: string | null } };

export const SIZE_REASONS: ReturnReason[] = ["size-small", "size-large", "fit"];
export const isSizeReturn = (r: ReturnReason) => SIZE_REASONS.includes(r);

/** 패턴으로 볼 최소 표본 — 이보다 적으면 우연일 수 있어 보여주지 않는다 */
export const MIN_SUPPORT = { product: 5, size: 3, group: 5 } as const;

type Group = SegmentId | "guest";
const groupOf = (customerId: string): Group => CUSTOMER_BY_ID[customerId]?.segment ?? "guest";
const hasProfile = (customerId: string, d: Delta) =>
  customerId === DEMO_CUSTOMER_ID
    ? !!(d.fitProfile?.height || d.fitProfile?.topSize)
    : !!CUSTOMER_BY_ID[customerId]?.hasFitProfile;

export interface ReturnFinding {
  id: string;
  kind: "size" | "product" | "segment" | "fit-profile";
  title: string;
  /** 근거 숫자를 담은 한 문장 */
  evidence: string;
  /** 발견된 반품 건수 */
  support: number;
  rate: number;
  baseline: number;
  /** 평균 대비 배수 */
  lift: number;
  productId?: string;
  size?: string;
  direction?: "small" | "large";
  recommendation: string;
  action: ActionType | null;
}

/** 판매 수량 집계(배송완료 주문 기준 — 반품이 생길 수 있는 주문만) */
function emptyUnits() {
  return {
    total: 0,
    byProduct: new Map<string, number>(),
    byGroup: new Map<string, number>(),
    byProfile: { yes: 0, no: 0, guest: 0 },
  };
}

export interface ReturnIntel {
  overallRate: number;
  sizeRate: number;
  totalReturns: number;
  totalUnits: number;
  byReason: { reason: ReturnReason; count: number; share: number }[];
  findings: ReturnFinding[];
  /** 핏 프로필 유무별 사이즈 반품률 — 핏 추천의 근거 */
  profileEffect: {
    withProfile: number;
    withoutProfile: number;
    guest: number;
    unitsWith: number;
    unitsWithout: number;
    unitsGuest: number;
  };
}

export function returnIntel(d: Delta): ReturnIntel {
  const orders = allOrders(d).filter(
    (o) => o.status === "delivered" || o.status === "return-requested" || o.status === "exchange-requested",
  );
  const returns: ReturnRequest[] = allReturns(d).filter((r) => r.status !== "rejected");
  const u = emptyUnits();
  for (const o of orders)
    for (const it of o.items) {
      u.total += it.qty;
      u.byProduct.set(it.productId, (u.byProduct.get(it.productId) ?? 0) + it.qty);
      const g = groupOf(o.customerId);
      u.byGroup.set(g, (u.byGroup.get(g) ?? 0) + it.qty);
      const key =
        CUSTOMER_BY_ID[o.customerId] || o.customerId === DEMO_CUSTOMER_ID
          ? hasProfile(o.customerId, d)
            ? "yes"
            : "no"
          : "guest";
      u.byProfile[key] += it.qty;
    }
  const overallRate = safeDiv(returns.length, Math.max(1, u.total));
  const sizeReturns = returns.filter((r) => isSizeReturn(r.reason));
  const sizeRate = safeDiv(sizeReturns.length, Math.max(1, u.total));

  const reasonCount = new Map<ReturnReason, number>();
  for (const r of returns) reasonCount.set(r.reason, (reasonCount.get(r.reason) ?? 0) + 1);
  const byReason = [...reasonCount.entries()]
    .map(([reason, count]) => ({ reason, count, share: safeDiv(count, returns.length) }))
    .sort((a, b) => b.count - a.count);

  const findings: ReturnFinding[] = [];

  // 1) 상품 — 평균보다 반품률이 높은 상품
  const byProduct = new Map<string, ReturnRequest[]>();
  for (const r of returns) byProduct.set(r.productId, [...(byProduct.get(r.productId) ?? []), r]);
  for (const [productId, rs] of byProduct) {
    const units = u.byProduct.get(productId) ?? 0;
    if (rs.length < MIN_SUPPORT.product || units === 0) continue;
    const rate = safeDiv(rs.length, units);
    const lift = safeDiv(rate, overallRate);
    if (lift < 1.8) continue;
    const sizeShare = safeDiv(rs.filter((r) => isSizeReturn(r.reason)).length, rs.length);
    const p = PRODUCT_BY_ID[productId];
    findings.push({
      id: `product:${productId}`,
      kind: "product",
      title: `${p.name} 반품률 평균의 ${lift.toFixed(1)}배`,
      evidence: `판매 ${units}개 중 ${rs.length}건 반품(${(rate * 100).toFixed(1)}%) · 전체 평균 ${(overallRate * 100).toFixed(1)}% · 사이즈·핏 사유 ${Math.round(sizeShare * 100)}%`,
      support: rs.length,
      rate,
      baseline: overallRate,
      lift,
      productId,
      recommendation:
        sizeShare >= 0.5
          ? "사이즈 사유가 대부분 — 핏 안내·추천 규칙을 먼저 고칩니다."
          : "사유가 흩어져 있음 — 상세 정보(소재·색상 사진)를 점검합니다.",
      action: sizeShare >= 0.5 ? "fit-guide" : null,
    });

    // 2) 사이즈 — 그 상품 안에서 사이즈 사유 반품이 몰린 사이즈
    const sizeRs = rs.filter((r) => isSizeReturn(r.reason));
    if (sizeRs.length >= MIN_SUPPORT.size) {
      const bySize = new Map<string, ReturnRequest[]>();
      for (const r of sizeRs) {
        const v = VARIANT_BY_ID[r.variantId];
        if (v) bySize.set(v.size, [...(bySize.get(v.size) ?? []), r]);
      }
      const small = sizeRs.filter((r) => r.reason === "size-small").length;
      const large = sizeRs.filter((r) => r.reason === "size-large").length;
      const direction: "small" | "large" = small >= large ? "small" : "large";
      const hot = [...bySize.entries()]
        .filter(([, list]) => list.length >= 2)
        .map(([size]) => size)
        .sort((a, b) => p.sizes.indexOf(a) - p.sizes.indexOf(b));
      if (hot.length) {
        const dirShare = safeDiv(direction === "small" ? small : large, sizeRs.length);
        findings.push({
          id: `size:${productId}`,
          kind: "size",
          title: `${p.name} ${hot.join("·")}에서 '${direction === "small" ? "작음" : "큼"}' 반품 집중`,
          evidence: `사이즈 사유 반품 ${sizeRs.length}건 중 ${hot.join("·")} ${hot.reduce((s, sz) => s + (bySize.get(sz)?.length ?? 0), 0)}건 · '${direction === "small" ? "사이즈 작음" : "사이즈 큼"}' ${Math.round(dirShare * 100)}%`,
          support: sizeRs.length,
          rate: safeDiv(sizeRs.length, units),
          baseline: sizeRate,
          lift: safeDiv(safeDiv(sizeRs.length, units), sizeRate),
          productId,
          size: hot.join("·"),
          direction,
          recommendation:
            direction === "small"
              ? `상품 상세에 '평소보다 한 치수 크게'를 명시하고 핏 추천 규칙에 +1 보정을 적용합니다.`
              : `상품 상세에 '평소보다 한 치수 작게'를 명시하고 핏 추천 규칙에 −1 보정을 적용합니다.`,
          action: "fit-guide",
        });
      }
    }
  }

  // 3) 고객군 — 세그먼트·비회원별 반품률
  const byGroup = new Map<Group, number>();
  for (const r of returns) byGroup.set(groupOf(r.customerId), (byGroup.get(groupOf(r.customerId)) ?? 0) + 1);
  for (const [g, count] of byGroup) {
    const units = u.byGroup.get(g) ?? 0;
    if (count < MIN_SUPPORT.group || units === 0) continue;
    const rate = safeDiv(count, units);
    const lift = safeDiv(rate, overallRate);
    if (lift < 1.3) continue;
    const name = g === "guest" ? "비회원(첫 구매)" : SEGMENT_LABEL[g];
    findings.push({
      id: `segment:${g}`,
      kind: "segment",
      title: `${name} 고객의 반품률이 평균의 ${lift.toFixed(1)}배`,
      evidence: `구매 ${units}개 중 ${count}건 반품(${(rate * 100).toFixed(1)}%) · 전체 ${(overallRate * 100).toFixed(1)}%`,
      support: count,
      rate,
      baseline: overallRate,
      lift,
      recommendation:
        g === "guest"
          ? "첫 구매 고객에게 주문 전 핏 프로필(키·몸무게·평소 사이즈) 입력을 유도합니다."
          : "이 고객군에 맞는 사이즈 안내 메시지를 검토합니다.",
      action: g === "post-return-drop" ? "segment-campaign" : null,
    });
  }

  // 4) 핏 프로필 효과 — 핏 추천이 반품을 줄이는가
  const sizeBy = { yes: 0, no: 0, guest: 0 };
  for (const r of sizeReturns) {
    const key =
      CUSTOMER_BY_ID[r.customerId] || r.customerId === DEMO_CUSTOMER_ID
        ? hasProfile(r.customerId, d)
          ? "yes"
          : "no"
        : "guest";
    sizeBy[key]++;
  }
  const profileEffect = {
    withProfile: safeDiv(sizeBy.yes, Math.max(1, u.byProfile.yes)),
    withoutProfile: safeDiv(sizeBy.no, Math.max(1, u.byProfile.no)),
    guest: safeDiv(sizeBy.guest, Math.max(1, u.byProfile.guest)),
    unitsWith: u.byProfile.yes,
    unitsWithout: u.byProfile.no,
    unitsGuest: u.byProfile.guest,
  };
  const withoutAll = safeDiv(sizeBy.no + sizeBy.guest, Math.max(1, u.byProfile.no + u.byProfile.guest));
  if (sizeBy.no + sizeBy.guest >= MIN_SUPPORT.group && profileEffect.withProfile < withoutAll * 0.8) {
    findings.push({
      id: "fit-profile",
      kind: "fit-profile",
      title: "핏 프로필이 있는 고객은 사이즈 반품이 적다",
      evidence: `사이즈 사유 반품률 — 프로필 있음 ${(profileEffect.withProfile * 100).toFixed(1)}% · 프로필 없는 회원 ${(profileEffect.withoutProfile * 100).toFixed(1)}% · 비회원 ${(profileEffect.guest * 100).toFixed(1)}%`,
      support: sizeReturns.length,
      rate: profileEffect.withProfile,
      baseline: withoutAll,
      lift: safeDiv(withoutAll, Math.max(0.0001, profileEffect.withProfile)),
      recommendation:
        "상품 상세·장바구니에서 핏 프로필 입력을 유도하면 사이즈 반품을 줄일 수 있습니다 — 데모 데이터 기준, 실증에서 검증.",
      action: null,
    });
  }

  const order: Record<ReturnFinding["kind"], number> = { size: 0, product: 1, "fit-profile": 2, segment: 3 };
  findings.sort((a, b) => order[a.kind] - order[b.kind] || b.support - a.support);
  return {
    overallRate,
    sizeRate,
    totalReturns: returns.length,
    totalUnits: u.total,
    byReason,
    findings,
    profileEffect,
  };
}

/** 핏 안내 개선의 기대 효과 — 사이즈 사유 반품의 일부가 줄어든다고 가정한다(가정값은 화면에 함께 표시) */
export const FIT_GUIDE_REDUCTION = 0.4;
export function fitGuideImpact(productId: string, d: Delta) {
  const intel = returnIntel(d);
  const units = allOrders(d)
    .filter((o) => o.status === "delivered")
    .flatMap((o) => o.items)
    .filter((it) => it.productId === productId)
    .reduce((s, it) => s + it.qty, 0);
  const sizeRs = allReturns(d).filter((r) => r.productId === productId && isSizeReturn(r.reason)).length;
  const before = safeDiv(sizeRs, Math.max(1, units));
  return {
    units,
    sizeReturns: sizeRs,
    before,
    target: before * (1 - FIT_GUIDE_REDUCTION),
    avoidedPer100: Math.round(before * FIT_GUIDE_REDUCTION * 100 * 10) / 10,
    assumption: `사이즈 사유 반품의 ${Math.round(FIT_GUIDE_REDUCTION * 100)}% 감소 가정 (실증에서 보정)`,
    overallSizeRate: intel.sizeRate,
  };
}
