# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start development server at http://localhost:3000
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

## Architecture

This is a **노코드 백테스팅 웹서비스** built with Next.js App Router, TypeScript, and Tailwind CSS v4.

- **Package manager**: pnpm
- **Routing**: File-based via the `app/` directory (App Router)
- **Components**: Server Components by default; add `"use client"` directive for client-side interactivity
- **Styling**: Tailwind CSS v4 — import via `@import "tailwindcss"` in CSS (not the v3 `@tailwind` directives)
- **Path alias**: `@/*` resolves to the project root

### Tech Stack

| 용도 | 라이브러리 |
|---|---|
| 노드 그래프 캔버스 | `@xyflow/react` (ReactFlow v12) |
| 금융 차트 | `lightweight-charts` v5 (TradingView) |
| 상태 관리 | `zustand` |
| 서버 데이터 패칭 | `@tanstack/react-query` |
| 폼 처리 | `react-hook-form` + `zod` |
| 기술 지표 계산 | `technicalindicators` |
| 미국/한국 주식 데이터 | `yahoo-finance2` |
| 암호화폐 데이터 | Binance REST API (무료) |

### Key Files

**타입 정의**
- `types/strategy.ts` — BlockType, AssetClass, StrategyNode, Strategy 등 전략 빌더 핵심 타입
- `types/backtest.ts` — BacktestResult, Trade, EquityDataPoint
- `types/market.ts` — OHLCVBar, MarketDataRequest, MarketDataResponse
- `types/api.ts` — ApiResponse\<T\>, AssetSearchResult
- `types/metrics.ts` — PerformanceMetrics

**상태 관리 (Zustand)**
- `lib/store/builderStore.ts` — ReactFlow 그래프(nodes, edges, viewport), RunConfig, clearCanvas, loadStrategy
- `lib/store/backtestStore.ts` — 백테스트 결과 및 실행 상태
- `lib/store/uiStore.ts` — 패널 모드(config/run), 사이드바 열림 여부

**백테스팅 엔진**
- `lib/backtest/engine.ts` — 메인 백테스팅 루프 (서버사이드, API Route에서 호출)
- `lib/backtest/strategyEvaluator.ts` — 그래프 순회 → BUY/SELL 시그널 생성
- `lib/backtest/indicators.ts` — technicalindicators 래퍼
- `lib/backtest/metrics.ts` — MDD, Sharpe, 승률 등 성과 지표 계산

**데이터 레이어**
- `lib/data/fetchers.ts` — fetchMarketData (assetClass 기반 라우팅), Yahoo/Binance 호출
- `lib/data/cache.ts` — TTL 30분 인메모리 캐시 (일 단위 캐시키)
- `lib/data/normalizer.ts` — Yahoo/Binance API 응답 → OHLCVBar[] 변환
- `lib/data/mockData.ts` — 개발/테스트용 가상 OHLCV 생성

**페이지**
- `app/page.tsx` — 랜딩 페이지
- `app/builder/page.tsx` — 전략 빌더 (좌: 블록 팔레트, 중: ReactFlow 캔버스, 우: 설정 패널)
- `app/results/[strategyId]/page.tsx` — 백테스트 결과 (지표, 차트, 거래 내역)

**API Routes**
- `app/api/backtest/route.ts` — POST: 백테스팅 실행
- `app/api/market-data/route.ts` — GET: 시장 데이터 (OHLCV)
- `app/api/search/route.ts` — GET: 종목 심볼 검색 (자동완성)

**빌더 컴포넌트**
- `components/builder/BuilderToolbar.tsx` — 상단 툴바 (새 전략, 불러오기, 저장)
- `components/builder/BuilderCanvas.tsx` — ReactFlow 캔버스
- `components/builder/BuilderSidebar.tsx` — 블록 팔레트
- `components/builder/AssetSearch.tsx` — 종목 검색 자동완성 (300ms 디바운스)
- `components/builder/panels/RunPanel.tsx` — 자산·기간·자본 설정 + 백테스트 실행
- `components/builder/panels/NodeConfigPanel.tsx` — 선택된 노드 파라미터 편집

**결과 컴포넌트**
- `components/results/CandlestickChart.tsx` — 캔들스틱 + 지표 오버레이 + 매매 마커
- `components/results/EquityChart.tsx` — 누적 수익 곡선
- `components/results/MetricsGrid.tsx` — KPI 카드 (수익률, MDD, Sharpe 등)
- `components/results/TradeTable.tsx` — 거래 내역 테이블

## Coding Conventions

### Tailwind CSS v4 CSS 변수 참조

CSS 변수는 괄호 문법으로 참조한다. `[var(--...)]` 형식은 사용하지 않는다.

```tsx
// 올바른 예
bg-(--color-accent)
text-(--color-text-secondary)
border-(--color-border-default)

// 잘못된 예
bg-[var(--color-accent)]
text-[var(--color-text-secondary)]
```

전역 변수(`--color-background`, `--color-foreground`)는 Tailwind 기본 유틸리티 사용:

```tsx
bg-background   // --color-background
text-foreground // --color-foreground
```

커스텀 CSS 변수 목록은 `app/globals.css` 참고 (`--color-accent`, `--color-danger`, `--color-bg-surface` 등).

### TypeScript 타입 패턴

- `StrategyNodeData`는 반드시 `extends Record<string, unknown>` (ReactFlow v12 제약)
- `StrategyNode = Node<StrategyNodeData>` — ReactFlow Node 타입 직접 사용
- ReactFlow 이벤트 핸들러: `OnNodeClick` 없음 → `NodeMouseHandler` 사용
- API 응답 봉투 형식: `{ success: boolean; data: T; timestamp: string }`

### 라이브러리 주의사항

- **lightweight-charts v5**: `createSeriesMarkers(series, markers)` 사용. v4의 `series.setMarkers()` 없음
- **lightweight-charts 시간**: Unix seconds 단위 → `Math.floor(timestamp / 1000)` 변환 필요
- **yahoo-finance2 `.search()`**: 반환 타입이 `never`로 추론됨 → `as any` 후 `as unknown[]` 캐스팅 필요
- **CandlestickChart 오버레이**: RSI/MACD/ATR는 가격 스케일이 달라 오버레이 제외, SMA/EMA/BOLLINGER만 지원

### 자산 유형 (AssetClass)

- `STOCK`: Yahoo Finance 경유. `AAPL`(미국), `005930.KS`(한국 KOSPI) 심볼 모두 처리
- `CRYPTO`: Binance API 경유. `BTCUSDT` 형식 (하이픈 없음)
- 한국 주식은 `.KS` 접미사 포함 심볼을 Yahoo Finance에 직접 전달 (별도 경로 없음)

### click-outside 패턴

드롭다운/자동완성에서 외부 클릭 감지 시 `mousedown` 이벤트를 사용한다. `blur` 이전에 클릭이 등록되어야 항목 선택이 가능하기 때문이다.

```tsx
document.addEventListener('mousedown', handler);
// 항목 클릭도 onMouseDown으로 처리
<button onMouseDown={() => handleSelect(item)}>
```

## Phase 진행 상황

- **Phase 1** ✅ — 전략 빌더 UI + Mock OHLCV + 백테스팅 엔진 + 결과 페이지
- **Phase 2** ✅ — Yahoo Finance/Binance 실제 데이터 + AssetSearch + CandlestickChart
- **Phase 3** 미시작 — 인증(Clerk/NextAuth), DB(PostgreSQL + Prisma), KIS OpenAPI 직접 연동
