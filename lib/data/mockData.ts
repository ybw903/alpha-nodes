import type { OHLCVBar } from '@/types/market';

/**
 * 2년간의 가상 OHLCV 데이터 (일봉, 약 500개 봉)
 * 현실적인 추세와 변동성을 가진 시뮬레이션 데이터
 */
export function generateMockOHLCV(from: number, to: number): OHLCVBar[] {
  const bars: OHLCVBar[] = [];

  // 시작 가격
  let close = 50000;
  const MS_PER_DAY = 86_400_000;

  // 트렌드 파라미터
  let trend = 0.0003; // 일 평균 수익률
  let trendChangePeriod = 60; // 트렌드 변경 주기 (봉)
  let barCount = 0;

  let current = from;
  while (current <= to) {
    const date = new Date(current);
    const dow = date.getDay();

    // 주말 건너뜀
    if (dow === 0 || dow === 6) {
      current += MS_PER_DAY;
      continue;
    }

    // 트렌드 주기적 반전
    if (barCount % trendChangePeriod === 0) {
      trend = (Math.random() - 0.48) * 0.001;
      trendChangePeriod = 30 + Math.floor(Math.random() * 60);
    }

    // 일간 수익률 (정규분포 근사: 합산 12개 균등분포 - 6)
    let noise = 0;
    for (let i = 0; i < 12; i++) noise += Math.random();
    noise = (noise - 6) * 0.012;

    const dailyReturn = trend + noise;
    close = Math.max(close * (1 + dailyReturn), 100);

    const range = close * (0.005 + Math.random() * 0.025);
    const open = close * (1 + (Math.random() - 0.5) * 0.008);
    const high = Math.max(open, close) + range * Math.random();
    const low = Math.min(open, close) - range * Math.random();
    const volume = Math.floor(500_000 + Math.random() * 2_000_000);

    bars.push({
      timestamp: current,
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    });

    barCount++;
    current += MS_PER_DAY;
  }

  return bars;
}
