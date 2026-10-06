# QA_REPORT.md — MORFIT First Build (DEMO)

> 빌드: `next build` 성공 (Next 15.5 · 36 Route · TypeScript 0 error). 검증 환경: 프로덕션 서버 + Playwright(Chromium).
> 2차 고도화 재측정은 §9 참조 (여정 23/23 · 반응형 · 접근성).
> 모든 숫자는 DEMO / SIMULATION. 실제 성과 아님. BASELINE: UNKNOWN / REQUIRED.

## 1. Score

### SCORE A — Strategy / Business Quality (자체 평가)
| 영역 | 배점 | 점수 | 근거 |
|---|---:|---:|---|
| Problem / Constraint | 15 | 15 | Primary Constraint 1문장 잠금, 핵심 기능 60~70%가 Constraint와 직결(Demand Radar·Action·Fit) |
| Process Redesign | 10 | 9 | ELIMINATE→…→AI 순서 표, 중복확인 제거가 화면(Action Center)으로 구현 |
| Data Foundation / Asset | 15 | 14 | SSOT(seed+store) · 옵션 단위 수요×반품×핏 데이터 · 12개월 Data Question 답변 |
| AI Fit / Explainability | 10 | 10 | 4 Engine 전부 RULE/STAT · 근거 2~4 · L2/L3 · Error Cost · AI Ready 3곳만 |
| Proof / KPI Design | 15 | 15 | Cost/Revenue/Scale KPI 3종 · Evidence 10 Type · 12주 체크리스트 · Baseline UNKNOWN 명시 · **Evidence Pack 미리보기(인쇄·JSON) + Loop 1 알림→구매 전환 기록 (2차)** |
| Customer / Partner / Platform Fit | 10 | 9 | Primary Journey 완주 · 4 Closed Loop 실동작 · NEXT 5 Preview(과장 없음) |
| Scale / Unit Economics | 10 | 9 | 사입/위탁 매출·마진 구성, 객단가·주문당 매출총이익·배송비 비중 계산 표시. CAC/LTV/Payback은 측정 설계만(VALIDATE LATER) — 값을 지어내지 않음 (2차) |
| Moat / Asset | 5 | 5 | Proprietary 옵션 데이터·MD Workflow·핏 프로필. 기술스택 Moat 미주장 |
| Adoption / Risk | 5 | 5 | 역할별 화면·직원 이익 명시·개인정보 없음 |
| Financeability / Growth Logic | 5 | 4 | 정책자금 언급은 실증 이후로 제한(보장 표현 0) |
| **합계** | **100** | **95** | Strategic P0 = 0 (2차 재평가) |

### SCORE B — Product / Implementation Quality (자체 평가)
| 영역 | 배점 | 점수 | 근거 |
|---|---:|---:|---|
| Product Shell | 15 | 15 | Nav·Settings·Tutorial·Presentation·Device Preview·Escape Path 실측 |
| Business AX | 20 | 19 | KPI→Detail→Insight→Action→Result→Evidence · Role · Freshness |
| Customer Platform | 20 | 18 | Explore→Detail→Fit→Cart→DEMO Checkout→My · 사진은 placeholder(추후) |
| Cross-Surface | 15 | 15 | 4 Loop 자동 검증 통과 · Theme 상태 공유 · Surface 왕복 |
| Visual / Interaction | 15 | 14 | Hover/Pressed·Skeleton·Empty·Error·Overlay 정리 + **접근 이름 100% · 모바일 터치 타겟 40px+ · 사이드바 hover 복구 (2차 자동 점검)**. 사진 밀도는 자산 적용 후 재평가 |
| Theme Integrity | 10 | 10 | 9 Theme 실측 전환 · 잔존 장식색 0(하드코딩 팔레트 클래스 0건) · Error Red 의미색만 |
| Story / Growth | 5 | 5 | Why AX 16 Section · Current→Improved→Growth · NEXT 분리 |
| **합계** | **100** | **96** | Product P0 = 0 (2차 재평가) |

판정: **Strategy 95 / Product 96 → 고품질 MVP(90+)** (1차 93/95 → 2차 재평가). 98+ 목표 대비 부족분은 (1) 사진 자산 미적용, (2) 실측 Baseline 부재(Pilot에서만 가능), (3) CAC/LTV 실값 없음, (4) LLM 키 없음 — 모두 Demo 단계에서 지어내지 않기로 한 항목.

## 2. Strategic P0 점검 (13항목)
| 항목 | 결과 |
|---|---|
| Primary Constraint 없음 | PASS (PROJECT_SPEC §0) |
| 핵심 기능이 Constraint와 단절 | PASS |
| Cost/Revenue/Scale KPI 없음 | PASS |
| Demo Data를 Live처럼 표현 | PASS — 전 화면 DEMO/SIMULATION 배지, Freshness `DEMO DATA` |
| Baseline 없는 개선율 | PASS — Evidence·KPI에 `BASELINE: UNKNOWN / REQUIRED`, 개선율은 SIMULATION 표기 |
| 고객행동이 Workflow와 단절 | PASS — Loop 1~4 자동 검증 |
| Rule로 충분한데 AI 포장 | PASS — 전부 RULE/STAT, "AI Ready" 3곳만 |
| AI Action 근거 없음 | PASS — 근거 2~4 + 주의 + 승인자 + 다음 행동 |
| High Risk AI 무감독 | PASS — L2/L3만, 자동발주 없음 |
| Data Provenance 불명확 | PASS — Freshness + 데이터 출처 필터 |
| NEXT를 현재 기능처럼 표현 | PASS — NEXT 배지 + Preview 페이지 + "구현되지 않음" 고지 |
| 정책자금·투자 보장 표현 | PASS — 소스 전수 검색 0건 |
| Capital Independence 실패 | PASS — YES (§3.2) |

