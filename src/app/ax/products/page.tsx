"use client";
/* 04 상품·SKU — 상품 단위 판매·재고·찜·반품 목록 (옵션 상세는 /ax/products/[id]) */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shirt, Layers, PackageX, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { BRANDS, BRAND_BY_ID, CATEGORIES, CATEGORY_NAME } from "@/lib/demo/seed";
import { allProductAgg, discountRate, type ProductAgg } from "@/lib/kpi";
import { can } from "@/lib/roles";
import { krw, krwShort, num, pct, signed } from "@/lib/format";
import { ICON_ACCENTS } from "@/lib/theme";
import type { Role } from "@/lib/types";
import { Hydrated } from "@/components/system/Hydrated";
import { PageHeader } from "@/components/ax/AxShell";
import { InventoryStatusBadge } from "@/components/ax/StatusBadges";
import { PageSkeleton, RoleNote, UnitDelta } from "@/components/ax/core/shared";
import { KpiCard } from "@/components/ui/Kpi";
import { Input, Segmented, Select } from "@/components/ui/Form";
import { Freshness, Term } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";

type SaleStatus = "all" | "normal" | "sale" | "soldout" | "new";
type SortKey = "velocity" | "wishlist" | "returnRate" | "margin" | "stock" | "sales7d";
const SORT_LABEL: Record<SortKey, string> = { sales7d: "7일 판매", velocity: "판매속도 변화", wishlist: "찜 증가", returnRate: "반품률", margin: "마진율", stock: "현재고" };
const NEW_DAYS = 30;

export default function ProductsPage() {
  return <Hydrated fallback={<PageSkeleton rows={2} />}><ProductsInner /></Hydrated>;
}

