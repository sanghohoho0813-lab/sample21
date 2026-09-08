"use client";
/* [데이터] CSV 가져오기 (READY) — 샘플 보기 / 필드 구조 / 업로드 미리보기. 스토어는 절대 변경하지 않는다. */
import { useCallback, useRef, useState } from "react";
import { FileUp, Table2 } from "lucide-react";
import { Modal } from "@/components/ui/Overlay";
import { Segmented, Chip } from "@/components/ui/Form";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/cn";

type Tab = "sample" | "fields" | "upload";
type FileKey = "products" | "variants" | "orders";

interface FieldDef { name: string; required: boolean; desc: string; example: string }
const FILES: Record<FileKey, { file: string; title: string; fields: FieldDef[]; rows: string[][] }> = {
  products: {
    file: "products.csv", title: "상품",
    fields: [
      { name: "product_id", required: true, desc: "상품 고유 ID (브랜드 내 중복 불가)", example: "p-nove-oxford" },
      { name: "brand_id", required: true, desc: "브랜드 ID", example: "b-nove" },
      { name: "category", required: true, desc: "카테고리 (outer/top/bottom/dress/shoes/bag/acc)", example: "top" },
      { name: "name", required: true, desc: "상품명", example: "오버핏 옥스포드 셔츠" },
      { name: "price", required: true, desc: "정상가 (원)", example: "79000" },
      { name: "sale_price", required: false, desc: "판매가 (할인 중일 때만)", example: "" },
      { name: "cost", required: true, desc: "원가 또는 정산 기준가 (원)", example: "28000" },
      { name: "sizing", required: false, desc: "사이징 경향 (small/true/large) — 핏 추천에 사용", example: "large" },
      { name: "season_end_days", required: false, desc: "시즌 종료까지 남은 일수 — 할인 검토에 사용", example: "240" },
    ],
    rows: [
      ["p-nove-oxford", "b-nove", "top", "오버핏 옥스포드 셔츠", "79000", "", "28000", "large", "240"],
      ["p-plane-wide", "b-plane", "bottom", "와이드 스트레이트 데님", "138000", "", "52000", "small", "240"],
      ["p-still-balmacaan", "b-still", "outer", "울 블렌드 발마칸 코트", "398000", "358000", "175000", "large", "75"],
    ],
  },
  variants: {
    file: "variants.csv", title: "옵션(색상×사이즈)",
    fields: [
      { name: "variant_id", required: true, desc: "옵션 고유 ID (SKU)", example: "p-nove-oxford-c0-M" },
      { name: "product_id", required: true, desc: "상품 ID (products.csv 참조)", example: "p-nove-oxford" },
      { name: "color", required: true, desc: "색상명", example: "블랙" },
      { name: "size", required: true, desc: "사이즈 (S/M/L/XL 또는 mm)", example: "M" },
      { name: "stock", required: true, desc: "현재고 수량", example: "4" },
      { name: "incoming", required: false, desc: "입고 예정 수량", example: "0" },
    ],
    rows: [
      ["p-nove-oxford-c0-M", "p-nove-oxford", "블랙", "M", "4", "0"],
      ["p-nove-oxford-c0-L", "p-nove-oxford", "블랙", "L", "7", "0"],
      ["p-plane-wide-c0-M", "p-plane-wide", "인디고", "M", "12", "20"],
    ],
  },
  orders: {
    file: "orders.csv", title: "주문 (행 = 주문 항목)",
    fields: [
      { name: "order_id", required: true, desc: "주문번호 — 같은 주문의 항목은 같은 번호", example: "MF0908-0121" },
      { name: "customer_id", required: true, desc: "고객 ID (개인정보 아님, 익명 키)", example: "c-0042" },
      { name: "created_at", required: true, desc: "주문 일시 (ISO 8601)", example: "2026-09-08T10:20:00+09:00" },
      { name: "variant_id", required: true, desc: "옵션 ID (variants.csv 참조)", example: "p-nove-oxford-c0-M" },
      { name: "qty", required: true, desc: "수량", example: "1" },
      { name: "unit_price", required: true, desc: "실제 판매 단가 (원)", example: "79000" },
      { name: "status", required: true, desc: "pending/preparing/shipped/in-transit/delivered/cancelled/return-requested", example: "delivered" },
      { name: "return_reason", required: false, desc: "반품 사유 (size-small/size-large/fit/color/material/delivery/change-of-mind/other)", example: "" },
    ],
    rows: [
      ["MF0908-0121", "c-0042", "2026-09-08T10:20:00+09:00", "p-nove-oxford-c0-M", "1", "79000", "delivered", ""],
      ["MF0907-0088", "c-0110", "2026-09-07T18:02:00+09:00", "p-plane-wide-c0-M", "1", "138000", "return-requested", "size-small"],
      ["MF0907-0088", "c-0110", "2026-09-07T18:02:00+09:00", "p-unit-tee-c0-M", "2", "29000", "delivered", ""],
    ],
  },
};
const FILE_KEYS: FileKey[] = ["products", "variants", "orders"];

