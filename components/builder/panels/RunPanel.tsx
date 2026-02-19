'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useBuilderStore } from '@/lib/store/builderStore';
import { useBacktestStore } from '@/lib/store/backtestStore';
import type { Strategy } from '@/types/strategy';
import type { BacktestRequest } from '@/types/backtest';

interface RunFormValues {
  symbol: string;
  from: string;
  to: string;
  initialCapital: number;
  feeRatePct: number;
  slippagePct: number;
}

function toDefaultDate(offsetYears: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  return d.toISOString().split('T')[0];
}

export function RunPanel() {
  const router = useRouter();
  const { nodes, edges, viewport, strategyName } = useBuilderStore();
  const { setResult, setIsRunning, setError, isRunning } = useBacktestStore();

  const { register, handleSubmit, formState: { errors } } = useForm<RunFormValues>({
    defaultValues: {
      symbol: 'MOCK',
      from: toDefaultDate(-2),
      to: toDefaultDate(0),
      initialCapital: 10_000_000,
      feeRatePct: 0.05,
      slippagePct: 0.05,
    },
  });

  const onSubmit = async (values: RunFormValues) => {
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
        symbol: values.symbol,
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
      initialCapital: Number(values.initialCapital),
      feeRatePct: Number(values.feeRatePct),
      slippagePct: Number(values.slippagePct),
      from: new Date(values.from).getTime(),
      to: new Date(values.to).getTime(),
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
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(msg);
      alert('백테스트 실패: ' + msg);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">실행 설정</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 space-y-3 flex flex-col flex-1">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">자산 심볼</span>
          <input
            {...register('symbol', { required: true })}
            placeholder="MOCK / AAPL / 005930.KS"
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
          />
        </label>

        <div className="flex gap-2">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">시작일</span>
            <input
              type="date"
              {...register('from', { required: true })}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">종료일</span>
            <input
              type="date"
              {...register('to', { required: true })}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">초기 자본 (원)</span>
          <input
            type="number"
            {...register('initialCapital', { required: true, min: 1 })}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
          />
        </label>

        <div className="flex gap-2">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">수수료 (%)</span>
            <input
              type="number"
              step="0.01"
              {...register('feeRatePct', { required: true, min: 0 })}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">슬리피지 (%)</span>
            <input
              type="number"
              step="0.01"
              {...register('slippagePct', { required: true, min: 0 })}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
            />
          </label>
        </div>

        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-[var(--color-danger)]">모든 필드를 올바르게 입력해주세요.</p>
        )}

        <div className="flex-1" />

        <button
          type="submit"
          disabled={isRunning}
          className="w-full py-2.5 text-sm font-semibold rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? '백테스트 실행 중...' : '백테스트 실행'}
        </button>
      </form>
    </div>
  );
}
