export interface PerformanceMetrics {
  // Returns
  totalReturnPct: number;
  annualizedReturnPct: number;
  benchmarkReturnPct: number;

  // Risk
  maxDrawdownPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  volatilityAnnualized: number;

  // Trade statistics
  totalTrades: number;
  winRate: number; // 0–1
  avgWinPct: number;
  avgLossPct: number;
  profitFactor: number;
  avgHoldingPeriodBars: number;
  largestWinPct: number;
  largestLossPct: number;

  // Capital
  initialCapital: number;
  finalCapital: number;
  totalFeesSpent: number;
  peakCapital: number;
}
