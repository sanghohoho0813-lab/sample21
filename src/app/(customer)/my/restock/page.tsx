"use client";
import { useApp } from "@/lib/store";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle } from "@/components/customer/Section";
import { SkeletonCard } from "@/components/ui/States";
import { RestockList } from "@/components/customer/conversion/MyBits";
import { LoopHint } from "@/components/customer/LoopHint";

function RestockContent() {
  const store = useApp();
  const waiting = store.restockSubs.filter((s) => s.status === "waiting").length;
  const notified = store.restockSubs.filter((s) => s.status === "notified").length;
  const purchased = store.restockSubs.filter((s) => s.status === "purchased").length;
  return (
    <div className="space-y-5">
      {/* 상태 요약 — 한 줄 칩. 문구 형식('구매 완료 1')은 여정 테스트가 확인한다 */}
      <ul className="tabular flex flex-wrap gap-2 text-[0.88rem]" aria-label="재입고 알림 현황">
        {[
          { label: "전체", n: store.restockSubs.length, tone: "" },
          { label: "대기", n: waiting, tone: "" },
          { label: "알림 도착", n: notified, tone: "text-semantic-success" },
          { label: "구매 완료", n: purchased, tone: "" },
        ].map((x) => (
          <li
            key={x.label}
            className="rounded-full border border-neutral-border bg-white px-3.5 py-1.5 text-neutral-text2"
          >
            {x.label} <b className={x.tone || "text-neutral-text"}>{x.n}</b>
          </li>
        ))}
      </ul>
      <LoopHint href="/ax/inventory">신청하면 AX 수요 레이더에 옵션별 수요로 바로 반영됩니다</LoopHint>
      <div data-tour="c-restock-list">
        <RestockList />
      </div>
    </div>
  );
}

export default function RestockPage() {
  return (
    <Container className="max-w-[960px] py-6 md:py-10">
      <PageTitle title="재입고 알림" desc="품절된 색상·사이즈가 입고되면 알려드리고, 바로 구매할 수 있게 열어드려요." />
      <Hydrated
        fallback={
          <div className="space-y-3">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={3} />
          </div>
        }
      >
        <RestockContent />
      </Hydrated>
    </Container>
  );
}
