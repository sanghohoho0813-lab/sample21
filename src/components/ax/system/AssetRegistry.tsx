/* [이미지 자산] — 사진은 추후 적용 (Google Drive 「샘플 21. 의류」). ASSET_PACK 파일명 × AVAILABLE 등록 상태. */
import { ImageOff, ImageIcon } from "lucide-react";
import { ASSET_PACK, AVAILABLE } from "@/lib/assets";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const GROUPS: { key: keyof typeof ASSET_PACK; title: string; desc: string }[] = [
  { key: "customer", title: "Customer Front", desc: "히어로 · 에디토리얼 · 카테고리 · 브랜드 · 핏 · 주문" },
  { key: "ax", title: "Business AX", desc: "커버 · MD 업무 · 재고 · 쇼룸 · Evidence · Why AX 3장" },
];

export function AssetRegistry() {
  const total = ASSET_PACK.customer.length + ASSET_PACK.ax.length;
  const registered = [...ASSET_PACK.customer, ...ASSET_PACK.ax].filter((f) => AVAILABLE.includes(f)).length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-neutral-canvas p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="ready">READY</Badge>
          <span className="font-bold">사진은 추후 적용</span>
          <span className="ml-auto text-[0.85rem] text-neutral-text2 tabular">등록 {registered} / {total}</span>
        </div>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-neutral-text2">
          Google Drive 「샘플 21. 의류」 폴더의 자산이 준비되면 아래 파일명 그대로 넣습니다. 그 전까지 모든 이미지 자리는 상품 색상으로 만든 <span className="font-semibold text-neutral-text">Gradient Placeholder</span>가 채우며, 빈 박스는 나오지 않습니다.
        </p>
        <ol className="mt-3 space-y-1.5 text-[0.9rem] list-decimal pl-5">
          <li>Drive에서 파일을 내려받아 <code className="rounded bg-white px-1.5 py-0.5 text-[0.82rem] border border-neutral-border">/public/images/&lt;파일명&gt;</code> 에 저장</li>
          <li><code className="rounded bg-white px-1.5 py-0.5 text-[0.82rem] border border-neutral-border">src/lib/assets.ts</code> 의 <code className="rounded bg-white px-1.5 py-0.5 text-[0.82rem] border border-neutral-border">AVAILABLE</code> 배열에 파일명 추가</li>
          <li>새로고침 — placeholder가 실제 사진으로 자동 교체됩니다 (코드 수정 불필요)</li>
        </ol>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {GROUPS.map((g) => (
          <div key={g.key} className="rounded-2xl border border-neutral-border bg-white p-4">
            <div className="flex items-center justify-between gap-2"><span className="font-bold">{g.title}</span><span className="text-[0.78rem] text-neutral-text2 tabular">{ASSET_PACK[g.key].length}개</span></div>
            <p className="text-[0.8rem] text-neutral-text2">{g.desc}</p>
            <ul className="mt-3 divide-y divide-neutral-border">
              {ASSET_PACK[g.key].map((f) => {
                const ok = AVAILABLE.includes(f);
                return (
                  <li key={f} className="flex items-center gap-2 py-1.5 text-[0.85rem]">
                    <span className={cn("shrink-0", ok ? "text-semantic-success" : "text-neutral-text2/60")}>{ok ? <ImageIcon size={15} /> : <ImageOff size={15} />}</span>
                    <code className="min-w-0 break-anywhere text-[0.82rem]">{f}</code>
                    <Badge tone={ok ? "success" : "neutral"} size="sm" className="ml-auto shrink-0">{ok ? "등록" : "미등록"}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
