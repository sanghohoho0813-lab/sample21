# DECISIONS.md — MORFIT 주요 설계 결정 (WHY / WHY NOT / REVISIT WHEN)

## D-01 Customer Front와 Business AX를 하나의 Next.js 앱, 하나의 Zustand 스토어로 구현
- WHY: Closed Data Loop(고객 Event → AX → 고객 환류)를 Demo에서 **실제로** 체감시키려면 두 Surface가 같은 상태를 공유해야 함. 별도 앱/Mock API는 왕복 지연과 불일치를 만든다.
- WHY NOT ALTERNATIVE: (a) Supabase 즉시 도입 — API 키·비용·설정이 Hard Blocker가 되어 첫 빌드가 멈춤. (b) 두 앱 분리 — 시연 시 상태 동기화 불가.
- REVISIT WHEN: Pilot 전환 시 `store.ts` action을 Supabase repository 호출로 교체(구조는 이미 분리).

## D-02 Demo Repository = 결정론적 시드(PRNG) + 주문에서 파생되는 판매·재고 통계
- WHY: 매출·주문·수량·재고·반품·찜이 서로 모순되면 심사자가 즉시 신뢰를 잃는다. 주문을 먼저 생성하고 옵션 판매·일별 매출을 **주문에서 계산**해 정합성을 보장.
- WHY NOT: 화면별 하드코딩 숫자 — 유지보수 불가, 모순 발생.
- REVISIT WHEN: 실데이터 CSV Import 시 seed를 Adapter로 대체.

## D-03 Scenario A~D를 주문 생성에 결정론적으로 주입
- WHY: 시연 스토리(옥스포드 셔츠 블랙 M 급상승·품절위험, 데님 사이즈 반품, 발마칸 코트 저회전, AERNO 재구매 주기)가 어떤 날짜에 열어도 유지되어야 함. Action 카드의 근거 문장도 계산값으로 생성.
- REVISIT WHEN: 실데이터 연결 후 Scenario 제거.

## D-04 AI는 전부 규칙 기반(RULE/STAT) + "AI READY" 표시, LLM 호출 없음
- WHY: API 키 없음. Unified §42 "외부 LLM API 임의 호출 금지". 재입고·할인·핏·재구매는 규칙과 수식으로 충분히 설명 가능(AI Fit Gate 통과 4개). 자연어 브리핑만 LLM 가치가 높아 1순위 연결 지점으로 준비(`src/lib/ai.ts`).
- WHY NOT: "AI가 추천했습니다" 포장 — Strategic P0.
- REVISIT WHEN: `ANTHROPIC_API_KEY` 제공 시 `/api/ai/explain` Route 추가 후 AI Briefing 1개만 연결.

## D-05 자동발주 L4 미구현, 모든 Action은 L2/L3(사람 승인)
- WHY: Error Cost MID, 브랜드 정책·현금흐름에 영향. MORFIT 프롬프트 §19 명시.
- REVISIT WHEN: 12주 실증 후 저위험 베이식(UNIT ZERO 티셔츠 등)에 한해 L4 검토.

## D-06 Customer Public 화면에 Theme Picker 미노출, 브랜드 토큰 고정 + AX 테마 연동은 Accent만
- WHY: MORFIT은 독립 패션 브랜드로 보여야 함(§35). Unified §Hybrid Theme 규칙(AX 선택 테마가 Customer에도 전달)은 `--brand-accent`가 테마 Primary를 따르는 방식으로 충족. 기본 테마(01 Deep Navy)에서는 MORFIT Cobalt `#315CF5`.
- WHY NOT: 고객 화면 전체를 테마색으로 물들이기 — 브랜드 일관성 훼손.

## D-07 Device Preview = 같은 Route를 iframe으로 여는 True Viewport
- WHY: 부모 transform으로 fixed/sticky가 깨지는 CSS-scale 방식의 P0 결함을 원천 차단. iframe 내부(`window.self !== window.top`)에서는 Preview 버튼을 숨겨 재귀 금지. 상태는 localStorage로 공유.
- WHY NOT: 별도 `/mobile-preview` Route — 404·상태 불일치 위험.