## 3. Whole-Hybrid Acceptance Journey (자동, `scripts/qa-journey.mjs`) — **21/21 PASS**, pageerror 0
Fresh Load·Demo Reset → Home 5초 → Tutorial 종료(Overlay 0) → 랭킹 → 상세(Scenario A) → 핏 프로필 → 재입고 알림(Loop 1) → AX 전환·KPI → Role(MD) 변화 → Demand Radar 반영(18→19) → Action 확인·실행·완료(재고 +60, 알림 발송) → 고객 재입고 상태 → 장바구니·DEMO 주문(Loop 2) → AX 주문 반영·상품준비 → My Page 상태 반영 → Evidence → Why AX 발견 → 시연 모드 → 9 Theme 전환 → 글자크기·Device Preview(재귀 0·스크롤 복구) → Demo Reset.

## 4. Responsive (자동, `scripts/qa-screens.mjs`) — 8폭 × 32 Route = 256 조합
| 항목 | 결과 |
|---|---|
| 404 / notFound | 0 |
| 런타임·콘솔 오류 | 0 (CDN 폰트 차단 노이즈 제외) |
| Horizontal overflow | 1차 74건(헤더 폭·그리드 min-width·표·썸네일 폭) → 수정 후 **0건 / 256 조합** |
| Mobile 360 | 2열 상품 그리드 · 표→카드 · 필터 Sheet · Sticky CTA와 Bottom Nav 비중첩 |

## 5. Theme / Visual
- 9 Canonical Theme × Desktop/Mobile/Preview 동일 상태(localStorage) · `data-theme` 실측
- 하드코딩 팔레트 클래스(`text-red-*` 등) 0건 · 원시 Hex는 시맨틱 톤/에디토리얼 그라디언트/아이콘 Accent만
- Dark Sidebar 텍스트 White 계열 · Pure White Raised Surface · Error Red = 의미색
- 차트 애니메이션 비활성(스크린샷·인쇄 안정성)

## 6. Red Team (PASS 3, 1회) — 발견 및 조치
| # | 관점 | 발견 | 등급 | 조치 |
|---|---|---|---|---|
| 1 | Business Devil | 재구매율 93.5% (회원 361명에 주문 1,200건 배정) | P1 | 비회원 주문 42% 도입 → 24.8% |
| 2 | Business Devil | 매출이 항상 "직전 대비 하락" (현재 기간이 오늘 남은 시간만큼 짧음) | P1 | 기간 비교를 일 단위 경계로 |
| 3 | Product Devil | 반품률 ↑247% 등 무의미한 델타 | P1 | 반품률은 델타 대신 분모·분자 표기 |
| 4 | Product Devil | 차트가 스크린샷·시연 초기에 비어 보임 | P1 | 애니메이션 제거 |
| 5 | Product Devil | Device Preview iframe 내부에 하이드레이션 전 Preview 버튼 노출(재귀 가능) | P0 | 인라인 스크립트 + CSS 가드 |
| 6 | Customer | Scenario A(품절 임박)에서 재입고 알림 신청 불가 → Loop 1 시연 단절 | P1 | 품절 임박 옵션에도 재입고 CTA |
| 7 | Product Devil | Freshness가 SSR에서 초를 렌더 → 하이드레이션 불일치 | P1 | 마운트 후 렌더 |
| 8 | Product Devil | AX 상단바 768/1024px 폭 초과, 고객 헤더 768/1024px 초과 | P1 | 반응형 축약(아이콘화·xl에서 텍스트) |
| 9 | AI Devil | "AI 추천"이라 부르는 곳 없음, 규칙 기반 명시 | — | 유지 |
| 10 | Growth Devil | 파트너센터·멤버십·B2B를 현재 기능처럼 보이지 않게 | — | NEXT Preview로 분리 확인 |
| 11 | Data Devil | 개인정보(전화·이메일) 없음, 이름은 역할별 마스킹 | — | 유지 |
| P2 | — | Evidence Pack Export, 재입고→구매 추적, 캠페인 초안 store 승격 등 | P2 | docs/RECOMMENDATIONS.md |

## 7. 최종 재측정 (수정 후 프로덕션 빌드, 3회차)
- Acceptance Journey: **21/21 PASS** · pageerror 0
- Responsive: 256 조합 중 **404 0 · 오류 0 · overflow 0**
- 재현: `npm run build && npm start` 후 `node scripts/qa-journey.mjs`, `QA_SHOTS=0 npm run qa:shots`

## 8. Known Issues / 남은 것
- 사진 자산 미적용(의도) — placeholder. 적용 후 Image Sharpness Gate 재검증 필요
- 리뷰·캠페인 초안·반품 처리 상태는 localStorage(Demo)
- Pretendard CDN 차단 환경에서는 시스템 폰트 폴백

