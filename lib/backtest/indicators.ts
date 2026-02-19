import {
  SMA as TISma,
  EMA as TIEma,
  RSI as TIRsi,
  MACD as TIMacd,
  BollingerBands as TIBollinger,
  ATR as TIAtr,
} from 'technicalindicators';
import type { OHLCVBar } from '@/types/market';
import type {
  StrategyNode,
  SMAParams, EMAParams, RSIParams, MACDParams, BollingerParams, ATRParams, PriceParams,
} from '@/types/strategy';

export type IndicatorSeries = (number | null)[];

function getSource(bars: OHLCVBar[], source: string): number[] {
  switch (source) {
    case 'open':   return bars.map((b) => b.open);
    case 'high':   return bars.map((b) => b.high);
    case 'low':    return bars.map((b) => b.low);
    case 'volume': return bars.map((b) => b.volume);
    default:       return bars.map((b) => b.close);
  }
}

/**
 * Pads the result array to align with input bars.
 * technicalindicators trims leading NaN bars, so we pad front with nulls.
 */
function padFront(values: number[], targetLen: number): IndicatorSeries {
  const padLen = targetLen - values.length;
  return [...Array(padLen).fill(null), ...values];
}

export function computeIndicator(
  node: StrategyNode,
  bars: OHLCVBar[]
): IndicatorSeries {
  const { blockType, params } = node.data;

  switch (blockType) {
    case 'SMA': {
      const p = params as SMAParams;
      const values = TISma.calculate({ period: p.period, values: getSource(bars, p.source) });
      return padFront(values, bars.length);
    }
    case 'EMA': {
      const p = params as EMAParams;
      const values = TIEma.calculate({ period: p.period, values: getSource(bars, p.source) });
      return padFront(values, bars.length);
    }
    case 'RSI': {
      const p = params as RSIParams;
      const values = TIRsi.calculate({ period: p.period, values: getSource(bars, p.source) });
      return padFront(values, bars.length);
    }
    case 'MACD': {
      const p = params as MACDParams;
      const results = TIMacd.calculate({
        fastPeriod: p.fastPeriod,
        slowPeriod: p.slowPeriod,
        signalPeriod: p.signalPeriod,
        values: bars.map((b) => b.close),
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });
      const extracted = results.map((r) => {
        if (p.output === 'macd') return r.MACD ?? null;
        if (p.output === 'signal') return r.signal ?? null;
        return r.histogram ?? null;
      });
      return padFront(extracted.filter((v): v is number => v !== null), bars.length);
    }
    case 'BOLLINGER': {
      const p = params as BollingerParams;
      const results = TIBollinger.calculate({
        period: p.period,
        stdDev: p.stdDev,
        values: bars.map((b) => b.close),
      });
      const extracted = results.map((r) => {
        if (p.output === 'upper') return r.upper;
        if (p.output === 'lower') return r.lower;
        return r.middle;
      });
      return padFront(extracted, bars.length);
    }
    case 'ATR': {
      const p = params as ATRParams;
      const values = TIAtr.calculate({
        period: p.period,
        high: bars.map((b) => b.high),
        low: bars.map((b) => b.low),
        close: bars.map((b) => b.close),
      });
      return padFront(values, bars.length);
    }
    case 'PRICE': {
      const p = params as PriceParams;
      return getSource(bars, p.field);
    }
    case 'VOLUME': {
      return bars.map((b) => b.volume);
    }
    default:
      return bars.map(() => null);
  }
}
