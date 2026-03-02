"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  ColorType,
  AreaSeries,
} from "lightweight-charts";
import { useTranslations } from "next-intl";
import type { EquityDataPoint } from "@/types/backtest";

export function DrawdownChart({
  equityCurve,
}: {
  equityCurve: EquityDataPoint[];
}) {
  const t = useTranslations("results");
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8890a4",
      },
      grid: {
        vertLines: { color: "#2a2d36" },
        horzLines: { color: "#2a2d36" },
      },
      crosshair: {
        vertLine: { color: "#5a5d6a", labelBackgroundColor: "#1e2028" },
        horzLine: { color: "#5a5d6a", labelBackgroundColor: "#1e2028" },
      },
      rightPriceScale: {
        borderColor: "#2a2d36",
      },
      timeScale: {
        borderColor: "#2a2d36",
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#ef4444",
      topColor: "rgba(239, 68, 68, 0.2)",
      bottomColor: "rgba(239, 68, 68, 0)",
      lineWidth: 1,
      title: t("drawdown.series"),
      priceFormat: { type: "percent", precision: 2, minMove: 0.01 },
    });

    const data = equityCurve.map((p) => ({
      time: Math.floor(p.timestamp / 1000) as unknown as string,
      value: p.drawdown * 100,
    }));

    series.setData(data as Parameters<typeof series.setData>[0]);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [equityCurve, t]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-(--color-text-secondary) font-medium px-1">
        {t("drawdown.title")}
      </span>
      <div
        ref={containerRef}
        className="w-full h-36 rounded-xl overflow-hidden bg-(--color-bg-elevated) border border-(--color-border-subtle)"
      />
    </div>
  );
}