## 9. 2차 고도화 재측정 (2026-09-15 · 프로덕션 빌드)
### 9.1 범위
Loop 1 완결(알림→구매 전환 자동 기록) · Evidence Pack DEMO 미리보기(`/ax/evidence/pack` 인쇄·JSON) · Unit Economics 측정 설계 패널 · `/api/ai/explain` LLM Route(키 없으면 규칙 텍스트) · 접근성/Hover 자동 점검 스크립트 + 수정. Drive 「샘플 21. 의류」 재확인 → 여전히 비어 있어 사진은 계속 보류.

### 9.2 결과 요약
| 항목 | 결과 |
|---|---|
| typecheck / build | 0 error · `next build` 성공 · 36 Route |
| Whole-Hybrid Journey (`npm run qa:journey`) | **23/23 PASS** · pageerror 0 — 추가 Step: "Restock notified → purchased (Loop 1 complete)", "Evidence Pack preview + JSON export"(다운로드 JSON 구조·VALIDATE LATER 고정 검증) |
| 반응형 (`QA_SHOTS=0 npm run qa:shots`) | 최종: 8폭 × 33 Route = **264 조합 · 404 0 · 상태코드 비정상 0 · 런타임 오류 0 · overflow 0** (중간 재검사에서 Why AX 360px 6px 넘침 1건 발견 → flex-wrap 수정 후 0) |
| 접근성·Hover (`npm run qa:a11y`) | 최종: 66 route×폭(1280·390) · 4,987 인터랙티브 요소 — **접근 이름 누락 0 · 모바일 40px 미만 터치 타겟 0**(1차 35종 → 2차 7종 → 최종 0) · 40~43px 경고 778건(허용) · hover 무변화 16종 = 선택된 탭·칩·현재 메뉴 등 활성 상태 컨트롤과 hover-lift 카드 내부 링크(측정 한계) — 실제 hover 클래스 누락 없음 |
| 인쇄 미디어 (Evidence Pack) | `emulateMedia(print)` 실측: AX 사이드바·상단바·하단 탭·목차 숨김, 좌측 여백 0, 흰 배경, 7 Section 출력 |
| LLM Route 스모크 | `GET /api/ai/explain` → `{status:"AI_READY", configured:false}` · `POST`(키 없음) → 규칙 텍스트 그대로 + note. 외부 호출 0 |

### 9.3 2차 Red Team (자동 점검이 찾은 것)
| # | 관점 | 발견 | 등급 | 조치 |
|---|---|---|---|---|
| 1 | Product Devil | AX 사이드바 hover·active 배경이 렌더되지 않음 — Tailwind 불투명도 `bg-white/8`, `/12`는 스케일 밖이라 클래스 미생성 | P1 | `bg-white/[0.08]`, `/[0.12]`로 교체 (ThemeSettings 포함) |
| 2 | Customer Devil | 모바일(390px)에서 40px 미만 터치 타겟 35종(Button sm 38px · Segmented sm 34px · EntityChip 28px · 역할 전환 34px · 데모 바 28px · 용어 도움말 14px · 텍스트 링크 20~25px 등) | P1 | 모바일 전용 높이 상향(`h-10 md:h-*`) · 인라인 링크 `.tap`(히트 영역 확장, 레이아웃 불변) · 도움말 아이콘 40×40 히트박스 |
| 3 | Product Devil | 접근 가능한 이름 없는 버튼 — 더보기(하단 탭) | P2 | `aria-label` 추가 → 누락 0 |
| 4 | Product Devil | Why AX 360px에서 6px 가로 넘침 (Evidence 예시 행 배지 비줄바꿈) | P2 | `flex-wrap` |
| 5 | QA | 여정 QA 체크아웃 동의 체크박스가 클릭 직후 등록되지 않는 타이밍 플레이크 | P2(테스트) | `name="agree"` 지정 + 체크 확인 후 재시도 루프 |
| 6 | Hover | 활성 상태 컨트롤(선택된 탭·칩·현재 메뉴)은 hover 변화 없음 | — | 의도된 상태 표시로 유지. 썸네일 링크에는 `hover:opacity-90` 추가 |

### 9.4 남은 것 (2차 이후)
- 사진 자산: Drive 폴더 업로드 대기 (등록 경로 `src/lib/assets.ts`)
- LLM: `ANTHROPIC_API_KEY` 서버 설정만 하면 경영 브리핑 1곳 LIVE — 키 없이 검증 불가한 부분은 "생성 문장의 숫자 일치 확인"
- 접근성 후속: 스크린리더 읽기 순서 · 색 대비 자동 검사 (RECOMMENDATIONS P-07)

