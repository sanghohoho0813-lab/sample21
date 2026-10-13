/* ------------------------------------------------------------------
   고객 Lifecycle · 핏 학습 — 고객 한 명의 행동이 Profile로 쌓인다.
   첫 구매 → 핏 학습(유지한 사이즈·사이즈 반품) → 재구매 → 찜·재입고 대기 → 반품 성향
   · 같은 계산을 AX(고객 상세)와 고객 화면(My·핏 추천)이 함께 쓴다.
   · 학습 규칙은 단순하고 설명 가능해야 한다: "지난번 M을 '작음'으로 반품 → 이번엔 L".
------------------------------------------------------------------- */
import type { CategoryId, Order, ReturnRequest } from "../types";
import { CUSTOMER_BY_ID, DEMO_CUSTOMER_ID, PRODUCT_BY_ID, VARIANT_BY_ID } from "../demo/seed";
import { allOrders, allReturns } from "../kpi";
import { daysBetween } from "../dates";
import { safeDiv } from "../format";
import { isSizeReturn } from "./returns";

type Delta = Parameters<typeof allOrders>[0] &
  Parameters<typeof allReturns>[0] & {
    restockSubs: { variantId: string; status: string; notifiedAt?: string; createdAt: string }[];
    fitProfile: { height: number | null; topSize: string | null; bottomSize: string | null; updatedAt?: string | null };
  };

export type FitGroup = "top" | "bottom";
export const FIT_GROUP_LABEL: Record<FitGroup, string> = { top: "상의·아우터", bottom: "하의" };
const SIZE_LADDER = ["XS", "S", "M", "L", "XL"];

export const fitGroupOf = (c: CategoryId): FitGroup | null =>
  c === "bottom" || c === "dress" ? "bottom" : c === "top" || c === "outer" ? "top" : null;

export interface FitLearning {
  group: FitGroup;
  /** 다음 구매에 쓸 사이즈 */
  size: string;
  /** 근거 — 최근 것부터 */
  evidence: string[];
  /** 유지한 구매 수 · 사이즈 사유 반품 수 */
  kept: number;
  sizeReturns: number;
  /** 사이즈 반품에서 배운 보정이 있는가 */
  corrected: boolean;
}

interface ItemRecord {
  at: string;
  productName: string;
  group: FitGroup;
  size: string;
  ret?: ReturnRequest;
}

const shift = (size: string, by: number) => {
  const i = SIZE_LADDER.indexOf(size);
  return i < 0 ? size : SIZE_LADDER[Math.max(0, Math.min(SIZE_LADDER.length - 1, i + by))];
};

