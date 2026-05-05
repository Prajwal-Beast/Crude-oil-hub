import { NextResponse } from "next/server";

const NEWS_KEY = process.env.NEWS_API_KEY!;

// Keywords that indicate high-impact oil market events
const HIGH_IMPACT_KEYWORDS = [
  "opec", "sanction", "iran", "russia", "pipeline", "refinery",
  "supply cut", "embargo", "war", "conflict", "strike", "explosion",
  "hurricane", "shutdown", "disruption",
];

const MEDIUM_IMPACT_KEYWORDS = [
  "oil", "crude", "brent", "wti", "energy", "petroleum",
  "production", "inventory", "eia", "fed", "inflation", "gdp",
  "demand", "export", "import",
];

function calculateImpactScore(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  HIGH_IMPACT_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) score += 3;
  });

  MEDIUM_IMPACT_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) score += 1;
  });

  return Math.min(score, 10); // cap at 10
}

function getImpactLevel(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 6) return "HIGH";
  if (score >= 3) return "MEDIUM";
  return "LOW";
}

export async function GET() {
  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", "crude oil OR OPEC OR petroleum OR energy market OR oil price");
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "30");
    url.searchParams.set("apiKey", NEWS_KEY);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    const data = await res.json();

    if (data.status !== "ok") {
      throw new Error(data.message ?? "NewsAPI error");
    }

    const articles = (data.articles as {
      title: string;
      description: string;
      url: string;
      source: { name: string };
      publishedAt: string;
      urlToImage: string | null;
    }[])
      .map((a) => {
        const combined = `${a.title} ${a.description ?? ""}`;
        const score = calculateImpactScore(combined);
        return {
          title: a.title,
          description: a.description,
          url: a.url,
          source: a.source.name,
          publishedAt: a.publishedAt,
          urlToImage: a.urlToImage,
          impactScore: score,
          impactLevel: getImpactLevel(score),
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore);

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
