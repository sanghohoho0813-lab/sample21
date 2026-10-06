"use client";
/* /style — 스타일 찾기 = 핏/스타일 프로필 허브. */
import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, Sparkles, ChevronRight } from "lucide-react";
import { DEMO_CUSTOMER_NAME } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { recommendForCustomer } from "@/lib/engine";
import { cn } from "@/lib/cn";
import { Hydrated } from "@/components/system/Hydrated";
import { SkeletonCard, SkeletonGrid } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { Container, PageTitle, SectionHead } from "@/components/customer/Section";
import { ProductGrid } from "@/components/customer/ProductCard";
import { FitProfileForm, isProfileComplete } from "@/components/customer/discovery/FitProfileForm";
import { FITS, FIT_LABEL } from "@/components/customer/discovery/filters";

function StyleBody() {
  const store = useApp();
  const fp = store.fitProfile;
  const complete = isProfileComplete(fp);
  const recs = useMemo(
    () =>
      recommendForCustomer({
        recentlyViewed: store.recentlyViewed,
        wishlist: store.wishlist.map((w) => w.productId),
        limit: 8,
      }),
    [store.recentlyViewed, store.wishlist],
  );
  const reasons = Object.fromEntries(recs.map((r) => [r.product.id, r.reason]));

  return (
    <div className="space-y-12 md:space-y-16">
      <section aria-label="핏 프로필 입력">
        <FitProfileForm />
      </section>

      <section>
        <SectionHead title="선호 핏으로 보기" desc="핏 기준으로 상품을 골라볼 수 있어요" />
        <div className="flex flex-wrap gap-2">
          {FITS.map((f) => (
            <Link
              key={f}
              href={`/shop?fit=${f}`}
              className={cn(
                "inline-flex h-11 items-center gap-1 rounded-full border px-4 text-[0.9rem] font-semibold transition-all duration-fast active:scale-[0.97] md:h-10",
                fp.preferredFit === f
                  ? "border-brand-black bg-brand-black text-white"
                  : "border-neutral-border bg-white hover:border-neutral-text2 hover:bg-neutral-canvas",
              )}
            >
              {FIT_LABEL[f]} 핏
              {fp.preferredFit === f && <span className="ml-1 text-[0.78rem] font-bold opacity-80">내 선호</span>}
              <ChevronRight size={14} />
            </Link>
          ))}
        </div>
      </section>

      {complete ? (
        <section>
          <SectionHead
            title={
              <span className="inline-flex items-center gap-2">
                <Sparkles size={20} className="text-brand-accent" />
                {DEMO_CUSTOMER_NAME}님을 위한 추천
              </span>
            }
            desc="완성된 핏 프로필과 최근 본 상품·찜 목록을 바탕으로 골랐어요"
            more="/ranking"
            moreLabel="랭킹"
          />
          <ProductGrid products={recs.map((r) => r.product)} reasons={reasons} />
        </section>
      ) : (
        <section className="rounded-cardlg border border-dashed border-neutral-border bg-brand-ivory p-5 text-center md:p-6">
          <p className="text-[1.05rem] font-bold">{DEMO_CUSTOMER_NAME}님을 위한 추천이 준비 중이에요</p>
          <p className="mt-1 text-[0.9rem] text-neutral-text2">
            키·몸무게·평소 상의·하의 4가지를 저장하면 이 자리에 맞춤 추천이 나타납니다.
          </p>
        </section>
      )}

      <section
        aria-label="안내"
        className="flex items-start gap-3 rounded-2xl border border-neutral-border bg-white p-4 md:p-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-canvas text-semantic-warning md:bg-brand-ivory">
          <AlertTriangle size={18} />
        </span>
        <div className="text-[0.85rem] leading-relaxed text-neutral-text2">
          <p className="font-bold text-neutral-text">사이즈 추천은 참고 정보입니다</p>
          <p className="mt-0.5">
            입력한 정보와 상품 실측·구매 데이터를 바탕으로 계산한 추천이며, 실제 착용감은 개인차가 있습니다. 사이즈
            선택의 최종 책임은 고객에게 있으며, 구매 전 상품별 실측표를 함께 확인해 주세요.{" "}
            <Badge tone="demo" size="sm" className="align-middle">
              데모
            </Badge>{" "}
            규칙 기반 추천이며 실제 고객 데이터를 사용하지 않습니다.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function StylePage() {
  return (
    <Container className="animate-fadeIn py-6 md:py-10">
      <PageTitle
        title="스타일 찾기"
        desc="키·몸무게·평소 사이즈를 알려주시면 브랜드마다 다른 사이즈를 대신 계산해드려요."
      />
      <Hydrated
        fallback={
          <div className="space-y-6">
            <SkeletonCard lines={6} />
            <SkeletonGrid n={4} />
          </div>
        }
      >
        <StyleBody />
      </Hydrated>
    </Container>
  );
}
