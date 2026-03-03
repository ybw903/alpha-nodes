"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useBacktestStore } from "@/lib/store/backtestStore";
import { MetricsGrid } from "@/components/results/MetricsGrid";
import { CandlestickChart } from "@/components/results/CandlestickChart";
import { EquityChart } from "@/components/results/EquityChart";
import { DrawdownChart } from "@/components/results/DrawdownChart";
import { TradeTable } from "@/components/results/TradeTable";
import { useTranslations } from "next-intl";
import { useFormatter } from "next-intl";

export default function ResultsPage() {
  const router = useRouter();
  const { result } = useBacktestStore();
  const t = useTranslations("results");
  const format = useFormatter();

  useEffect(() => {
    if (!result) {
      router.replace("/");
    }
  }, [result, router]);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[var(--color-text-muted)]">{t("loading")}</p>
      </div>
    );
  }

  const { metrics, equityCurve, bars, trades, request, warnings } = result;
  const strategyName = request.strategy.meta.name;
  const symbol = request.strategy.meta.symbol;
  const fromDate = format.dateTime(new Date(request.from), {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  const toDate = format.dateTime(new Date(request.to), {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-13 flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-[var(--color-accent)] font-bold hover:text-[var(--color-accent-hover)] transition-colors"
          >
            AlphaNodes
          </Link>
          <span className="text-[var(--color-border-default)]">/</span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {strategyName}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] ml-1">
            {symbol} · {fromDate} ~ {toDate}
          </span>
          <div className="flex-1" />
          <Link
            href="/"
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
          >
            {t("editStrategy")}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10">
            <p className="text-xs font-semibold text-[var(--color-warning)] mb-1">
              {t("warnings")}
            </p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-[var(--color-warning)]/80">
                {w}
              </p>
            ))}
          </div>
        )}

        {/* Metrics */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            {t("sections.metrics")}
          </h2>
          <MetricsGrid metrics={metrics} />
        </section>

        {/* Candlestick chart */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {t("sections.priceChart")}
          </h2>
          <CandlestickChart
            bars={bars}
            trades={trades}
            nodes={request.strategy.nodes}
          />
        </section>

        {/* Charts */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {t("sections.equityChart")}
          </h2>
          <EquityChart
            equityCurve={equityCurve}
            initialCapital={request.initialCapital}
          />
          <DrawdownChart equityCurve={equityCurve} />
        </section>

        {/* Trade log */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            {t("sections.trades")}
          </h2>
          <TradeTable trades={trades} />
        </section>
      </main>
    </div>
  );
}
