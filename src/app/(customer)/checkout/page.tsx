"use client";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, CreditCard, Landmark, Smartphone, ShieldCheck, MapPin, User } from "lucide-react";
import { DEMO_CUSTOMER_NAME } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";
import { effPrice } from "@/lib/kpi";
import { krw } from "@/lib/format";
import { Hydrated } from "@/components/system/Hydrated";
import { Container, PageTitle } from "@/components/customer/Section";
import { Button } from "@/components/ui/Button";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { EmptyState, SkeletonCard } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { OrderItemRow, PriceSummary } from "@/components/customer/conversion/OrderBits";
import { couponByCode, couponDiscount, etaLabel, parseVariant, shippingFeeFor, useDocumentTitle } from "@/components/customer/conversion/shared";

const PAYMENTS = [
  { key: "카드", label: "신용·체크카드", desc: "카드사 결제창 연결 예정", icon: CreditCard },
  { key: "계좌이체", label: "계좌이체", desc: "실시간 계좌이체 연결 예정", icon: Landmark },
  { key: "간편결제", label: "간편결제", desc: "네이버·카카오·토스 연결 예정", icon: Smartphone },
];
const REQUESTS = ["문 앞에 놓아주세요", "경비실에 맡겨주세요", "배송 전 연락 부탁드립니다", "부재 시 문자 남겨주세요", "직접 입력"];

