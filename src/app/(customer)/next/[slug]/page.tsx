"use client";
/* /next/[slug] — 향후 확장 Preview. 구현되지 않은 기능임을 명확히 표시. 모르는 slug도 404 대신 EmptyState. */
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Crown, Store, Megaphone, BookOpen, Building2, Sparkles, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import { NEXT_MENUS } from "@/components/customer/CustomerShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { GradientImage } from "@/components/ui/ProductImage";
import { Container } from "@/components/customer/Section";

const CONTENT: Record<string, { icon: ReactNode; gradient: [string, string]; intent: string; capabilities: string[]; audience: string }> = {
  membership: {
    icon: <Crown size={22} />, gradient: ["#111111", "#4b4b4b"], audience: "재구매 고객",
    intent: "구매 금액과 활동에 따라 등급을 나누고, 등급별 적립·무료배송·신상품 선공개 같은 혜택을 제공하는 기능입니다. 자주 찾는 고객이 더 오래 머물도록 만드는 것이 목표입니다.",
    capabilities: ["등급별 포인트 적립·사용", "등급별 무료배송 기준 완화", "신상품·기획전 24시간 선공개", "생일·재구매 주기 쿠폰 자동 발급"],
  },
  "partner-center": {
    icon: <Store size={22} />, gradient: ["#0f172a", "#334155"], audience: "입점 브랜드",
    intent: "입점 브랜드가 직접 상품과 재고를 관리하고 정산 내역을 확인하는 브랜드 전용 공간입니다. MD의 수작업을 줄이고 브랜드와 같은 데이터를 보는 것이 목표입니다.",
    capabilities: ["브랜드 직접 상품 등록·수정", "브랜드 재고 시스템 연동", "월별 정산 리포트·세금계산서", "기획전·세일 참여 신청", "브랜드별 판매·반품 대시보드"],
  },
  ads: {
    icon: <Megaphone size={22} />, gradient: ["#1e3a8a", "#60a5fa"], audience: "입점 브랜드 · 마케팅",
    intent: "브랜드가 원하는 상품을 홈·랭킹·검색 결과에 노출하는 광고 상품과 기획전 신청 기능입니다. 노출 성과를 숫자로 보여주는 것이 목표입니다.",
    capabilities: ["홈 배너·기획전 지면 신청", "검색 결과 상단 노출 상품", "노출·클릭·구매 성과 리포트", "예산·기간 설정과 정산"],
  },
  "style-content": {
    icon: <BookOpen size={22} />, gradient: ["#3f3f46", "#a1a1aa"], audience: "탐색 고객",
    intent: "룩북과 스타일링 가이드로 상품을 '입는 장면'으로 보여주는 콘텐츠 영역입니다. 콘텐츠에서 바로 상품으로 이어지는 흐름을 만드는 것이 목표입니다.",
    capabilities: ["시즌 룩북·매거진", "상품 태그가 달린 스타일링 이미지", "체형·핏별 스타일링 가이드", "콘텐츠 → 상품 전환 측정"],
  },
  b2b: {
    icon: <Building2 size={22} />, gradient: ["#14532d", "#86efac"], audience: "기업·단체",
    intent: "기업·단체가 유니폼과 단체복을 한 번에 견적받고 주문하는 B2B 채널입니다. 사이즈 수집부터 세금계산서까지 단체 주문의 번거로움을 줄이는 것이 목표입니다.",
    capabilities: ["단체복·유니폼 견적 요청", "구성원 사이즈 일괄 수집 링크", "수량별 단가·납기 안내", "세금계산서·법인 결제", "단체 주문 분할 배송"],
  },
};

