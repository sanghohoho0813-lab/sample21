# SETUP.md — 실제화(READY) 전환 가이드

현재 MORFIT은 **전부 DEMO 모드**로 동작합니다. 아래 항목은 사용자가 직접 해야 하는 작업이며, 없어도 시연에는 영향이 없습니다.

## 1. 이미지 자산 적용 (사진은 추후)
1. Google Drive 「샘플 21. 의류」의 사진을 `public/images/`에 저장 — 파일명은 `src/lib/assets.ts`의 `ASSET_PACK` 규격 (`hero_main.jpg`, `service_01_*.jpg`, `why_ax_01_current.jpg` …)
2. `src/lib/assets.ts`의 `AVAILABLE` 배열에 파일명을 추가
3. 저장하면 placeholder 대신 실제 사진이 즉시 사용됩니다 (Hero / Why AX / 카테고리 / 브랜드)

## 2. Supabase (Auth / Data / RLS) — 선택
1. Supabase 프로젝트 생성
2. `.env.example` → `.env.local` 복사 후 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력
3. 스키마: `src/lib/types.ts`의 Entity를 그대로 테이블로 매핑 (Brand, Product, ProductVariant, Inventory, Customer, Order, OrderItem, ReturnRequest, Campaign, AXAction, EvidenceLog, RestockSubscription, Notification)
4. RLS: `profiles.role` (owner / md / ops / customer) 기준 — 권한 매트릭스는 `src/lib/roles.ts` `PERMISSIONS`
5. `src/lib/store.ts`의 action(placeOrder, updateActionStatus, updateOrderStatus, subscribeRestock …)을 Supabase 호출로 교체 — UI는 변경 불필요

## 3. AI API (LLM) — 선택, 1개만 먼저
1. `.env.local`에 `ANTHROPIC_API_KEY` 추가 (서버 전용 · 브라우저 노출 없음)
2. 서버 Route `src/app/api/ai/explain/route.ts` 는 이미 준비되어 있습니다 — 키가 있으면 `claude-opus-5` 를 호출하고, 없으면 규칙 기반 텍스트를 그대로 돌려줍니다 (`@anthropic-ai/sdk`).
3. 서버 재시작 → 경영 대시보드 AI 브리핑의 **"AI 설명 생성"** 버튼이 AI READY → AI LIVE 로 바뀝니다. 설정 > AI 섹션에서도 연결 상태를 확인할 수 있습니다.
4. 연결 범위는 **경영 브리핑 1곳**입니다. 계산·추천·우선순위는 계속 코드가 담당하고, LLM은 설명 문장만 만듭니다. 구조화된 KPI 숫자만 전달하며 개인정보는 보내지 않습니다.
5. 검증: 생성 문장의 숫자가 화면 KPI와 일치하는지 확인합니다 (불일치 시 `route.ts` SYSTEM 프롬프트 규칙 조정).

## 4. 실제 데이터 일부 반영 (CSV)
- 설정 > 데이터 > CSV 가져오기에서 필드 구조 확인 (products / variants / orders)
- Supabase 연결 후 Import Adapter 구현 (`src/lib/demo/seed.ts` 대체)

## 5. 배포
- Vercel: Framework Preset = Next.js, 환경변수 없이도 DEMO 배포 가능