## D-08 사진 자산은 추후 적용, 지금은 색상 DNA 기반 Gradient Placeholder
- WHY: 사용자 지시("사진은 추후 적용"). Drive 폴더가 비어 있음. 빈 박스 대신 상품 색상으로 만든 placeholder를 사용하고, `/public/images` + `src/lib/assets.ts` 등록만으로 교체 가능하게 설계.
- REVISIT WHEN: Drive 폴더에 자산 업로드 시 `AVAILABLE` 배열 등록.

## D-09 Font: Pretendard Variable(CDN) + 시스템 폴백, Root 18px(Customer)/19px(AX)
- WHY: 한글 가독성·Executive Readability. 오프라인/차단 환경에서도 시스템 폰트로 안전.

## D-10 Recharts 2.x 사용 (3.x 미사용)
- WHY: 안정성·문서량. 차트는 모두 실제 데이터에서 렌더링(가짜 이미지 금지).

## D-11 NEXT 메뉴는 `/next/[slug]` Preview 페이지로 구현 (Footer + Drawer 노출, 상단 Nav에는 미노출)
- WHY: 70/30 규칙. 현재 핵심 8개 메뉴가 우선. Preview 페이지는 예상 기능 3~5개만 보여주고 "향후 확장" 배지로 현재 기능과 분리.

## D-12 기술자산(특허·벤처) 표시 = "해당없음 (Demo 프로젝트)"
- WHY: 가상 회사. 출원하지 않은 특허를 출원된 것처럼 표시 금지(Unified §71).

## D-13 주문의 42%를 비회원(1회 구매) 주문으로 생성
- WHY: 회원 361명에 주문 1,200건을 모두 배정하면 재구매율이 90%를 넘는 비현실적 KPI가 된다(Red Team BUSINESS DEVIL). 비회원 주문을 섞어 재구매율 약 25%, 회원 구매고객 264명으로 현실적인 분포를 만든다.
- WHY NOT: 회원 수를 1,000명 이상으로 늘리기 — 고객 화면·문서의 "고객 300~500명" 규모 지침과 충돌.

## D-14 Recharts 애니메이션 전체 비활성화
- WHY: 시연·스크린샷·인쇄 시 차트가 비어 보이는 문제(애니메이션 도중 캡처). 정보 전달이 장식 모션보다 우선(Unified Motion 원칙).

## D-15 상품 상세: '품절 임박' 옵션에서도 재입고 알림 신청 제공
- WHY: Scenario A(재고 4개)의 시연 경로에서 고객 → Demand Radar → Action → 알림 Loop를 끊김 없이 보여주기 위함. 품절 옵션은 기존처럼 주 CTA가 재입고 알림으로 바뀐다.

## D-16 KPI 기간 비교는 일 단위 경계(00:00)로 계산
- WHY: "지금 시각" 기준 창은 오늘의 남은 시간만큼 현재 기간이 짧아져 매출이 항상 하락처럼 보였다. 직전 기간과 같은 길이의 온전한 일 단위 창으로 비교한다.

## D-17 재입고 알림 → 구매 전환은 주문 시점에 자동으로 닫는다 (RestockSubscription.status = purchased)
- WHY: Loop 1이 "알림 발송"에서 끝나면 재입고 Action이 매출로 이어졌는지 증명할 수 없다. 고객이 해당 옵션을 주문하는 순간 purchased(+purchasedAt, purchaseOrderId)로 바꾸고 RESULT Evidence를 남겨 알림→구매 퍼널을 코드로 계산한다.
- WHY NOT: 알림 후 N일 내 구매만 인정 — Demo에서는 시간 창을 두면 시연이 끊긴다. 실증에서 창(예: 7일)을 붙인다 (Baseline 측정 항목).

