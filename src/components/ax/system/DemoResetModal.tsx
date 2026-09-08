"use client";
/* 데모 초기화 — 설정 · 시연 로비에서 공용. confirm Modal → resetDemo() → toast (+ 이동) */
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/store";
import { Modal } from "@/components/ui/Overlay";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { relTime } from "@/lib/dates";

export const RESET_ITEMS: { label: string; desc: string }[] = [
  { label: "찜", desc: "찜 목록이 기본 2개(Demo)로 돌아갑니다" },
  { label: "장바구니", desc: "담아둔 상품이 비워집니다" },
  { label: "주문", desc: "DEMO 주문과 반품 요청이 삭제됩니다" },
  { label: "Action 상태", desc: "승인·실행·완료 기록이 시드 상태로 돌아갑니다" },
  { label: "알림", desc: "재입고·주문·추천 알림이 초기화됩니다" },
  { label: "재고 변경", desc: "주문·재입고로 바뀐 옵션 재고가 시드 값으로 돌아갑니다" },
  { label: "튜토리얼", desc: "다음 대시보드 방문 시 튜토리얼이 다시 시작됩니다" },
];

export function DemoResetModal({ open, onClose, redirectTo = "/ax" }: { open: boolean; onClose: () => void; redirectTo?: string | null }) {
  const resetDemo = useApp((s) => s.resetDemo);
  const lastResetAt = useApp((s) => s.lastResetAt);
  const router = useRouter();

  const run = () => {
    resetDemo();
    toast("데모가 초기화되었습니다", "찜·장바구니·주문·Action·알림·재고가 시드 값으로 돌아갔습니다.");
    onClose();
    if (redirectTo) router.push(redirectTo);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="데모 초기화"
      size="md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="danger" onClick={run} icon={<RotateCcw size={16} />}>초기화 실행</Button>
        </div>
      }
    >
      <div className="space-y-4 text-[0.95rem]">
        <div className="flex items-start gap-3 rounded-xl bg-neutral-canvas p-4">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-semantic-warning" />
          <p className="leading-relaxed">지금까지 Demo에서 만든 변경 사항이 모두 사라지고 <span className="font-bold">처음 시연 상태</span>로 돌아갑니다. 실제 데이터가 아니므로 안전합니다.</p>
        </div>
        <div>
          <p className="font-bold mb-2">초기화되는 항목</p>
          <ul className="space-y-1.5">
            {RESET_ITEMS.map((it) => (
              <li key={it.label} className="flex items-start gap-2">
                <Badge tone="neutral" size="sm" className="mt-0.5 shrink-0">{it.label}</Badge>
                <span className="text-neutral-text2 text-[0.9rem] leading-snug">{it.desc}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[0.85rem] text-neutral-text2">유지되는 것: 테마 · 글자 크기 · 모션 설정. 역할은 <span className="font-semibold text-neutral-text">대표</span>로 돌아갑니다.{lastResetAt && <> 마지막 초기화 {relTime(lastResetAt)}.</>}</p>
      </div>
    </Modal>
  );
}

/** 버튼 + 모달 한 묶음. 라벨은 항상 "데모 초기화"로 시작한다. */
export function DemoResetButton({ redirectTo = "/ax", children, icon, ...btn }: Omit<ButtonProps, "onClick"> & { redirectTo?: string | null }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button {...btn} onClick={() => setOpen(true)} icon={icon ?? <RotateCcw size={16} />}>{children ?? "데모 초기화"}</Button>
      <DemoResetModal open={open} onClose={close} redirectTo={redirectTo} />
    </>
  );
}
