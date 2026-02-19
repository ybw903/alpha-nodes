import type { Strategy } from './strategy';
import type { PerformanceMetrics } from './metrics';

export type TradeDirection = 'LONG';
export type TradeStatus = 'OPEN' | 'CLOSED';
export type ExitReason = 'SIGNAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'END_OF_DATA';

export interface Trade {
  id: string;
  direction: TradeDirection;
  entryTimestamp: number;
  entryPrice: number;
  exitTimestamp?: number;
  exitPrice?: number;
  positionSizePct: number;
  shares: number;
  entryCapital: number;
  pnl?: number;
  pnlPct?: number;
  status: TradeStatus;
  exitReason?: ExitReason;
}

export interface EquityDataPoint {
  timestamp: number;
  equity: number;
  drawdown: number; // percentage, negative
  benchmark: number;
}

export interface BacktestRequest {
  strategy: Strategy;
  initialCapital: number;
  feeRatePct: number;
  slippagePct: number;
  from: number; // Unix ms
  to: number;   // Unix ms
}

export interface BacktestResult {
  strategyId: string;
  runAt: string;
  request: BacktestRequest;
  trades: Trade[];
  equityCurve: EquityDataPoint[];
  metrics: PerformanceMetrics;
  warnings: string[];
}
