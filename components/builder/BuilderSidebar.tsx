'use client';

import { clsx } from 'clsx';
import type { BlockType, BlockCategory, BlockParams } from '@/types/strategy';

interface BlockDefinition {
  blockType: BlockType;
  category: BlockCategory;
  label: string;
  description: string;
  defaultParams: BlockParams;
}

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // 지표
  { blockType: 'PRICE',     category: 'indicator', label: '가격',      description: 'OHLCV 가격 데이터',    defaultParams: { field: 'close' } },
  { blockType: 'VOLUME',    category: 'indicator', label: '거래량',     description: '거래량 데이터',          defaultParams: { type: 'raw' } },
  { blockType: 'SMA',       category: 'indicator', label: 'SMA',       description: '단순 이동평균',          defaultParams: { period: 20, source: 'close' } },
  { blockType: 'EMA',       category: 'indicator', label: 'EMA',       description: '지수 이동평균',          defaultParams: { period: 20, source: 'close' } },
  { blockType: 'RSI',       category: 'indicator', label: 'RSI',       description: '상대강도지수',           defaultParams: { period: 14, source: 'close' } },
  { blockType: 'MACD',      category: 'indicator', label: 'MACD',      description: '이동평균 수렴확산',       defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, output: 'macd' } },
  { blockType: 'BOLLINGER', category: 'indicator', label: 'Bollinger', description: '볼린저 밴드',            defaultParams: { period: 20, stdDev: 2, output: 'middle' } },
  { blockType: 'ATR',       category: 'indicator', label: 'ATR',       description: '평균 진폭 범위',          defaultParams: { period: 14 } },
  // 조건
  { blockType: 'COMPARE',   category: 'condition', label: '비교',      description: 'A와 B 값 비교',         defaultParams: { operator: '>' } },
  { blockType: 'CROSSOVER', category: 'condition', label: '상향 교차', description: 'A가 B를 위로 교차',     defaultParams: { direction: 'above' } },
  { blockType: 'CROSSUNDER',category: 'condition', label: '하향 교차', description: 'A가 B를 아래로 교차',   defaultParams: { direction: 'below' } },
  { blockType: 'THRESHOLD', category: 'condition', label: '임계값',    description: '값과 고정 숫자 비교',    defaultParams: { operator: '<', value: 30 } },
  { blockType: 'AND',       category: 'logic',     label: 'AND',       description: '두 조건 모두 참',        defaultParams: {} },
  { blockType: 'OR',        category: 'logic',     label: 'OR',        description: '두 조건 중 하나 참',     defaultParams: {} },
  // 액션
  { blockType: 'BUY',       category: 'action',    label: '매수',      description: '롱 포지션 진입',         defaultParams: { positionSizePct: 100 } },
  { blockType: 'SELL',      category: 'action',    label: '매도',      description: '롱 포지션 청산',         defaultParams: { positionSizePct: 100 } },
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

const CATEGORY_NAMES: Record<BlockCategory, string> = {
  indicator: '지표',
  condition: '조건',
  action: '액션',
  logic: '논리',
};

const CATEGORIES: BlockCategory[] = ['indicator', 'condition', 'logic', 'action'];

export function BuilderSidebar() {
  const onDragStart = (e: React.DragEvent, block: BlockDefinition) => {
    e.dataTransfer.setData('application/reactflow-blocktype', block.blockType);
    e.dataTransfer.setData('application/reactflow-category', block.category);
    e.dataTransfer.setData('application/reactflow-label', block.label);
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
          블록 팔레트
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
          드래그하여 캔버스에 추가
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {CATEGORIES.map((category) => (
          <div key={category}>
            <p className={clsx('text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1', CATEGORY_HEADER_COLORS[category])}>
              {CATEGORY_NAMES[category]}
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
                    {block.label}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-0.5">
                    {block.description}
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
