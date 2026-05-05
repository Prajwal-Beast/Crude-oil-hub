"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { Activity, TrendingDown, TrendingUp, Zap, Droplets, Flame } from "lucide-react";

function TickerCard({
  label,
  icon,
  price,
  change,
  changePct,
  unit = "$/bbl",
}: {
  label: string;
  icon: React.ReactNode;
  price: number | null;
  change: number | null;
  changePct: number | null;
  unit?: string;
}) {
  const isPositive = (changePct ?? 0) >= 0;
  return (
    <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 min-w-[200px]">
      <div className="text-amber-400">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-bold text-white font-mono">
            {price != null ? `$${price.toFixed(2)}` : "—"}
          </span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
      <div className={`text-right ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
        <div className="flex items-center gap-0.5 text-xs font-semibold">
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {changePct != null ? `${isPositive ? "+" : ""}${changePct.toFixed(2)}%` : "—"}
        </div>
        <div className="text-xs opacity-75">
          {change != null ? `${isPositive ? "+" : ""}${change.toFixed(2)}` : "—"}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { data, isLoading, dataUpdatedAt } = useMarketData();

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const isBullish = data?.sentiment === "BULLISH";

  return (
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        {/* Top row: logo + sentiment */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Droplets size={18} className="text-gray-950" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">OIL-LINK</span>
              <span className="text-gray-500 text-xs ml-2">Market Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sentiment badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
                isBullish
                  ? "bg-emerald-900/40 border-emerald-700 text-emerald-400"
                  : "bg-red-900/40 border-red-700 text-red-400"
              }`}
            >
              {isBullish ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isLoading ? "—" : data?.sentiment}
              <span className="text-xs font-normal opacity-70">24h Sentiment</span>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"
                }`}
              />
              {isLoading ? "Fetching..." : `Updated ${lastUpdate ?? "—"}`}
            </div>

            {/* Live pulse icon */}
            <Activity size={16} className="text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Ticker row */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          <TickerCard
            label="WTI Crude"
            icon={<Droplets size={20} />}
            price={data?.wti.price ?? null}
            change={data?.wti.change ?? null}
            changePct={data?.wti.changePct ?? null}
          />
          <TickerCard
            label="Brent Crude"
            icon={<Zap size={20} />}
            price={data?.brent.price ?? null}
            change={data?.brent.change ?? null}
            changePct={data?.brent.changePct ?? null}
          />
          <TickerCard
            label="Natural Gas"
            icon={<Flame size={20} />}
            price={data?.naturalGas.price ?? null}
            change={data?.naturalGas.change ?? null}
            changePct={data?.naturalGas.changePct ?? null}
            unit="$/MMBtu"
          />

          {/* Spread indicator */}
          {data?.wti?.price && data?.brent?.price && (
            <div className="flex items-center gap-2 bg-gray-800/40 border border-gray-700/50 rounded-xl px-4 py-2.5 min-w-[160px]">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Brent–WTI Spread</div>
                <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                  ${(data.brent.price - data.wti.price).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">per barrel</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