## 10. 3차 — 정보구조 · 색 시스템 · 모션 (2026-09-15)
### 10.1 바꾼 것
| 영역 | 전 | 후 |
|---|---|---|
| AX 사이드바 | 5그룹(핵심 운영 / 고객·성장 / 운영 / 스토리 / 관리) — 이름이 겹치고 1개짜리 그룹 존재 | 4그룹(오늘의 판단 2 · 상품·재고 3 · 고객·매출 5 · 근거·설정 4) + 구분선 · 항목 수 · 톤 점 (D-21) |
| 아이콘 색 | 8개 장식색(파랑·청록·금색·보라·초록·빨강·회색) 고정 hex | 테마 Primary에서 파생한 같은 색 10단계 톤 `--icon-t1~t10`, 테마 전환 시 함께 이동 (D-22) |
| 차트 계열색 | 아이콘 팔레트 일부 재사용 | 테마 4색 + 변형 4색으로 분리 — 톤만으로는 계열 구분 불가하므로 (D-22) |
| 모션 | 진입·전환 모션 거의 없음 (fadeIn 위주) | 페이지 전환 rise, KPI·카드·목록 stagger, 사이드바 호버(이동+강조바+타일 확대), sheen·press·link-line·nudge, 긴급 Action 호흡 점 (D-23) |
| 호버 | 토큰 색 + 투명도 조합 74곳이 CSS 미생성으로 사실상 무효 | Tailwind 색 정의를 함수형으로 바꿔 74곳 전부 동작 (D-24) |

### 10.2 재측정
| 항목 | 결과 |
|---|---|
| typecheck / build | 0 error · `next build` 성공 |
| Whole-Hybrid Journey | **23/23 PASS** · pageerror 0 (그룹 재편 후 튜토리얼·시연·Loop 전부 정상) |
| 반응형 8폭 × 33 Route | **264 조합 · 404 0 · 상태코드 비정상 0 · overflow 0** (그룹 재편·모션 도입 후 재측정) |
| 접근성·Hover | 66 route×폭 · 5,016 요소 — **접근 이름 누락 0 · 모바일 40px 미만 타겟 0** · hover 무변화 11종(선택된 탭·칩·현재 메뉴·현재 역할 등 활성 상태 컨트롤). 고객 데모바의 '호버해도 흰색→흰색'이던 링크 1건은 수정 |
| 테마 연동 | 9테마 중 Deep Navy · Emerald Gold 실측 — 사이드바/KPI 아이콘 톤이 테마 Primary를 따라 이동, 차트 4계열은 색상 구분 유지 |
| 모션 차단 | 설정 '모션 줄이기' → `animation-duration 0.001s · opacity 1`(내용 즉시 표시) 실측 · OS `prefers-reduced-motion` · 인쇄에서 전체 비활성 |

### 10.3 3차 Red Team
| # | 발견 | 등급 | 조치 |
|---|---|---|---|
| 1 | 토큰 색 + 투명도 유틸 74곳이 조용히 미생성 — 호버·구분선이 눈에 띄지 않던 근본 원인 | P1 | Tailwind 색 정의 함수형 전환 (D-24) |
| 2 | 아이콘을 한 색 톤으로 통일하면 도넛·막대 차트의 계열 구분이 무너짐 | P1 | 차트 팔레트를 톤 사다리와 분리 (D-22) |
| 3 | 진입 모션의 `transform: translateY(0)` 잔류가 stacking context를 만들어 튜토리얼 스포트라이트를 가릴 수 있음 | P2 | 모든 진입 키프레임을 `transform: none`으로 종료 |
| 4 | 숫자 카운트업은 시연·스크린샷 중 중간값이 찍힘 | — | 도입하지 않음 (D-23) |

## 11. 4차 — 미래AI랩 브릿지 CTA (2026-09-18)
### 11.1 구성
| 위치 | 컴포넌트 | 내용 |
|---|---|---|
| 고객 화면 전 페이지 하단(푸터 위) | `SampleBridgeCTA surface="customer"` | 배지 → 제작 고지 → 헤드라인 → 소개 → **우리 회사도 만들어보기** → 다른 샘플 보기 / 미래AI랩 홈페이지 |
| Business AX 전 페이지 하단(main 끝) | `SampleBridgeCTA surface="ax"` | 동일 구조 · 테마 컬러 팔레트 |
| AX 사이드바 왼쪽 아래 | `SampleBridgeMini` | 같은 3개 링크 축소판 (상시 노출) |

### 11.2 검증
| 항목 | 결과 |
|---|---|
| 링크 | 3개 모두 정확 (`/business-diagnosis`, `/business-services`, `/`) · `target=_blank` + `rel=noopener noreferrer` · 새 창 aria-label · 한 페이지에 중복 0 |
| 터치 타겟 | 메인 CTA 52px · 서브 50px · 사이드바 축소판 43~48px |
| 모션 | 광택 `sweepIdle 6s infinite`(흰색 22% 띠, 마지막 1초) · hover 시 일시정지 + lift·glow · **모션 줄이기에서 `animation-name: none`** 실측 |
| 인쇄 | Evidence Pack 인쇄 시 브릿지 `display: none` 실측 (보고서에 광고 미포함) |
| 반응형 | 390px 가로 넘침 0 · 8폭 × 33 Route **264 조합 · 404 0 · overflow 0** |
| 접근성 | 66 route×폭 · 5,340 요소 — 접근 이름 누락 0 · 40px 미만 타겟 0 · hover 무변화 10종(전부 선택된 탭·현재 메뉴 등 활성 상태) |
| 여정 | **23/23 PASS** · pageerror 0 (CTA 추가 후에도 4 Loop·시연·튜토리얼 정상) |