export default function NextPreviewPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const menu = NEXT_MENUS.find((m) => m.slug === slug);
  const content = CONTENT[slug];
  useEffect(() => { document.title = menu ? `${menu.label} (Coming Next) | MORFIT` : "향후 확장 | MORFIT"; }, [menu]);

  if (!menu || !content) {
    return (
      <Container className="py-16 animate-fadeIn">
        <EmptyState icon={<Sparkles size={22} />} title="준비 중인 확장 기능을 찾을 수 없습니다" desc="아래 목록에서 향후 확장 항목을 선택해보세요." action={<div className="flex flex-wrap justify-center gap-2">{NEXT_MENUS.map((m) => <Button key={m.slug} variant="outline" size="sm" href={`/next/${m.slug}`}>{m.label}</Button>)}<Button variant="brand" size="sm" href="/">홈으로</Button></div>} />
      </Container>
    );
  }

  const others = NEXT_MENUS.filter((m) => m.slug !== slug);
  return (
    <Container className="py-6 md:py-10 animate-fadeIn">
      <div className="max-w-[56rem]">
        <Badge tone="next">향후 확장 · Coming Next</Badge>
        <h1 className="mt-3 text-[1.9rem] md:text-[2.4rem] font-black tracking-tight leading-tight inline-flex items-center gap-3"><span className="h-11 w-11 rounded-2xl bg-neutral-canvas md:bg-brand-ivory border border-neutral-border inline-flex items-center justify-center text-neutral-text">{content.icon}</span>{menu.label}</h1>
        <p className="mt-2 text-neutral-text2">{menu.desc} · 대상: {content.audience}</p>

        <div className="mt-6 rounded-2xl border border-semantic-warning/40 bg-[#fff7ed] px-4 py-3.5 flex items-start gap-3" role="note">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-semantic-warning" />
          <p className="text-[0.9rem] leading-relaxed"><strong>현재 구현되지 않은 기능입니다. 계약 범위와 혼동하지 마세요.</strong> 이 화면은 확장 방향을 설명하는 Preview이며, 버튼·데이터·화면 흐름은 아직 존재하지 않습니다.</p>
        </div>

        <div className="mt-8 grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-6">
            <section>
              <h2 className="text-[1.1rem] font-bold mb-2">기획 의도</h2>
              <p className="text-neutral-text2 leading-relaxed">{content.intent}</p>
            </section>
            <section>
              <h2 className="text-[1.1rem] font-bold mb-2">예상 기능</h2>
              <ul className="space-y-2">
                {content.capabilities.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 rounded-xl border border-neutral-border bg-white px-3.5 py-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-neutral-text2" /><span className="font-semibold text-[0.95rem]">{c}</span><Badge tone="next" size="sm" className="ml-auto shrink-0">NEXT</Badge>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-[1.1rem] font-bold mb-2">지금 사용할 수 있는 것</h2>
              <p className="text-[0.9rem] text-neutral-text2 leading-relaxed">현재 Demo에서는 탐색(홈·랭킹·브랜드·검색), 핏 프로필 추천, 찜·재입고 알림, DEMO 주문까지 실제로 동작합니다. 위 확장 기능은 이 데이터 기반 위에 순차적으로 추가될 예정입니다.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="brand" href="/">홈으로</Button>
                <Button variant="outline" href="/ranking">랭킹 보기</Button>
              </div>
            </section>
          </div>
          <div className="md:col-span-5">
            <GradientImage gradient={content.gradient} ratio="aspect-[4/3]" overlay label={`${menu.label} 미리보기 이미지`} className="rounded-cardlg">
              <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
                <p className="text-[0.68rem] font-bold tracking-[0.18em] text-white/70">PREVIEW ONLY</p>
                <p className="mt-1 font-black text-[1.3rem] leading-tight">{menu.label}</p>
                <p className="mt-1 text-[0.82rem] text-white/80">화면·데이터 없음 · 설명용</p>
              </div>
            </GradientImage>
            <div className="mt-4 rounded-2xl border border-neutral-border bg-white p-4">
              <p className="text-[0.8rem] font-bold text-neutral-text2 tracking-wide mb-2">다른 확장 항목</p>
              <ul className="space-y-1">
                {others.map((m) => <li key={m.slug}><Link href={`/next/${m.slug}`} className="flex items-center justify-between h-11 px-2 rounded-xl hover:bg-neutral-canvas font-semibold text-[0.9rem]">{m.label}<ChevronRight size={16} className="text-neutral-text2" /></Link></li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