function CheckoutForm() {
  const store = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const cp = couponByCode(params.get("coupon"));
  const [name, setName] = useState(DEMO_CUSTOMER_NAME);
  const [phone, setPhone] = useState("010-0000-0000");
  const [address, setAddress] = useState("서울 마포구 성산로 12");
  const [detail, setDetail] = useState("");
  const [request, setRequest] = useState(REQUESTS[0]);
  const [customRequest, setCustomRequest] = useState("");
  const [payment, setPayment] = useState(PAYMENTS[0].key);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const rows = store.cart.map((c) => { const parsed = parseVariant(c.variantId); return parsed ? { c, ...parsed, price: effPrice(parsed.product, store) } : null; }).filter((r): r is NonNullable<typeof r> => !!r);
  const subtotal = rows.reduce((s, r) => s + r.price * r.c.qty, 0);
  const itemDiscount = rows.reduce((s, r) => s + (r.product.price - r.price) * r.c.qty, 0);
  const cDisc = couponDiscount(subtotal, cp.rate);
  const ship = shippingFeeFor(subtotal);
  const total = subtotal - cDisc + ship;

  if (rows.length === 0 && !submitting) {
    return <EmptyState icon={<ShoppingBag size={22} />} title="주문할 상품이 없습니다" desc="장바구니에 상품을 담은 뒤 주문서로 이동하세요." action={<div className="flex gap-2"><Button variant="brand" href="/cart">장바구니로 이동</Button><Button variant="outline" href="/ranking">상품 둘러보기</Button></div>} />;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = "주문자 이름을 입력해주세요.";
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone.trim())) err.phone = "휴대폰 번호 형식을 확인해주세요. (예: 010-1234-5678)";
    if (address.trim().length < 5) err.address = "배송지 주소를 입력해주세요.";
    if (request === "직접 입력" && !customRequest.trim()) err.request = "배송 요청사항을 입력해주세요.";
    if (!agree) err.agree = "DEMO 주문 안내에 동의해주세요.";
    setErrors(err);
    if (Object.keys(err).length) { toast("입력 내용을 확인해주세요", Object.values(err)[0], "warning"); return; }
    setSubmitting(true);
    const memo = request === "직접 입력" ? customRequest.trim() : request;
    const order = store.placeOrder({ address: `${address.trim()}${detail.trim() ? ` ${detail.trim()}` : ""}`, memo: `${memo} · 주문자 ${name.trim()} ${phone.trim()}${cp.code ? ` · 쿠폰 ${cp.code}` : ""}`, couponRate: cp.rate, payment });
    toast("DEMO 주문이 완료되었습니다", `주문번호 ${order.id} · Business AX에 즉시 반영`);
    router.push(`/checkout/complete/${order.id}`);
  };

  return (
    <form onSubmit={submit} noValidate className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8 items-start">
      <div className="space-y-5 min-w-0">
        <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
          <h2 className="font-bold text-[1.05rem] flex items-center gap-2 mb-4"><User size={18} />주문자 정보</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Input label="이름" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="주문자 이름" required aria-invalid={!!errors.name} className={cn(errors.name && "border-semantic-error")} />{errors.name && <p className="mt-1 text-[0.82rem] text-semantic-error">{errors.name}</p>}</div>
            <div><Input label="휴대폰" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" inputMode="tel" required aria-invalid={!!errors.phone} className={cn(errors.phone && "border-semantic-error")} hint="가상 번호 · 실제 문자 발송 없음" />{errors.phone && <p className="mt-1 text-[0.82rem] text-semantic-error">{errors.phone}</p>}</div>
          </div>
        </section>

        <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
          <h2 className="font-bold text-[1.05rem] flex items-center gap-2 mb-4"><MapPin size={18} />배송지</h2>
          <div className="space-y-4">
            <div><Input label="주소" name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="도로명 주소" required aria-invalid={!!errors.address} className={cn(errors.address && "border-semantic-error")} />{errors.address && <p className="mt-1 text-[0.82rem] text-semantic-error">{errors.address}</p>}</div>
            <Input label="상세 주소 (선택)" name="addressDetail" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="동·호수 등" />
            <Select label="배송 요청사항" name="request" value={request} onChange={(e) => setRequest(e.target.value)}>{REQUESTS.map((r) => <option key={r} value={r}>{r}</option>)}</Select>
            {request === "직접 입력" && <div><Textarea name="customRequest" value={customRequest} onChange={(e) => setCustomRequest(e.target.value)} placeholder="배송 기사님께 전달할 내용을 입력하세요" maxLength={100} />{errors.request && <p className="mt-1 text-[0.82rem] text-semantic-error">{errors.request}</p>}</div>}
            <p className="text-[0.85rem] text-neutral-text2 inline-flex items-center gap-1.5"><ShieldCheck size={14} />{etaLabel(ship === 0)} · {ship === 0 ? "무료배송" : "배송비 3,000원"}</p>
          </div>
        </section>

        <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
          <h2 className="font-bold text-[1.05rem] flex items-center gap-2 mb-1"><CreditCard size={18} />결제수단 <Badge tone="ready" size="sm">Preview</Badge><DemoBadge /></h2>
          <p className="text-[0.85rem] text-neutral-text2 mb-4">PG 연동 전 단계입니다. 선택만 기록되고 실제 결제는 일어나지 않습니다.</p>
          <div className="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="결제수단">
            {PAYMENTS.map((p) => { const Icon = p.icon; const on = payment === p.key; return (
              <label key={p.key} className={cn("cursor-pointer rounded-2xl border p-4 flex flex-col gap-1 transition-all duration-fast hover:border-neutral-text2 active:scale-[0.99]", on ? "border-brand-black bg-brand-black text-white" : "border-neutral-border bg-white")}>
                <input type="radio" name="payment" value={p.key} checked={on} onChange={() => setPayment(p.key)} className="sr-only" />
                <span className="flex items-center gap-2 font-bold"><Icon size={18} />{p.label}</span>
                <span className={cn("text-[0.78rem]", on ? "text-white/70" : "text-neutral-text2")}>{p.desc} · DEMO</span>
              </label>
            ); })}
          </div>
        </section>

        <section className="rounded-cardlg border border-neutral-border bg-white p-5 md:p-6">
          <h2 className="font-bold text-[1.05rem] mb-3">주문 상품 {rows.length}건</h2>
          <ul className="divide-y divide-neutral-border">{rows.map((r) => <li key={r.c.variantId} className="py-3 first:pt-0 last:pb-0"><OrderItemRow item={{ variantId: r.c.variantId, productId: r.product.id, qty: r.c.qty, unitPrice: r.price, discount: r.product.price - r.price }} /></li>)}</ul>
        </section>
      </div>

      <aside className="lg:sticky lg:top-[96px] rounded-cardlg border border-neutral-border bg-white p-5 md:p-6 shadow-card space-y-4 min-w-0">
        <p className="font-bold text-[1.05rem]">결제 예정 금액</p>
        <PriceSummary subtotal={subtotal} itemDiscount={itemDiscount} coupon={cDisc} shipping={ship} total={total} couponLabel={cp.code || undefined} />
        {cp.code && <p className="text-[0.82rem] text-brand-accent font-semibold">{cp.code} 쿠폰 적용 · {cp.rate}% 할인 ({krw(cDisc)})</p>}
        <label className={cn("flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors", errors.agree ? "border-semantic-error" : "border-neutral-border hover:bg-brand-ivory")}>
          <input type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 accent-[#111111]" />
          <span className="text-[0.88rem] leading-relaxed"><span className="font-bold">DEMO 주문 안내에 동의합니다.</span><br /><span className="text-neutral-text2">실제 결제·배송이 이루어지지 않는 시연용 주문이며, 주문 데이터는 Business AX 화면에 반영됩니다.</span></span>
        </label>
        {errors.agree && <p className="text-[0.82rem] text-semantic-error -mt-2">{errors.agree}</p>}
        <Button type="submit" variant="brand" size="lg" full loading={submitting} icon={<ShieldCheck size={18} />}>DEMO 주문 완료</Button>
        <p className="text-[0.78rem] text-neutral-text2 leading-relaxed">주문 즉시 재고가 차감되고 운영팀 주문 목록에 나타납니다. 결제 대기 상태로 시작되며 운영직원이 상태를 변경합니다.</p>
      </aside>
    </form>
  );
}

export default function CheckoutPage() {
  useDocumentTitle("주문서 (DEMO)");
  return (
    <Container className="py-6 md:py-10">
      <div className="rounded-cardlg bg-brand-black text-white px-5 py-4 mb-6 flex items-start gap-3"><DemoBadge label="DEMO CHECKOUT" /><p className="text-[0.9rem] leading-relaxed">DEMO CHECKOUT — 실제 결제는 연결되지 않으며, 주문 흐름을 보여주는 시연입니다.</p></div>
      <PageTitle title="주문서" desc="주문자·배송지·결제수단을 확인하고 DEMO 주문을 완료하세요." />
      <Suspense fallback={<SkeletonCard lines={6} />}>
        <Hydrated fallback={<div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6"><div className="space-y-5"><SkeletonCard lines={3} /><SkeletonCard lines={4} /><SkeletonCard lines={3} /></div><SkeletonCard lines={6} /></div>}><CheckoutForm /></Hydrated>
      </Suspense>
    </Container>
  );
}
