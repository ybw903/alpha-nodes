import type { EquityDataPoint } from "@/types/backtest";

const BASE_TS = new Date("2023-01-01").getTime();
const MS_PER_DAY = 86_400_000;

/**
 * startCapital → endCapital으로 선형 보간되는 equity curve 생성.
 * withDrawdown=true이면 중간 지점에서 startCapital의 50%로 떨어지는 MDD 삽입.
 */
export function makeEquityCurve(
  startCapital: number,
  endCapital: number,
  bars: number,
  withDrawdown = false,
): EquityDataPoint[] {
  let peak = startCapital;

  return Array.from({ length: bars }, (_, i) => {
    const t = bars > 1 ? i / (bars - 1) : 0;
    let equity = startCapital + (endCapital - startCapital) * t;

    // 중간 지점에서 50% MDD 삽입
    if (withDrawdown && i === Math.floor(bars / 2)) {
      equity = startCapital * 0.5;
    }

    peak = Math.max(peak, equity);
    const drawdown = peak > 0 ? (equity - peak) / peak : 0;

    return {
      timestamp: BASE_TS + i * MS_PER_DAY,
      equity,
      drawdown,
      benchmark: startCapital * (1 + t * 0.05),
    };
  });
}

/** 모든 equity가 일정한 플랫 curve */
export function makeFlatEquityCurve(
  capital: number,
  bars: number,
): EquityDataPoint[] {
  return Array.from({ length: bars }, (_, i) => ({
    timestamp: BASE_TS + i * MS_PER_DAY,
    equity: capital,
    drawdown: 0,
    benchmark: capital,
  }));
}
