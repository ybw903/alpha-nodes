import type { Trade, EquityDataPoint } from '@/types/backtest';
import type { PerformanceMetrics } from '@/types/metrics';

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

const BARS_PER_YEAR: Record<string, number> = {
  "15m": 252 * 26,
  "30m": 252 * 13,
  "1h": 252 * 6.5,
  "4h": 252 * 1.625,
  "1d": 252,
  "1w": 52,
  "1m": 12,
};

export function computeMetrics(
  trades: Trade[],
  equityCurve: EquityDataPoint[],
  initialCapital: number,
  totalFees: number,
  timeframe: string = "1d",
): PerformanceMetrics {
  const finalCapital = equityCurve.at(-1)?.equity ?? initialCapital;
  const peakCapital = Math.max(...equityCurve.map((e) => e.equity));
  const totalReturnPct = ((finalCapital - initialCapital) / initialCapital) * 100;

  // Annualized return (CAGR) — timestamp 기반 실제 경과 기간 사용
  const startTs = equityCurve[0]?.timestamp ?? 0;
  const endTs = equityCurve.at(-1)?.timestamp ?? 0;
  const yearsFraction = (endTs - startTs) / (365.25 * 86_400_000);
  const annualizedReturnPct = yearsFraction > 0
    ? ((finalCapital / initialCapital) ** (1 / yearsFraction) - 1) * 100
    : 0;

  // Benchmark (buy-and-hold)
  const benchmarkReturnPct = equityCurve.length > 0
    ? ((equityCurve.at(-1)!.benchmark - initialCapital) / initialCapital) * 100
    : 0;

  // Max drawdown
  const maxDrawdownPct = Math.abs(Math.min(0, ...equityCurve.map((e) => e.drawdown))) * 100;

  // Daily returns for Sharpe/Sortino
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    dailyReturns.push(prev !== 0 ? (equityCurve[i].equity - prev) / prev : 0);
  }

  const meanDaily = dailyReturns.length > 0
    ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
    : 0;
  const barsPerYear = BARS_PER_YEAR[timeframe] ?? 252;
  const stdDaily = stdDev(dailyReturns);
  const sharpeRatio = stdDaily !== 0 ? (meanDaily / stdDaily) * Math.sqrt(barsPerYear) : 0;

  const downsideReturns = dailyReturns.filter((r) => r < 0);
  const downsideStd = stdDev(downsideReturns);
  const sortinoRatio = downsideStd !== 0
    ? ((annualizedReturnPct / 100) / (downsideStd * Math.sqrt(barsPerYear)))
    : 0;

  const calmarRatio = maxDrawdownPct !== 0 ? annualizedReturnPct / maxDrawdownPct : 0;
  const volatilityAnnualized = stdDaily * Math.sqrt(barsPerYear) * 100;

  // Trade statistics
  const closedTrades = trades.filter((t) => t.status === 'CLOSED' && t.pnlPct !== undefined);
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) <= 0);

  const winRate = closedTrades.length > 0 ? wins.length / closedTrades.length : 0;
  const avgWinPct = wins.length > 0
    ? wins.reduce((a, t) => a + (t.pnlPct ?? 0), 0) / wins.length
    : 0;
  const avgLossPct = losses.length > 0
    ? losses.reduce((a, t) => a + (t.pnlPct ?? 0), 0) / losses.length
    : 0;

  const grossProfit = wins.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + (t.pnl ?? 0), 0));
  const profitFactor = grossLoss !== 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgHoldingPeriodBars = closedTrades.length > 0
    ? closedTrades.reduce((a, t) => {
        const bars = t.exitTimestamp && t.entryTimestamp
          ? Math.round((t.exitTimestamp - t.entryTimestamp) / 86_400_000)
          : 0;
        return a + bars;
      }, 0) / closedTrades.length
    : 0;

  const largestWinPct = wins.length > 0 ? Math.max(...wins.map((t) => t.pnlPct ?? 0)) : 0;
  const largestLossPct = losses.length > 0 ? Math.min(...losses.map((t) => t.pnlPct ?? 0)) : 0;

  return {
    totalReturnPct: parseFloat(totalReturnPct.toFixed(2)),
    annualizedReturnPct: parseFloat(annualizedReturnPct.toFixed(2)),
    benchmarkReturnPct: parseFloat(benchmarkReturnPct.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(3)),
    sortinoRatio: parseFloat(sortinoRatio.toFixed(3)),
    calmarRatio: parseFloat(calmarRatio.toFixed(3)),
    volatilityAnnualized: parseFloat(volatilityAnnualized.toFixed(2)),
    totalTrades: closedTrades.length,
    winRate: parseFloat(winRate.toFixed(4)),
    avgWinPct: parseFloat(avgWinPct.toFixed(2)),
    avgLossPct: parseFloat(avgLossPct.toFixed(2)),
    profitFactor: parseFloat(Math.min(profitFactor, 999).toFixed(3)),
    avgHoldingPeriodBars: parseFloat(avgHoldingPeriodBars.toFixed(1)),
    largestWinPct: parseFloat(largestWinPct.toFixed(2)),
    largestLossPct: parseFloat(largestLossPct.toFixed(2)),
    initialCapital,
    finalCapital: parseFloat(finalCapital.toFixed(0)),
    totalFeesSpent: parseFloat(totalFees.toFixed(0)),
    peakCapital: parseFloat(peakCapital.toFixed(0)),
  };
}
