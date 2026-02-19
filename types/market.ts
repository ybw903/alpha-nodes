import type { AssetClass, Timeframe } from './strategy';

export interface OHLCVBar {
  timestamp: number; // Unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataRequest {
  symbol: string;
  assetClass: AssetClass;
  timeframe: Timeframe;
  from: number; // Unix ms
  to: number;   // Unix ms
}

export interface MarketDataResponse {
  symbol: string;
  timeframe: Timeframe;
  bars: OHLCVBar[];
  source: 'yahoo' | 'binance' | 'mock';
}
