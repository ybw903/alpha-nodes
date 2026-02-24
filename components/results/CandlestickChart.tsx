"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  ColorType,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import { computeIndicator } from "@/lib/backtest/indicators";
import type { OHLCVBar } from "@/types/market";
import type { Trade } from "@/types/backtest";
import type { StrategyNode } from "@/types/strategy";

// Only these block types can be overlaid on price scale
const PRICE_OVERLAY_TYPES = new Set(["SMA", "EMA", "BOLLINGER"]);

const OVERLAY_COLORS = [
  "#f59e0b", // amber
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#34d399", // emerald
  "#fb7185", // rose
];

interface CandlestickChartProps {
  bars: OHLCVBar[];
  trades: Trade[];
  nodes: StrategyNode[];
}

export function CandlestickChart({ bars, trades, nodes }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return;

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
      rightPriceScale: { borderColor: "#2a2d36" },
      timeScale: { borderColor: "#2a2d36", timeVisible: true },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const candleData = bars.map((b) => ({
      time: Math.floor(b.timestamp / 1000) as unknown as Time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    candleSeries.setData(candleData);

    // Indicator overlays (SMA / EMA / Bollinger only)
    const overlayNodes = nodes.filter((n) => PRICE_OVERLAY_TYPES.has(n.data.blockType));
    overlayNodes.forEach((node, idx) => {
      const series = computeIndicator(node, bars);
      const color = OVERLAY_COLORS[idx % OVERLAY_COLORS.length];

      const lineSeries = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        title: node.data.label,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
        lastValueVisible: true,
        priceLineVisible: false,
      });

      const lineData = bars
        .map((b, i) => ({ time: Math.floor(b.timestamp / 1000) as unknown as Time, value: series[i] }))
        .filter((d): d is { time: Time; value: number } => d.value !== null);

      lineSeries.setData(lineData);
    });

    // Trade markers
    const markers: SeriesMarker<Time>[] = trades
      .filter((t) => t.status === "CLOSED")
      .flatMap((t) => {
        const result: SeriesMarker<Time>[] = [
          {
            time: Math.floor(t.entryTimestamp / 1000) as unknown as Time,
            position: "belowBar",
            color: "#22c55e",
            shape: "arrowUp",
            text: "매수",
            size: 1,
          },
        ];
        if (t.exitTimestamp != null) {
          result.push({
            time: Math.floor(t.exitTimestamp / 1000) as unknown as Time,
            position: "aboveBar",
            color: "#ef4444",
            shape: "arrowDown",
            text: "매도",
            size: 1,
          });
        }
        return result;
      })
      .sort((a, b) => (a.time as number) - (b.time as number));

    if (markers.length > 0) {
      createSeriesMarkers(candleSeries, markers);
    }

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
  }, [bars, trades, nodes]);

  if (bars.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 px-1">
        <span className="text-xs text-[var(--color-text-secondary)] font-medium">
          캔들스틱 차트
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-sm bg-[#22c55e]" />
          <span className="text-[11px] text-[var(--color-text-muted)]">매수</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-sm bg-[#ef4444]" />
          <span className="text-[11px] text-[var(--color-text-muted)]">매도</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full h-96 rounded-xl overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]"
      />
    </div>
  );
}
