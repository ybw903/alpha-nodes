"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { PerformanceMetrics } from "@/types/metrics";

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  positive?: boolean | null;
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

function fmtCapital(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

export function MetricsGrid({ metrics }: { metrics: PerformanceMetrics }) {
  const t = useTranslations("results");

  const cards: MetricCardProps[] = [
    {
      label: t("metrics.totalReturn"),
      value: fmtPct(metrics.totalReturnPct),
      subValue: t("metrics.annualized", { value: fmtPct(metrics.annualizedReturnPct) }),
      positive: metrics.totalReturnPct >= 0,
    },
    {
      label: t("metrics.benchmarkDiff"),
      value: fmtPct(metrics.totalReturnPct - metrics.benchmarkReturnPct),
      subValue: t("metrics.bnh", { value: fmtPct(metrics.benchmarkReturnPct) }),
      positive: metrics.totalReturnPct >= metrics.benchmarkReturnPct,
    },
    {
      label: t("metrics.mdd"),
      value: `-${metrics.maxDrawdownPct.toFixed(2)}%`,
      subValue: undefined,
      positive: metrics.maxDrawdownPct <= 20,
    },
    {
      label: t("metrics.sharpe"),
      value: fmtNum(metrics.sharpeRatio, 3),
      subValue: t("metrics.sortino", { value: fmtNum(metrics.sortinoRatio, 3) }),
      positive:
        metrics.sharpeRatio >= 1
          ? true
          : metrics.sharpeRatio >= 0
          ? null
          : false,
    },
    {
      label: t("metrics.winRate"),
      value: `${(metrics.winRate * 100).toFixed(1)}%`,
      subValue: t("metrics.tradeCount", { count: metrics.totalTrades }),
      positive:
        metrics.winRate >= 0.5 ? true : metrics.winRate >= 0.4 ? null : false,
    },
    {
      label: t("metrics.profitFactor"),
      value: fmtNum(metrics.profitFactor, 2),
      subValue: t("metrics.avgWinLoss", {
        win: fmtPct(metrics.avgWinPct),
        loss: fmtPct(metrics.avgLossPct),
      }),
      positive:
        metrics.profitFactor >= 1.5
          ? true
          : metrics.profitFactor >= 1
          ? null
          : false,
    },
    {
      label: t("metrics.finalCapital"),
      value: t("metrics.capitalValue", { value: fmtCapital(metrics.finalCapital) }),
      subValue: t("metrics.initialCapital", { value: fmtCapital(metrics.initialCapital) }),
      positive: metrics.finalCapital >= metrics.initialCapital,
    },
    {
      label: t("metrics.totalFees"),
      value: t("metrics.capitalValue", { value: fmtCapital(metrics.totalFeesSpent) }),
      subValue: t("metrics.avgHolding", { days: metrics.avgHoldingPeriodBars.toFixed(0) }),
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