function ProductsInner() {
  const app = useApp();
  const router = useRouter();
  const role: Role = app.role === "customer" ? "owner" : app.role;
  const showMargin = can(role, "brand-margin");
  const [brand, setBrand] = useState("all");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<SaleStatus>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("sales7d");

  const aggs = useMemo(() => allProductAgg(app), [app]);
  const isNew = (a: ProductAgg) => Date.now() - new Date(a.product.createdAt).getTime() <= NEW_DAYS * 86400000;

  const summary = useMemo(() => ({
    total: aggs.length,
    liveOptions: aggs.reduce((s, a) => s + a.variants.filter((v) => v.stock > 0).length, 0),
    soldout: aggs.reduce((s, a) => s + a.soldout, 0),
    newCount: aggs.filter(isNew).length,
  }), [aggs]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const f = aggs.filter((a) => (brand === "all" || a.product.brandId === brand) && (cat === "all" || a.product.categoryId === cat)
      && (status === "all" || (status === "sale" ? discountRate(a.product, app) > 0 : status === "soldout" ? a.soldout > 0 : status === "new" ? isNew(a) : discountRate(a.product, app) === 0 && a.soldout === 0))
      && (!ql || a.product.name.toLowerCase().includes(ql) || BRAND_BY_ID[a.product.brandId].name.toLowerCase().includes(ql) || a.product.subtitle.toLowerCase().includes(ql)));
    const key = (a: ProductAgg) => sort === "velocity" ? a.velocity : sort === "wishlist" ? a.wishlist7d - a.wishlistPrev7d : sort === "returnRate" ? a.returnRate : sort === "margin" ? a.marginRate : sort === "stock" ? a.stock : a.sales7d;
    return [...f].sort((x, y) => key(y) - key(x));
  }, [aggs, brand, cat, status, q, sort, app]);

  const columns: Column<ProductAgg>[] = [
    { key: "name", header: "상품", primary: true, cell: (a) => (
      <span className="flex items-center gap-3 min-w-0">
        <ProductImage colors={a.product.colors} ratio="aspect-square" className="hidden md:block h-11 w-11 shrink-0 !rounded-lg" label={a.product.name} />
        <span className="min-w-0"><span className="block text-[0.75rem] text-neutral-text2 font-semibold">{BRAND_BY_ID[a.product.brandId].name} · {CATEGORY_NAME[a.product.categoryId]}</span><span className="font-semibold leading-snug">{a.product.name}</span>{isNew(a) && <Badge tone="accent" size="sm" className="ml-1.5">NEW</Badge>}</span>
      </span>
    ) },
    { key: "price", header: "정상가 · 판매가", align: "right", cell: (a) => <span className="tabular">{a.price < a.product.price ? <><span className="text-neutral-text2 line-through text-[0.8rem] mr-1">{krw(a.product.price)}</span><span className="font-semibold">{krw(a.price)}</span><span className="block text-[0.75rem] text-semantic-error font-semibold">-{pct(discountRate(a.product, app), 0)}</span></> : <span className="font-semibold">{krw(a.price)}</span>}</span> },
    ...(showMargin ? [{ key: "margin", header: "원가 · 마진율", align: "right", cell: (a: ProductAgg) => <span className="tabular">{krwShort(a.product.cost)}<span className={`block text-[0.78rem] font-semibold ${a.marginRate < 0.5 ? "text-semantic-warning" : "text-semantic-success"}`}>{pct(a.marginRate, 0)}</span></span> } as Column<ProductAgg>] : []),
    { key: "options", header: "옵션", align: "right", cell: (a) => <span className="tabular">{a.variants.length}<span className="block text-[0.75rem] text-neutral-text2">품절 {a.soldout}</span></span> },
    { key: "stock", header: "현재고", align: "right", cell: (a) => <span className={`tabular font-semibold ${a.stock <= 10 ? "text-semantic-warning" : ""}`}>{num(a.stock)}{a.incoming > 0 && <span className="block text-[0.75rem] text-neutral-text2 font-normal">+{a.incoming} 예정</span>}</span> },
    { key: "sales7d", header: "7일 판매", align: "right", cell: (a) => <span className="tabular font-semibold">{num(a.sales7d)} <span className={`text-[0.78rem] ${a.velocity > 0 ? "text-semantic-success" : a.velocity < 0 ? "text-semantic-error" : "text-neutral-text2"}`}>{signed(a.velocity, 0)}</span></span> },
    { key: "wish", header: "찜 (7일)", align: "right", cell: (a) => <span className="tabular">{num(a.wishlist7d)} <UnitDelta cur={a.wishlist7d} prev={a.wishlistPrev7d} /></span> },
    { key: "restock", header: "재입고 신청", align: "right", cell: (a) => <span className={`tabular ${a.restockRequests >= 5 ? "font-semibold text-theme-primary" : ""}`}>{num(a.restockRequests)}</span> },
    { key: "return", header: "반품률", align: "right", cell: (a) => <span className={`tabular ${a.returnRate > 0.15 ? "text-semantic-error font-semibold" : ""}`}>{pct(a.returnRate, 1)}</span> },
    { key: "status", header: "상태", cell: (a) => <InventoryStatusBadge status={a.worst} /> },
  ];

  const reset = () => { setBrand("all"); setCat("all"); setStatus("all"); setQ(""); };

  return (
    <div className="space-y-6">
      <PageHeader title={<>상품 · <Term term="SKU">SKU</Term></>} desc="상품 단위로 판매속도·재고·찜·재입고 신청·반품률을 비교합니다. 행을 누르면 옵션(색상×사이즈) 단위 상세로 이동합니다." badge={<Badge tone="demo" size="sm">DEMO</Badge>} right={<Freshness source="DEMO" />} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="전체 상품" value={num(summary.total)} sub={`브랜드 ${BRANDS.length}개`} icon={<Shirt size={18} />} accent={ICON_ACCENTS.operations} />
        <KpiCard label="판매 중 옵션" value={num(summary.liveOptions)} sub="재고 1개 이상 색상×사이즈" icon={<Layers size={18} />} accent={ICON_ACCENTS.overview} />
        <KpiCard label="품절 옵션" value={num(summary.soldout)} sub="재입고 검토 대상" href="/ax/inventory?filter=low" icon={<PackageX size={18} />} accent={ICON_ACCENTS.risk} />
        <KpiCard label="신상품 (30일)" value={num(summary.newCount)} sub="등록 30일 이내" icon={<Sparkles size={18} />} accent={ICON_ACCENTS.customer} />
      </div>

      {!showMargin && <RoleNote>운영직원 화면 — 원가·마진율 열은 숨겨집니다.</RoleNote>}

      {/* Filters */}
      <div className="rounded-cardlg bg-white border border-neutral-border p-4 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input aria-label="상품 검색" placeholder="상품명 · 브랜드 검색" value={q} onChange={(e) => setQ(e.target.value)} className="h-11" />
          <Select aria-label="브랜드" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-11 text-[0.95rem]"><option value="all">브랜드 전체</option>{BRANDS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
          <Select aria-label="카테고리" value={cat} onChange={(e) => setCat(e.target.value)} className="h-11 text-[0.95rem]"><option value="all">카테고리 전체</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          <Select aria-label="정렬" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-11 text-[0.95rem]">{(Object.keys(SORT_LABEL) as SortKey[]).map((k) => <option key={k} value={k}>정렬 · {SORT_LABEL[k]}</option>)}</Select>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <Segmented size="sm" value={status} onChange={setStatus} options={[{ value: "all", label: "전체" }, { value: "normal", label: "정상" }, { value: "sale", label: "할인" }, { value: "soldout", label: "품절 포함" }, { value: "new", label: "신상품" }]} />
          <span className="text-[0.85rem] text-neutral-text2 tabular inline-flex items-center gap-2"><Search size={14} />{num(rows.length)}개 상품</span>
        </div>
      </div>

      <DataTable rows={rows} columns={columns} rowKey={(a) => a.product.id} onRowClick={(a) => router.push(`/ax/products/${a.product.id}`)} dense
        empty={<EmptyState title="조건에 맞는 상품이 없습니다" desc="검색어나 필터를 바꿔보세요." action={<Button variant="outline" onClick={reset}>필터 초기화</Button>} />} />
    </div>
  );
}
