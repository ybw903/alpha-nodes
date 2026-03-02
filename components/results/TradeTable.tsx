'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { useFormatter } from 'next-intl';
import type { Trade } from '@/types/backtest';

const PAGE_SIZE = 20;

function formatPrice(v?: number): string {
  if (v === undefined) return '-';
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

type SortKey = 'entryTimestamp' | 'exitTimestamp' | 'pnlPct' | 'entryPrice';
type SortDir = 'asc' | 'desc';

export function TradeTable({ trades }: { trades: Trade[] }) {
  const t = useTranslations('results');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('entryTimestamp');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const formatDate = (ts?: number): string => {
    if (!ts) return '-';
    return format.dateTime(new Date(ts), { year: '2-digit', month: '2-digit', day: '2-digit' });
  };

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
      <div className="flex items-center justify-center py-12 text-sm text-(--color-text-muted) bg-(--color-bg-elevated) rounded-xl border border-(--color-border-subtle)">
        {t('tradeTable.noTrades')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-[var(--color-text-secondary)] font-medium">
          {t('tradeTable.count', { count: closed.length })}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-0.5 text-xs rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] disabled:opacity-30"
            >
              {tCommon('previous')}
            </button>
            <span className="text-xs text-(--color-text-muted)">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-2 py-0.5 text-xs rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] disabled:opacity-30"
            >
              {tCommon('next')}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-(--color-border-subtle)">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-elevated)">
              {[
                { key: 'entryTimestamp' as SortKey, label: t('tradeTable.entryDate') },
                { key: 'entryPrice' as SortKey, label: t('tradeTable.entryPrice') },
                { key: 'exitTimestamp' as SortKey, label: t('tradeTable.exitDate') },
                { key: null, label: t('tradeTable.exitPrice') },
                { key: null, label: t('tradeTable.holdDays') },
                { key: 'pnlPct' as SortKey, label: t('tradeTable.pnl') },
                { key: null, label: t('tradeTable.exitReason') },
              ].map(({ key, label }) => (
                <th
                  key={label}
                  onClick={() => key && handleSort(key)}
                  className={clsx(
                    'px-3 py-2 text-left font-medium text-(--color-text-muted) whitespace-nowrap',
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
              const exitReasonText = trade.exitReason
                ? t(`tradeTable.exitReasons.${trade.exitReason}` as Parameters<typeof t>[0])
                : '-';

              return (
                <tr
                  key={trade.id}
                  className={clsx(
                    'border-b border-(--color-border-subtle) last:border-0',
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
                  <td className="px-3 py-2 font-mono text-(--color-text-muted) whitespace-nowrap">
                    {typeof holdDays === 'number' ? t('tradeTable.holdUnit', { days: holdDays }) : holdDays}
                  </td>
                  <td className={clsx(
                    'px-3 py-2 font-mono font-semibold whitespace-nowrap',
                    win ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                  )}>
                    {trade.pnlPct !== undefined
                      ? `${trade.pnlPct >= 0 ? '+' : ''}${trade.pnlPct.toFixed(2)}%`
                      : '-'}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-muted) whitespace-nowrap">
                    {exitReasonText}
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
