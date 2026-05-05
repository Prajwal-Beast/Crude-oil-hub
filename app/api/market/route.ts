import { NextResponse } from "next/server";

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

// Yahoo Finance symbols
// CL=F  = WTI Crude Oil Futures (NYMEX)
// BZ=F  = Brent Crude Oil Futures (ICE)
// NG=F  = Natural Gas Futures (NYMEX)
const SYMBOLS = ["CL=F", "BZ=F", "NG=F"];

async function fetchQuotes() {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYMBOLS.join(",")}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,shortName`;
  const res = await fetch(url, {
    headers: YF_HEADERS,
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Yahoo quote failed: ${res.status}`);
  return res.json();
}

async function fetchChart(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=90d`;
  const res = await fetch(url, {
    headers: YF_HEADERS,
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Yahoo chart failed for ${symbol}: ${res.status}`);
  return res.json();
}

function buildChartSeries(chartData: Record<string, unknown>) {
  try {
    const result = (chartData as { chart: { result: { timestamp: number[]; indicators: { quote: { close: number[] }[] } }[] } }).chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    return timestamps
      .map((ts, i) => ({
        time: new Date(ts * 1000).toISOString().split("T")[0],
        value: closes[i] != null ? parseFloat(closes[i].toFixed(2)) : null,
      }))
      .filter((d) => d.value != null) as { time: string; value: number }[];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Fetch quotes + charts in parallel
    const [quotesData, wtiChart, brentChart] = await Promise.all([
      fetchQuotes(),
      fetchChart("CL=F"),
      fetchChart("BZ=F"),
    ]);

    const results: Record<string, unknown>[] =
      quotesData?.quoteResponse?.result ?? [];

    const get = (sym: string) =>
      results.find((r) => (r as { symbol: string }).symbol === sym) as Record<string, number> | undefined;

    const wtiQ = get("CL=F");
    const brentQ = get("BZ=F");
    const ngQ = get("NG=F");

    const map = (q: Record<string, number> | undefined) => ({
      price: q?.regularMarketPrice ?? null,
      change: q?.regularMarketChange != null ? parseFloat(q.regularMarketChange.toFixed(2)) : null,
      changePct: q?.regularMarketChangePercent != null ? parseFloat(q.regularMarketChangePercent.toFixed(2)) : null,
      open: q?.regularMarketOpen ?? null,
      high: q?.regularMarketDayHigh ?? null,
      low: q?.regularMarketDayLow ?? null,
    });

    const wti = map(wtiQ);
    const brent = map(brentQ);
    const ng = map(ngQ);

    const positiveCount = [wti, brent, ng].filter((c) => (c.changePct ?? 0) > 0).length;
    const sentiment = positiveCount >= 2 ? "BULLISH" : "BEARISH";

    return NextResponse.json({
      wti,
      brent,
      naturalGas: ng,
      sentiment,
      wtiChart: buildChartSeries(wtiChart),
      brentChart: buildChartSeries(brentChart),
    });
  } catch (err) {
    console.error("Market API error:", err);
    return NextResponse.json({ error: "Failed to fetch market data", detail: String(err) }, { status: 500 });
  }
}