## D-18 Evidence Pack은 Pilot 전에도 "DEMO 미리보기"로 연다 (인쇄·JSON)
- WHY: 대표·심사자는 "어떤 형식으로 증명할 것인가"를 미리 봐야 한다. 대신 모든 변화 칸을 VALIDATE LATER, Baseline을 UNKNOWN / REQUIRED로 고정해 개선율을 지어낼 수 없게 했다.
- WHY NOT: CSV/PDF 생성 라이브러리 추가 — 브라우저 인쇄(PDF)와 JSON이면 심사 재사용에 충분하고 의존성이 없다.

## D-19 LLM은 서버 Route(/api/ai/explain)에서만, 키가 있을 때만 호출한다
- WHY: 브라우저 키 노출 금지·외부 API 임의 호출 금지(Unified §42). 키가 없으면 규칙 텍스트를 그대로 돌려주어 화면이 절대 비지 않는다. 구조화된 KPI 숫자만 전달하며 개인정보는 보내지 않는다. 연결 범위는 경영 브리핑 1곳.
- WHY NOT: 4개 엔진에 LLM 근거 생성 — 규칙 기반 근거가 먼저 실증되어야 LLM 문장의 가치를 비교할 수 있다.

## D-20 Unit Economics는 "계산 가능한 항목"과 "측정 설계"를 분리해 표시한다
- WHY: 객단가·주문당 매출총이익·배송비 비중·사입/위탁 구성은 지금 데이터로 계산되지만 CAC·LTV·Payback은 마케팅비·코호트가 없으면 추정값이 된다. Demo에서 추정값을 넣는 순간 Fake KPI가 된다.

## D-21 AX 사이드바를 5그룹 → 4그룹으로 재편 (질문이 같은 화면끼리)
- 그룹: **오늘의 판단**(대시보드·Action) / **상품 · 재고**(상품·재고·브랜드) / **고객 · 매출**(매출·고객·핏·캠페인·주문) / **근거 · 설정**(Evidence·Why AX·시연·설정).
- WHY: 기존 "핵심 운영"과 "운영"은 이름이 겹쳐 무엇이 다른지 알 수 없었고, Evidence가 '운영'에, 설정이 1개짜리 그룹에 있었다. 새 기준은 **"이 화면에서 답하는 질문"** — 지금 결정할 것 / 공급(무엇을 언제 채울까) / 수요(누가 얼마에 사는가) / 증거와 설정.
- 브랜드·파트너를 공급 쪽에 둔 이유: 리드타임·정산 조건이 재입고 판단의 입력값이다. 주문·배송을 수요 쪽에 둔 이유: 주문은 고객이 만든 결과이고 상태 변경이 곧바로 고객 화면(Loop 2)으로 돌아간다.
- 그룹 헤더에 항목 수와 톤 점을 표시하고 그룹 사이에 구분선을 넣었다. 모바일 하단탭은 배열 인덱스 대신 `navByKey()`로 조회한다(순서를 바꿔도 깨지지 않음).

## D-22 아이콘 색상: 8개 장식색 → '같은 색의 10단계 톤' (테마 Primary 파생)
- `--icon-t1~t10` 을 `color-mix(in oklab, var(--theme-primary), #000/#fff)` 로 파생한다. 테마를 바꾸면 10단계가 통째로 따라 움직이고, 화면에서 장식색(무지개 아이콘)은 0이 된다.
- 톤은 위에서 아래로 진함 → 옅음. t1이 가장 주목도가 높고 t10(무채 혼합)이 가장 낮다 — 색이 아니라 **톤이 중요도**를 말한다.
- WHY NOT 고정 팔레트: 9개 테마 중 어떤 것을 골라도 아이콘만 파란색으로 남아 테마가 반쪽만 바뀌는 문제가 생긴다.
- `color-mix` 미지원 브라우저용 고정 hex 폴백을 함께 둔다(@supports).
- **차트 계열색은 분리**: 차트는 '구분'이 목적이라 같은 색 톤 차이만으로는 계열을 못 읽는다. 테마 4색 + 각 색의 변형(`--chart-5~8`)을 쓴다.

