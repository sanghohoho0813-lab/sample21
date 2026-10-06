"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AutoFit } from "@/components/ui/AutoFit";

/** wrap: 긴 설명 열만 줄바꿈 허용(기본은 한 줄) · mobileFull: 모바일 카드에서 한 줄 전체 폭 */
export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  hideOnMobile?: boolean;
  primary?: boolean;
  wrap?: boolean;
  mobileFull?: boolean;
}

/* Desktop: 표 — 이름 열은 최소 폭을 보장하고(한글 세로 깨짐 방지) 나머지 값은 한 줄로 두어
   좁으면 표 안에서만 가로 스크롤된다. Mobile: 카드 — 라벨 위·값 아래로 쌓아 값이 잘리지 않는다. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  empty,
  className,
  dense,
  mobileFooter,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (r: T) => string;
  onRowClick?: (r: T) => void;
  empty?: ReactNode;
  className?: string;
  dense?: boolean;
  /** 모바일 카드 맨 아래(내용을 다 읽은 뒤)에 두는 처리 버튼 */
  mobileFooter?: (r: T) => ReactNode;
}) {
  if (!rows.length)
    return (
      <div className={className}>
        {empty ?? <p className="py-10 text-center text-neutral-text2">데이터가 없습니다.</p>}
      </div>
    );
  return (
    <div className={cn("w-full min-w-0 max-w-full", className)}>
      <div className="hidden overflow-x-auto overscroll-x-contain rounded-cardlg border border-neutral-border bg-white md:block">
        <table className="w-full text-[0.92rem]">
          <thead>
            <tr className="bg-neutral-canvas text-left text-neutral-text2">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-4 font-semibold",
                    dense ? "py-2.5" : "py-3",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                  )}
                  style={{ width: c.width }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={rowKey(r)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn("hover-row group border-t border-neutral-border", onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 align-middle",
                      dense ? "py-2.5" : "py-3.5",
                      c.align === "right" && "tabular text-right",
                      c.align === "center" && "text-center",
                      c.primary || c.wrap ? "break-keep" : "whitespace-nowrap",
                    )}
                  >
                    {c.primary ? (
                      <div className="min-w-[13rem] max-w-[24rem]">{c.cell(r)}</div>
                    ) : c.wrap ? (
                      <div className="min-w-[10rem] max-w-[22rem]">{c.cell(r)}</div>
                    ) : (
                      c.cell(r)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="stagger stagger-sm space-y-3 md:hidden">
        {rows.map((r) => {
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const rest = columns.filter((c) => c !== primary && !c.hideOnMobile);
          return (
            <div
              key={rowKey(r)}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cn(
                "rounded-2xl border border-neutral-border bg-white p-4 transition-all duration-200 hover:border-neutral-text2/40 hover:shadow-card active:scale-[0.99] active:bg-neutral-canvas",
                onRowClick && "cursor-pointer",
              )}
            >
              <div className="mb-3 min-w-0 break-keep text-[1rem] font-semibold [overflow-wrap:break-word]">
                {primary.cell(r)}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {rest.map((c) => (
                  <div key={c.key} className={cn("min-w-0", c.mobileFull && "col-span-2")}>
                    <dt className="break-keep text-[0.78rem] leading-snug text-neutral-text2">{c.header}</dt>
                    <dd className="tabular mt-0.5 min-w-0 break-keep text-[0.9rem] leading-snug [overflow-wrap:break-word]">
                      {c.align === "right" ? <AutoFit>{c.cell(r)}</AutoFit> : c.cell(r)}
                    </dd>
                  </div>
                ))}
              </dl>
              {mobileFooter && <div className="mt-3 border-t border-neutral-border pt-3">{mobileFooter(r)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