### 11.3 수정 위치
- **링크 3개**: `src/lib/mirae.ts` → `MIRAE_LINKS.consult / samples / home`
- **문구 전체**: 같은 파일 `MIRAE_COPY` (배지·제작 고지·헤드라인·설명·버튼 문구)
- **개별 페이지만 다르게**: `<SampleBridgeCTA consultHref=... samplesHref=... homeHref=... />` props


## 12. 5차 — UI/UX 안정화 v1.0 (2026-09-29)
### 12.1 메뉴 (기능 삭제 0 · 위치만 이동)
| 화면 | 기존 1차 노출 | 개선 후 1차 노출 | 구조 |
|---|---|---|---|
| AX 사이드바 | 14 (4그룹 평면) | **8** | 최대 2단계 · 아코디언 · 본문 위 섹션 탭 |
| 고객 전체 메뉴 | 19 (메뉴 7 + 카테고리 7 + 향후 확장 5) | **7** | 최대 2단계 · '확장 기능 보기(예정)' 접기 |
| 합계 | 33 | **15** | Route 35개 전부 유지 · 404 0 |

기능 이동: 상품·옵션/재고·재입고/브랜드·입점사 → **상품·재고**▸ · 주문·배송/고객·재구매/핏·반품 → **주문·고객**▸ · 매출·마진/캠페인·기획전 → **매출·마케팅**▸ · 기획의도/시연 모드 → **소개·시연**▸ · (고객) 신상품/세일 → **신상품·세일**▸ · 남성/여성/카테고리 7 → **카테고리**▸ · 마이페이지/주문·배송/찜/장바구니/재입고 알림 → **내 쇼핑**▸ · 향후 확장 5 → **확장 기능 보기(예정)** 접기.

### 12.2 레이아웃 결함 자동 검사 (`npm run qa:layout`, D-30)
| 모드 | 폭 × Route | 기준선 | 최종 |
|---|---|---|---|
| 일반 | 8폭(360/390/412/430/768/1024/1280/1440) × 34 | 268 | **0** |
| 햄버거 연 상태 (`QA_DRAWER=1`) | 8폭 × 34 | — | **0** |
| 긴 데이터 (`QA_STRESS=1` · 상품/브랜드/캠페인명 +20자 · 금액 10자리 · 배지 99+) | 8폭 × 34 | 1,194 (고정 문구까지 늘리던 초기 검사) | **0** |

검사 항목: 문서 가로 넘침 · 한글 세로 쪼개짐(한 줄 1~2글자) · 숫자/날짜 줄바꿈 · 잘림 · 박스 밖 삐져나옴.

### 12.3 이번에 잡은 주요 결함
| 결함 | 원인 | 조치 |
|---|---|---|
| AX 전 화면 1024px에서 가로 24px 넘침 | 1024px에 고정 사이드바(280px)가 나오면 본문이 744px인데, 헤더 도구·페이지 그리드는 1024px 전폭을 가정 | 고정 사이드바를 **1280px(xl)부터** 표시, 그 아래는 햄버거 Drawer(같은 메뉴) — 47건 → 0 (D-32) |
| 상품 표의 상품명 세로 쪼개짐 (1280/1440) | 44px 썸네일 안에 상품명 캡션이 그려짐 | 7rem 미만 썸네일에서 캡션 숨김(컨테이너 쿼리) |
| 모바일 표 카드에서 금액 줄바꿈 | `overflow-wrap:anywhere`가 숫자 중간을 끊음 | `break-word` + 숫자 칸 `AutoFit` |
| 긴 브랜드·상품명이 칩·배지 밖으로 넘침 | `whitespace-nowrap` + 폭 제한 없음 | 칩·배지·필터칩 공통: `max-w-full` + 말줄임 + `title` |
| 태블릿(768) 상품 상세 '품절 임박 N개' 세로 쪼개짐 · '바로 주문' 잘림 | 좁은 구매 박스에 옵션 4열 · 버튼 3개 한 줄 | md 구간 2열 · 버튼 줄바꿈 허용 |
| 고객 데모 바 버튼이 바 높이(36px)를 넘음 | 버튼 40px(터치 타겟) | 바 높이 44px(모바일) |
| 고객 데스크톱 메뉴 글자가 로고보다 10px 위 | 40px 링크에 세로 가운데 정렬 없음 | `inline-flex items-center` |
| 영어 잔존 (Action 표 헤더 · Error 비용 · TRIGGER/RECOMMENDATION/APPROVAL · System · BEST/NEW · MID/LOW) | 한글 문자열만 치환한 1차 변환의 사각지대 | 화면 문구 수집 스크립트(`npm run qa:english`)로 찾아 한글화 · 저장 데이터는 v4로 갱신 |

### 12.4 회귀 검증 (최종 빌드)
| 항목 | 결과 |
|---|---|
| Build · TypeScript · ESLint | 성공 · 0 error · 0 error/0 warning |
| 수용 여정 | **25/25 PASS** · pageerror 0 (신규: 화면 전환 CTA 양방향 · 모바일 햄버거 왼쪽/1차 메뉴 수/스크롤 잠금/하단 CTA/닫힘 복구) |
| 8폭 × 33 Route | 264 조합 · 404 0 · 가로 넘침 0 · pageerror 0 (콘솔은 테스트가 차단한 외부 폰트 CDN만) |
| 접근성 | 66 route×폭 · 5,202 요소 · 접근 이름 누락 0 · 40px 미만 터치 타겟 0 · hover 무변화 62(전부 '현재 선택된' 메뉴·탭·필터) |
| 큰 글자 설정 | 1024/1280px AX 헤더 넘침 0 |

