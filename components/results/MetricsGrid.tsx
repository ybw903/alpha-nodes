"use client";

import { clsx } from "clsx";
import type { PerformanceMetrics } from "@/types/metrics";

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  positive?: boolean | null; // null = neutral
}

function MetricCard({ label, value, subValue, positive }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
      <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
        {label}
      </span>
      <span
        className={clsx(
          "text-2xl font-bold font-mono leading-none",
          positive === true && "text-[var(--color-success)]",
          positive === false && "text-[var(--color-danger)]",
          positive === null && "text-[var(--color-text-primary)]"
        )}
      >
        {value}
      </span>
      {subValue && (
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {subValue}
        </span>
      )}
    </div>
  );
}

function fmtPct(v: number, decimals = 2): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;
}

function fmtNum(v: number, decimals = 2): string {
  return v.toFixed(decimals);
}

function fmtKRW(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

export function MetricsGrid({ metrics }: { metrics: PerformanceMetrics }) {
  const cards: MetricCardProps[] = [
    {
      label: "총 수익률",
      value: fmtPct(metrics.totalReturnPct),
      subValue: `연환산 ${fmtPct(metrics.annualizedReturnPct)}`,
      positive: metrics.totalReturnPct >= 0,
    },
    {
      label: "벤치마크 대비",
      value: fmtPct(metrics.totalReturnPct - metrics.benchmarkReturnPct),
      subValue: `B&H ${fmtPct(metrics.benchmarkReturnPct)}`,
      positive: metrics.totalReturnPct >= metrics.benchmarkReturnPct,
    },
    {
      label: "최대 낙폭 (MDD)",
      value: `-${metrics.maxDrawdownPct.toFixed(2)}%`,
      subValue: undefined,
      positive: metrics.maxDrawdownPct <= 20,
    },
    {
      label: "샤프 지수",
      value: fmtNum(metrics.sharpeRatio, 3),
      subValue: `소르티노 ${fmtNum(metrics.sortinoRatio, 3)}`,
      positive:
        metrics.sharpeRatio >= 1
          ? true
          : metrics.sharpeRatio >= 0
          ? null
          : false,
    },
    {
      label: "승률",
      value: `${(metrics.winRate * 100).toFixed(1)}%`,
      subValue: `${metrics.totalTrades}건 거래`,
      positive:
        metrics.winRate >= 0.5 ? true : metrics.winRate >= 0.4 ? null : false,
    },
    {
      label: "손익비 (PF)",
      value: fmtNum(metrics.profitFactor, 2),
      subValue: `평균 수익 ${fmtPct(metrics.avgWinPct)} / 손실 ${fmtPct(
        metrics.avgLossPct
      )}`,
      positive:
        metrics.profitFactor >= 1.5
          ? true
          : metrics.profitFactor >= 1
          ? null
          : false,
    },
    {
      label: "최종 자본",
      value: `${fmtKRW(metrics.finalCapital)}원`,
      subValue: `초기 ${fmtKRW(metrics.initialCapital)}원`,
      positive: metrics.finalCapital >= metrics.initialCapital,
    },
    {
      label: "수수료 총액",
      value: `${fmtKRW(metrics.totalFeesSpent)}원`,
      subValue: `평균 보유 ${metrics.avgHoldingPeriodBars.toFixed(0)}일`,
      positive: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
