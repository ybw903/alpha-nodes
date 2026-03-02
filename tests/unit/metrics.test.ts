import { describe, it, expect } from "vitest";
import { computeMetrics } from "@/lib/backtest/metrics";
import { makeEquityCurve, makeFlatEquityCurve } from "@/tests/fixtures";
import type { Trade } from "@/types/backtest";

const MS_PER_DAY = 86_400_000;
const BASE_TS = new Date("2023-01-01").getTime();

function makeClosedTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: "t1",
    direction: "LONG",
    entryTimestamp: BASE_TS,
    exitTimestamp: BASE_TS + 5 * MS_PER_DAY,
    entryPrice: 100,
    exitPrice: 110,
    positionSizePct: 100,
    shares: 10,
    entryCapital: 10_000,
    pnl: 1_000,
    pnlPct: 10,
    status: "CLOSED",
    exitReason: "SIGNAL",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("10000 → 11000이면 totalReturnPct = 10.00", () => {
    const curve = makeEquityCurve(10_000, 11_000, 10);
    const result = computeMetrics([], curve, 10_000, 0);
    expect(result.totalReturnPct).toBe(10.0);
  });

  it("거래 없으면 totalTrades=0, winRate=0", () => {
    const curve = makeEquityCurve(10_000, 10_000, 10);
    const result = computeMetrics([], curve, 10_000, 0);
    expect(result.totalTrades).toBe(0);
    expect(result.winRate).toBe(0);
  });

  it("빈 equityCurve → throw 없이 반환, totalReturnPct=0, sharpeRatio=0", () => {
    expect(() => computeMetrics([], [], 10_000, 0)).not.toThrow();
    const result = computeMetrics([], [], 10_000, 0);
    expect(result.totalReturnPct).toBe(0);
    expect(result.sharpeRatio).toBe(0);
    expect(result.maxDrawdownPct).toBe(0);
  });

  it("수익률 변동 없으면 sharpeRatio=0 (stdDev=0)", () => {
    const curve = makeFlatEquityCurve(10_000, 30);
    const result = computeMetrics([], curve, 10_000, 0);
    expect(result.sharpeRatio).toBe(0);
  });

  it("손실 없을 때 profitFactor=999 (Infinity 클램프)", () => {
    const trades = [
      makeClosedTrade({ id: "t1", pnl: 500, pnlPct: 5 }),
      makeClosedTrade({ id: "t2", pnl: 300, pnlPct: 3 }),
    ];
    const curve = makeEquityCurve(10_000, 10_800, 30);
    const result = computeMetrics(trades, curve, 10_000, 0);
    expect(result.profitFactor).toBe(999);
  });

  it("3승 1패 → winRate=0.75", () => {
    const trades = [
      makeClosedTrade({ id: "t1", pnl: 100, pnlPct: 10 }),
      makeClosedTrade({ id: "t2", pnl: 200, pnlPct: 20 }),
      makeClosedTrade({ id: "t3", pnl: 150, pnlPct: 15 }),
      makeClosedTrade({ id: "t4", pnl: -50, pnlPct: -5, exitReason: "STOP_LOSS" }),
    ];
    const curve = makeEquityCurve(10_000, 10_400, 30);
    const result = computeMetrics(trades, curve, 10_000, 0);
    expect(result.winRate).toBe(0.75);
  });

  it("1년 2배 → annualizedReturnPct≈100%", () => {
    // 366 bars = 365 days → yearsFraction ≈ 1
    const curve = makeEquityCurve(10_000, 20_000, 366);
    const result = computeMetrics([], curve, 10_000, 0);
    // 2^(1/yearsFraction) - 1 ≈ 100%
    expect(result.annualizedReturnPct).toBeCloseTo(100, 0);
  });

  it("calmarRatio = annualizedReturnPct / maxDrawdownPct", () => {
    const curve = makeEquityCurve(10_000, 12_000, 366, true); // MDD 삽입
    const result = computeMetrics([], curve, 10_000, 0);
    if (result.maxDrawdownPct !== 0) {
      expect(result.calmarRatio).toBeCloseTo(
        result.annualizedReturnPct / result.maxDrawdownPct,
        2,
      );
    }
  });

  it("1h 타임프레임은 1d보다 sharpeRatio 절대값이 더 크다", () => {
    const curve = makeEquityCurve(10_000, 11_000, 30);
    const sharpe1d = computeMetrics([], curve, 10_000, 0, "1d").sharpeRatio;
    const sharpe1h = computeMetrics([], curve, 10_000, 0, "1h").sharpeRatio;
    // 1h: barsPerYear=1638, 1d: barsPerYear=252 → sqrt 비율 차이
    expect(Math.abs(sharpe1h)).toBeGreaterThan(Math.abs(sharpe1d));
  });

  it("totalFees 파라미터가 totalFeesSpent에 반영된다", () => {
    const curve = makeEquityCurve(10_000, 11_000, 10);
    const result = computeMetrics([], curve, 10_000, 500);
    expect(result.totalFeesSpent).toBe(500);
  });

  it("OPEN 상태 거래는 totalTrades 집계에서 제외된다", () => {
    const openTrade: Trade = {
      id: "open1",
      direction: "LONG",
      entryTimestamp: BASE_TS,
      entryPrice: 100,
      positionSizePct: 100,
      shares: 10,
      entryCapital: 10_000,
      status: "OPEN",
    };
    const curve = makeEquityCurve(10_000, 11_000, 10);
    const result = computeMetrics([openTrade], curve, 10_000, 0);
    expect(result.totalTrades).toBe(0);
  });

  it("MDD 있는 curve → maxDrawdownPct > 0", () => {
    const curve = makeEquityCurve(10_000, 12_000, 50, true);
    const result = computeMetrics([], curve, 10_000, 0);
    expect(result.maxDrawdownPct).toBeGreaterThan(0);
  });

  it("승률 0이어도 profitFactor=0 (grossProfit=0)", () => {
    const trades = [
      makeClosedTrade({ id: "t1", pnl: -100, pnlPct: -10, exitReason: "STOP_LOSS" }),
    ];
    const curve = makeEquityCurve(10_000, 9_900, 10);
    const result = computeMetrics(trades, curve, 10_000, 0);
    expect(result.profitFactor).toBe(0);
    expect(result.winRate).toBe(0);
  });
});