## 13. 6차 — UI/UX 고도화 · 기능 안정화 (2026-10-06)
### 13.1 진단 (처음 보는 사람 기준)
| 문제 | 영향 |
|---|---|
| 대시보드 KPI 12장이 모두 같은 크기 · 휴대폰에서 한 줄에 1장 | 무엇이 중요한지 모름 · 휴대폰에서 KPI만 4화면 스크롤 |
| 페이지 제목마다 '데모' 배지, 항목마다 '데모/시뮬레이션' 배지, 과제 카드에 배지 5개 | 배지 소음 · 핵심 문장이 묻힘 |
| 고객 화면에 "AX 수요 레이더에 반영" 같은 운영 설명 박스·데이터 기준 시각 | 쇼핑 화면이 관리자 화면처럼 보임 |
| 휴대폰 상품 상세: 하단 탭 위에 구매 바가 한 겹 더, 옵션 없이 누르면 화면만 이동 | 화면 아래가 이중으로 막힘 · 구매 흐름이 끊김 |
| 상품 상세 찜(♡) 버튼이 비어 보임 | 버튼 기능을 알 수 없음 (실제 결함) |
| AX 상품 상세(휴대폰) 탭 라벨 겹침 | 탭을 읽을 수 없음 (실제 결함) |
| 상품 카드 사진 캡션과 '급상승' 배지 겹침 | 지저분한 첫인상 |
| 스타일 찾기 핏 프로필: 범위 밖 키(300cm)를 조용히 버리고 '저장됨' | 저장된 줄 알지만 키가 비어 있음 (실제 결함) |
| 주문서: 고친 칸의 오류가 다시 제출할 때까지 남음 · 토스트가 문구 반복 | 고쳤는데 틀린 것처럼 보임 |
| 홈이 휴대폰 9화면 · 핏 프로필 유도 2번 중복 | 핵심 행동이 흐려짐 |

### 13.2 개선
| 영역 | 변경 |
|---|---|
| 지표 위계 (D-33) | 주요 KPI 4 큰 카드 + 보조 8 작은 칸(`KpiTile`) · 모든 지표 줄 휴대폰 2열 · 모바일 카드 여백·숫자 축소 · '직전 대비'만 남김 |
| 데모 표시·설명 (D-34) | 제목 옆 '데모' 배지 제거 · 신선도는 점 + "데모 데이터 · hh:mm 기준" 한 줄 · 증빙 출처는 회색 글자 · 고객 화면 운영 설명은 `LoopHint`(시연 역할에서만) · 페이지 설명 한 문장 |
| 과제 카드 | 긴급도는 점+글자, 유형은 글자, 상태 배지 1개만 · 'L3·수요 엔진' 배지는 펼친 상세로 · '트리거' 꼬리표 제거 |
| 실행 센터 | 큰 KPI 4 → 작은 칸 · 처리 과정 박스 → 한 줄 · 유형 필터 휴대폰 한 줄 가로 스크롤 |
| 재고 | 상태 칩 휴대폰 가로 스크롤 · 0건 상태 숨김 · 수요 점수 식은 한 문장(식은 툴팁) · 수요 레이더 휴대폰 10개씩 |
| 증빙·고객 | 필터 패널 PC에서도 접기('필터 N') · 기록 순서 박스 → 한 줄 · 고객 KPI 5 → 작은 칸 1줄 |
| AI 브리핑 | 환경변수·LLM 상태 문구 제거 → "숫자는 코드가 계산합니다 · AI 연결 시 설명이 붙습니다" |
| 홈 | 히어로 문구 1문장 · 리스트 휴대폰 4개(PC 8개) · 핏 유도 1곳으로 통합하고 위로 이동 · 보조 버튼 제거 (휴대폰 높이 9,179 → 7,160px) |
| 상품 상세 (D-35) | 휴대폰: 하단 탭 대신 구매 바(맨 아래) · 옵션 미선택 시 옵션 시트(금액 표시 버튼) · 박스 안 중복 버튼 숨김 · 사이즈 '관심 상승' 표시 제거 · 핏 카드 "내 사이즈 추천"으로 단순화 |
| 주문서 (D-36) | 상단 검은 데모 배너·결제 배지·'데모' 꼬리표 제거 · 고친 칸 오류 즉시 해제 · 첫 오류 칸으로 이동 |
| 공통 결함 (D-37) | 찜 버튼 아이콘(`!px-0`) · 세그먼트 탭 겹침(`shrink-0`) · 카드 캡션 겹침 · 큰 상품 이미지(AX 휴대폰) → 작은 썸네일 |
| 입력 검증 (D-36) | 핏 프로필 범위 오류 즉시 표시·저장 차단(두 폼 범위 통일) · CSV 필수 열 누락 안내 |

