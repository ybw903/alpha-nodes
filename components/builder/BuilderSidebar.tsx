'use client';

import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import type { BlockType, BlockCategory, BlockParams } from '@/types/strategy';

interface BlockDefinition {
  blockType: BlockType;
  category: BlockCategory;
  defaultParams: BlockParams;
}

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // 지표
  { blockType: 'PRICE',      category: 'indicator', defaultParams: { field: 'close' } },
  { blockType: 'VOLUME',     category: 'indicator', defaultParams: { type: 'raw' } },
  { blockType: 'SMA',        category: 'indicator', defaultParams: { period: 20, source: 'close' } },
  { blockType: 'EMA',        category: 'indicator', defaultParams: { period: 20, source: 'close' } },
  { blockType: 'RSI',        category: 'indicator', defaultParams: { period: 14, source: 'close' } },
  { blockType: 'MACD',       category: 'indicator', defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, output: 'macd' } },
  { blockType: 'BOLLINGER',  category: 'indicator', defaultParams: { period: 20, stdDev: 2, output: 'middle' } },
  { blockType: 'ATR',        category: 'indicator', defaultParams: { period: 14 } },
  { blockType: 'LOOKBACK',   category: 'indicator', defaultParams: { period: 1 } },
  // 조건
  { blockType: 'COMPARE',    category: 'condition', defaultParams: { operator: '>' } },
  { blockType: 'CROSSOVER',  category: 'condition', defaultParams: { direction: 'above' } },
  { blockType: 'CROSSUNDER', category: 'condition', defaultParams: { direction: 'below' } },
  { blockType: 'THRESHOLD',  category: 'condition', defaultParams: { operator: '<', value: 30 } },
  { blockType: 'CONSECUTIVE',category: 'condition', defaultParams: { count: 3 } },
  // 논리
  { blockType: 'AND',        category: 'logic',     defaultParams: {} },
  { blockType: 'OR',         category: 'logic',     defaultParams: {} },
  { blockType: 'NOT',        category: 'logic',     defaultParams: {} },
  // 액션
  { blockType: 'BUY',        category: 'action',    defaultParams: { positionSizePct: 100 } },
  { blockType: 'SELL',       category: 'action',    defaultParams: { positionSizePct: 100 } },
];

const CATEGORY_HEADER_COLORS: Record<BlockCategory, string> = {
  indicator: 'text-[#818cf8]',
  condition: 'text-[#f59e0b]',
  action: 'text-[#22c55e]',
  logic: 'text-[#a78bfa]',
};

const CATEGORY_BADGE_COLORS: Record<BlockCategory, string> = {
  indicator: 'bg-[#818cf8]/10 border-[#818cf8]/30',
  condition: 'bg-[#f59e0b]/10 border-[#f59e0b]/30',
  action: 'bg-[#22c55e]/10 border-[#22c55e]/30',
  logic: 'bg-[#a78bfa]/10 border-[#a78bfa]/30',
};

const CATEGORIES: BlockCategory[] = ['indicator', 'condition', 'logic', 'action'];

export function BuilderSidebar() {
  const t = useTranslations('builder');
  const tBlocks = useTranslations('blocks');

  const onDragStart = (e: React.DragEvent, block: BlockDefinition) => {
    const label = tBlocks(`${block.blockType}.label`);
    e.dataTransfer.setData('application/reactflow-blocktype', block.blockType);
    e.dataTransfer.setData('application/reactflow-category', block.category);
    e.dataTransfer.setData('application/reactflow-label', label);
    e.dataTransfer.setData(
      'application/reactflow-params',
      JSON.stringify(block.defaultParams)
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {t('sidebar.title')}
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
          {t('sidebar.hint')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {CATEGORIES.map((category) => (
          <div key={category}>
            <p className={clsx('text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1', CATEGORY_HEADER_COLORS[category])}>
              {t(`sidebar.categories.${category}`)}
            </p>
            <div className="space-y-1">
              {BLOCK_DEFINITIONS.filter((b) => b.category === category).map((block) => (
                <div
                  key={block.blockType}
                  draggable
                  onDragStart={(e) => onDragStart(e, block)}
                  className={clsx(
                    'flex flex-col px-2.5 py-2 rounded-md border cursor-grab active:cursor-grabbing',
                    'transition-colors duration-100',
                    CATEGORY_BADGE_COLORS[category],
                    'hover:brightness-110'
                  )}
                >
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">
                    {tBlocks(`${block.blockType}.label`)}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-0.5">
                    {tBlocks(`${block.blockType}.description`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
