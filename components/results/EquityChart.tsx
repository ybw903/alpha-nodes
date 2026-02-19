"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  LineStyle,
  LineSeries,
} from "lightweight-charts";
import type { EquityDataPoint } from "@/types/backtest";

interface EquityChartProps {
  equityCurve: EquityDataPoint[];
  initialCapital: number;
}

export function EquityChart({ equityCurve, initialCapital }: EquityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const benchmarkSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

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
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const equitySeries = chart.addSeries(LineSeries, {
      color: "#6366f1",
      lineWidth: 2,
      title: "전략",
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    });
    equitySeriesRef.current = equitySeries;

    const benchmarkSeries = chart.addSeries(LineSeries, {
      color: "#5a5d6a",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: "B&H",
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    });
    benchmarkSeriesRef.current = benchmarkSeries;

    // Set data
    const equityData = equityCurve.map((p) => ({
      time: Math.floor(p.timestamp / 1000) as unknown as string,
      value: p.equity,
    }));
    const benchmarkData = equityCurve.map((p) => ({
      time: Math.floor(p.timestamp / 1000) as unknown as string,
      value: p.benchmark,
    }));

    equitySeries.setData(
      equityData as Parameters<typeof equitySeries.setData>[0]
    );
    benchmarkSeries.setData(
      benchmarkData as Parameters<typeof benchmarkSeries.setData>[0]
    );

    // Baseline
    equitySeries.createPriceLine({
      price: initialCapital,
      color: "#3a3d4a",
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "초기 자본",
    });

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
  }, [equityCurve, initialCapital]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 px-1">
        <span className="text-xs text-[var(--color-text-secondary)] font-medium">
          자산 곡선
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-[#6366f1]" />
          <span className="text-[11px] text-[var(--color-text-muted)]">
            전략
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-[#5a5d6a] border-dashed border-b" />
          <span className="text-[11px] text-[var(--color-text-muted)]">
            매수 후 보유 (B&H)
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full h-64 rounded-xl overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]"
      />
    </div>
  );
}