### 13.3 검증 (최종 빌드)
| 항목 | 결과 |
|---|---|
| Build · TypeScript · ESLint | 성공 · 0 · 0 |
| 사용 흐름·예외 (`qa:flows`, 신규) | **20/20 PASS** · 콘솔/페이지 오류 0 — 검색 0건 · 구매 바/옵션 시트 · 찜 · 장바구니 수량/삭제 · 주문서 오류→해제→주문 · 주문 취소 · 핏 범위 · 품절→재입고 알림 · 탭 숨김/복귀 · 과제 필터/무시 사유 · 주문 검색 0건 · 재고 필터 · 증빙 필터 · 캠페인 기간 · CSV 형식/필수 열 · 표→상세 |
| 수용 여정 | **25/25 PASS** · pageerror 0 |
| 레이아웃 (8폭 × 34 Route) | 일반·햄버거·긴 데이터 모두 **0건** (768px 핏 카드 제목 1건 발견 → 수정) |
| 8폭 × 33 Route | 264 조합 · 404 0 · 가로 넘침 0 · pageerror 0 |
| 접근성 | 접근 이름 누락 0 · 40px 미만 터치 타겟 0 (신규 'AX에서 보기' 39px 발견 → 40px) · hover 무변화는 모두 '현재 선택' 항목 |

## 14. 7차 — 2차 고도화: 처음 쓰는 사람 기준 재점검 (2026-10-06)
### 14.1 진단 (실제 여정을 휴대폰·PC로 따라가며 캡처)
| 발견 | 영향 |
|---|---|
| 휴대폰 하위 화면(상품·장바구니·주문서·주문 상세) 헤더 왼쪽이 햄버거 | '뒤로'가 없어 브라우저 뒤로에 의존 · 링크로 들어오면 사이트 밖으로 나감 |
| 장바구니 '주문하기' · 주문서 '데모 주문 완료'가 긴 화면 맨 아래 | 결제 버튼을 찾으려 끝까지 스크롤 |
| 주문 완료 화면 버튼 2개가 높이 22px로 찌그러짐 (`flex-col` 안의 `flex-1`) | 누르기 어려움 (실제 결함) |
| 주문 완료 직후 같은 내용의 토스트가 또 뜸 · 토스트가 3개까지 쌓여 결제 바·시트 버튼을 덮음 | 화면이 시끄럽고 버튼이 가려짐 |
| 장바구니 결제 바가 하단 탭에 17px 가려짐 (탭 실제 높이 81px인데 64px로 계산) | 금액 줄이 잘림 (실제 결함, 흐름 테스트가 발견) |
| 모든 고객 화면 맨 아래 저작권 줄이 하단 탭·구매 바에 가려짐 · 태블릿에서 장바구니 결제 바가 81px 떠 있음 | 마지막 줄을 볼 수 없음 (기존 결함) |
| 주문번호가 두 줄로 끊김 · 메모 한 줄("…· 결제수단(데모): 카드")이 그대로 노출 | 영수증이 정리되지 않아 보임 |
| 찜 목록 모든 상품에 '가격 변동 없음'·'정상' 배지 · 마이페이지 '데모 회원'·'프로필 미입력' 중복 | 중요한 품절·가격 인하가 묻힘 |
| 고객 알림 문구에 "AX 운영화면 수요신호에 반영" · 스크린리더 이름에 "관심 상승 · 정상" | 고객 화면에 운영 용어 |
| 실행 센터에서 '확인'을 누르면 카드가 다른 자리로 튐 · AX 주문 휴대폰 카드에서 버튼이 내용보다 위 | 방금 처리한 카드를 다시 찾아야 함 |
| 시트·모달 위로 공용 이동 버튼이 떠 있음 · 'AX에서 보기' 링크가 줄 간격을 40px로 벌림 | 시트 하단 버튼 가림 · 문장이 띄엄띄엄 |
| PC '바로 주문' vs 휴대폰 '구매하기', 찜 '장바구니 이동'(실제는 담기) | 같은 행동, 다른 이름 |

### 14.2 개선 (D-38 ~ D-41)
| 영역 | 변경 |
|---|---|
| 동선 (D-38) | 휴대폰 하위 화면 헤더 = 뒤로(앱 안 이동이면 직전 화면, 바로 열었으면 상위 화면) · 장바구니 결제 바(탭 바로 위) · 주문서 결제 버튼 맨 아래 고정 + 탭 숨김 · `--tabbar-h` 단일 값 · 푸터 아래 여백 = 실측한 하단 바 높이 |
| 알림 (D-39) | 최대 2개(휴대폰 1개) · 같은 문구 합침 · 시트가 열려 있으면 위쪽, 구매·결제 바가 있으면 그 위 · 완료 화면 중복 토스트 제거 · 시트 열림 동안 공용 이동 버튼 숨김 |
| 고객 언어 (D-40) | 평소 상태 배지 제거(품절·임박·가격 인하만) · '관심 상승/정상' → '구매 가능' · '결제대기(데모)' → '결제대기' · 알림 문구 고객 언어 · 버튼 이름 통일 |
| 처리 화면 (D-41) | 실행 센터 정렬은 필터 변경 때만 · AX 주문/반품 휴대폰 카드 버튼은 카드 맨 아래(`DataTable mobileFooter`) · 주문 정보 행(배송지·요청사항·주문자·결제수단·쿠폰) |
| 마감 | 완료 버튼 높이 · 주문번호 한 줄 · `LoopHint` 점 정렬·줄 간격 · 마이페이지 탭 화살표 제거 · 휴대폰 상품 첫 화면 사진 비율 |