function customerOrders(customerId: string, d: Delta): Order[] {
  return allOrders(d)
    .filter((o) => o.customerId === customerId && o.status !== "cancelled")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

/** 내 구매·반품 기록에서 그룹별 사이즈를 배운다 — 최근 기록이 이긴다 */
export function fitHistory(customerId: string, d: Delta): FitLearning[] {
  const returns = allReturns(d).filter((r) => r.customerId === customerId && r.status !== "rejected");
  const items: ItemRecord[] = [];
  for (const o of customerOrders(customerId, d)) {
    if (o.status === "pending" || o.status === "preparing") continue; // 받아보기 전에는 학습하지 않는다
    for (const it of o.items) {
      const p = PRODUCT_BY_ID[it.productId];
      const v = VARIANT_BY_ID[it.variantId];
      const group = p && fitGroupOf(p.categoryId);
      if (!p || !v || !group || !SIZE_LADDER.includes(v.size)) continue;
      const ret = returns.find((r) => r.orderId === o.id && r.variantId === it.variantId);
      items.push({ at: o.createdAt, productName: p.name, group, size: v.size, ret });
    }
  }
  const out: FitLearning[] = [];
  for (const group of ["top", "bottom"] as FitGroup[]) {
    const list = items.filter((x) => x.group === group);
    if (!list.length) continue;
    let size: string | null = null;
    let corrected = false;
    const evidence: string[] = [];
    // 오래된 것부터 적용 → 최근 기록이 최종 결정
    for (const x of list) {
      if (x.ret && isSizeReturn(x.ret.reason)) {
        if (x.ret.reason === "size-small") {
          size = shift(x.size, 1);
          corrected = true;
          evidence.push(`${x.productName} ${x.size}을 '사이즈 작음'으로 반품 → 한 치수 크게(${size})`);
        } else if (x.ret.reason === "size-large") {
          size = shift(x.size, -1);
          corrected = true;
          evidence.push(`${x.productName} ${x.size}을 '사이즈 큼'으로 반품 → 한 치수 작게(${size})`);
        } else evidence.push(`${x.productName} ${x.size} '핏 불만족' 반품 — 실측 비교 권장`);
      } else if (!x.ret) {
        size = x.size;
        corrected = false;
        evidence.push(`${x.productName} ${x.size} 구매 후 유지`);
      }
    }
    if (!size) continue;
    out.push({
      group,
      size,
      evidence: evidence.reverse(),
      kept: list.filter((x) => !x.ret).length,
      sizeReturns: list.filter((x) => x.ret && isSizeReturn(x.ret.reason)).length,
      corrected,
    });
  }
  return out;
}

/* ------------------------------ Lifecycle ------------------------------ */
export type StageKey = "first" | "fit" | "repeat" | "intent" | "returns";
export interface Stage {
  key: StageKey;
  label: string;
  reached: boolean;
  at?: string;
  detail: string;
}
export interface LifeEvent {
  at: string;
  kind: "order" | "return" | "restock" | "notice" | "fit";
  title: string;
  detail?: string;
}
export interface Lifecycle {
  stages: Stage[];
  events: LifeEvent[];
  fit: FitLearning[];
  metrics: {
    orders: number;
    units: number;
    returns: number;
    sizeReturns: number;
    returnRate: number;
    avgGapDays: number | null;
    daysSince: number | null;
    restockWaiting: number;
    noticeToPurchase: number;
  };
  next: { label: string; reason: string };
}

export function customerLifecycle(customerId: string, d: Delta, now = new Date()): Lifecycle {
  const c = CUSTOMER_BY_ID[customerId];
  const isMe = customerId === DEMO_CUSTOMER_ID;
  const orders = customerOrders(customerId, d);
  const returns = allReturns(d)
    .filter((r) => r.customerId === customerId && r.status !== "rejected")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const subs = isMe ? d.restockSubs : [];
  const fit = fitHistory(customerId, d);
  const units = orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0);
  const sizeReturns = returns.filter((r) => isSizeReturn(r.reason)).length;
  const gaps = orders.slice(1).map((o, i) => daysBetween(orders[i].createdAt, new Date(o.createdAt)));
  const avgGapDays = gaps.length
    ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length)
    : (c?.avgCycleDays ?? null);
  const last = orders.at(-1);
  const daysSince = last ? daysBetween(last.createdAt, now) : null;
  const waiting = subs.filter((s) => s.status === "waiting").length;
  const notified = subs.filter((s) => s.notifiedAt).length;
  const purchasedAfter = subs.filter((s) => s.status === "purchased" && s.notifiedAt).length;
  const hasProfile = isMe
    ? !!(d.fitProfile.height || d.fitProfile.topSize || d.fitProfile.bottomSize)
    : !!c?.hasFitProfile;

  const events: LifeEvent[] = [];
  for (const o of orders) {
    const names = o.items.map((i) => {
      const v = VARIANT_BY_ID[i.variantId];
      return `${PRODUCT_BY_ID[i.productId]?.name ?? i.productId}${v ? ` ${v.color}/${v.size}` : ""}`;
    });
    events.push({ at: o.createdAt, kind: "order", title: `주문 ${o.id}`, detail: names.join(", ") });
  }
  for (const r of returns) {
    const v = VARIANT_BY_ID[r.variantId];
    events.push({
      at: r.createdAt,
      kind: "return",
      title: `반품 요청 · ${isSizeReturn(r.reason) ? "사이즈·핏" : "기타"} 사유`,
      detail: `${PRODUCT_BY_ID[r.productId]?.name ?? r.productId}${v ? ` ${v.size}` : ""}`,
    });
  }
  for (const s of subs) {
    const v = VARIANT_BY_ID[s.variantId];
    const name = v ? `${PRODUCT_BY_ID[v.productId]?.name} ${v.color}/${v.size}` : s.variantId;
    events.push({ at: s.createdAt, kind: "restock", title: "재입고 알림 신청", detail: name });
    if (s.notifiedAt)
      events.push({
        at: s.notifiedAt,
        kind: "notice",
        title: s.status === "purchased" ? "재입고 알림 → 구매" : "재입고 알림 받음",
        detail: name,
      });
  }
  if (isMe && d.fitProfile.updatedAt && hasProfile)
    events.push({ at: d.fitProfile.updatedAt, kind: "fit", title: "핏 프로필 저장" });
  events.sort((a, b) => (a.at < b.at ? 1 : -1));

  const stages: Stage[] = [
    {
      key: "first",
      label: "첫 구매",
      reached: orders.length > 0,
      at: orders[0]?.createdAt,
      detail: orders.length ? `${PRODUCT_BY_ID[orders[0].items[0].productId]?.name ?? ""}` : "구매 전",
    },
    {
      key: "fit",
      label: "핏 학습",
      reached: fit.length > 0 || hasProfile,
      detail: fit.length
        ? fit.map((f) => `${FIT_GROUP_LABEL[f.group]} ${f.size}${f.corrected ? "(반품에서 보정)" : ""}`).join(" · ")
        : hasProfile
          ? "핏 프로필 입력"
          : "기록 없음",
    },
    {
      key: "repeat",
      label: "재구매",
      reached: orders.length >= 2,
      at: orders[1]?.createdAt,
      detail: orders.length >= 2 ? `${orders.length}회 · 평균 ${avgGapDays ?? "-"}일 주기` : "아직 1회 이하",
    },
    {
      key: "intent",
      label: "찜·재입고 대기",
      reached: waiting > 0 || notified > 0 || (c?.wishlistCount ?? 0) > 0,
      detail: isMe
        ? `재입고 대기 ${waiting} · 알림 후 구매 ${purchasedAfter}`
        : `찜 ${c?.wishlistCount ?? 0} · 재입고 대기 ${c?.restockWaiting ?? 0}`,
    },
    {
      key: "returns",
      label: "반품 행동",
      reached: returns.length > 0,
      at: returns.at(-1)?.createdAt,
      detail: returns.length ? `반품 ${returns.length}건 · 사이즈 사유 ${sizeReturns}건` : "반품 없음",
    },
  ];

  // 다음 행동 — 가장 최근의 막힌 지점부터
  let next: Lifecycle["next"];
  if (!orders.length)
    next = { label: "첫 구매 유도", reason: "구매 기록이 없습니다 — 핏 프로필 입력과 첫 구매 혜택을 안내합니다." };
  else if (sizeReturns > 0 && !hasProfile)
    next = {
      label: "핏 프로필 입력 유도",
      reason: "사이즈 사유 반품이 있는데 핏 프로필이 없습니다 — 다음 구매 전에 추천 사이즈를 보여줍니다.",
    };
  else if (waiting > 0)
    next = {
      label: "재입고 알림 대기 관리",
      reason: `재입고를 기다리는 옵션 ${waiting}개 — 입고되면 알림이 자동 발송됩니다.`,
    };
  else if (avgGapDays && daysSince !== null && daysSince >= avgGapDays)
    next = {
      label: "재구매 추천",
      reason: `평균 ${avgGapDays}일 주기인데 마지막 구매 후 ${daysSince}일 — 선호 브랜드 신상품을 추천합니다.`,
    };
  else next = { label: "관계 유지", reason: "특별한 신호가 없습니다 — 일반 추천만 유지합니다." };

  return {
    stages,
    events,
    fit,
    metrics: {
      orders: orders.length,
      units,
      returns: returns.length,
      sizeReturns,
      returnRate: safeDiv(returns.length, Math.max(1, units)),
      avgGapDays,
      daysSince,
      restockWaiting: waiting,
      noticeToPurchase: safeDiv(purchasedAfter, Math.max(1, notified)),
    },
    next,
  };
}

