'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import type { Trade } from '@/types/backtest';

const PAGE_SIZE = 20;

function formatDate(ts?: number): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

function formatPrice(v?: number): string {
  if (v === undefined) return '-';
  return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
}

type SortKey = 'entryTimestamp' | 'exitTimestamp' | 'pnlPct' | 'entryPrice';
type SortDir = 'asc' | 'desc';

export function TradeTable({ trades }: { trades: Trade[] }) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('entryTimestamp');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const closed = trades.filter((t) => t.status === 'CLOSED');

  const sorted = [...closed].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const SortIndicator = ({ col }: { col: SortKey }) =>
    sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  if (closed.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)]">
        거래 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-[var(--color-text-secondary)] font-medium">
          거래 내역 ({closed.length}건)
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-0.5 text-xs rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] disabled:opacity-30"
            >
              이전
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-2 py-0.5 text-xs rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] disabled:opacity-30"
            >
              다음
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
              {[
                { key: 'entryTimestamp' as SortKey, label: '진입일' },
                { key: 'entryPrice' as SortKey, label: '진입가' },
                { key: 'exitTimestamp' as SortKey, label: '청산일' },
                { key: null, label: '청산가' },
                { key: null, label: '보유일' },
                { key: 'pnlPct' as SortKey, label: '수익률' },
                { key: null, label: '청산 이유' },
              ].map(({ key, label }) => (
                <th
                  key={label}
                  onClick={() => key && handleSort(key)}
                  className={clsx(
                    'px-3 py-2 text-left font-medium text-[var(--color-text-muted)] whitespace-nowrap',
                    key && 'cursor-pointer hover:text-[var(--color-text-secondary)] select-none'
                  )}
                >
                  {label}{key && <SortIndicator col={key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((trade) => {
              const win = (trade.pnl ?? 0) > 0;
              const holdDays = trade.exitTimestamp
                ? Math.round((trade.exitTimestamp - trade.entryTimestamp) / 86_400_000)
                : '-';
              const exitReasonLabel: Record<string, string> = {
                SIGNAL: '시그널',
                STOP_LOSS: '손절',
                TAKE_PROFIT: '익절',
                END_OF_DATA: '데이터 종료',
              };

              return (
                <tr
                  key={trade.id}
                  className={clsx(
                    'border-b border-[var(--color-border-subtle)] last:border-0',
                    win ? 'bg-[var(--color-success-subtle)]' : 'bg-[var(--color-danger-subtle)]'
                  )}
                >
                  <td className="px-3 py-2 font-mono text-[var(--color-text-secondary)] whitespace-nowrap">
                    {formatDate(trade.entryTimestamp)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--color-text-secondary)] whitespace-nowrap">
                    {formatPrice(trade.entryPrice)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--color-text-secondary)] whitespace-nowrap">
                    {formatDate(trade.exitTimestamp)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--color-text-secondary)] whitespace-nowrap">
                    {formatPrice(trade.exitPrice)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                    {holdDays}일
                  </td>
                  <td className={clsx(
                    'px-3 py-2 font-mono font-semibold whitespace-nowrap',
                    win ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                  )}>
                    {trade.pnlPct !== undefined
                      ? `${trade.pnlPct >= 0 ? '+' : ''}${trade.pnlPct.toFixed(2)}%`
                      : '-'}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-text-muted)] whitespace-nowrap">
                    {exitReasonLabel[trade.exitReason ?? ''] ?? trade.exitReason ?? '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
