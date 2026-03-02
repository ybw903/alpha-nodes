import { describe, it, expect, vi, beforeEach } from "vitest";
import { runBacktest } from "@/lib/backtest/engine";
import { fetchMarketData } from "@/lib/data/fetchers";
import {
  makeBars,
  makeDropBars,
  makeStepDownBars,
  makeSimpleStrategy,
  makeStrategyWithSL,
  makeStrategyWithTrailing,
  makeStrategyWithTimeExit,
} from "@/tests/fixtures";

vi.mock("@/lib/data/fetchers", () => ({
  fetchMarketData: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("runBacktest — 통합 테스트", () => {
  it("정상 bars → BacktestResult 구조 반환 (trades, equityCurve, metrics, bars)", async () => {
    vi.mocked(fetchMarketData).mockResolvedValue(makeDropBars(300, 50));
    const result = await runBacktest(makeSimpleStrategy());

    expect(result).toHaveProperty("trades");
    expect(result).toHaveProperty("equityCurve");
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("bars");
    expect(result.equityCurve.length).toBeGreaterThan(0);
    expect(typeof result.metrics.totalReturnPct).toBe("number");
  });

  it("빈 bars → '시장 데이터를 가져올 수 없습니다' 에러", async () => {
    vi.mocked(fetchMarketData).mockResolvedValue([]);
    await expect(runBacktest(makeSimpleStrategy())).rejects.toThrow(
      "시장 데이터를 가져올 수 없습니다",
    );
  });

  it("bars < warmup+10 → '데이터가 부족합니다' 에러", async () => {
    // warmup = max(period=5, 30) = 30; minimum required = 30 + 10 = 40
    vi.mocked(fetchMarketData).mockResolvedValue(makeBars(39));
    await expect(runBacktest(makeSimpleStrategy())).rejects.toThrow(
      "데이터가 부족합니다",
    );
  });

  it("Stop-Loss 도달 → trade.exitReason === 'STOP_LOSS'", async () => {
    // makeDropBars: 가격이 중반 이후 급락 → SL(5%) 트리거
    vi.mocked(fetchMarketData).mockResolvedValue(makeDropBars(300, 50));
    const result = await runBacktest(makeStrategyWithSL(5));

    const slTrades = result.trades.filter((t) => t.exitReason === "STOP_LOSS");
    expect(slTrades.length).toBeGreaterThan(0);
  });

  it("Trailing Stop 도달 → trade.exitReason === 'TRAILING_STOP'", async () => {
    vi.mocked(fetchMarketData).mockResolvedValue(makeDropBars(300, 50));
    const result = await runBacktest(makeStrategyWithTrailing(5));

    const trailingTrades = result.trades.filter(
      (t) => t.exitReason === "TRAILING_STOP",
    );
    expect(trailingTrades.length).toBeGreaterThan(0);
  });

  it("exitAfterBars 도달 → trade.exitReason === 'TIME_EXIT'", async () => {
    vi.mocked(fetchMarketData).mockResolvedValue(makeDropBars(300, 50));
    const result = await runBacktest(makeStrategyWithTimeExit(5));

    const timeExitTrades = result.trades.filter(
      (t) => t.exitReason === "TIME_EXIT",
    );
    expect(timeExitTrades.length).toBeGreaterThan(0);
  });

  it("기간 종료 미청산 → trade.exitReason === 'END_OF_DATA'", async () => {
    // makeStepDownBars: 정수 가격으로 SMA 부동소수점 오차 없음 → SELL 신호 없이 기간 종료
    vi.mocked(fetchMarketData).mockResolvedValue(makeStepDownBars(200, 150));
    const result = await runBacktest(makeSimpleStrategy());

    const endTrades = result.trades.filter(
      (t) => t.exitReason === "END_OF_DATA",
    );
    expect(endTrades.length).toBeGreaterThan(0);
  });

  it("feeRatePct > 0 → metrics.totalFeesSpent > 0", async () => {
    vi.mocked(fetchMarketData).mockResolvedValue(makeDropBars(300, 50));
    const result = await runBacktest(makeSimpleStrategy({ feeRatePct: 0.1 }));

    expect(result.metrics.totalFeesSpent).toBeGreaterThan(0);
  });

  it("fetchMarketData throw → runBacktest도 throw 전파", async () => {
    vi.mocked(fetchMarketData).mockRejectedValue(new Error("Network error"));
    await expect(runBacktest(makeSimpleStrategy())).rejects.toThrow(
      "Network error",
    );
  });
});
