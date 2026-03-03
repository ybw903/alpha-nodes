# AlphaNodes

A no-code backtesting web service for stocks and cryptocurrencies. Build trading strategies by dragging and dropping blocks, then validate performance against historical data.

## Features

### Strategy Builder

A node graph editor powered by ReactFlow. Arrange blocks on a canvas and connect them to define your strategy logic.

**Indicator Blocks**
| Block | Description |
|---|---|
| `PRICE` | Extract OHLCV values from a bar (open, high, low, close, volume) |
| `SMA` | Simple Moving Average (configurable period and source) |
| `EMA` | Exponential Moving Average |
| `RSI` | Relative Strength Index |
| `MACD` | MACD line / Signal line / Histogram |
| `BOLLINGER` | Bollinger Bands (upper, middle, lower) |
| `ATR` | Average True Range |
| `LOOKBACK` | Reference the value from N bars ago |

**Condition Blocks**
| Block | Description |
|---|---|
| `COMPARE` | Compare two values with an operator (`>`, `<`, `>=`, `<=`, `==`) |
| `CROSSOVER` | Detect when value A crosses above value B |
| `CROSSUNDER` | Detect when value A crosses below value B |
| `THRESHOLD` | Compare a value against a fixed number |
| `CONSECUTIVE` | Condition must be true for N consecutive bars |

**Logic Blocks**

`AND` · `OR` · `NOT`

**Action Blocks**
| Block | Description |
|---|---|
| `BUY` | Enter a long position (configurable position size %) |
| `SELL` | Close a long position with optional risk management: stop-loss (`stopLossPct`), take-profit (`takeProfitPct`), trailing stop (`trailingStopPct`), time-based exit (`exitAfterBars`) |

### Supported Assets & Timeframes

| Asset Class      | Data Source   | Timeframes                         |
| ---------------- | ------------- | ---------------------------------- |
| Stocks (US / KR) | Yahoo Finance | 15m · 30m · 1h · 1d · 1w · 1M      |
| Crypto           | Binance API   | 15m · 30m · 1h · 4h · 1d · 1w · 1M |

- Korean stocks: enter the KOSPI symbol directly (e.g. `005930.KS`)
- Crypto: use Binance format without hyphens (e.g. `BTCUSDT`, `ETHUSDT`)

### Performance Metrics (21 total)

Total return, annualized return, max drawdown (MDD), Sharpe ratio, Sortino ratio, Calmar ratio, annualized volatility, win rate, average win/loss, profit factor, average holding period, largest win/loss, initial and final capital, total fees paid, peak capital

### Internationalization

Full Korean (ko) and English (en) support via `next-intl`. The middleware automatically redirects based on the browser's preferred language.

---

## Tech Stack

| Purpose              | Library                                         |
| -------------------- | ----------------------------------------------- |
| Framework            | Next.js 16 (App Router) + React 19 + TypeScript |
| Node graph           | `@xyflow/react` (ReactFlow v12)                 |
| Financial charts     | `lightweight-charts` v5 (TradingView)           |
| State management     | `zustand`                                       |
| Server data fetching | `@tanstack/react-query`                         |
| Forms                | `react-hook-form` + `zod`                       |
| Technical indicators | `technicalindicators`                           |
| Stock data           | `yahoo-finance2`                                |
| Crypto data          | Binance REST API (free)                         |
| Styling              | Tailwind CSS v4                                 |
| i18n                 | `next-intl`                                     |
| Modals               | `@radix-ui/react-dialog`                        |
| Testing              | `vitest` + `@vitest/coverage-v8`                |

---

## Project Structure

