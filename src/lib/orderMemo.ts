/* 주문 메모 — 저장 형식은 한 줄 문자열(기존 데이터와 호환), 화면에서는 항목별로 나눠 보여준다.
   형식: "<배송 요청> · 주문자 <이름> <연락처> · 쿠폰 <코드> · 결제수단(데모): <수단>" (앞 세 항목은 선택) */

const SEP = " · ";

export interface OrderMemoParts {
  request: string;
  orderer: string;
  coupon: string;
  payment: string;
}

/** 주문서 입력값 → 저장용 메모 (결제수단은 store.placeOrder가 붙인다) */
export function buildOrderMemo({ request, name, phone, coupon }: { request: string; name: string; phone: string; coupon?: string }) {
  return [request.trim(), `주문자 ${name.trim()} ${phone.trim()}`, coupon ? `쿠폰 ${coupon}` : ""].filter(Boolean).join(SEP);
}

export const withPayment = (memo: string | undefined, payment: string) => (memo ? `${memo}${SEP}결제수단(데모): ${payment}` : `결제수단(데모): ${payment}`);

/** 저장된 메모 → 항목. 알 수 없는 조각은 배송 요청으로 모은다(요청 문구 안의 ' · '도 보존). */
export function parseOrderMemo(memo?: string): OrderMemoParts {
  const out: OrderMemoParts = { request: "", orderer: "", coupon: "", payment: "" };
  for (const part of (memo ?? "").split(SEP).map((x) => x.trim()).filter(Boolean)) {
    if (part.startsWith("주문자 ")) out.orderer = part.slice(4);
    else if (part.startsWith("쿠폰 ")) out.coupon = part.slice(3);
    else if (part.startsWith("결제수단")) out.payment = part.replace(/^결제수단(\(데모\))?:\s*/, "");
    else out.request = out.request ? `${out.request}${SEP}${part}` : part;
  }
  return out;
}
