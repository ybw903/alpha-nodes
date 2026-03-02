import type { OHLCVBar } from "@/types/market";

const BASE_TIMESTAMP = new Date("2023-01-01").getTime();
const MS_PER_DAY = 86_400_000;

/** count개의 단조증가 가격 OHLCVBar 생성 */
export function makeBars(count: number, startPrice = 100): OHLCVBar[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: BASE_TIMESTAMP + i * MS_PER_DAY,
    open: startPrice + i,
    high: startPrice + i + 2,
    low: Math.max(startPrice + i - 1, 1),
    close: startPrice + i + 1,
    volume: 1_000_000,
  }));
}

/** N봉 후 dropPct 비율만큼 하락하는 bars (중반 이후 하락) */
export function makeDropBars(count: number, dropPct: number): OHLCVBar[] {
  const bars = makeBars(count);
  const midpoint = Math.floor(count / 2);
  for (let i = midpoint + 1; i < count; i++) {
    const progress = (i - midpoint) / (count - midpoint);
    const prevClose = bars[i - 1].close;
    const close = Math.max(prevClose * (1 - dropPct * progress * 0.1), 1);
    bars[i] = {
      ...bars[i],
      open: prevClose,
      high: prevClose + 0.5,
      low: close - 0.5,
      close,
    };
  }
  return bars;
}

/**
 * highPrice → lowPrice로 계단식으로 떨어지는 bars.
 * breakBar 이전: highPrice, 이후: lowPrice.
 * SMA(5) 기반 전략에서 END_OF_DATA 청산 시나리오 재현용.
 * lowPrice / highPrice 모두 정수여야 SMA 부동소수점 오차가 없다.
 */
export function makeStepDownBars(
  count: number,
  breakBar = 40,
  highPrice = 100,
  lowPrice = 50,
): OHLCVBar[] {
  return Array.from({ length: count }, (_, i) => {
    const close = i < breakBar ? highPrice : lowPrice;
    return {
      timestamp: BASE_TIMESTAMP + i * MS_PER_DAY,
      open: close,
      high: close + 1,
      low: close - 1,
      close,
      volume: 1_000_000,
    };
  });
}

/** 모든 봉이 동일 가격인 평탄 bars (경계 케이스 테스트용) */
export function makeFlatBars(count: number, price = 100): OHLCVBar[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: BASE_TIMESTAMP + i * MS_PER_DAY,
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 500_000,
  }));
}