/* ------------------------------ 상품 반품 신호 (핏 추천 근거) ------------------------------ */
export interface ProductReturnSignal {
  direction: "small" | "large";
  /** 이 상품의 사이즈 사유 반품률 */
  rate: number;
  /** 전체 평균 대비 */
  lift: number;
  count: number;
}

/** 상품의 사이즈 반품이 평균보다 뚜렷하게 한쪽(작음/큼)으로 몰렸을 때만 신호로 쓴다 */
export function productReturnSignal(
  productId: string,
  d: Parameters<typeof allOrders>[0] & Parameters<typeof allReturns>[0],
): ProductReturnSignal | null {
  const delivered = allOrders(d).filter(
    (o) => o.status === "delivered" || o.status === "return-requested" || o.status === "exchange-requested",
  );
  let units = 0;
  let all = 0;
  for (const o of delivered)
    for (const it of o.items) {
      all += it.qty;
      if (it.productId === productId) units += it.qty;
    }
  const rs = allReturns(d).filter((r) => r.status !== "rejected" && isSizeReturn(r.reason));
  const mine = rs.filter((r) => r.productId === productId);
  if (mine.length < 3 || units === 0) return null;
  const small = mine.filter((r) => r.reason === "size-small").length;
  const large = mine.filter((r) => r.reason === "size-large").length;
  if (Math.max(small, large) < mine.length * 0.6) return null;
  const rate = mine.length / units;
  const lift = rate / Math.max(0.0001, rs.length / Math.max(1, all));
  if (lift < 1.8) return null;
  return { direction: small >= large ? "small" : "large", rate, lift, count: mine.length };
}
