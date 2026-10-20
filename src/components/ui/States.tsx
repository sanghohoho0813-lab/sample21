import type { ReactNode } from "react";
import { Inbox, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-cardlg border border-neutral-border bg-white p-5", className)}>
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i % 2 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ n = 8, ratio = "aspect-[3/4]" }: { n?: number; ratio?: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className={cn("w-full rounded-2xl", ratio)} />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  desc,
  action,
  icon,
  className,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-cardlg border border-neutral-border bg-white px-6 py-12 text-center",
        className,
      )}
    >
      {/* 위쪽에서 은은하게 퍼지는 면 — 빈 칸이 아니라 '다음 행동을 기다리는 자리'로 보이게 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(60%_100%_at_50%_0%,var(--neutral-canvas),transparent)]"
      />
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-text shadow-raised ring-[6px] ring-neutral-canvas">
        {icon ?? <Inbox size={22} />}
      </div>
      <p className="relative text-[1.05rem] font-bold">{title}</p>
      {desc && (
        <p className="relative mx-auto mt-1.5 max-w-[30rem] text-[0.92rem] leading-relaxed text-neutral-text2">
          {desc}
        </p>
      )}
      {action && <div className="relative mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "불러오지 못했습니다",
  desc = "잠시 후 다시 시도해주세요.",
  onRetry,
}: {
  title?: string;
  desc?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-cardlg border border-neutral-border bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdecec] text-semantic-error">
        <AlertCircle size={22} />
      </div>
      <p className="text-[1.05rem] font-bold">{title}</p>
      <p className="mt-1 text-[0.92rem] text-neutral-text2">{desc}</p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="outline" onClick={onRetry} icon={<RefreshCw size={16} />}>
            다시 시도
          </Button>
        </div>
      )}
    </div>
  );
}
