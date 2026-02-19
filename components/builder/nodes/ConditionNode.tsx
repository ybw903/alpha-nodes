'use client';

import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { StrategyNodeData, CompareParams, ThresholdParams } from '@/types/strategy';

const COMPARE_INPUTS = [
  { id: 'a', label: '입력 A', dataType: 'NUMERIC' as const },
  { id: 'b', label: '입력 B', dataType: 'NUMERIC' as const },
];
const CROSSOVER_INPUTS = [
  { id: 'a', label: '시리즈 A', dataType: 'NUMERIC' as const },
  { id: 'b', label: '시리즈 B', dataType: 'NUMERIC' as const },
];
const THRESHOLD_INPUTS = [
  { id: 'value', label: '입력 값', dataType: 'NUMERIC' as const },
];
const LOGIC_INPUTS = [
  { id: 'a', label: '조건 A', dataType: 'BOOLEAN' as const },
  { id: 'b', label: '조건 B', dataType: 'BOOLEAN' as const },
];
const BOOL_OUTPUT = [
  { id: 'signal', label: '시그널', dataType: 'BOOLEAN' as const },
];

function formatParams(data: StrategyNodeData): string {
  switch (data.blockType) {
    case 'COMPARE': return `A ${(data.params as CompareParams).operator} B`;
    case 'CROSSOVER': return '위로 교차';
    case 'CROSSUNDER': return '아래로 교차';
    case 'THRESHOLD': {
      const p = data.params as ThresholdParams;
      return `값 ${p.operator} ${p.value}`;
    }
    case 'AND': return 'A AND B';
    case 'OR': return 'A OR B';
    default: return '';
  }
}

function getInputs(blockType: string) {
  switch (blockType) {
    case 'COMPARE': return COMPARE_INPUTS;
    case 'CROSSOVER':
    case 'CROSSUNDER': return CROSSOVER_INPUTS;
    case 'THRESHOLD': return THRESHOLD_INPUTS;
    case 'AND':
    case 'OR': return LOGIC_INPUTS;
    default: return [];
  }
}

export function ConditionNode(props: NodeProps) {
  const data = props.data as StrategyNodeData;

  return (
    <BaseNode
      {...props}
      data={data}
      inputs={getInputs(data.blockType)}
      outputs={BOOL_OUTPUT}
    >
      <span className="font-mono text-[11px]">{formatParams(data)}</span>
    </BaseNode>
  );
}
