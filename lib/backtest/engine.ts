import type { BacktestRequest, BacktestResult, Trade, EquityDataPoint } from '@/types/backtest';
import type { OHLCVBar } from '@/types/market';
import type { StrategyNode } from '@/types/strategy';
import type { BuyParams, SellParams } from '@/types/strategy';
import { generateMockOHLCV } from '@/lib/data/mockData';
import { computeIndicator, type IndicatorSeries } from './indicators';
import { evaluateStrategy } from './strategyEvaluator';
import { computeMetrics } from './metrics';

const INDICATOR_BLOCKS = new Set(['SMA','EMA','RSI','MACD','BOLLINGER','ATR','PRICE','VOLUME']);

function getMaxPeriod(nodes: StrategyNode[]): number {
  let max = 0;
  for (const node of nodes) {
    const p = node.data.params as Record<string, unknown>;
    for (const key of ['period', 'slowPeriod', 'fastPeriod', 'signalPeriod']) {
      if (typeof p[key] === 'number') max = Math.max(max, p[key] as number);
    }
  }
  return Math.max(max, 30); // minimum 30-bar warmup
}

export async function runBacktest(request: BacktestRequest): Promise<BacktestResult> {
  const { strategy, initialCapital, feeRatePct, slippagePct, from, to } = request;
  const { nodes, edges } = strategy;

  const warnings: string[] = [];

  // 1. Fetch (mock) data with warmup buffer
  const warmup = getMaxPeriod(nodes);
  const warmupMs = warmup * 86_400_000 * 1.5; // extra buffer for weekends
  const bars: OHLCVBar[] = generateMockOHLCV(from - warmupMs, to);

  if (bars.length < warmup + 10) {
    throw new Error('데이터가 부족합니다. 더 긴 기간을 선택해주세요.');
  }

  // 2. Compute indicator series for all indicator nodes
  const indicatorMap = new Map<string, IndicatorSeries>();
  for (const node of nodes) {
    if (INDICATOR_BLOCKS.has(node.data.blockType)) {
      try {
        indicatorMap.set(node.id, computeIndicator(node, bars));
      } catch (err) {
        warnings.push(`[${node.data.label}] 계산 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
        indicatorMap.set(node.id, bars.map(() => null));
      }
    }
  }

  // 3. Evaluate strategy signals per bar
  const barSignals = evaluateStrategy(nodes, edges, indicatorMap, bars.length);

  // 4. Simulate trades
  const trades: Trade[] = [];
  let capital = initialCapital;
  let totalFees = 0;
  let openTrade: Trade | null = null;
  const equityCurve: EquityDataPoint[] = [];

  const startPrice = bars[0].close;
  let benchmarkShares = initialCapital / startPrice;

  // Track peak for drawdown
  let peak = initialCapital;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const signal = barSignals[i];

    // Skip warmup period (use test window based on 'from' timestamp)
    if (bar.timestamp < from) {
      continue;
    }

    const benchmark = benchmarkShares * bar.close;

    // Check stop-loss / take-profit on open trade
    if (openTrade) {
      const sellNode = nodes.find((n) => n.data.blockType === 'SELL');
      const sellParams = sellNode?.data.params as SellParams | undefined;

      const currentPnlPct = ((bar.close - openTrade.entryPrice) / openTrade.entryPrice) * 100;

      const stopLossHit = sellParams?.stopLossPct
        && currentPnlPct <= -(sellParams.stopLossPct);
      const takeProfitHit = sellParams?.takeProfitPct
        && currentPnlPct >= sellParams.takeProfitPct;

      if (stopLossHit || takeProfitHit) {
        const exitPrice = bar.low * (1 - slippagePct / 100); // conservative exit on SL
        const exitReason = stopLossHit ? 'STOP_LOSS' : 'TAKE_PROFIT';
        closeTrade(openTrade, exitPrice, bar.timestamp, exitReason);
        openTrade = null;
      }
    }

    // Process signals (use next bar open price via current close as proxy)
    const entryPrice = bar.close * (1 + slippagePct / 100);
    const exitPrice = bar.close * (1 - slippagePct / 100);

    if (signal.buy && !openTrade) {
      const buyNode = nodes.find((n) => n.data.blockType === 'BUY');
      const buyParams = buyNode?.data.params as BuyParams | undefined;
      const sizePct = buyParams?.positionSizePct ?? 100;
      const tradeCapital = capital * (sizePct / 100);
      const fee = tradeCapital * (feeRatePct / 100);
      const netCapital = tradeCapital - fee;
      const shares = netCapital / entryPrice;

      totalFees += fee;
      capital -= tradeCapital;

      openTrade = {
        id: `trade_${trades.length + 1}`,
        direction: 'LONG',
        entryTimestamp: bar.timestamp,
        entryPrice,
        positionSizePct: sizePct,
        shares,
        entryCapital: tradeCapital,
        status: 'OPEN',
      };
      trades.push(openTrade);
    }

    if (signal.sell && openTrade) {
      closeTrade(openTrade, exitPrice, bar.timestamp, 'SIGNAL');
      openTrade = null;
    }

    // Calculate current equity
    const unrealized = openTrade ? openTrade.shares * bar.close - openTrade.entryCapital : 0;
    const equity = capital + (openTrade ? openTrade.entryCapital + unrealized : 0);

    peak = Math.max(peak, equity);
    const drawdown = peak > 0 ? (equity - peak) / peak : 0;

    equityCurve.push({ timestamp: bar.timestamp, equity, drawdown, benchmark });
  }

  // Close any open trade at end of data
  if (openTrade && bars.length > 0) {
    const lastBar = bars[bars.length - 1];
    closeTrade(openTrade, lastBar.close, lastBar.timestamp, 'END_OF_DATA');
  }

  function closeTrade(
    trade: Trade,
    exitPrice: number,
    exitTimestamp: number,
    exitReason: Trade['exitReason']
  ) {
    const exitValue = trade.shares * exitPrice;
    const fee = exitValue * (feeRatePct / 100);
    totalFees += fee;
    const proceeds = exitValue - fee;
    capital += proceeds;

    trade.exitPrice = exitPrice;
    trade.exitTimestamp = exitTimestamp;
    trade.exitReason = exitReason;
    trade.status = 'CLOSED';
    trade.pnl = proceeds - trade.entryCapital;
    trade.pnlPct = (trade.pnl / trade.entryCapital) * 100;
  }

  // 5. Compute metrics
  const metrics = computeMetrics(trades, equityCurve, initialCapital, totalFees);

  return {
    strategyId: strategy.meta.id,
    runAt: new Date().toISOString(),
    request,
    trades,
    equityCurve,
    metrics,
    warnings,
  };
}
