"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useBuilderStore } from "@/lib/store/builderStore";
import { useBacktestStore } from "@/lib/store/backtestStore";
import { useModal } from "@/hooks/useModal";
import { AssetSearch } from "@/components/builder/AssetSearch";
import type { Strategy, AssetClass, Timeframe } from "@/types/strategy";
import type { BacktestRequest } from "@/types/backtest";

interface RunFormValues {
  from: string;
  to: string;
  initialCapital: number;
  feeRatePct: number;
  slippagePct: number;
}

export function RunPanel() {
  const router = useRouter();
  const t = useTranslations("runPanel");
  const { showAlert } = useModal();
  const { nodes, edges, viewport, strategyName, runConfig, patchRunConfig } =
    useBuilderStore();
  const { setResult, setIsRunning, setError, isRunning } = useBacktestStore();

  const { assetClass, timeframe, symbol } = runConfig;

  const assetClassOptions: { value: AssetClass; label: string; placeholder: string }[] = [
    { value: "STOCK", label: t("assetClass.STOCK"), placeholder: "AAPL / 005930.KS" },
    { value: "CRYPTO", label: t("assetClass.CRYPTO"), placeholder: "BTCUSDT" },
  ];

  const timeframeOptions: { value: Timeframe; label: string }[] = [
    { value: "1d", label: t("timeframe.1d") },
    { value: "1w", label: t("timeframe.1w") },
    { value: "1m", label: t("timeframe.1m") },
  ];

  const handleAssetClassChange = (ac: AssetClass) => {
    patchRunConfig({ assetClass: ac, symbol: "" });
  };

  const handleSymbolChange = useCallback(
    (sym: string) => {
      patchRunConfig({ symbol: sym });
    },
    [patchRunConfig],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RunFormValues>({
    defaultValues: {
      from: runConfig.from,
      to: runConfig.to,
      initialCapital: runConfig.initialCapital,
      feeRatePct: runConfig.feeRatePct,
      slippagePct: runConfig.slippagePct,
    },
  });

  const onSubmit = async (values: RunFormValues) => {
    if (nodes.length === 0) {
      await showAlert(t("validationErrors.noBlocks"));
      return;
    }
    if (!symbol.trim()) {
      await showAlert(t("validationErrors.noSymbol"));
      return;
    }
    const hasBuy = nodes.some((n) => n.data.blockType === "BUY");
    const hasSell = nodes.some((n) => n.data.blockType === "SELL");
    if (!hasBuy || !hasSell) {
      await showAlert(t("validationErrors.missingBuySell"));
      return;
    }

    const strategyId = `strategy_${Date.now()}`;
    const strategy: Strategy = {
      meta: {
        id: strategyId,
        name: strategyName,
        assetClass,
        symbol: symbol.trim(),
        timeframe,
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
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data);
      router.push(`/results/${strategyId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("error");
      setError(msg);
      await showAlert(t("backtestFailed", { message: msg }));
    } finally {
      setIsRunning(false);
    }
  };

  const currentAsset = assetClassOptions.find((o) => o.value === assetClass)!;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {t("title")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="px-4 py-3 space-y-3 flex flex-col flex-1"
      >
        {/* Asset Class */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
            {t("fields.assetType")}
          </span>
          <div className="flex rounded-md overflow-hidden border border-(--color-border-default)">
            {assetClassOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleAssetClassChange(opt.value)}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                  assetClass === opt.value
                    ? "bg-(--color-accent) text-white"
                    : "bg-(--color-bg-elevated) text-(--color-text-secondary) hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol Search */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
            {t("fields.symbol")}
          </span>
          <AssetSearch
            assetClass={assetClass}
            value={symbol}
            onChange={handleSymbolChange}
            placeholder={currentAsset.placeholder}
          />
        </div>

        {/* Timeframe */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
            {t("fields.timeframe")}
          </span>
          <div className="flex rounded-md overflow-hidden border border-(--color-border-default)">
            {timeframeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => patchRunConfig({ timeframe: opt.value })}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                  timeframe === opt.value
                    ? "bg-(--color-accent) text-white"
                    : "bg-(--color-bg-elevated) text-(--color-text-secondary) hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="flex gap-2">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {t("fields.startDate")}
            </span>
            <input
              type="date"
              {...register("from", {
                required: true,
                onChange: (e) => patchRunConfig({ from: e.target.value }),
              })}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {t("fields.endDate")}
            </span>
            <input
              type="date"
              {...register("to", {
                required: true,
                onChange: (e) => patchRunConfig({ to: e.target.value }),
              })}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </label>
        </div>

        {/* Capital */}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
            {t("fields.initialCapital")}
          </span>
          <input
            type="number"
            {...register("initialCapital", {
              required: true,
              min: 1,
              onChange: (e) =>
                patchRunConfig({ initialCapital: Number(e.target.value) }),
            })}
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
          />
        </label>

        {/* Fee / Slippage */}
        <div className="flex gap-2">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {t("fields.fee")}
            </span>
            <input
              type="number"
              step="0.01"
              {...register("feeRatePct", {
                required: true,
                min: 0,
                onChange: (e) =>
                  patchRunConfig({ feeRatePct: Number(e.target.value) }),
              })}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {t("fields.slippage")}
            </span>
            <input
              type="number"
              step="0.01"
              {...register("slippagePct", {
                required: true,
                min: 0,
                onChange: (e) =>
                  patchRunConfig({ slippagePct: Number(e.target.value) }),
              })}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
            />
          </label>
        </div>

        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-[var(--color-danger)]">
            {t("validationError")}
          </p>
        )}

        <div className="flex-1" />

        <button
          type="submit"
          disabled={isRunning}
          className="w-full py-2.5 text-sm font-semibold rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? t("runningButton") : t("runButton")}
        </button>
      </form>
    </div>
  );
}
