"use client";

import { useEffect, useRef, useState, useId } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { BarChart2, Maximize2, Minimize2 } from "lucide-react";

declare global {
  interface Window {
    TradingView: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}

type Commodity = "wti" | "brent";

const TV_SYMBOLS: Record<Commodity, string> = {
  wti:   "NYMEX:CL1!",
  brent: "TVC:UKOIL",
};

const TV_INTERVALS = [
  { label: "1H",  value: "60" },
  { label: "4H",  value: "240" },
  { label: "1D",  value: "D" },
  { label: "1W",  value: "W" },
];

export default function PriceChart() {
  const uid = useId().replace(/:/g, "");
  const containerId = `tv_chart_${uid}`;
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { data } = useMarketData();
  const [activeCommodity, setActiveCommodity] = useState<Commodity>("wti");
  const [activeInterval, setActiveInterval] = useState("D");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Build / rebuild widget whenever symbol or interval changes
  useEffect(() => {
    // Remove previous widget container contents
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";

    // Remove old script if present
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: TV_SYMBOLS[activeCommodity],
        interval: activeInterval,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",              // Candlestick
        locale: "en",
        toolbar_bg: "#111827",
        enable_publishing: false,
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: true,
        container_id: containerId,
        backgroundColor: "rgba(3,7,18,0.0)",
        gridColor: "rgba(31,41,55,0.8)",
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
        show_popup_button: true,
        popup_width: "1000",
        popup_height: "650",
        overrides: {
          "paneProperties.background":           "#030712",
          "paneProperties.backgroundType":       "solid",
          "paneProperties.vertGridProperties.color": "#1f2937",
          "paneProperties.horzGridProperties.color": "#1f2937",
          "symbolWatermarkProperties.transparency": 90,
          "scalesProperties.textColor":           "#9ca3af",
          "mainSeriesProperties.candleStyle.upColor":        "#10b981",
          "mainSeriesProperties.candleStyle.downColor":      "#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor":    "#10b981",
          "mainSeriesProperties.candleStyle.wickDownColor":  "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor":  "#10b981",
          "mainSeriesProperties.candleStyle.borderDownColor":"#ef4444",
        },
      });
    };

    scriptRef.current = script;
    document.head.appendChild(script);

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCommodity, activeInterval]);

  const activePrice = activeCommodity === "wti" ? data?.wti : data?.brent;
  const isPositive = (activePrice?.changePct ?? 0) >= 0;

  return (
    <div
      className={`flex flex-col bg-gray-900/60 border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? "fixed inset-2 z-50 rounded-xl shadow-2xl shadow-black/80" : "h-full"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 flex-shrink-0 bg-gray-900/80">
        <div className="flex items-center gap-3">
          <BarChart2 size={15} className="text-amber-400" />
          <span className="text-white font-semibold text-sm">Live Chart</span>

          {/* Commodity toggle */}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {(["wti", "brent"] as Commodity[]).map((c) => (
              <button
                key={c}
                onClick={() => setActiveCommodity(c)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeCommodity === c
                    ? c === "wti"
                      ? "bg-amber-500 text-gray-950 shadow-sm"
                      : "bg-blue-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {c === "wti" ? "WTI" : "BRENT"}
              </button>
            ))}
          </div>

          {/* Interval selector */}
          <div className="flex gap-0.5">
            {TV_INTERVALS.map((iv) => (
              <button
                key={iv.value}
                onClick={() => setActiveInterval(iv.value)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  activeInterval === iv.value
                    ? "bg-gray-600 text-white font-semibold"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live price */}
          {activePrice?.price && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-gray-500">LIVE</span>
              </div>
              <span className="text-white font-bold font-mono text-sm">
                ${activePrice.price.toFixed(2)}
              </span>
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  isPositive
                    ? "bg-emerald-900/50 text-emerald-400"
                    : "bg-red-900/50 text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {activePrice.changePct?.toFixed(2)}%
              </span>
              {activePrice.high && activePrice.low && (
                <span className="text-xs text-gray-500 hidden xl:inline">
                  H: <span className="text-emerald-500">${activePrice.high.toFixed(2)}</span>{" "}
                  L: <span className="text-red-500">${activePrice.low.toFixed(2)}</span>
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="text-gray-500 hover:text-amber-400 transition-colors p-1"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* TradingView widget fills the rest */}
      <div className="flex-1 relative overflow-hidden">
        <div id={containerId} className="w-full h-full" style={{ minHeight: 0 }} />
      </div>
    </div>
  );
}
