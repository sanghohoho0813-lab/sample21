"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { PRODUCT_BY_ID } from "@/lib/demo/seed";
import { Hydrated } from "@/components/system/Hydrated";
import { Container } from "@/components/customer/Section";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { ProductDetail, ProductDetailSkeleton } from "@/components/customer/conversion/ProductDetail";
import { useDocumentTitle } from "@/components/customer/conversion/shared";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id ?? ""));
  const product = PRODUCT_BY_ID[id];
  useDocumentTitle(product ? `${product.name} — 상품 상세` : "상품을 찾을 수 없습니다");
  if (!product) {
    return (
      <Container className="py-16">
        <EmptyState icon={<Search size={22} />} title="상품을 찾을 수 없습니다" desc={`'${id}' 상품이 없거나 판매가 종료되었습니다. 다른 상품을 둘러보세요.`} action={<div className="flex gap-2"><Button variant="brand" href="/ranking">랭킹 보기</Button><Button variant="outline" href="/shop">전체 상품</Button></div>} />
      </Container>
    );
  }
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <Hydrated fallback={<ProductDetailSkeleton />}>
        <ProductDetail key={product.id} product={product} />
      </Hydrated>
    </Suspense>
  );
}
