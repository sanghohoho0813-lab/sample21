"use client";
/* ------------------------------------------------------------------
   Loop 검증 — SKU 하나를 골라 고객 행동이 운영 판단이 되고 다시 고객에게 닫히는지
   단계마다 '지금 데이터'로 판정한다. 체크는 저장된 상태에서 계산하므로 꾸밀 수 없다.
   조회·찜 → 수요 신호 → 후보·과제 → 승인·실행 → 재고 반영 → 재입고 알림 → 구매 → 증빙·성과
------------------------------------------------------------------- */
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, CircleDashed, Workflow } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";
import { PRODUCT_BY_ID, SCENARIO, VARIANT_BY_ID, variantId } from "@/lib/demo/seed";
import { classify, skuSignals, ATTENTION_CODES, PATTERN_META, type PatternCode } from "@/lib/intel/signals";
import { approvalOf } from "@/lib/intel/policy";
import { compareRows } from "@/lib/intel/measure";
import { ACTION_STATUS_LABEL } from "@/components/ax/StatusBadges";
import { Panel } from "./Signals";
import { useIntelState } from "./useIntel";

interface Step {
  label: string;
  ok: boolean;
  value: string;
  detail: string;
  href?: string;
}

export function LoopVerifier() {
  const d = useIntelState();
  const actions = useApp((s) => s.actions);
  const evidence = useApp((s) => s.evidence);
  const events = useApp((s) => s.events);
  const viewDelta = useApp((s) => s.viewDelta);
  const wishlistDelta = useApp((s) => s.wishlistDelta);
  const restockDelta = useApp((s) => s.restockDelta);
  const inventoryDelta = useApp((s) => s.inventoryDelta);

  // 추적 대상: 재입고 과제가 걸린 옵션 + 기본 시나리오(옥스포드 블랙 M · 트러커 인디고 M)
  const targets = useMemo(() => {
    const ids = new Set<string>([SCENARIO.A_VARIANT, variantId(SCENARIO.E_PRODUCT, 0, "M")]);
    for (const a of actions) if (a.type === "restock" && a.variantId) ids.add(a.variantId);
    return [...ids].filter((id) => VARIANT_BY_ID[id]);
  }, [actions]);
  const latestEngine = actions.find((a) => a.origin === "engine" && a.type === "restock" && a.variantId);
  const [picked, setPicked] = useState<string | null>(null);
  const vid = picked ?? latestEngine?.variantId ?? SCENARIO.A_VARIANT;
  const v0 = VARIANT_BY_ID[vid];
  const p = PRODUCT_BY_ID[v0.productId];

  const steps = useMemo<Step[]>(() => {
    const sig = skuSignals(v0, d);
    const pt = classify(sig);
    const action = actions.find(
      (a) => a.variantId === vid && (a.type === "restock" || a.type === "rebalance") && a.status !== "dismissed",
    );
    const ap = action ? approvalOf(action) : null;
    // 과제가 만들어질 때의 판독 — 엔진 과제는 패턴을 기록하고, 시나리오 재입고 과제는 수요 급등에서 출발한다
    const origin =
      (action?.pattern as PatternCode | undefined) ?? (action?.engine === "demand" ? "surge-shortage" : undefined);
    const subs = d.restockSubs.filter((r) => r.variantId === vid);
    const notified = subs.filter((r) => r.notifiedAt).length;
    const purchased = subs.filter((r) => r.status === "purchased" && r.notifiedAt).length;
    const ev = action ? evidence.filter((e) => e.actionId === action.id) : [];
    const rows = action ? compareRows(action, d) : null;
    const sessionViews = events.filter((e) => e.name === "view_product" && e.productId === p.id).length;
    const sessionWish = wishlistDelta[p.id] ?? 0;
    const sessionReq = restockDelta[vid] ?? 0;
    const stockAdded = inventoryDelta[vid] ?? 0;
    return [
      {
        label: "고객 조회·찜·재입고 신청",
        ok: sessionViews + sessionWish + sessionReq > 0 || (viewDelta[p.id] ?? 0) > 0,
        value: `조회 ${sessionViews} · 찜 ${sessionWish > 0 ? `+${sessionWish}` : 0} · 신청 +${sessionReq}`,
        detail: "이번 데모 세션에서 고객 화면이 남긴 행동",
        href: `/products/${p.id}?color=${encodeURIComponent(v0.color)}&size=${v0.size}`,
      },
      {
        label: "수요 신호 판독",
        // 과제를 만든 신호가 실행 뒤 해소됐으면 그것도 통과다 — '해소됨'이 이 Loop의 결과이기 때문
        ok: ATTENTION_CODES.includes(pt.code) || (!!origin && ATTENTION_CODES.includes(origin)),
        value:
          origin && origin !== pt.code && ATTENTION_CODES.includes(origin)
            ? `${PATTERN_META[origin].label} → 지금 ${PATTERN_META[pt.code].label}`
            : PATTERN_META[pt.code].label,
        detail: origin && origin !== pt.code ? `과제 근거: ${action?.trigger ?? ""}` : pt.why,
        href: "/ax/inventory#signals",
      },
      {
        label: "후보 → 과제 등록",
        ok: !!action,
        value: action ? (action.origin === "engine" ? "엔진 후보에서 등록" : "시나리오 과제") : "미등록",
        detail: action ? action.title : "실행 센터의 '신호 엔진이 새로 찾은 후보'에서 등록",
        href: action ? `/ax/actions?open=${action.id}` : "/ax/actions",
      },
      {
        label: "검토·승인·실행",
        ok: !!action && (action.status === "in-progress" || action.status === "done"),
        value: action ? ACTION_STATUS_LABEL[action.status] : "-",
        detail: ap ? `${ap.reason}${ap.approvedBy ? ` · ${ap.approvedBy} 승인` : ""}` : "과제 등록 후 진행",
        href: action ? `/ax/actions?open=${action.id}` : undefined,
      },
      {
        label: "재고 반영",
        ok: stockAdded > 0,
        value: stockAdded > 0 ? `+${stockAdded}개` : "0",
        detail: `현재고 ${sig.variant.stock}개 · 고객 화면 옵션 상태와 같은 값`,
      },
      {
        label: "고객 재입고 알림",
        ok: notified > 0,
        value: `${notified}명 발송`,
        detail: `이번 세션 신청 대기 ${subs.filter((r) => r.status === "waiting").length}명 · 누적 신청 ${sig.variant.restockRequests}건 중 시드 분은 집계값(알림 대상 아님)`,
        href: "/my/restock",
      },
      {
        label: "알림 후 구매",
        ok: purchased > 0,
        value: `${purchased}건`,
        detail: notified ? `알림 대비 ${Math.round((purchased / notified) * 100)}%` : "알림 발송 후 측정",
      },
      {
        label: "증빙 · 성과 전/후",
        ok: ev.some((e) => e.type === "RESULT") && !!rows,
        value: `증빙 ${ev.length}건`,
        detail: rows
          ? rows
              .filter((r) => r.measured)
              .map((r) => `${r.label} ${r.before}→${r.after}`)
              .join(" · ")
          : "검토 확정 시 기준값 기록",
        href: action ? `/ax/evidence?actionId=${action.id}` : undefined,
      },
    ];
  }, [v0, d, actions, vid, evidence, events, p.id, wishlistDelta, restockDelta, inventoryDelta, viewDelta]);

  const passed = steps.filter((s) => s.ok).length;
  return (
    <Panel
      tour="loop-verifier"
      className="mb-6"
      title={
        <span className="inline-flex items-center gap-1.5">
          <Workflow size={15} className="text-theme-primary" aria-hidden />
          순환 검증 — SKU 한 개를 끝까지 따라가기
        </span>
      }
      sub="단계마다 저장된 상태로 판정 · 고객 화면과 운영 화면이 같은 데이터를 본다는 증거"
      right={
        <label className="flex items-center gap-2 text-[0.78rem]">
          <span className="text-neutral-text2">추적 옵션</span>
          <select
            className="h-11 max-w-[15rem] rounded-lg border border-neutral-border bg-white px-2 text-[0.82rem] md:h-8"
            value={vid}
            onChange={(e) => setPicked(e.target.value)}
          >
            {targets.map((id) => {
              const v = VARIANT_BY_ID[id];
              return (
                <option key={id} value={id}>
                  {PRODUCT_BY_ID[v.productId].name} · {v.color} · {v.size}
                </option>
              );
            })}
          </select>
        </label>
      }
    >
      <div className="flex items-center gap-3 border-b border-neutral-border px-4 py-2 text-[0.82rem]">
        <b className="tabular">
          {passed}/{steps.length} 단계 통과
        </b>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-canvas" aria-hidden>
          <span
            className="block h-full rounded-full bg-theme-primary"
            style={{ width: `${(passed / steps.length) * 100}%` }}
          />
        </span>
        <span className="text-neutral-text2">
          {p.name} · {v0.color} · {v0.size}
        </span>
      </div>
      <ol className="grid sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((s, i) => {
          const body = (
            <>
              <p className="flex items-center gap-1.5 text-[0.74rem] font-semibold text-neutral-text2">
                {s.ok ? (
                  <Check size={13} className="text-semantic-success" aria-label="통과" />
                ) : (
                  <CircleDashed size={13} aria-label="대기" />
                )}
                {i + 1}. {s.label}
              </p>
              <p className={cn("mt-0.5 text-[0.9rem] font-bold", s.ok ? "text-neutral-text" : "text-neutral-text2")}>
                {s.value}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[0.74rem] leading-snug text-neutral-text2">{s.detail}</p>
            </>
          );
          return (
            <li
              key={s.label}
              className={cn("min-w-0 border-b border-neutral-border sm:border-r", s.ok ? "bg-[#f3fbf6]" : "bg-white")}
              data-loop-step={i + 1}
              data-ok={s.ok}
            >
              {s.href ? (
                <Link href={s.href} className="block h-full px-4 py-3 hover:bg-neutral-canvas/60">
                  {body}
                </Link>
              ) : (
                <div className="px-4 py-3">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