### 14.3 검증 (프로덕션 빌드)
| 항목 | 결과 |
|---|---|
| Build · TypeScript · ESLint | 성공 · 0 · 0 |
| 사용 흐름·예외 (`qa:flows`) | **28/28 PASS** (20 → 28: 하단 결제 바·탭 겹침 · 주문서 탭 숨김 · 완료 화면 버튼 높이·정보 행·중복 알림 · 푸터 가림 · 뒤로 2종 · 찜 배지 · AX 주문 카드 버튼 위치 · 과제 카드 자리 유지) · 콘솔/페이지 오류 0 |
| 수용 여정 | **25/25 PASS** · pageerror 0 |
| 레이아웃 (8폭 × 34 Route) | 일반 · 햄버거 열림 · 긴 데이터 모두 **0건** |
| 접근성 (66 Route · 5,088 요소) | 접근 이름 누락 0 · 40px 미만 터치 타겟 0 |

## 15. 8차 — 3차 고도화: 개발자 시선의 완성도 (2026-10-06)
### 15.1 진단 (코드·번들·메타데이터·키보드·실측)
| 발견 | 영향 |
|---|---|
| 쿠폰 할인 계산식이 화면과 저장 코드에 따로 있었고, 저장 쪽 괄호 위치가 달라 할인액 100배 | 79,000원 + 5% 쿠폰 주문이 화면 75,000원 / 저장·AX 매출 **−316,000원** (실제 결함) |
| 시드의 오늘 주문 일부가 현재보다 미래 시각 | 방금 넣은 고객 주문이 AX 주문 목록 맨 위에 오지 않음 · '방금 전'이 여러 건 |
| 탭 제목: 고객 9개 화면은 클라이언트 `document.title`이 Next 메타데이터에 덮여 모두 같은 제목, 7개 화면은 `MutationObserver` 우회 | 탭·방문 기록·공유에서 화면 구분 불가 · 첫 HTML에 제목 없음 |
| AX 셸이 아이콘을 이름 문자열로 찾으려고 `import * as Icons from "lucide-react"` | lucide 1,500여 개 전체(600KB+)가 AX 모든 화면 번들에 포함 |
| 시드 생성이 `상품 × 30일 × 주문 1,242건` 재순회 + 가중치 36만 회 재계산 | 브라우저 시작 시 PC 316ms · 휴대폰(4배 저속) 1초+ 메인 스레드 차단 (Lighthouse TBT 1,070ms) |
| 모달·시트·드로어: 열어도 포커스가 바깥, Tab이 배경으로 빠짐, 겹친 창에서 ESC 한 번에 모두 닫힘, `onClose`가 바뀔 때마다 효과 재실행 | 키보드·스크린리더 사용 불가 수준 · 닫은 뒤 포커스 유실 |
| 오류 경계(`error.tsx`) 없음 · 본문 바로가기 없음 · 제목 단계 건너뜀 · 별점/진행 막대/버튼 이름 접근성 경고 | 예외 시 흰 화면 · Lighthouse 접근성 감점 |
| 단위 테스트·포매터·CI 없음 · 200자 넘는 줄 1,094개 · 빌드 시 ESLint 끔 · 핏 범위(120~220cm)·배송비(5만 원)가 숫자로 여러 곳 | 규칙이 갈라지는 구조(위 쿠폰 버그의 원인) · 리뷰하기 어려운 코드 |

### 15.2 개선 (D-42 ~ D-47)
| 영역 | 변경 |
|---|---|
| 금액·규칙 단일화 (D-42) | `lib/pricing`(금액) · `lib/validation`(입력 규칙·문구) · `lib/orderMemo`(메모 형식) — 화면·스토어·시드·필터가 같은 함수 사용 → 쿠폰 100배 버그 수정 · 저장 데이터 v5 마이그레이션(이미 저장된 잘못된 주문 금액 복구) |
| 메타데이터 (D-43) | 라우트별 `layout.tsx` 메타데이터·`generateMetadata`(상품·브랜드·주문) · AX 제목 = 메뉴 이름 · 404 제목 · OG 이미지·apple-icon·manifest·robots · `formatDetection` · `metadataBase` · 동적 라우트도 메타데이터를 `<head>`에(`htmlLimitedBots`) |
| 성능 (D-44 · D-47) | 시드 생성 316ms → 65ms(결과 동일 검증) · 미래 시각 주문 정리 · AX lucide 전체 import 제거(AX 대시보드 첫 로드 JS 456KB → 294KB) |
| 접근성 (D-45) | 창 포커스 이동·가두기·복귀 · ESC/뒤로는 맨 위 창만 · dialog를 패널에 두고 제목 연결 · 본문 바로가기 · 오류 경계 · live region 알림 · 진행 막대·별점·버튼 이름 |
| 품질 게이트 (D-46) | Vitest 44개 · Prettier(+Tailwind 정렬) · 빌드 시 ESLint · `npm run check` · GitHub Actions · `.nvmrc`·`engines`·`.editorconfig` · 보안 헤더 · Next 15.5.27 · 운영 의존성 보안 경고 4 → 0 |
