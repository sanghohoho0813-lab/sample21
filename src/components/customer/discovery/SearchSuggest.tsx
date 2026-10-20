"use client";
/* ------------------------------------------------------------------
   검색 입력 + 자동완성(combobox). 헤더·검색 시트·검색 화면이 같은 것을 쓴다.
   · 입력하는 동안 브랜드·카테고리·상품 추천, 일치한 글자 강조
   · ↑/↓로 고르고 Enter로 이동, Esc로 닫기 — 고른 것이 없으면 Enter는 그냥 검색
   · inline: 휴대폰 검색 시트처럼 목록을 입력칸 아래에 그대로 펼칠 때
------------------------------------------------------------------- */
import { useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, Store, LayoutGrid } from "lucide-react";
import { BRAND_BY_ID, PRODUCT_BY_ID } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { effPrice } from "@/lib/kpi";
import { krw } from "@/lib/format";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/cn";
import { searchSuggestions, splitMatch, type Suggestion } from "./suggest";

function Mark({ text, q }: { text: string; q: string }) {
  const [a, b, c] = splitMatch(text, q);
  return (
    <>
      {a}
      {b && <mark className="bg-transparent font-bold text-brand-accent">{b}</mark>}
      {c}
    </>
  );
}

export function SearchSuggest({
  value,
  onValueChange,
  onSubmit,
  onNavigate,
  inline,
  autoFocus,
  placeholder = "상품 · 브랜드 · 스타일 검색",
  label = "검색",
  inputClassName,
  className,
  trailing,
  iconSize = 18,
}: {
  value: string;
  onValueChange: (v: string) => void;
  /** 고른 추천 없이 Enter/검색 버튼 */
  onSubmit: (q: string) => void;
  /** 추천을 눌러 다른 화면으로 갈 때(시트 닫기 등) */
  onNavigate?: () => void;
  inline?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  label?: string;
  inputClassName?: string;
  className?: string;
  /** 입력칸 오른쪽(지우기·검색 버튼 등) */
  trailing?: ReactNode;
  iconSize?: number;
}) {
  const router = useRouter();
  const store = useApp();
  const listId = useId();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const items = useMemo(() => searchSuggestions(value), [value]);
  const open = (inline || focused) && value.trim().length > 0;

  const pick = (s: Suggestion) => {
    store.track("search_product", { q: value.trim(), pick: s.kind, target: s.id });
    if (s.kind === "category" && s.categoryId) store.track("select_category", { categoryId: s.categoryId });
    setFocused(false);
    setActive(-1);
    onNavigate?.();
    router.push(s.href);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (open && active >= 0 && items[active]) return pick(items[active]);
    setFocused(false);
    onSubmit(value.trim());
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setFocused(false);
      setActive(-1);
    }
  };

  const groups: { kind: Suggestion["kind"]; title: string }[] = [
    { kind: "brand", title: "브랜드" },
    { kind: "category", title: "카테고리" },
    { kind: "product", title: "상품" },
  ];

  return (
    <form onSubmit={submit} role="search" className={cn("relative", className)}>
      <div className="relative">
        <Search
          size={iconSize}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-text2"
        />
        <input
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            setActive(-1);
          }}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setFocused(false), 120);
          }}
          onKeyDown={onKey}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={inputClassName}
        />
        {trailing}
      </div>
      {open && (
        <div
          className={cn(
            "overflow-hidden bg-white",
            inline
              ? "mt-3"
              : "absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-neutral-border shadow-raised",
          )}
          data-search-suggest
        >
          {items.length === 0 ? (
            <p className="px-4 py-4 text-[0.88rem] text-neutral-text2">
              일치하는 추천이 없어요. <b className="text-neutral-text">Enter</b>로 ‘{value.trim()}’ 전체 검색
            </p>
          ) : (
            <ul
              id={listId}
              role="listbox"
              aria-label="검색 추천"
              className="max-h-[min(60vh,28rem)] overflow-y-auto py-1.5"
            >
              {groups.map((g) => {
                const rows = items.map((s, i) => ({ s, i })).filter((x) => x.s.kind === g.kind);
                if (!rows.length) return null;
                return (
                  <li key={g.kind} role="presentation">
                    <p aria-hidden className="px-4 pb-1 pt-2 text-[0.78rem] font-bold text-neutral-text2">
                      {g.title}
                    </p>
                    <ul role="group" aria-label={g.title}>
                      {rows.map(({ s, i }) => {
                        const p = s.productId ? PRODUCT_BY_ID[s.productId] : null;
                        return (
                          <li
                            key={s.kind + s.id}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={active === i}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => pick(s)}
                            className={cn(
                              "flex min-h-11 cursor-pointer items-center gap-3 px-4 py-1.5 text-[0.92rem]",
                              active === i ? "bg-brand-ivory" : "hover:bg-brand-ivory/60",
                            )}
                          >
                            {p ? (
                              <ProductImage
                                colors={p.colors}
                                label={p.name}
                                name={p.name}
                                category={p.categoryId}
                                caption={false}
                                className="w-9 shrink-0 rounded-md"
                                ratio="aspect-[3/4]"
                              />
                            ) : (
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-ivory text-neutral-text2">
                                {s.kind === "brand" ? (
                                  <Store size={16} aria-hidden />
                                ) : (
                                  <LayoutGrid size={16} aria-hidden />
                                )}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">
                                <Mark text={s.label} q={value} />
                              </span>
                              {p ? (
                                <span className="tabular block truncate text-[0.78rem] text-neutral-text2">
                                  {BRAND_BY_ID[p.brandId].name} · {krw(effPrice(p, store))}
                                </span>
                              ) : (
                                s.sub && (
                                  <span className="block truncate text-[0.78rem] text-neutral-text2">{s.sub}</span>
                                )
                              )}
                            </span>
                            <ArrowUpRight size={15} aria-hidden className="shrink-0 text-neutral-text2" />
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
          {items.length > 0 && (
            <button
              type="submit"
              onMouseDown={(e) => e.preventDefault()}
              className="flex min-h-11 w-full items-center gap-2 border-t border-neutral-border px-4 text-left text-[0.88rem] font-semibold hover:bg-brand-ivory/60"
            >
              <Search size={15} aria-hidden />‘{value.trim()}’ 전체 결과 보기
            </button>
          )}
        </div>
      )}
    </form>
  );
}