```
backtest-app/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                  # Strategy builder (home)
│   │   ├── results/[strategyId]/     # Backtest results page
│   │   └── layout.tsx                # Locale-aware layout
│   ├── api/
│   │   ├── backtest/route.ts         # POST: run backtest
│   │   ├── market-data/route.ts      # GET: fetch OHLCV data
│   │   └── search/route.ts           # GET: symbol autocomplete search
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Dark theme CSS variables
│
├── components/
│   ├── builder/
│   │   ├── BuilderCanvas.tsx         # ReactFlow canvas
│   │   ├── BuilderSidebar.tsx        # Block palette
│   │   ├── BuilderToolbar.tsx        # Save / load toolbar
│   │   ├── AssetSearch.tsx           # Symbol autocomplete (300ms debounce)
│   │   └── panels/
│   │       ├── NodeConfigPanel.tsx   # Node parameter editor
│   │       └── RunPanel.tsx          # Run configuration
│   ├── results/
│   │   ├── CandlestickChart.tsx      # Candlestick + indicator overlays
│   │   ├── EquityChart.tsx           # Cumulative return curve
│   │   ├── DrawdownChart.tsx         # Drawdown chart
│   │   ├── MetricsGrid.tsx           # KPI cards
│   │   └── TradeTable.tsx            # Trade history table
│   ├── common/
│   │   └── LanguageToggle.tsx        # Language switcher
│   └── ui/
│       └── Modal.tsx                 # Alert / Confirm / Prompt dialogs
│
├── lib/
│   ├── backtest/
│   │   ├── engine.ts                 # Main backtest loop (server-side)
│   │   ├── strategyEvaluator.ts      # Graph traversal → trade signals
│   │   ├── indicators.ts             # technicalindicators wrappers
│   │   └── metrics.ts                # Performance metric calculations
│   ├── data/
│   │   ├── fetchers.ts               # fetchMarketData (routes by assetClass)
│   │   ├── normalizer.ts             # API responses → OHLCVBar[]
│   │   ├── cache.ts                  # 30-minute TTL in-memory cache
│   │   └── mockData.ts               # Synthetic OHLCV for development
│   └── store/
│       ├── builderStore.ts           # ReactFlow graph state
│       ├── backtestStore.ts          # Backtest result state
│       └── uiStore.ts                # UI state (panel mode, sidebar)
│
├── types/                            # TypeScript type definitions
├── messages/                         # i18n messages (ko / en)
├── i18n/                             # next-intl routing config
├── hooks/                            # Custom hooks (useModal, etc.)
└── tests/
    ├── unit/                         # Unit tests
    ├── integration/                  # Integration tests
    └── fixtures/                     # Shared test data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
git clone https://github.com/your-username/backtest-app.git
cd backtest-app
pnpm install
pnpm dev
```

Open http://localhost:3000 — the middleware will redirect to `/ko` or `/en` based on your browser language.

### Production Build

```bash
pnpm build
pnpm start
```

---

## Usage

### 1. Build a Strategy

1. Drag blocks from the left palette onto the canvas
2. Connect block handles to define the logic flow
   - Blue handles (NUMERIC): pass indicator values
   - Green handles (BOOLEAN): pass condition results
3. Click a node to edit its parameters in the right panel

**Example — SMA Golden Cross:**

```
SMA(5)  ─┐
          CROSSOVER ──► BUY
SMA(20) ─┘
```

### 2. Run a Backtest

Select the **Run** tab in the right panel and configure:

1. Asset class (Stock / Crypto)
2. Symbol (with autocomplete: `AAPL`, `005930.KS`, `BTCUSDT`)
3. Timeframe
4. Date range and initial capital
5. Click **Run Backtest**

### 3. Review Results

- **Metrics**: 21 performance indicators including return, MDD, and Sharpe ratio
- **Charts**: Candlestick with indicator overlays and trade entry/exit markers
- **Equity curve**: Cumulative return and drawdown over time
- **Trade log**: Entry/exit prices, P&L, and exit reason for every trade

### 4. Save and Load Strategies

Use the **Save** button in the toolbar to store up to 5 strategies in browser local storage.

---

## Testing

```bash
pnpm test             # Run all tests once
pnpm test:watch       # Watch mode
pnpm test:coverage    # Generate coverage report
```

Coverage targets: **80% lines** and **85% functions** across `lib/backtest/` and `lib/data/`.

---

## License

MIT