## D-23 모션은 '진입 · 전환 · 상태 변화'에만 넣는다 (장식 모션 금지)
- 넣은 것: 페이지 전환(rise), KPI·카드·목록 순차 진입(stagger), 사이드바 호버(3px 이동 + 강조바 성장 + 아이콘 타일 확대), 버튼 광택 스윕·누름 반응, 표 행 왼쪽 강조바, 링크 밑줄 그리기, 화살표 nudge, 긴급 Action 호흡 점.
- 넣지 않은 것: **숫자 카운트업**(읽는 순간 정확한 값이 더 중요하고, 시연·스크린샷 중 중간값이 찍힌다), **차트 애니메이션**(D-14 유지).
- 모든 모션은 설정의 '모션 줄이기', OS의 `prefers-reduced-motion`, 인쇄(Evidence Pack)에서 자동으로 꺼진다. 진입 모션은 `transform: none`으로 끝나 stacking context를 남기지 않는다(튜토리얼 스포트라이트 보호).

## D-24 토큰 색(CSS 변수)에 투명도 수식이 먹도록 Tailwind 색 정의를 함수형으로 바꿈
- 증상: `border-neutral-text2/40`, `bg-brand-accent/5`, `ring-theme-primary/20` 처럼 **토큰 색 + 투명도** 조합 74곳이 CSS를 아예 생성하지 않아 호버·구분선·강조 배경이 조용히 죽어 있었다(에러도 경고도 없음). Tailwind v3는 `var(--x)` 색의 알파를 계산하지 못한다.
- 조치: `tailwind.config.ts`에서 토큰 색을 함수로 정의해 투명도가 오면 `color-mix(in srgb, var(--x) N%, transparent)`로 직접 섞는다. 74곳이 한 번에 살아난다.
- 주의: 이 규칙은 CSS 변수 색에만 적용된다. 리터럴 색(`bg-white/20`)은 원래대로 동작한다. 스케일 밖 숫자(`/8`, `/12`)는 여전히 생성되지 않으므로 `bg-white/[0.08]` 형태를 쓴다.

## D-25 미래AI랩 브릿지 CTA는 '셸'에 한 번만 심는다 (페이지마다 붙이지 않음)
- `SampleBridgeCTA`를 CustomerShell(푸터 위)과 AxShell(main 끝)에 각각 1회 배치해 **모든 화면 하단에 자동으로** 같은 구조가 나온다. 페이지 파일은 건드리지 않아 기존 샘플 디자인·흐름이 그대로 유지된다.
- 링크·문구는 `src/lib/mirae.ts` 한 곳(MIRAE_LINKS / MIRAE_COPY)에서만 관리하고, 컴포넌트는 `consultHref` · `samplesHref` · `homeHref` props로 덮어쓸 수 있다.
- 로고는 화면에 이미 있으므로 반복하지 않고 `MIRAE AI LAB` 배지 + 브랜드명만 쓴다. 메인 CTA 문구는 **"우리 회사도 만들어보기"** 로 통일.
- 팔레트만 surface로 나눈다: 고객 화면은 아이보리·잉크(브랜드 톤), AX는 테마 컬러. 구조·문구·링크는 동일.
- 외부 링크는 전부 `target="_blank" rel="noopener noreferrer"` + 새 창 안내. Evidence Pack 인쇄에서는 `no-print`로 빠진다(보고서에 광고가 찍히지 않게).
- 모바일 sticky mini CTA는 넣지 않았다 — 두 화면 모두 이미 하단 고정 내비게이션이 있어 겹치고, 광고 배너 느낌이 난다. 대신 AX 사이드바 왼쪽 아래에 축소판(`SampleBridgeMini`)으로 3개 링크를 상시 노출한다.

## D-26 장식용 반복 모션은 '모션 줄이기'에서 빠르게 돌리지 않고 끈다
- 기존 규칙은 `animation-duration: 1ms`만 강제해서, 무한 반복 모션(호흡 점·스켈레톤·CTA 광택)이 **1ms 주기로 고속 점멸**할 수 있었다. `animation-iteration-count: 1`을 함께 강제하고, 순수 장식(`.animate-breathe`, `.sheen-idle::after`)은 `animation: none`으로 완전히 끈다.
- 메인 CTA 광택은 6초 주기 중 마지막 1초에만 흰색 22% 띠가 지나간다(색 변화·깜빡임 없음). 마우스를 올리면 일시정지하고, 대신 살짝 떠오르며 색 그림자(glow)가 생긴다.


