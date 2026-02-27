import type { Strategy } from './strategy';
import type { PerformanceMetrics } from './metrics';
import type { OHLCVBar } from './market';

export type TradeDirection = 'LONG';
export type TradeStatus = 'OPEN' | 'CLOSED';
export type ExitReason = 'SIGNAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP' | 'TIME_EXIT' | 'END_OF_DATA';

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
  highWatermark?: number;   // 트레일링 스탑용 고점 추적
  entryBarIndex?: number;   // 시간 기반 청산용 진입 봉 인덱스
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
  bars: OHLCVBar[];
  metrics: PerformanceMetrics;
  warnings: string[];
}
