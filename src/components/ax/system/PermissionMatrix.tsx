"use client";
/* [사용자/권한] Permission Matrix — PERMISSIONS × 역할(대표/MD/운영직원/고객). ✓ 전체 · △ 부분 · × 없음 */
import { PERMISSIONS, type Permission } from "@/lib/roles";
import { ROLE_LABEL } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";

const ROLES: Role[] = ["owner", "md", "ops", "customer"];
type Level = "full" | "partial" | "none";
const LEVEL: Record<Level, { sym: string; label: string; cls: string }> = {
  full: { sym: "✓", label: "전체", cls: "text-semantic-success" },
  partial: { sym: "△", label: "부분", cls: "text-semantic-warning" },
  none: { sym: "×", label: "없음", cls: "text-neutral-text2/70" },
};

export function PermissionLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem] text-neutral-text2">
      {(Object.keys(LEVEL) as Level[]).map((k) => (
        <span key={k} className="inline-flex items-center gap-1"><span className={cn("font-bold text-[1rem] leading-none", LEVEL[k].cls)}>{LEVEL[k].sym}</span>{LEVEL[k].label}</span>
      ))}
    </div>
  );
}

export function PermissionMatrix({ highlight }: { highlight?: Role }) {
  const keys = Object.keys(PERMISSIONS) as Permission[];
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-border bg-white">
      <table className="w-full min-w-[340px] text-[0.88rem]">
        <thead>
          <tr className="bg-neutral-canvas text-neutral-text2">
            <th scope="col" className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">권한</th>
            {ROLES.map((r) => (
              <th key={r} scope="col" className={cn("px-2 py-2.5 text-center font-semibold whitespace-nowrap", highlight === r && "text-theme-primary")}>
                {ROLE_LABEL[r]}
                {highlight === r && <span className="block text-[0.68rem] font-bold">현재</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-t border-neutral-border hover-row">
              <th scope="row" className="px-3 py-2.5 text-left font-semibold text-neutral-text whitespace-nowrap">{PERMISSIONS[k].label}</th>
              {ROLES.map((r) => {
                const lv: Level = PERMISSIONS[k].roles[r] ?? "none";
                return (
                  <td key={r} className={cn("px-2 py-2.5 text-center", highlight === r && "bg-theme-soft/50")}>
                    <span className={cn("font-bold text-[1.05rem] leading-none", LEVEL[lv].cls)} aria-label={`${ROLE_LABEL[r]} ${LEVEL[lv].label}`}>{LEVEL[lv].sym}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
