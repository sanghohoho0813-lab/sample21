"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** wrap: 긴 설명 열만 줄바꿈 허용(기본은 한 줄) · mobileFull: 모바일 카드에서 한 줄 전체 폭 */
export interface Column<T> { key: string; header: ReactNode; cell: (row: T) => ReactNode; align?: "left" | "right" | "center"; width?: string; hideOnMobile?: boolean; primary?: boolean; wrap?: boolean; mobileFull?: boolean }

/* Desktop: 표 — 이름 열은 최소 폭을 보장하고(한글 세로 깨짐 방지) 나머지 값은 한 줄로 두어
   좁으면 표 안에서만 가로 스크롤된다. Mobile: 카드 — 라벨 위·값 아래로 쌓아 값이 잘리지 않는다. */
export function DataTable<T>({ rows, columns, rowKey, onRowClick, empty, className, dense }: {
  rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; empty?: ReactNode; className?: string; dense?: boolean;
}) {
  if (!rows.length) return <div className={className}>{empty ?? <p className="text-center text-neutral-text2 py-10">데이터가 없습니다.</p>}</div>;
  return (
    <div className={cn("w-full min-w-0 max-w-full", className)}>
      <div className="hidden md:block overflow-x-auto overscroll-x-contain rounded-cardlg border border-neutral-border bg-white">
        <table className="w-full text-[0.92rem]">
          <thead>
            <tr className="bg-neutral-canvas text-neutral-text2 text-left">
              {columns.map((c) => <th key={c.key} className={cn("px-4 font-semibold whitespace-nowrap", dense ? "py-2.5" : "py-3", c.align === "right" && "text-right", c.align === "center" && "text-center")} style={{ width: c.width }}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn("group border-t border-neutral-border hover-row", onRowClick && "cursor-pointer")}>
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 align-middle", dense ? "py-2.5" : "py-3.5", c.align === "right" && "text-right tabular", c.align === "center" && "text-center",
                    c.primary ? "min-w-[13rem] max-w-[24rem] break-keep" : c.wrap ? "min-w-[10rem] max-w-[22rem] break-keep" : "whitespace-nowrap")}>{c.cell(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3 stagger stagger-sm">
        {rows.map((r) => {
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const rest = columns.filter((c) => c !== primary && !c.hideOnMobile);
          return (
            <div key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn("rounded-2xl border border-neutral-border bg-white p-4 active:bg-neutral-canvas transition-all duration-200 hover:border-neutral-text2/40 hover:shadow-card active:scale-[0.99]", onRowClick && "cursor-pointer")}>
              <div className="font-semibold text-[1rem] mb-3 min-w-0 break-keep [overflow-wrap:anywhere]">{primary.cell(r)}</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {rest.map((c) => (
                  <div key={c.key} className={cn("min-w-0", c.mobileFull && "col-span-2")}>
                    <dt className="text-[0.78rem] text-neutral-text2 leading-snug break-keep">{c.header}</dt>
                    <dd className="mt-0.5 text-[0.9rem] leading-snug tabular min-w-0 break-keep [overflow-wrap:anywhere]">{c.cell(r)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
