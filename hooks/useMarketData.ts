"use client";
import { useQuery } from "@tanstack/react-query";

export interface CommodityTick {
  price: number | null;
  change: number | null;
  changePct: number | null;
  date?: string;
}

export interface ChartPoint {
  time: string;
  value: number;
}

export interface MarketData {
  wti: CommodityTick;
  brent: CommodityTick;
  naturalGas: CommodityTick;
  sentiment: "BULLISH" | "BEARISH";
  wtiChart: ChartPoint[];
  brentChart: ChartPoint[];
}

async function fetchMarket(): Promise<MarketData> {
  const res = await fetch("/api/market");
  if (!res.ok) throw new Error("Market fetch failed");
  return res.json();
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ["market"],
    queryFn: fetchMarket,
    refetchInterval: 60_000, // refresh every 60 seconds
    staleTime: 30_000,
  });
}
