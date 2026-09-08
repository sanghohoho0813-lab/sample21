"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> { key: string; header: ReactNode; cell: (row: T) => ReactNode; align?: "left" | "right" | "center"; width?: string; hideOnMobile?: boolean; primary?: boolean }

/** Desktop: table with row hover. Mobile: stacked cards (재배치, 삭제 아님). */
export function DataTable<T>({ rows, columns, rowKey, onRowClick, empty, className, dense }: {
  rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; empty?: ReactNode; className?: string; dense?: boolean;
}) {
  if (!rows.length) return <div className={className}>{empty ?? <p className="text-center text-neutral-text2 py-10">데이터가 없습니다.</p>}</div>;
  return (
    <div className={cn("w-full min-w-0 max-w-full", className)}>
      <div className="hidden md:block overflow-x-auto rounded-cardlg border border-neutral-border bg-white">
        <table className="w-full text-[0.92rem]">
          <thead>
            <tr className="bg-neutral-canvas text-neutral-text2 text-left">
              {columns.map((c) => <th key={c.key} className={cn("px-4 font-semibold whitespace-nowrap", dense ? "py-2.5" : "py-3", c.align === "right" && "text-right", c.align === "center" && "text-center")} style={{ width: c.width }}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn("border-t border-neutral-border hover-row", onRowClick && "cursor-pointer")}>
                {columns.map((c) => <td key={c.key} className={cn("px-4 align-middle", dense ? "py-2.5" : "py-3.5", c.align === "right" && "text-right tabular", c.align === "center" && "text-center")}>{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {rows.map((r) => {
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const rest = columns.filter((c) => c !== primary && !c.hideOnMobile);
          return (
            <div key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn("rounded-2xl border border-neutral-border bg-white p-4 active:bg-neutral-canvas transition-colors", onRowClick && "cursor-pointer")}>
              <div className="font-semibold text-[1rem] mb-2">{primary.cell(r)}</div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.85rem]">
                {rest.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-2 min-w-0"><dt className="text-neutral-text2 whitespace-nowrap">{c.header}</dt><dd className="tabular text-right min-w-0 truncate">{c.cell(r)}</dd></div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
