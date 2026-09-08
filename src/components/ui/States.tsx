import type { ReactNode } from "react";
import { Inbox, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-cardlg border border-neutral-border bg-white p-5 space-y-3", className)}>
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={cn("h-4", i % 2 ? "w-2/3" : "w-full")} />)}
    </div>
  );
}

export function SkeletonGrid({ n = 8, ratio = "aspect-[3/4]" }: { n?: number; ratio?: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="space-y-2"><Skeleton className={cn("w-full rounded-2xl", ratio)} /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-3/4" /></div>
      ))}
    </div>
  );
}

export function EmptyState({ title, desc, action, icon, className }: { title: string; desc?: string; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-cardlg border border-dashed border-neutral-border bg-white px-6 py-12 text-center", className)}>
      <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-neutral-canvas flex items-center justify-center text-neutral-text2">{icon ?? <Inbox size={22} />}</div>
      <p className="font-bold text-[1.05rem]">{title}</p>
      {desc && <p className="mt-1 text-neutral-text2 text-[0.92rem]">{desc}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "불러오지 못했습니다", desc = "잠시 후 다시 시도해주세요.", onRetry }: { title?: string; desc?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-cardlg border border-neutral-border bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-[#fdecec] flex items-center justify-center text-semantic-error"><AlertCircle size={22} /></div>
      <p className="font-bold text-[1.05rem]">{title}</p>
      <p className="mt-1 text-neutral-text2 text-[0.92rem]">{desc}</p>
      {onRetry && <div className="mt-5 flex justify-center"><Button variant="outline" onClick={onRetry} icon={<RefreshCw size={16} />}>다시 시도</Button></div>}
    </div>
  );
}
