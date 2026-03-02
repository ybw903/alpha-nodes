'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useBuilderStore } from '@/lib/store/builderStore';
import type { BlockParams, BlockType } from '@/types/strategy';

const OPERATOR_OPTIONS = ['>', '<', '>=', '<=', '=='];
const SOURCE_OPTIONS = ['close', 'open', 'high', 'low', 'volume'];
const MACD_OUTPUT_OPTIONS = ['macd', 'signal', 'histogram'];
const BOLLINGER_OUTPUT_OPTIONS = ['upper', 'middle', 'lower'];

interface FieldDef {
  key: string;
  labelKey: string;
  type: 'number' | 'select';
  options?: string[];
  min?: number;
}

const FIELDS_BY_BLOCK: Record<BlockType, FieldDef[]> = {
  SMA: [
    { key: 'period', labelKey: 'period', type: 'number', min: 1 },
    { key: 'source', labelKey: 'source', type: 'select', options: SOURCE_OPTIONS },
  ],
  EMA: [
    { key: 'period', labelKey: 'period', type: 'number', min: 1 },
    { key: 'source', labelKey: 'source', type: 'select', options: SOURCE_OPTIONS },
  ],
  RSI: [
    { key: 'period', labelKey: 'period', type: 'number', min: 2 },
    { key: 'source', labelKey: 'source', type: 'select', options: SOURCE_OPTIONS },
  ],
  MACD: [
    { key: 'fastPeriod', labelKey: 'fastPeriod', type: 'number', min: 1 },
    { key: 'slowPeriod', labelKey: 'slowPeriod', type: 'number', min: 1 },
    { key: 'signalPeriod', labelKey: 'signalPeriod', type: 'number', min: 1 },
    { key: 'output', labelKey: 'output', type: 'select', options: MACD_OUTPUT_OPTIONS },
  ],
  BOLLINGER: [
    { key: 'period', labelKey: 'period', type: 'number', min: 1 },
    { key: 'stdDev', labelKey: 'stdDev', type: 'number', min: 0.1 },
    { key: 'output', labelKey: 'output', type: 'select', options: BOLLINGER_OUTPUT_OPTIONS },
  ],
  ATR: [{ key: 'period', labelKey: 'period', type: 'number', min: 1 }],
  PRICE: [{ key: 'field', labelKey: 'field', type: 'select', options: SOURCE_OPTIONS }],
  VOLUME: [],
  COMPARE: [{ key: 'operator', labelKey: 'operator', type: 'select', options: OPERATOR_OPTIONS }],
  CROSSOVER: [],
  CROSSUNDER: [],
  THRESHOLD: [
    { key: 'operator', labelKey: 'operator', type: 'select', options: OPERATOR_OPTIONS },
    { key: 'value', labelKey: 'value', type: 'number' },
  ],
  AND: [],
  OR: [],
  NOT: [],
  CONSECUTIVE: [{ key: 'count', labelKey: 'count', type: 'number', min: 2 }],
  LOOKBACK: [{ key: 'period', labelKey: 'lookbackPeriod', type: 'number', min: 1 }],
  BUY: [{ key: 'positionSizePct', labelKey: 'positionSizePct', type: 'number', min: 1 }],
  SELL: [
    { key: 'positionSizePct', labelKey: 'positionSizePct', type: 'number', min: 1 },
    { key: 'stopLossPct', labelKey: 'stopLossPct', type: 'number', min: 0 },
    { key: 'takeProfitPct', labelKey: 'takeProfitPct', type: 'number', min: 0 },
    { key: 'trailingStopPct', labelKey: 'trailingStopPct', type: 'number', min: 0 },
    { key: 'exitAfterBars', labelKey: 'exitAfterBars', type: 'number', min: 1 },
  ],
};

export function NodeConfigPanel() {
  const t = useTranslations('builder');
  const tNodeConfig = useTranslations('nodeConfig');
  const { nodes, selectedNodeId, updateNodeParams } = useBuilderStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const { register, reset, getValues } = useForm<Record<string, unknown>>();

  useEffect(() => {
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node) {
      reset(node.data.params as Record<string, unknown>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, reset]);

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
        <p className="text-xs text-[var(--color-text-muted)] whitespace-pre-line">
          {t('nodeConfig.noNodeSelected')}
        </p>
      </div>
    );
  }

  const fields = FIELDS_BY_BLOCK[selectedNode.data.blockType] ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {t('nodeConfig.title')}
        </p>
        <p className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
          {selectedNode.data.label}
        </p>
      </div>

      <div className="px-4 py-3 space-y-3">
        {fields.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('nodeConfig.noParams')}
          </p>
        ) : (
          fields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                {tNodeConfig(`fields.${field.labelKey}`)}
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
