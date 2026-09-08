# MORFIT — 패션·의류 AX + 멀티브랜드 플랫폼 (DEMO)

> 고객의 조회·검색·찜·사이즈·구매·반품 데이터를 **상품 옵션 단위의 수요신호**로 바꾸고,
> 이를 MD·재고·할인·재구매 판단에 연결하는 **Business AX + Customer Platform Hybrid**.
> 미래AI랩 AX + Platform Unified Design & Development System v3.0 기반 · 가상 브랜드 · 모든 데이터는 DEMO.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
npm run qa:shots   # 8개 폭 × 전 Route 스크린샷 + overflow/404 리포트 (dev 서버 필요)
node scripts/qa-journey.mjs   # Whole-Hybrid Acceptance Journey 자동 검증
```

## 구조

```
/                     Customer Front (MORFIT)           /ax                Business AX
/ranking /new /brands /shop /search /style              /ax/actions        Growth & Action Center
/products/[id]  (Fit Signal · 재입고 알림)              /ax/inventory      Demand Radar
/wishlist /cart /checkout (DEMO) /my …                  /ax/orders /ax/evidence /ax/why /ax/present /ax/settings
/next/[slug]    향후 확장 Preview (404 없음)

src/lib/types.ts        데이터 모델 (SSOT)
src/lib/demo/seed.ts    Demo Repository — 결정론적 시드, Scenario A~D 내장
src/lib/store.ts        공유 Zustand 스토어 (Customer ↔ AX Closed Loop, localStorage 유지)
src/lib/kpi.ts          KPI·재고상태·Demand Score·재입고 우선순위 (코드 계산)
src/lib/engine.ts       규칙 기반 엔진: 핏 추천 · 재구매 추천 · AI 브리핑(규칙)
src/lib/ai.ts           AI READY — LLM 연결 지점 (현재 미연결)
```

## 문서
- `PROJECT_SPEC.md` — 설계도 (전략 잠금 · IA · Loop · 권한 · 데이터)
- `PROJECT_STATE.md` — 진행상황 · USER ACTION QUEUE
- `DECISIONS.md` — 설계 결정 (WHY / WHY NOT / REVISIT)
- `QA_REPORT.md` — Strategy/Product Score · P0/P1 · 반응형·테마 검증
- `docs/RECOMMENDATIONS.md` — P2 개선 후보
- `SETUP.md` — Supabase / AI API / 이미지 자산 연결 가이드 (READY)
