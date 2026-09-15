"use client";
/* [Scale] Unit Economics 측정 설계 — "지금 계산 가능한 것"과 "실증에서 측정할 것"을 나눠 보여준다.
   값을 지어내지 않는다: CAC · LTV · Payback 은 정의와 측정 지점만 두고 VALIDATE LATER 로 둔다 (Unified §22 · MORFIT §26). */
import { useMemo } from "react";
import { Calculator, Lock } from "lucide-react";
import { useApp, type AppState } from "@/lib/store";
import { allOrders, periodOrders, salesKpi } from "@/lib/kpi";
import { BRANDS, BRAND_BY_ID, PRODUCT_BY_ID } from "@/lib/demo/seed";
import { krw, krwShort, num, pct, safeDiv } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Kpi";
import { NoteCard } from "./shared";

/** 30일 주문으로 계산 가능한 단위경제 항목 (DEMO). */
export function unitEconomics(app: AppState) {
  const orders = periodOrders(allOrders(app), "30d");
  const n = orders.length;
  let revenue = 0, subtotal = 0, cost = 0, discount = 0, shipping = 0, freeShip = 0;
  const bySourcing = { purchase: { revenue: 0, margin: 0 }, consignment: { revenue: 0, margin: 0 } };
  for (const o of orders) {
    revenue += o.total; subtotal += o.subtotal; discount += o.discount; shipping += o.shippingFee; if (o.shippingFee === 0) freeShip += 1;
    for (const it of o.items) {
      const p = PRODUCT_BY_ID[it.productId]; const b = BRAND_BY_ID[p.brandId];
      cost += p.cost * it.qty;
      const s = bySourcing[b.sourcing === "purchase" ? "purchase" : "consignment"];
      s.revenue += it.unitPrice * it.qty; s.margin += (it.unitPrice - p.cost) * it.qty;
    }
  }
  const grossMargin = subtotal - cost - discount;
  const consignmentBrands = BRANDS.filter((b) => b.sourcing === "consignment");
  const k90 = salesKpi(app, "90d");
  return {
    orders: n, revenue, grossMargin, aov: safeDiv(revenue, n), cmPerOrder: safeDiv(grossMargin, n), marginRate: safeDiv(grossMargin, Math.max(1, revenue)),
    discountRate: safeDiv(discount, Math.max(1, subtotal)), shippingPerOrder: safeDiv(shipping, n), freeShipRatio: safeDiv(freeShip, n),
    sourcing: {
      purchase: { ...bySourcing.purchase, revenueShare: safeDiv(bySourcing.purchase.revenue, Math.max(1, bySourcing.purchase.revenue + bySourcing.consignment.revenue)), marginRate: safeDiv(bySourcing.purchase.margin, Math.max(1, bySourcing.purchase.revenue)) },
      consignment: { ...bySourcing.consignment, revenueShare: safeDiv(bySourcing.consignment.revenue, Math.max(1, bySourcing.purchase.revenue + bySourcing.consignment.revenue)), marginRate: safeDiv(bySourcing.consignment.margin, Math.max(1, bySourcing.consignment.revenue)), avgCommission: safeDiv(consignmentBrands.reduce((s, b) => s + b.commissionRate, 0), Math.max(1, consignmentBrands.length)) },
    },
    repeat90: k90.repeat,
  };
}
export type UnitEconomics = ReturnType<typeof unitEconomics>;

export interface UeRow { item: string; formula: string; now: string; needs: string; state: "demo" | "partial" | "later" }
export function unitEconomicsRows(u: UnitEconomics, showMargin: boolean): UeRow[] {
  const cm = showMargin ? `주문당 매출총이익 ${krw(u.cmPerOrder)} (판매가 − 원가/정산 − 할인)` : "주문당 매출총이익 (대표 권한)";
  return [
    { item: "주문당 기여이익 (Contribution Margin)", formula: "매출 − 원가/정산 − 할인 − 배송원가 − 결제수수료 − 반품 처리비", now: cm, needs: "택배 계약 단가 · PG 수수료율 · 반품 물류비", state: "partial" },
    { item: "사입 vs 위탁 마진 구조", formula: "브랜드 정산 방식별 매출 비중 · 마진율", now: `사입 매출 ${pct(u.sourcing.purchase.revenueShare, 0)}${showMargin ? ` (마진율 ${pct(u.sourcing.purchase.marginRate, 0)})` : ""} · 위탁 매출 ${pct(u.sourcing.consignment.revenueShare, 0)}${showMargin ? ` (마진율 ${pct(u.sourcing.consignment.marginRate, 0)})` : ""} · 위탁 평균 수수료 ${pct(u.sourcing.consignment.avgCommission, 0)}`, needs: "실제 브랜드 정산서 (월 단위)", state: "demo" },
    { item: "배송비 부담 구조", formula: "5만원 이상 무료배송 비중 · 고객 부담 배송비 / 주문", now: `무료배송 주문 ${pct(u.freeShipRatio, 0)} · 고객 부담 평균 ${krw(u.shippingPerOrder)}`, needs: "실제 택배 원가 → 무료배송 기준 재검토", state: "partial" },
    { item: "CAC (고객 획득 비용)", formula: "기간 마케팅비 ÷ 신규 구매 고객 수", now: "계산 불가 — 마케팅비 데이터 없음", needs: "광고비 원장 + 첫 구매 이벤트(first_purchase) 연결", state: "later" },
    { item: "LTV (고객 생애 가치)", formula: "주문당 CM × 연간 구매 횟수 × 유지 기간", now: `재구매율 ${pct(u.repeat90, 1)} (90일 · DEMO) · 객단가 ${krw(u.aov)} 까지만`, needs: "12개월 코호트 재구매·이탈 실측", state: "later" },
    { item: "Payback (회수 기간)", formula: "CAC ÷ 고객당 월 기여이익", now: "계산 불가 — CAC 필요", needs: "CAC + 월 CM 실측 후 자동 계산", state: "later" },
  ];
}

