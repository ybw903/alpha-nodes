'use client';

import { useRouter } from 'next/navigation';
import { useBuilderStore } from '@/lib/store/builderStore';
import { useBacktestStore } from '@/lib/store/backtestStore';
import { useUIStore } from '@/lib/store/uiStore';
import type { Strategy } from '@/types/strategy';
import type { BacktestRequest } from '@/types/backtest';

const DEFAULT_RUN_CONFIG = {
  initialCapital: 10_000_000,
  feeRatePct: 0.05,
  slippagePct: 0.05,
};

function getTwoYearsAgo(): number {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d.getTime();
}

export function BuilderToolbar() {
  const router = useRouter();
  const { nodes, edges, viewport, strategyName, setStrategyName } = useBuilderStore();
  const { setResult, setIsRunning, setError } = useBacktestStore();
  const { setRightPanelMode } = useUIStore();

  const handleSave = () => {
    const strategy: Strategy = {
      meta: {
        id: `strategy_${Date.now()}`,
        name: strategyName,
        assetClass: 'US_STOCK',
        symbol: 'MOCK',
        timeframe: '1d',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes,
      edges,
      viewport,
    };
    const saved = JSON.parse(localStorage.getItem('strategies') || '[]') as Strategy[];
    const existing = saved.findIndex((s) => s.meta.name === strategyName);
    if (existing >= 0) {
      saved[existing] = strategy;
    } else {
      saved.push(strategy);
    }
    localStorage.setItem('strategies', JSON.stringify(saved));
    alert('전략이 저장되었습니다.');
  };

  const handleRunBacktest = async () => {
    if (nodes.length === 0) {
      alert('캔버스에 블록을 추가해주세요.');
      return;
    }

    const hasBuy = nodes.some((n) => n.data.blockType === 'BUY');
    const hasSell = nodes.some((n) => n.data.blockType === 'SELL');
    if (!hasBuy || !hasSell) {
      alert('매수(BUY)와 매도(SELL) 블록이 모두 필요합니다.');
      return;
    }

    const strategyId = `strategy_${Date.now()}`;
    const strategy: Strategy = {
      meta: {
        id: strategyId,
        name: strategyName,
        assetClass: 'US_STOCK',
        symbol: 'MOCK',
        timeframe: '1d',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes,
      edges,
      viewport,
    };

    const request: BacktestRequest = {
      strategy,
      ...DEFAULT_RUN_CONFIG,
      from: getTwoYearsAgo(),
      to: Date.now(),
    };

    setIsRunning(true);
    setError(null);

    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data);
      router.push(`/results/${strategyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '백테스트 실행 중 오류가 발생했습니다.');
      alert('백테스트 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
    } finally {
      setIsRunning(false);
    }
  };

  const { isRunning } = useBacktestStore();

  return (
    <header className="h-13 flex items-center gap-3 px-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shrink-0">
      {/* Logo */}
      <span className="text-sm font-bold text-[var(--color-accent)] mr-2">BacktestApp</span>

      {/* Strategy name */}
      <input
        type="text"
        value={strategyName}
        onChange={(e) => setStrategyName(e.target.value)}
        className="flex-1 max-w-xs bg-transparent text-sm font-medium text-[var(--color-text-primary)] border-b border-transparent focus:border-[var(--color-border-default)] focus:outline-none transition-colors px-1 py-0.5"
        placeholder="전략 이름"
      />

      <div className="flex-1" />

      {/* Action buttons */}
      <button
        onClick={() => setRightPanelMode('run')}
        className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
      >
        실행 설정
      </button>

      <button
        onClick={handleSave}
        className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
      >
        저장
      </button>

      <button
        onClick={handleRunBacktest}
        disabled={isRunning}
        className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? '실행 중...' : '백테스트 실행'}
      </button>
    </header>
  );
}
