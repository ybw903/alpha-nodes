import type { OHLCVBar } from '@/types/market';

type YahooQuote = {
  date: Date | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export function normalizeYahooQuotes(quotes: YahooQuote[]): OHLCVBar[] {
  return quotes
    .filter(
      (q): q is YahooQuote & {
        date: Date;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      } =>
        q.date != null &&
        q.open != null &&
        q.high != null &&
        q.low != null &&
        q.close != null &&
        q.volume != null,
    )
    .map((q) => ({
      timestamp: q.date.getTime(),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

// Binance kline tuple: [openTime, open, high, low, close, volume, ...]
type BinanceKline = [
  number, // 0: openTime (ms)
  string, // 1: open
  string, // 2: high
  string, // 3: low
  string, // 4: close
  string, // 5: volume
  ...unknown[],
];

export function normalizeBinanceKlines(klines: BinanceKline[]): OHLCVBar[] {
  return klines
    .map((k) => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}
