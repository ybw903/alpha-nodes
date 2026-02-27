'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useBuilderStore } from '@/lib/store/builderStore';
import type { BlockParams, BlockType } from '@/types/strategy';

const OPERATOR_OPTIONS = ['>', '<', '>=', '<=', '=='];
const SOURCE_OPTIONS = ['close', 'open', 'high', 'low', 'volume'];
const MACD_OUTPUT_OPTIONS = ['macd', 'signal', 'histogram'];
const BOLLINGER_OUTPUT_OPTIONS = ['upper', 'middle', 'lower'];

interface FieldDef {
  key: string;
  label: string;
  type: 'number' | 'select';
  options?: string[];
  min?: number;
}

const FIELDS_BY_BLOCK: Record<BlockType, FieldDef[]> = {
  SMA: [
    { key: 'period', label: '기간 (Period)', type: 'number', min: 1 },
    { key: 'source', label: '소스', type: 'select', options: SOURCE_OPTIONS },
  ],
  EMA: [
    { key: 'period', label: '기간 (Period)', type: 'number', min: 1 },
    { key: 'source', label: '소스', type: 'select', options: SOURCE_OPTIONS },
  ],
  RSI: [
    { key: 'period', label: '기간 (Period)', type: 'number', min: 2 },
    { key: 'source', label: '소스', type: 'select', options: SOURCE_OPTIONS },
  ],
  MACD: [
    { key: 'fastPeriod', label: '빠른 기간', type: 'number', min: 1 },
    { key: 'slowPeriod', label: '느린 기간', type: 'number', min: 1 },
    { key: 'signalPeriod', label: '시그널 기간', type: 'number', min: 1 },
    { key: 'output', label: '출력', type: 'select', options: MACD_OUTPUT_OPTIONS },
  ],
  BOLLINGER: [
    { key: 'period', label: '기간', type: 'number', min: 1 },
    { key: 'stdDev', label: '표준편차 배수', type: 'number', min: 0.1 },
    { key: 'output', label: '출력', type: 'select', options: BOLLINGER_OUTPUT_OPTIONS },
  ],
  ATR: [{ key: 'period', label: '기간 (Period)', type: 'number', min: 1 }],
  PRICE: [{ key: 'field', label: '가격 필드', type: 'select', options: SOURCE_OPTIONS }],
  VOLUME: [],
  COMPARE: [{ key: 'operator', label: '연산자', type: 'select', options: OPERATOR_OPTIONS }],
  CROSSOVER: [],
  CROSSUNDER: [],
  THRESHOLD: [
    { key: 'operator', label: '연산자', type: 'select', options: OPERATOR_OPTIONS },
    { key: 'value', label: '기준값', type: 'number' },
  ],
  AND: [],
  OR: [],
  NOT: [],
  CONSECUTIVE: [{ key: 'count', label: '연속 봉 수', type: 'number', min: 2 }],
  LOOKBACK: [{ key: 'period', label: 'N봉 전', type: 'number', min: 1 }],
  BUY: [{ key: 'positionSizePct', label: '포지션 크기 (%)', type: 'number', min: 1 }],
  SELL: [
    { key: 'positionSizePct', label: '포지션 크기 (%)', type: 'number', min: 1 },
    { key: 'stopLossPct', label: '손절 (%)', type: 'number', min: 0 },
    { key: 'takeProfitPct', label: '익절 (%)', type: 'number', min: 0 },
    { key: 'trailingStopPct', label: '트레일링 스탑 (%)', type: 'number', min: 0 },
    { key: 'exitAfterBars', label: 'N봉 후 자동 청산', type: 'number', min: 1 },
  ],
};

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, updateNodeParams } = useBuilderStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const { register, reset, getValues } = useForm<Record<string, unknown>>();

  // 선택된 노드가 바뀔 때만 폼을 초기화.
  // `nodes`를 deps에 넣으면 updateNodeParams → nodes 변경 → reset → onChange → 무한루프가 발생하므로
  // 의도적으로 selectedNodeId 변경 시에만 실행.
  useEffect(() => {
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node) {
      reset(node.data.params as Record<string, unknown>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, reset]);

  // watch() 구독 대신 각 필드의 onChange에서 getValues()로 직접 스토어 업데이트.
  // watch(callback)은 렌더마다 새 참조를 반환해 useEffect deps 불안정 문제를 일으킴.
  const handleFieldChange = () => {
    if (!selectedNodeId) return;
    updateNodeParams(selectedNodeId, getValues() as BlockParams);
  };

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-[var(--color-text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
            />
          </svg>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          노드를 선택하면
          <br />
          파라미터를 편집할 수 있습니다
        </p>
      </div>
    );
  }

  const fields = FIELDS_BY_BLOCK[selectedNode.data.blockType] ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          노드 설정
        </p>
        <p className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
          {selectedNode.data.label}
        </p>
      </div>

      <div className="px-4 py-3 space-y-3">
        {fields.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            설정 가능한 파라미터가 없습니다.
          </p>
        ) : (
          fields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                {field.label}
              </span>
              {field.type === 'select' ? (
                <select
                  {...register(field.key, { onChange: handleFieldChange })}
                  className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  step="any"
                  min={field.min}
                  {...register(field.key, {
                    valueAsNumber: true,
                    onChange: handleFieldChange,
                  })}
                  className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
                />
              )}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
