import { describe, expect, it } from "vitest";
import { buildOrderMemo, parseOrderMemo, withPayment } from "@/lib/orderMemo";

describe("order memo", () => {
  it("저장 → 화면 항목으로 그대로 돌아온다", () => {
    const memo = withPayment(
      buildOrderMemo({ request: "문 앞에 놓아주세요", name: " 김하늘 ", phone: "010-1234-5678", coupon: "WELCOME5" }),
      "카드",
    );
    expect(memo).toBe("문 앞에 놓아주세요 · 주문자 김하늘 010-1234-5678 · 쿠폰 WELCOME5 · 결제수단(데모): 카드");
    expect(parseOrderMemo(memo)).toEqual({
      request: "문 앞에 놓아주세요",
      orderer: "김하늘 010-1234-5678",
      coupon: "WELCOME5",
      payment: "카드",
    });
  });
  it("쿠폰이 없으면 쿠폰 항목을 만들지 않는다", () => {
    expect(buildOrderMemo({ request: "경비실에 맡겨주세요", name: "김하늘", phone: "01012345678" })).toBe(
      "경비실에 맡겨주세요 · 주문자 김하늘 01012345678",
    );
  });
  it("요청 문구 안의 구분자도 보존한다", () => {
    expect(parseOrderMemo("벨 누르지 마세요 · 문 앞 · 결제수단(데모): 카드").request).toBe("벨 누르지 마세요 · 문 앞");
  });
  it("결제수단만 있는 예전 메모·빈 메모도 처리한다", () => {
    expect(parseOrderMemo(withPayment(undefined, "계좌이체"))).toEqual({
      request: "",
      orderer: "",
      coupon: "",
      payment: "계좌이체",
    });
    expect(parseOrderMemo(undefined)).toEqual({ request: "", orderer: "", coupon: "", payment: "" });
  });
});
