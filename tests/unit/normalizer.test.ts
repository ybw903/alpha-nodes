import { describe, it, expect } from "vitest";
import {
  normalizeYahooQuotes,
  normalizeBinanceKlines,
} from "@/lib/data/normalizer";

// ─── Yahoo Finance ─────────────────────────────────────────────────────────

describe("normalizeYahooQuotes", () => {
  it("완전한 quote를 OHLCVBar로 정확히 변환한다", () => {
    const date = new Date("2023-01-01T00:00:00Z");
    const result = normalizeYahooQuotes([
      { date, open: 100, high: 105, low: 98, close: 102, volume: 1_000_000 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      timestamp: date.getTime(),
      open: 100,
      high: 105,
      low: 98,
      close: 102,
      volume: 1_000_000,
    });
  });

  it("close=null인 항목을 필터링한다", () => {
    const date = new Date("2023-01-01");
    const result = normalizeYahooQuotes([
      { date, open: 100, high: 105, low: 98, close: null, volume: 1_000 },
    ]);
    expect(result).toHaveLength(0);
  });

  it("date=null인 항목을 필터링한다", () => {
    const result = normalizeYahooQuotes([
      { date: null, open: 100, high: 105, low: 98, close: 102, volume: 1_000 },
    ]);
    expect(result).toHaveLength(0);
  });

  it("open, high, low, volume 중 하나라도 null이면 필터링한다", () => {
    const date = new Date("2023-01-01");
    const result = normalizeYahooQuotes([
      { date, open: null, high: 105, low: 98, close: 102, volume: 1_000 },
      { date, open: 100, high: null, low: 98, close: 102, volume: 1_000 },
      { date, open: 100, high: 105, low: null, close: 102, volume: 1_000 },
      { date, open: 100, high: 105, low: 98, close: 102, volume: null },
    ]);
    expect(result).toHaveLength(0);
  });

  it("역순 입력 → timestamp 오름차순으로 정렬된다", () => {
    const d1 = new Date("2023-01-01");
    const d2 = new Date("2023-01-02");
    const d3 = new Date("2023-01-03");
    const result = normalizeYahooQuotes([
      { date: d3, open: 103, high: 106, low: 101, close: 104, volume: 1_000 },
      { date: d1, open: 101, high: 104, low: 99, close: 102, volume: 1_000 },
      { date: d2, open: 102, high: 105, low: 100, close: 103, volume: 1_000 },
    ]);
    expect(result[0].timestamp).toBe(d1.getTime());
    expect(result[1].timestamp).toBe(d2.getTime());
    expect(result[2].timestamp).toBe(d3.getTime());
  });

  it("빈 배열 입력 → 빈 배열 반환", () => {
    expect(normalizeYahooQuotes([])).toEqual([]);
  });

  it("null 포함/미포함 혼합 → 유효한 항목만 반환", () => {
    const date = new Date("2023-01-01");
    const result = normalizeYahooQuotes([
      { date, open: 100, high: 105, low: 98, close: null, volume: 1_000 }, // 제거
      { date, open: 100, high: 105, low: 98, close: 102, volume: 1_000 }, // 유지
      { date: null, open: 100, high: 105, low: 98, close: 103, volume: 1_000 }, // 제거
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].close).toBe(102);
  });

  it("timestamp가 date.getTime()과 정확히 일치한다", () => {
    const date = new Date("2023-06-15T12:30:00.000Z");
    const result = normalizeYahooQuotes([
      { date, open: 100, high: 105, low: 98, close: 102, volume: 1_000 },
    ]);
    expect(result[0].timestamp).toBe(date.getTime());
  });
});

// ─── Binance ───────────────────────────────────────────────────────────────

describe("normalizeBinanceKlines", () => {
  it("문자열 가격을 parseFloat으로 정확히 변환한다", () => {
    const result = normalizeBinanceKlines([
      [1_700_000_000_000, "43251.50", "43500.00", "43000.00", "43350.75", "123.456"],
    ]);
    expect(result[0].open).toBe(43251.5);
    expect(result[0].high).toBe(43500.0);
    expect(result[0].low).toBe(43000.0);
    expect(result[0].close).toBe(43350.75);
    expect(result[0].volume).toBe(123.456);
  });

  it("kline[0] = openTime → timestamp 그대로 사용", () => {
    const openTime = 1_700_000_000_000;
    const result = normalizeBinanceKlines([
      [openTime, "100", "110", "90", "105", "500"],
    ]);
    expect(result[0].timestamp).toBe(openTime);
  });

  it("역순 kline 입력 → timestamp 오름차순 정렬", () => {
    const result = normalizeBinanceKlines([
      [3_000, "103", "106", "101", "104", "300"],
      [1_000, "101", "104", "99", "102", "100"],
      [2_000, "102", "105", "100", "103", "200"],
    ]);
    expect(result[0].timestamp).toBe(1_000);
    expect(result[1].timestamp).toBe(2_000);
    expect(result[2].timestamp).toBe(3_000);
  });

  it("빈 배열 → 빈 OHLCVBar[] 반환", () => {
    expect(normalizeBinanceKlines([])).toEqual([]);
  });

  it("튜플 인덱스 0~5만 사용하고 나머지 필드는 무시한다", () => {
    const result = normalizeBinanceKlines([
      [1_000, "100", "110", "90", "105", "500", "extra1", "extra2", 12345],
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      timestamp: 1_000,
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      volume: 500,
    });
  });

  it("volume=0인 kline도 유효 항목으로 변환한다", () => {
    const result = normalizeBinanceKlines([
      [1_000, "100", "110", "90", "105", "0"],
    ]);
    expect(result[0].volume).toBe(0);
  });
});
