'use client';

import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { StrategyNodeData, BuyParams, SellParams } from '@/types/strategy';

const ACTION_INPUTS = [
  { id: 'signal', label: '진입 시그널', dataType: 'BOOLEAN' as const },
];

function formatParams(data: StrategyNodeData): string {
  if (data.blockType === 'BUY') {
    const p = data.params as BuyParams;
    return `포지션: ${p.positionSizePct}%`;
  }
  if (data.blockType === 'SELL') {
    const p = data.params as SellParams;
    const parts = [`포지션: ${p.positionSizePct}%`];
    if (p.stopLossPct) parts.push(`손절: ${p.stopLossPct}%`);
    if (p.takeProfitPct) parts.push(`익절: ${p.takeProfitPct}%`);
    return parts.join(' · ');
  }
  return '';
}

export function ActionNode(props: NodeProps) {
  const data = props.data as StrategyNodeData;

  return (
    <BaseNode
      {...props}
      data={data}
      inputs={ACTION_INPUTS}
      outputs={[]}
    >
      <span className="font-mono text-[11px]">{formatParams(data)}</span>
    </BaseNode>
  );
}
