'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useBacktestStore } from '@/lib/store/backtestStore';
import { MetricsGrid } from '@/components/results/MetricsGrid';
import { EquityChart } from '@/components/results/EquityChart';
import { DrawdownChart } from '@/components/results/DrawdownChart';
import { TradeTable } from '@/components/results/TradeTable';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { result } = useBacktestStore();

  useEffect(() => {
    if (!result) {
      router.replace('/builder');
    }
  }, [result, router]);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[var(--color-text-muted)]">결과를 불러오는 중...</p>
      </div>
    );
  }

  const { metrics, equityCurve, trades, request, warnings } = result;
  const strategyName = request.strategy.meta.name;
  const symbol = request.strategy.meta.symbol;
  const fromDate = new Date(request.from).toLocaleDateString('ko-KR');
  const toDate = new Date(request.to).toLocaleDateString('ko-KR');

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-13 flex items-center gap-4">
          <Link
            href="/builder"
            className="text-sm text-[var(--color-accent)] font-bold hover:text-[var(--color-accent-hover)] transition-colors"
          >
            BacktestApp
          </Link>
          <span className="text-[var(--color-border-default)]">/</span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{strategyName}</span>
          <span className="text-xs text-[var(--color-text-muted)] ml-1">
            {symbol} · {fromDate} ~ {toDate}
          </span>
          <div className="flex-1" />
          <Link
            href="/builder"
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
          >
            전략 수정
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10">
            <p className="text-xs font-semibold text-[var(--color-warning)] mb-1">경고</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-[var(--color-warning)]/80">{w}</p>
            ))}
          </div>
        )}

        {/* Metrics */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            성과 지표
          </h2>
          <MetricsGrid metrics={metrics} />
        </section>

        {/* Charts */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            수익 차트
          </h2>
          <EquityChart equityCurve={equityCurve} initialCapital={request.initialCapital} />
          <DrawdownChart equityCurve={equityCurve} />
        </section>

        {/* Trade log */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            거래 내역
          </h2>
          <TradeTable trades={trades} />
        </section>
      </main>
    </div>
  );
}