const STATE_LABEL = { demo: "DEMO 계산", partial: "부분 계산", later: "VALIDATE LATER" } as const;
const STATE_TONE = { demo: "demo", partial: "info", later: "warning" } as const;

export function UnitEconomicsPanel({ showMargin, compact }: { showMargin: boolean; compact?: boolean }) {
  const app = useApp();
  const u = useMemo(() => unitEconomics(app), [app]);
  const rows = useMemo(() => unitEconomicsRows(u, showMargin), [u, showMargin]);
  return (
    <div className="space-y-4" data-tour="unit-economics">
      {!compact && <NoteCard tone="warning" icon={<Calculator size={16} />}><b>Unit Economics는 "측정 설계"까지만.</b> 지금 계산 가능한 항목만 값을 보여주고, CAC·LTV·Payback은 실증(Pilot)에서 마케팅비·코호트 데이터를 연결한 뒤 채웁니다. 값을 추정해 넣지 않습니다.</NoteCard>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="객단가 (30일)" value={krw(u.aov)} sub={`주문 ${num(u.orders)}건`} />
        {showMargin ? <Stat label="주문당 매출총이익" value={krw(u.cmPerOrder)} sub={`마진율 ${pct(u.marginRate, 1)}`} /> : <Stat label="주문당 매출총이익" value={<span className="inline-flex items-center gap-1 text-neutral-text2 text-[1rem]"><Lock size={14} />대표 권한</span>} sub="MD·운영은 비공개" />}
        <Stat label="무료배송 주문 비중" value={pct(u.freeShipRatio, 0)} sub={`고객 부담 평균 ${krw(u.shippingPerOrder)}`} />
        <Stat label="사입 : 위탁 매출" value={`${Math.round(u.sourcing.purchase.revenueShare * 100)} : ${Math.round(u.sourcing.consignment.revenueShare * 100)}`} sub={`위탁 평균 수수료 ${pct(u.sourcing.consignment.avgCommission, 0)} · 30일 매출 ${krwShort(u.revenue)}`} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-border bg-white">
        <table className="w-full text-[0.88rem]">
          <thead><tr className="bg-neutral-canvas text-neutral-text2 text-left"><th className="px-3 py-2.5 font-semibold whitespace-nowrap">항목</th><th className="px-3 py-2.5 font-semibold">정의 (공식)</th><th className="px-3 py-2.5 font-semibold">지금 계산 가능한 부분</th><th className="px-3 py-2.5 font-semibold">실증에서 더 필요한 데이터</th><th className="px-3 py-2.5 font-semibold whitespace-nowrap">상태</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item} className="border-t border-neutral-border align-top">
                <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{r.item}</td>
                <td className="px-3 py-2.5 text-neutral-text2 min-w-[12rem]">{r.formula}</td>
                <td className="px-3 py-2.5 min-w-[14rem]">{r.now}</td>
                <td className="px-3 py-2.5 text-neutral-text2 min-w-[12rem]">{r.needs}</td>
                <td className="px-3 py-2.5"><Badge tone={STATE_TONE[r.state]} size="sm">{STATE_LABEL[r.state]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && <p className="text-[0.82rem] text-neutral-text2 leading-relaxed">돈 KPI 연결 — <b>Cost</b>: 품절 추정손실·저회전 재고원가·반품 처리비 / <b>Revenue</b>: 알림→구매 전환·재구매율·객단가 / <b>Scale</b>: MD 1인당 활성 SKU·관리 브랜드 수. Baseline 측정 후에만 "개선"을 말합니다.</p>}
    </div>
  );
}
