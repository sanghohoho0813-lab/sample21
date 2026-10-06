/* 입력 검증 규칙 — 주문서·핏 프로필(스타일 찾기·상품 상세) 폼이 함께 쓴다. 문구도 여기서 한 번만 정한다. */

export const FIT_RANGE = {
  height: { label: "키", min: 120, max: 220, unit: "cm" },
  weight: { label: "몸무게", min: 30, max: 200, unit: "kg" },
} as const;
export type FitNumberField = keyof typeof FIT_RANGE;

export const fitRangeMessage = (field: FitNumberField) => {
  const r = FIT_RANGE[field];
  return `${r.label}는 ${r.min}~${r.max}${r.unit} 사이로 입력해주세요.`;
};

/** 빈 칸은 '입력 안 함'(null), 범위 안 숫자는 그 값, 그 밖은 오류 */
export function parseFitNumber(field: FitNumberField, raw: string): { value: number | null; error: string | null } {
  if (!raw.trim()) return { value: null, error: null };
  const n = Number(raw);
  const r = FIT_RANGE[field];
  return Number.isFinite(n) && n >= r.min && n <= r.max
    ? { value: n, error: null }
    : { value: null, error: fitRangeMessage(field) };
}

/** 국내 휴대폰·지역번호 형식 (하이픈 선택) — 010-1234-5678, 01012345678, 02-123-4567 */
export const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
export const isValidPhone = (v: string) => PHONE_RE.test(v.trim());

export const CUSTOM_REQUEST = "직접 입력";

export interface CheckoutInput {
  name: string;
  phone: string;
  address: string;
  request: string;
  customRequest: string;
  agree: boolean;
}
export type CheckoutField = "name" | "phone" | "address" | "request" | "agree";
/** 화면 위에서 아래 순서 — 첫 번째 오류 칸으로 이동할 때 쓴다 */
export const CHECKOUT_FIELDS: CheckoutField[] = ["name", "phone", "address", "request", "agree"];

export function validateCheckout(i: CheckoutInput): Partial<Record<CheckoutField, string>> {
  const err: Partial<Record<CheckoutField, string>> = {};
  if (!i.name.trim()) err.name = "주문자 이름을 입력해주세요.";
  if (!isValidPhone(i.phone)) err.phone = "휴대폰 번호 형식을 확인해주세요. (예: 010-1234-5678)";
  if (i.address.trim().length < 5) err.address = "배송지 주소를 입력해주세요.";
  if (i.request === CUSTOM_REQUEST && !i.customRequest.trim()) err.request = "배송 요청사항을 입력해주세요.";
  if (!i.agree) err.agree = "데모 주문 안내에 동의해주세요.";
  return err;
}
