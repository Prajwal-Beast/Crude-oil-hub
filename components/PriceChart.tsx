"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, AreaSeries, type IChartApi, type ISeriesApi, type LineData } from "lightweight-charts";
import { useMarketData } from "@/hooks/useMarketData";
import { BarChart2, Maximize2 } from "lucide-react";

type Commodity = "wti" | "brent";

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<"Area"> | any>(null);
  const { data, isLoading } = useMarketData();
  const [activeCommodity, setActiveCommodity] = useState<Commodity>("wti");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      crosshair: {
        vertLine: { color: "#6b7280", width: 1 },
        horzLine: { color: "#6b7280", width: 1 },
      },
      rightPriceScale: {
        borderColor: "#374151",
        textColor: "#9ca3af",
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
        rightOffset: 5,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#f59e0b",
      topColor: "rgba(245,158,11,0.3)",
      bottomColor: "rgba(245,158,11,0.02)",
      lineWidth: 2,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    // Responsive resize
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Update data when commodity or data changes
  useEffect(() => {
    if (!seriesRef.current || !data) return;

    const chartData = (activeCommodity === "wti" ? data.wtiChart : data.brentChart) as LineData[];

    if (chartData?.length) {
      seriesRef.current.setData(chartData);

      // Update series color for brent
      seriesRef.current.applyOptions({
        lineColor: activeCommodity === "wti" ? "#f59e0b" : "#3b82f6",
        topColor:
          activeCommodity === "wti" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)",
        bottomColor:
          activeCommodity === "wti" ? "rgba(245,158,11,0.02)" : "rgba(59,130,246,0.02)",
      });

      chartRef.current?.timeScale().fitContent();
    }
  }, [data, activeCommodity]);

  const activePrice =
    activeCommodity === "wti" ? data?.wti : data?.brent;
  const isPositive = (activePrice?.changePct ?? 0) >= 0;

  return (
    <div
      className={`flex flex-col bg-gray-900/60 border border-gray-700/50 rounded-xl overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-full"
      }`}
    >
      {/* Chart header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <BarChart2 size={16} className="text-amber-400" />
          <span className="text-white font-semibold text-sm">Price Chart</span>

          {/* Toggle buttons */}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {(["wti", "brent"] as Commodity[]).map((c) => (
              <button
                key={c}
                onClick={() => setActiveCommodity(c)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeCommodity === c
                    ? c === "wti"
                      ? "bg-amber-500 text-gray-950"
                      : "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activePrice?.price && (
            <div className="text-right">
              <span className="text-white font-bold font-mono">
                ${activePrice.price.toFixed(2)}
              </span>
              <span
                className={`ml-2 text-xs font-semibold ${
                  isPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {activePrice.changePct?.toFixed(2)}%
              </span>
            </div>
          )}
          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="text-gray-500 hover:text-white transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* 90-day label */}
      <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
        <span>90-Day Historical</span>
        <span>Source: Alpha Vantage</span>
      </div>
    </div>
  );
}