## D-27 메뉴는 '1차 5~8개 · 최대 2단계'로 묶는다 (기능 삭제 0 · 위치만 이동)
- AX 사이드바: 14개 평면 메뉴 → **1차 8개**(경영 대시보드 · 실행 센터 · 상품·재고▸ · 주문·고객▸ · 매출·마케팅▸ · 성과 증빙 · 소개·시연▸ · 설정). ▸는 아코디언이며, 현재 화면이 속한 묶음만 자동으로 펼친다. 같은 묶음의 형제 화면은 본문 위 **섹션 탭**으로도 이동할 수 있다(2단계 안에서 끝남).
- 고객 전체 메뉴: 19개 평면(메뉴 7 + 카테고리 7 + 향후 확장 5) → **1차 7개**(홈 · 랭킹 · 신상품·세일▸ · 카테고리▸ · 브랜드 · 스타일 찾기 · 내 쇼핑▸). '향후 확장'은 접힌 한 줄("확장 기능 보기 · 예정")로 내렸다.
- WHY: 처음 보는 사람이 첫 화면에서 읽어야 하는 단어 수를 절반 이하로 줄이면 "무엇을 하는 서비스인지"가 먼저 보인다. 메뉴를 지우면 기능이 사라지지만, 묶으면 기능은 그대로이고 탐색 비용만 1클릭 늘어난다.
- 모든 Route · 권한(roles) · 튜토리얼 대상은 그대로다. 튜토리얼이 가리키던 메뉴가 접힌 묶음 안에 있으면 묶음 헤더(`nav-group-*`)를 가리킨다.
- 햄버거는 두 화면 모두 **왼쪽**, Drawer는 `86vw · 최대 380px`, Drawer 안에서만 스크롤되고 배경은 잠긴다. Drawer 맨 아래에 화면 전환 CTA를 고정한다(AX → "고객 플랫폼 보기", 고객 → "AX 운영화면 보기", 고객 역할에서는 숨김).

## D-28 화면 문구는 한글로 통일한다 (예외: AI · AX · B2B · B2C · 브랜드·서비스명)
- 영어 메뉴·배지·버튼을 한글로 바꿨다(Action Center → 실행 센터, Evidence → 증빙, Demand Radar → 수요 레이더, NEXT → 예정, Preview → 미리보기, DEMO → 데모 등). 코드 값(`"DEMO"`, `"NEXT"`, 이벤트 타입)은 **바꾸지 않고** 화면에 보일 때만 라벨 표(`SOURCE_LABEL`, `CAPABILITY_LABEL`, `EVIDENCE_TYPE_LABEL`, `ENGINE_LABEL`)를 거친다 — 저장 데이터·JSON 내보내기·API 계약이 그대로 유지된다.
- 남겨 둔 영문(의도): ① 브랜드·서비스명(MORFIT, AERNO, Supabase, Claude…) ② 업계 약어(KPI, SKU, MD, CAC/LTV) ③ 사이즈·단위(S/M/L, cm) ④ **정확히 그대로 써야 하는 식별자**(이벤트명 `view_product`, 이미지 파일명, 환경변수) ⑤ 9개 테마의 고유 이름(Deep Navy Blue…) ⑥ 고객 홈의 에디토리얼 영문 타이포(MULTI-BRAND FASHION PLATFORM 등 — 한글 헤드라인 위 장식 문구, 우선순위 2 '브랜드 정체성'). 그 밖의 화면 문구는 `npm run qa:english`로 수집해 0으로 유지한다.
- 치환은 TypeScript AST 기반 스크립트(`scripts/tools/ko-ui.mjs`)로 JSX 텍스트와 한글이 섞인 문자열만 바꿨다(import 경로·타입·키·className은 건드리지 않음). 조사(을/를, 이/가, 은/는, 과/와)는 받침에 맞춰 자동 보정한다.

