'use client';

import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { StrategyNodeData, SMAParams, EMAParams, RSIParams, MACDParams, BollingerParams, ATRParams, PriceParams } from '@/types/strategy';

const INDICATOR_INPUTS = [
  { id: 'price', label: '가격 데이터', dataType: 'NUMERIC' as const },
];
const INDICATOR_OUTPUTS = [
  { id: 'value', label: '지표 값', dataType: 'NUMERIC' as const },
];
const PRICE_OUTPUTS = [
  { id: 'value', label: '가격', dataType: 'NUMERIC' as const },
];

function formatParams(data: StrategyNodeData): string {
  const p = data.params;
  switch (data.blockType) {
    case 'SMA': { const pp = p as SMAParams; return `기간: ${pp.period} / ${pp.source}`; }
    case 'EMA': { const pp = p as EMAParams; return `기간: ${pp.period} / ${pp.source}`; }
    case 'RSI': { const pp = p as RSIParams; return `기간: ${pp.period}`; }
    case 'MACD': { const pp = p as MACDParams; return `${pp.fastPeriod}/${pp.slowPeriod}/${pp.signalPeriod} · ${pp.output}`; }
    case 'BOLLINGER': { const pp = p as BollingerParams; return `기간: ${pp.period} / ${pp.output}`; }
    case 'ATR': { const pp = p as ATRParams; return `기간: ${pp.period}`; }
    case 'PRICE': { const pp = p as PriceParams; return pp.field; }
    case 'VOLUME': return '거래량';
    default: return '';
  }
}

export function IndicatorNode(props: NodeProps) {
  const data = props.data as StrategyNodeData;
  const isPrice = data.blockType === 'PRICE' || data.blockType === 'VOLUME';

  return (
    <BaseNode
      {...props}
      data={data}
      inputs={isPrice ? [] : INDICATOR_INPUTS}
      outputs={isPrice ? PRICE_OUTPUTS : INDICATOR_OUTPUTS}
    >
      <span className="font-mono text-[11px]">{formatParams(data)}</span>
    </BaseNode>
  );
}
