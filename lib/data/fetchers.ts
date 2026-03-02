import YahooFinance from "yahoo-finance2";
import type { OHLCVBar } from "@/types/market";
import type { MarketDataRequest } from "@/types/market";
import { getCached, setCached, makeCacheKey } from "./cache";
import { normalizeYahooQuotes, normalizeBinanceKlines } from "./normalizer";

export const yf = new YahooFinance();

// timeframe → Yahoo Finance chart() interval (모든 타임프레임 통일)
const YAHOO_CHART_INTERVAL: Record<string, string> = {
  "15m": "15m",
  "30m": "30m",
  "1h": "60m",
  "1d": "1d",
  "1w": "1wk",
  "1m": "1mo",
};
// 4h는 Yahoo chart()에서 미지원 — 항목 없음

// timeframe → Binance interval
const BINANCE_INTERVAL: Record<string, string> = {
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
  "1w": "1w",
  "1m": "1M",
};

export async function fetchUSStockData(
  symbol: string,
  timeframe: string,
  fromMs: number,
  toMs: number
): Promise<OHLCVBar[]> {
  if (timeframe === "4h") {
    throw new Error(
      "4시간봉은 주식 데이터에서 지원되지 않습니다. 암호화폐를 선택하세요."
    );
  }

  const cacheKey = makeCacheKey(symbol, timeframe, fromMs, toMs);
  const cached = getCached<OHLCVBar[]>(cacheKey);
  if (cached) return cached;

  const interval = YAHOO_CHART_INTERVAL[timeframe] ?? "1d";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (yf as any).chart(symbol, {
    period1: new Date(fromMs),
    period2: new Date(toMs),
    interval,
  });

  const bars = normalizeYahooQuotes(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result?.quotes ?? []) as any[]
  );
  setCached(cacheKey, bars);
  return bars;
}

export async function fetchKRStockData(
  symbol: string,
  timeframe: string,
  fromMs: number,
  toMs: number
): Promise<OHLCVBar[]> {
  // Append .KS suffix for KOSPI symbols if not already present
  const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.KS`;
  return fetchUSStockData(yahooSymbol, timeframe, fromMs, toMs);
}

export async function fetchCryptoData(
  symbol: string,
  timeframe: string,
  fromMs: number,
  toMs: number
): Promise<OHLCVBar[]> {
  const cacheKey = makeCacheKey(symbol, timeframe, fromMs, toMs);
  const cached = getCached<OHLCVBar[]>(cacheKey);
  if (cached) return cached;

  const interval = BINANCE_INTERVAL[timeframe] ?? "1d";
  const allKlines: unknown[] = [];
  let startTime = fromMs;

  // Binance klines API: max 1000 per request
  while (startTime < toMs) {
    const url = new URL("https://api.binance.com/api/v3/klines");
    url.searchParams.set("symbol", symbol.toUpperCase());
    url.searchParams.set("interval", interval);
    url.searchParams.set("startTime", String(startTime));
    url.searchParams.set("endTime", String(toMs));
    url.searchParams.set("limit", "1000");

    const res = await fetch(url.toString());
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = (await res.json()) as { code?: number; msg?: string };
        detail = body.msg ? `[${body.code}] ${body.msg}` : JSON.stringify(body);
      } catch {
        /* non-JSON body */
      }
      throw new Error(`Binance API 오류 (${res.status}): ${detail}`);
    }
    const batch = (await res.json()) as unknown[];
    if (!Array.isArray(batch) || batch.length === 0) break;

    allKlines.push(...batch);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastOpenTime = (batch[batch.length - 1] as any)[0] as number;
    // move startTime past last candle to avoid duplicate
    startTime = lastOpenTime + 1;

    if (batch.length < 1000) break; // no more data
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bars = normalizeBinanceKlines(allKlines as any[]);
  setCached(cacheKey, bars);
  return bars;
}

export async function fetchMarketData(
  request: MarketDataRequest
): Promise<OHLCVBar[]> {
  const { symbol, assetClass, timeframe, from, to } = request;
  switch (assetClass) {
    case "STOCK":
      // Yahoo Finance가 .KS 심볼을 포함한 전 세계 주식 심볼을 직접 처리
      return fetchUSStockData(symbol, timeframe, from, to);
    case "CRYPTO":
      return fetchCryptoData(symbol, timeframe, from, to);
    default:
      throw new Error(`지원하지 않는 자산 유형: ${assetClass}`);
  }
}