/** 작은 CSV 파서 — 따옴표·콤마·줄바꿈 처리 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim().length));
}

function MiniTable({ header, rows, className }: { header: string[]; rows: string[][]; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-neutral-border bg-white", className)}>
      <table className="min-w-full text-[0.82rem]">
        <thead><tr className="bg-neutral-canvas text-neutral-text2">{header.map((h, i) => <th key={`${h}-${i}`} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-neutral-border">
              {header.map((_, ci) => <td key={ci} className="px-3 py-2 whitespace-nowrap tabular">{r[ci] ?? ""}{r[ci] === "" && <span className="text-neutral-text2/60">—</span>}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CsvImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("sample");
  const [fileKey, setFileKey] = useState<FileKey>("products");
  const [parsed, setParsed] = useState<{ name: string; size: number; header: string[]; rows: string[][]; total: number; truncated: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | undefined) => {
    setError(null); setParsed(null);
    if (!f) return;
    if (!/\.csv$/i.test(f.name) && f.type !== "text/csv") { setError("CSV 파일(.csv)만 읽을 수 있습니다."); return; }
    const LIMIT = 512 * 1024;
    const blob = f.size > LIMIT ? f.slice(0, LIMIT) : f;
    const reader = new FileReader();
    reader.onerror = () => setError("파일을 읽지 못했습니다. 다시 시도해주세요.");
    reader.onload = () => {
      const text = String(reader.result ?? "").replace(/^﻿/, "");
      const rows = parseCsv(text);
      if (rows.length < 1) { setError("비어 있는 파일입니다. 첫 줄에 열 이름이 필요합니다."); return; }
      const [header, ...body] = rows;
      setParsed({ name: f.name, size: f.size, header, rows: body.slice(0, 5), total: body.length, truncated: f.size > LIMIT });
    };
    reader.readAsText(blob, "utf-8");
  }, []);

  const close = useCallback(() => { onClose(); }, [onClose]);
  const cur = FILES[fileKey];

  return (
    <Modal open={open} onClose={close} title={<span className="inline-flex items-center gap-2">CSV 가져오기 <Badge tone="ready" size="sm">READY</Badge></span>} size="lg"
      footer={<div className="flex flex-col sm:flex-row sm:items-center gap-2"><p className="text-[0.82rem] text-neutral-text2 sm:mr-auto">실제 반영은 Supabase 연결 후 가능 (READY). 지금은 미리보기만 하며 Demo 데이터는 바뀌지 않습니다.</p><Button variant="outline" onClick={close}>닫기</Button></div>}>
      <div className="space-y-4">
        <Segmented value={tab} onChange={setTab} options={[{ value: "sample", label: "샘플 파일 보기" }, { value: "fields", label: "필드 구조 보기" }, { value: "upload", label: "업로드" }]} />

        {tab !== "upload" && (
          <div className="flex flex-wrap gap-2">
            {FILE_KEYS.map((k) => <Chip key={k} active={fileKey === k} onClick={() => setFileKey(k)} className="h-9 px-3 text-[0.85rem]">{FILES[k].file}</Chip>)}
          </div>
        )}

        {tab === "sample" && (
          <div className="space-y-2">
            <p className="text-[0.88rem] text-neutral-text2"><span className="font-semibold text-neutral-text">{cur.file}</span> · {cur.title} — 첫 줄은 열 이름, 이후 한 줄이 한 건입니다. (샘플 값은 Demo 시나리오)</p>
            <MiniTable header={cur.fields.map((f) => f.name)} rows={cur.rows} />
          </div>
        )}

        {tab === "fields" && (
          <div className="space-y-2">
            <p className="text-[0.88rem] text-neutral-text2"><span className="font-semibold text-neutral-text">{cur.file}</span> 필드 — <Badge tone="error" size="sm">필수</Badge> 표시는 반드시 있어야 합니다.</p>
            <ul className="divide-y divide-neutral-border rounded-xl border border-neutral-border bg-white">
              {cur.fields.map((f) => (
                <li key={f.name} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                  <div className="sm:w-48 shrink-0 flex items-center gap-2"><code className="text-[0.85rem] font-bold">{f.name}</code>{f.required && <Badge tone="error" size="sm">필수</Badge>}</div>
                  <div className="min-w-0 text-[0.85rem]"><p>{f.desc}</p>{f.example && <p className="text-neutral-text2">예: <code>{f.example}</code></p>}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "upload" && (
          <div className="space-y-3">
            <label className="block rounded-2xl border-2 border-dashed border-neutral-border bg-neutral-canvas px-4 py-8 text-center cursor-pointer hover:border-theme-primary hover:bg-theme-soft/40 transition-colors duration-fast active:scale-[0.995]"
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <FileUp size={26} className="mx-auto text-theme-primary" />
              <p className="mt-2 font-bold">CSV 파일 선택 또는 끌어다 놓기</p>
              <p className="mt-1 text-[0.82rem] text-neutral-text2">브라우저 안에서만 읽습니다 · 서버 전송 없음 · 미리보기는 처음 512KB</p>
            </label>
            {error && <p role="alert" className="rounded-xl bg-[#fdecec] px-4 py-3 text-[0.88rem] text-semantic-error font-semibold">{error}</p>}
            {parsed ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[0.85rem]">
                  <Table2 size={16} className="text-theme-primary" />
                  <span className="font-bold break-anywhere">{parsed.name}</span>
                  <span className="text-neutral-text2 tabular">{(parsed.size / 1024).toFixed(1)}KB · 열 {parsed.header.length}개 · 행 {parsed.total.toLocaleString("ko-KR")}{parsed.truncated ? "+" : ""}개</span>
                  <Badge tone="demo" size="sm" className="ml-auto">미리보기만</Badge>
                </div>
                <MiniTable header={parsed.header} rows={parsed.rows} />
                <p className="text-[0.82rem] text-neutral-text2">처음 5행만 표시합니다. 실제 반영은 Supabase 연결 후 가능 (READY) — Demo 스토어는 변경되지 않았습니다.</p>
              </div>
            ) : !error && (
              <EmptyState title="아직 선택한 파일이 없습니다" desc="샘플 파일 형식에 맞춘 CSV를 올리면 열 이름과 처음 5행을 확인할 수 있습니다." className="py-8" />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
