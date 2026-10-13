/* ------------------------------------------------------------------
   성과 측정 — 과제의 '전'(검토 확정 시점)과 '후'(완료 시점·지금)를 같은 지표로 비교한다.
   데모 안에서 바로 측정되는 것(재고·가격·알림·알림 후 구매·핏 안내)은 숫자로,
   시간이 지나야 알 수 있는 것(할인 후 판매·반품률 변화)은 '측정 예정'과 기대치(가정)를 함께 보여준다.
------------------------------------------------------------------- */
import type { AXAction } from "../types";
import type { AppState } from "../store";
import { PRODUCT_BY_ID, VARIANT_BY_ID } from "../demo/seed";
import { daysOfStock, effPrice, effVariant, effVariants } from "../kpi";
import { fitGuideImpact } from "./returns";

type State = Pick<
  AppState,
  | "viewDelta"
  | "wishlistDelta"
  | "cartDelta"
  | "restockDelta"
  | "inventoryDelta"
  | "returnDelta"
  | "salePriceOverride"
  | "fitNoteOverride"
  | "variantRestockState"
  | "orderStatusOverride"
  | "orders"
  | "returns"
  | "restockSubs"
  | "fitProfile"
  | "notifications"
  | "campaignStatusOverride"
>;

/** 과제 유형별로 비교할 지표의 '지금' 값 */
export function snapshot(a: AXAction, s: State): Record<string, number> {
  if ((a.type === "restock" || a.type === "rebalance") && a.variantId && VARIANT_BY_ID[a.variantId]) {
    const v = effVariant(VARIANT_BY_ID[a.variantId], s);
    const subs = s.restockSubs.filter((r) => r.variantId === a.variantId);
    return {
      stock: v.stock,
      coverDays: daysOfStock(v),
      waiting: subs.filter((r) => r.status === "waiting").length,
      notified: subs.filter((r) => r.notifiedAt).length,
      purchasedAfterNotice: subs.filter((r) => r.status === "purchased" && r.notifiedAt).length,
    };
  }
  if (a.type === "markdown" && a.productId && PRODUCT_BY_ID[a.productId]) {
    const p = PRODUCT_BY_ID[a.productId];
    const vs = effVariants(p.id, s);
    const price = effPrice(p, s);
    return {
      price,
      discountRate: Math.round((1 - price / p.price) * 100),
      stock: vs.reduce((n, v) => n + v.stock, 0),
      marginRate: Math.round(((price - p.cost) / price) * 100),
    };
  }
  if (a.type === "fit-guide" && a.productId && PRODUCT_BY_ID[a.productId]) {
    const imp = fitGuideImpact(a.productId, s);
    return {
      sizeReturnRate: Math.round(imp.before * 1000) / 10,
      sizeReturns: imp.sizeReturns,
      fitNoteUpdated: s.fitNoteOverride[a.productId] ? 1 : 0,
    };
  }
  if (a.type === "segment-campaign")
    return {
      campaignRunning: s.campaignStatusOverride["cp-06"] === "running" ? 1 : 0,
      messages: s.notifications.filter((n) => n.kind === "recommend").length,
    };
  return { messages: s.notifications.filter((n) => n.kind === "recommend").length };
}

export interface CompareRow {
  label: string;
  before: string;
  after: string;
  /** 바로 측정됨 / 시간이 지나야 측정됨 */
  measured: boolean;
  /** 개선 방향인가 */
  better?: boolean;
  note?: string;
}

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

/** 성과 전/후 표 — 기준값이 없으면(아직 검토 전) 비교하지 않는다 */
export function compareRows(a: AXAction, s: State): CompareRow[] | null {
  if (!a.baseline) return null;
  const b = a.baseline.metrics;
  const live = snapshot(a, s);
  // 실행 직후 값(재고·가격)은 완료 시점 기록으로, 실행 뒤에 쌓이는 값(알림 후 구매)은 지금 값으로 본다
  const n = a.result?.metrics ?? live;
  const rows: CompareRow[] = [];
  if (a.type === "restock" || a.type === "rebalance") {
    rows.push({
      label: "재고",
      before: `${b.stock ?? 0}개`,
      after: `${n.stock ?? 0}개`,
      measured: true,
      better: (n.stock ?? 0) > (b.stock ?? 0),
    });
    rows.push({
      label: "남은 판매일",
      before: `${b.coverDays ?? 0}일`,
      after: `${n.coverDays ?? 0}일`,
      measured: true,
      better: (n.coverDays ?? 0) > (b.coverDays ?? 0),
    });
    rows.push({
      label: "재입고 알림 발송",
      before: `${b.notified ?? 0}명`,
      after: `${live.notified ?? 0}명`,
      measured: true,
      better: (live.notified ?? 0) > (b.notified ?? 0),
    });
    rows.push({
      label: "알림 후 구매",
      before: `${b.purchasedAfterNotice ?? 0}건`,
      after: `${live.purchasedAfterNotice ?? 0}건`,
      measured: true,
      better: (live.purchasedAfterNotice ?? 0) > (b.purchasedAfterNotice ?? 0),
      note:
        (live.notified ?? 0) > 0
          ? `완료 후 누적 · 알림 대비 구매 ${Math.round(((live.purchasedAfterNotice ?? 0) / (live.notified ?? 1)) * 100)}%`
          : undefined,
    });
  } else if (a.type === "markdown") {
    rows.push({
      label: "판매가",
      before: won(b.price ?? 0),
      after: won(n.price ?? 0),
      measured: true,
      note: `할인 ${b.discountRate ?? 0}% → ${n.discountRate ?? 0}%`,
    });
    rows.push({
      label: "매출총이익률",
      before: `${b.marginRate ?? 0}%`,
      after: `${n.marginRate ?? 0}%`,
      measured: true,
      better: false,
      note: "할인만큼 줄어듦 — 판매 증가로 만회하는지 측정",
    });
    rows.push({
      label: "판매 속도·재고 소진",
      before: `재고 ${b.stock ?? 0}개`,
      after: a.status === "done" ? "D+7 측정 예정" : "실행 후 측정",
      measured: false,
      note: "할인 적용 7일 후 판매 속도를 직전 7일과 비교",
    });
  } else if (a.type === "fit-guide") {
    rows.push({
      label: "핏 안내",
      before: b.fitNoteUpdated ? "개선됨" : "원본",
      after: n.fitNoteUpdated ? "개선됨" : "원본",
      measured: true,
      better: !!n.fitNoteUpdated && !b.fitNoteUpdated,
    });
    const target = a.productId ? fitGuideImpact(a.productId, s) : null;
    rows.push({
      label: "사이즈 사유 반품률",
      before: `${b.sizeReturnRate ?? 0}%`,
      after: a.status === "done" ? "D+30 측정 예정" : "실행 후 측정",
      measured: false,
      note: target ? `목표 ${(target.target * 100).toFixed(1)}% — ${target.assumption}` : undefined,
    });
  } else {
    rows.push({
      label: "발송 메시지",
      before: `${b.messages ?? 0}건`,
      after: `${n.messages ?? 0}건`,
      measured: true,
      better: (n.messages ?? 0) > (b.messages ?? 0),
    });
    rows.push({
      label: "재구매·회수 매출",
      before: "-",
      after: a.status === "done" ? "D+14 측정 예정" : "실행 후 측정",
      measured: false,
      note: "대상 고객의 구매를 발송 전 같은 기간과 비교",
    });
  }
  return rows;
}
