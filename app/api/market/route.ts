import { NextResponse } from "next/server";

const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY!;

// Alpha Vantage symbols for commodities
const SYMBOLS: Record<string, string> = {
  WTI: "CRUDE_OIL_WTI",
  BRENT: "BRENT",
  NATURAL_GAS: "NATURAL_GAS",
};

async function fetchCommodity(function_name: string) {
  const url = `https://www.alphavantage.co/query?function=${function_name}&interval=daily&apikey=${AV_KEY}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const data = await res.json();
  return data;
}

function extractLatest(data: Record<string, unknown>) {
  // Alpha Vantage returns { data: [{ date, value }, ...] }
  const series = (data["data"] as { date: string; value: string }[]) ?? [];
  if (!series.length) return { price: null, change: null, changePct: null };

  const latest = series[0];
  const previous = series[1];
  const price = parseFloat(latest.value);
  const prevPrice = previous ? parseFloat(previous.value) : price;
  const change = parseFloat((price - prevPrice).toFixed(2));
  const changePct = parseFloat(((change / prevPrice) * 100).toFixed(2));

  return { price, change, changePct, date: latest.date };
}

function buildChartData(data: Record<string, unknown>) {
  const series = (data["data"] as { date: string; value: string }[]) ?? [];
  return series
    .slice(0, 90)
    .reverse()
    .map((d) => ({
      time: d.date,
      value: parseFloat(d.value),
    }));
}

export async function GET() {
  try {
    const [wtiRaw, brentRaw, ngRaw] = await Promise.all([
      fetchCommodity(SYMBOLS.WTI),
      fetchCommodity(SYMBOLS.BRENT),
      fetchCommodity(SYMBOLS.NATURAL_GAS),
    ]);

    const wti = extractLatest(wtiRaw);
    const brent = extractLatest(brentRaw);
    const ng = extractLatest(ngRaw);

    // Overall sentiment: bullish if majority are positive
    const positiveCount = [wti, brent, ng].filter((c) => (c.changePct ?? 0) > 0).length;
    const sentiment = positiveCount >= 2 ? "BULLISH" : "BEARISH";

    return NextResponse.json({
      wti,
      brent,
      naturalGas: ng,
      sentiment,
      wtiChart: buildChartData(wtiRaw),
      brentChart: buildChartData(brentRaw),
    });
  } catch (err) {
    console.error("Market API error:", err);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
