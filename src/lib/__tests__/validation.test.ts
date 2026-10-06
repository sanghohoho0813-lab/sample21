import { describe, expect, it } from "vitest";
import { CHECKOUT_FIELDS, isValidPhone, parseFitNumber, validateCheckout } from "@/lib/validation";

describe("isValidPhone", () => {
  it.each(["010-1234-5678", "01012345678", "02-123-4567", " 010-1234-5678 "])("허용: %s", (v) =>
    expect(isValidPhone(v)).toBe(true),
  );
  it.each(["", "123", "010-12-5678", "1012345678", "010-1234-56789"])("거부: '%s'", (v) =>
    expect(isValidPhone(v)).toBe(false),
  );
});

describe("parseFitNumber", () => {
  it("빈 칸은 입력하지 않은 것으로 본다", () =>
    expect(parseFitNumber("height", "  ")).toEqual({ value: null, error: null }));
  it("경계값은 허용", () => {
    expect(parseFitNumber("height", "120").value).toBe(120);
    expect(parseFitNumber("weight", "200").value).toBe(200);
  });
  it("범위 밖·숫자가 아닌 값은 조용히 버리지 않고 오류를 돌려준다", () => {
    expect(parseFitNumber("height", "300")).toEqual({ value: null, error: "키는 120~220cm 사이로 입력해주세요." });
    expect(parseFitNumber("weight", "abc").error).toBe("몸무게는 30~200kg 사이로 입력해주세요.");
  });
});

describe("validateCheckout", () => {
  const ok = {
    name: "김하늘",
    phone: "010-1234-5678",
    address: "서울 마포구 성산로 12",
    request: "문 앞에 놓아주세요",
    customRequest: "",
    agree: true,
  };
  it("올바른 입력은 오류가 없다", () => expect(validateCheckout(ok)).toEqual({}));
  it("빈 주문서는 모든 필수 칸을 화면 순서대로 알려준다", () => {
    const err = validateCheckout({
      name: "",
      phone: "",
      address: "",
      request: "직접 입력",
      customRequest: " ",
      agree: false,
    });
    expect(CHECKOUT_FIELDS.filter((f) => err[f])).toEqual(["name", "phone", "address", "request", "agree"]);
  });
});
