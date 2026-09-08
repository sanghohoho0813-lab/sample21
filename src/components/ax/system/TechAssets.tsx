/* [기술·사업화 자산] — MORFIT은 가상 회사. 실제 출원·확인된 자산만 표시한다는 원칙(Unified §71, DECISIONS D-12). */
import { Badge } from "@/components/ui/Badge";

const FIELDS: { label: string; desc: string }[] = [
  { label: "특허 · 출원", desc: "출원번호 · 명칭 · 상태(출원/등록)" },
  { label: "벤처 · 이노비즈 확인", desc: "확인기관 · 유효기간" },
  { label: "연구개발 (R&D)", desc: "과제명 · 주관기관 · 기간" },
  { label: "인증 · 수상", desc: "인증명 · 발급기관 · 일자" },
];

export function TechAssets() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-neutral-canvas p-4 md:p-5">
        <div className="flex items-center gap-2 flex-wrap"><Badge tone="neutral">해당없음</Badge><span className="font-bold">Demo 프로젝트</span></div>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-neutral-text2">
          MORFIT은 시연을 위해 만든 <span className="font-semibold text-neutral-text">가상 회사</span>입니다. 이 영역은 실제 출원·확인·인증이 <span className="font-semibold text-neutral-text">완료된 자산만</span> 표시한다는 원칙을 따르며, 확인되지 않은 항목을 있는 것처럼 적지 않습니다. 실제 기업에 적용할 때는 아래 구조에 검증된 자산만 채웁니다.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.label} className="rounded-2xl border border-dashed border-neutral-border bg-white p-4">
            <div className="flex items-center justify-between gap-2"><span className="font-bold">{f.label}</span><Badge tone="neutral" size="sm">해당없음</Badge></div>
            <p className="mt-1 text-[0.82rem] text-neutral-text2">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
