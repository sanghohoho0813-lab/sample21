"use client";
import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { AI_READY_COPY, AI_STATUS } from "@/lib/ai";
import { Modal } from "@/components/ui/Overlay";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Kind = keyof typeof AI_READY_COPY;

/** AI Ready Marker — 클릭 시 어떤 데이터로/무엇을/왜 설명. 핵심 3~4곳에만 사용. */
export function AIReadyBadge({
  kind,
  className,
  label,
  children,
}: {
  kind: Kind;
  className?: string;
  label?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const c = AI_READY_COPY[kind];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full border border-theme-primary/25 bg-theme-soft px-3 text-[0.82rem] font-bold text-theme-primary transition-all hover:brightness-95 md:h-9",
          className,
        )}
        aria-haspopup="dialog"
      >
        <Sparkles size={14} />
        {label ?? (AI_STATUS === "LIVE" ? "AI 연결됨" : "AI 준비")}
        {children}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="이 기능에는 AI API가 연결될 예정입니다" size="md">
        <div className="space-y-5 text-[0.95rem]">
          <div className="flex items-center gap-2">
            <Badge tone="ready">AI 준비</Badge>
            <span className="font-bold">{c.title}</span>
          </div>
          <div>
            <p className="mb-1.5 font-bold">무엇을 보나요?</p>
            <ul className="list-disc space-y-1 pl-5 text-neutral-text2">
              {c.reads.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-bold">AI가 무엇을 하나요?</p>
            <ul className="list-disc space-y-1 pl-5 text-neutral-text2">
              {c.does.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-bold">왜 필요한가요?</p>
            <p className="leading-relaxed text-neutral-text2">{c.why}</p>
          </div>
          <div className="rounded-xl bg-neutral-canvas p-4 text-[0.88rem] leading-relaxed">
            <p>
              <span className="font-bold">현재 MVP:</span> 규칙 기반 계산 (코드/수식) — 숫자와 근거는 실제로 동작합니다.
            </p>
            <p className="mt-1">
              <span className="font-bold">향후:</span> Claude 등 LLM API를 연결해 자연어 설명·요약을 추가합니다. 계산
              자체를 AI에 맡기지 않습니다.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
