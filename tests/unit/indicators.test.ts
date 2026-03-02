import { describe, it, expect } from "vitest";
import { computeIndicator } from "@/lib/backtest/indicators";
import { makeBars, makeNode } from "@/tests/fixtures";

describe("computeIndicator", () => {
  it("SMA(5): 첫 4개 null, index[4]=mean(close[0..4])", () => {
    const bars = makeBars(10, 100);
    // close values: 101, 102, 103, 104, 105, ...
    const node = makeNode("sma1", "SMA", { period: 5, source: "close" });
    const result = computeIndicator(node, bars);

    expect(result).toHaveLength(10);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeNull();
    expect(result[3]).toBeNull();
    // mean(101,102,103,104,105) = 103
    expect(result[4]).toBeCloseTo(103, 5);
  });

  it("결과 길이 = bars.length (항상)", () => {
    const bars = makeBars(20, 100);
    const node = makeNode("sma1", "SMA", { period: 5, source: "close" });
    const result = computeIndicator(node, bars);
    expect(result).toHaveLength(20);
  });

  it("RSI 유효 값: [0, 100] 범위", () => {
    const bars = makeBars(50, 100);
    const node = makeNode("rsi1", "RSI", { period: 14, source: "close" });
    const result = computeIndicator(node, bars);
    const valid = result.filter((v): v is number => v !== null);
    expect(valid.length).toBeGreaterThan(0);
    valid.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it("BOLLINGER: upper > middle > lower", () => {
    const bars = makeBars(30, 100);
    const upperNode = makeNode("bb_u", "BOLLINGER", { period: 5, stdDev: 2, output: "upper" });
    const middleNode = makeNode("bb_m", "BOLLINGER", { period: 5, stdDev: 2, output: "middle" });
    const lowerNode = makeNode("bb_l", "BOLLINGER", { period: 5, stdDev: 2, output: "lower" });

    const upper = computeIndicator(upperNode, bars);
    const middle = computeIndicator(middleNode, bars);
    const lower = computeIndicator(lowerNode, bars);

    const idx = 10;
    expect(upper[idx]).not.toBeNull();
    expect(upper[idx]!).toBeGreaterThan(middle[idx]!);
    expect(middle[idx]!).toBeGreaterThan(lower[idx]!);
  });

  it("ATR: 항상 >= 0", () => {
    const bars = makeBars(30, 100);
    const node = makeNode("atr1", "ATR", { period: 14 });
    const result = computeIndicator(node, bars);
    const valid = result.filter((v): v is number => v !== null);
    expect(valid.length).toBeGreaterThan(0);
    valid.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });

  it("PRICE(close) = bars.map(b => b.close)", () => {
    const bars = makeBars(10, 100);
    const node = makeNode("price1", "PRICE", { field: "close" });
    const result = computeIndicator(node, bars);
    expect(result).toEqual(bars.map((b) => b.close));
  });

  it("VOLUME = bars.map(b => b.volume)", () => {
    const bars = makeBars(10, 100);
    const node = makeNode("vol1", "VOLUME", {});
    const result = computeIndicator(node, bars);
    expect(result).toEqual(bars.map((b) => b.volume));
  });

  it("알 수 없는 blockType → 모두 null인 배열 (bars.length 길이)", () => {
    const bars = makeBars(10, 100);
    const node = makeNode("unknown1", "UNKNOWN_TYPE" as any, {});
    const result = computeIndicator(node, bars);
    expect(result).toHaveLength(10);
    result.forEach((v) => expect(v).toBeNull());
  });

  it("EMA(5): 결과 길이 = bars.length, 첫 4개 null, 5번째 유효", () => {
    const bars = makeBars(15, 100);
    const node = makeNode("ema1", "EMA", { period: 5, source: "close" });
    const result = computeIndicator(node, bars);
    expect(result).toHaveLength(15);
    expect(result[0]).toBeNull();
    expect(result[3]).toBeNull();
    expect(result[4]).not.toBeNull();
  });

  it("MACD(12,26,9): 결과 길이 = bars.length, 유효 값 존재", () => {
    const bars = makeBars(50, 100);
    const node = makeNode("macd1", "MACD", {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      output: "macd",
    });
    const result = computeIndicator(node, bars);
    expect(result).toHaveLength(50);
    const valid = result.filter((v) => v !== null);
    expect(valid.length).toBeGreaterThan(0);
  });
});