## D-29 글자 크기 하한 0.78rem(약 12.5px) · 한글은 단어 단위 줄바꿈 · 숫자/날짜는 한 덩어리
- `text-[0.68~0.75rem]`을 전부 `text-[0.78rem]`으로 올렸다. 모바일에서 10~11px 글자는 읽히지 않고, 설정의 '글자 크기'를 키워도 하한이 너무 낮으면 여전히 작다.
- 한글이 한 글자씩 세로로 쪼개지는 문제는 `break-keep`(단어 단위 줄바꿈)과 **최소 폭** 확보로 막는다. 표의 td는 `min-width`를 무시하므로 셀 안쪽 블록에 최소 폭을 준다.
- 가격·수량·날짜는 줄바꿈 금지: 날짜와 시각 사이 · "N분 전"은 NBSP, 가격은 `whitespace-nowrap`. 좁은 카드의 큰 숫자는 `AutoFit`이 글자를 최대 62%까지 줄여 한 줄에 맞춘다(말줄임은 마지막 수단).
- 상품 플레이스홀더 캡션은 7rem 미만 썸네일에서 숨긴다(컨테이너 쿼리). 44px 썸네일 안에 상품명을 넣으면 반드시 세로로 쪼개진다.

## D-30 레이아웃 결함은 눈이 아니라 스크립트로 잡는다 (`npm run qa:layout`)
- `scripts/qa-layout.mjs`: 8폭(360/390/412/430/768/1024/1280/1440) × 34 Route에서 문서 가로 넘침 · 한글 세로 쪼개짐(한 줄 1~2글자) · 숫자/날짜 줄바꿈 · 잘림 · 박스 밖 삐져나옴을 `Range.getClientRects()`로 측정한다. `QA_DRAWER=1`은 햄버거 메뉴를 연 상태, `QA_STRESS=1`은 **데이터만** 길게 바꾼다 — 상품명·브랜드명·캠페인명(seed의 name)에 20자를 덧붙이고, 금액은 10자리(1,254,540,000원), 알림 배지는 99+. 버튼·배지 같은 고정 문구는 늘리지 않는다(실제로 길어질 수 없는 값을 늘리면 가짜 결함만 쌓인다).
- 긴 이름을 담는 칩·배지는 칸을 넘지 않고 말줄임하며 전체 이름은 `title`로 보여준다. 모바일 표 카드의 숫자 칸은 `AutoFit`으로 한 줄을 지킨다.
- 기준선 268건 → 0건(일반 · Drawer · 긴 데이터 모두).

## D-31 ESLint를 도입한다 (`npm run lint`, next/core-web-vitals + typescript)
- 사용하지 않는 import · 이스케이프 안 된 따옴표 · hooks 의존성 누락을 빌드 전에 잡기 위해. `<img>` 규칙만 끈다(사진 자산이 들어오기 전 placeholder 구조 · 정적 export 호환).

## D-32 AX 고정 사이드바는 1280px(xl)부터 — 1024~1279px는 햄버거 Drawer
- 1024px에서 사이드바(280px)를 고정하면 본문이 744px만 남는다. 그런데 페이지 그리드는 `lg:`(뷰포트 1024px) 기준으로 4열·2열로 바뀌어, 실제로는 태블릿 폭에 데스크톱 배치가 들어가 한글 세로 쪼개짐·박스 이탈 47건과 헤더 가로 넘침(24px)이 생겼다.
- 그리드 수십 곳을 고치는 대신 **셸 한 곳**에서 사이드바 등장 폭을 xl로 올렸다. 1024~1279px에서는 모바일·태블릿과 같은 2층 헤더 + 햄버거 Drawer(같은 메뉴 트리) + 하단 탭을 쓴다. Linear·Notion처럼 좁은 창에서 사이드바가 접히는 것과 같은 규칙.
- 데스크톱 전용 도구(역할 전환·튜토리얼·시연·스마트폰 보기)는 Drawer 안 '데모 도구'에 그대로 있다 — 기능 손실 없음.
