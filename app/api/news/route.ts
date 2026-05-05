import { NextResponse } from "next/server";
import Parser from "rss-parser";

const NEWS_KEY = process.env.NEWS_API_KEY!;

// ── Impact scoring ──────────────────────────────────────────────────────────
const HIGH_IMPACT: string[] = [
  "opec", "sanction", "iran", "russia", "pipeline", "refinery",
  "supply cut", "embargo", "war", "conflict", "strike", "explosion",
  "hurricane", "shutdown", "disruption", "attack", "crisis",
  "ceasefire", "blockade", "tanker", "strait of hormuz",
];
const MEDIUM_IMPACT: string[] = [
  "oil", "crude", "brent", "wti", "energy", "petroleum",
  "production", "inventory", "eia", "fed", "inflation", "gdp",
  "demand", "export", "import", "barrel", "opec+", "natural gas",
  "shale", "offshore", "drilling", "refining", "gasoline",
];

function score(text: string): number {
  const t = text.toLowerCase();
  let s = 0;
  HIGH_IMPACT.forEach((kw) => { if (t.includes(kw)) s += 3; });
  MEDIUM_IMPACT.forEach((kw) => { if (t.includes(kw)) s += 1; });
  return Math.min(s, 10);
}

function level(s: number): "HIGH" | "MEDIUM" | "LOW" {
  if (s >= 6) return "HIGH";
  if (s >= 3) return "MEDIUM";
  return "LOW";
}

// ── RSS Feed Sources ─────────────────────────────────────────────────────────
const RSS_FEEDS = [
  { url: "https://oilprice.com/rss/main",               source: "OilPrice.com" },
  { url: "https://www.eia.gov/rss/news.xml",            source: "EIA.gov" },
  { url: "https://feeds.reuters.com/reuters/businessNews", source: "Reuters" },
  { url: "https://www.rigzone.com/news/rss/rigzone_latest.aspx", source: "Rigzone" },
  { url: "https://www.naturalgasintel.com/feed/",       source: "NGI" },
];

interface Article {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage: string | null;
  impactScore: number;
  impactLevel: "HIGH" | "MEDIUM" | "LOW";
}

async function fetchRSS(feedUrl: string, sourceName: string): Promise<Article[]> {
  const parser = new Parser({ timeout: 5000, headers: { "User-Agent": "OIL-LINK/2.0" } });
  try {
    const feed = await parser.parseURL(feedUrl);
    return (feed.items ?? []).slice(0, 15).map((item) => {
      const combined = `${item.title ?? ""} ${item.contentSnippet ?? item.content ?? ""}`;
      const s = score(combined);
      return {
        title: item.title ?? "No title",
        description: item.contentSnippet ?? item.summary ?? "",
        url: item.link ?? "",
        source: sourceName,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        urlToImage: null,
        impactScore: s,
        impactLevel: level(s),
      };
    });
  } catch (e) {
    console.warn(`RSS failed for ${sourceName}:`, e);
    return [];
  }
}

async function fetchNewsAPI(): Promise<Article[]> {
  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", "crude oil OR OPEC OR petroleum OR energy market OR oil price OR Brent OR WTI");
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "30");
    url.searchParams.set("apiKey", NEWS_KEY);

    const res = await fetch(url.toString(), { next: { revalidate: 180 } });
    const data = await res.json();
    if (data.status !== "ok") return [];

    return (data.articles as {
      title: string; description: string; url: string;
      source: { name: string }; publishedAt: string; urlToImage: string | null;
    }[]).map((a) => {
      const s = score(`${a.title} ${a.description ?? ""}`);
      return {
        title: a.title,
        description: a.description ?? "",
        url: a.url,
        source: a.source.name,
        publishedAt: a.publishedAt,
        urlToImage: a.urlToImage,
        impactScore: s,
        impactLevel: level(s),
      };
    });
  } catch (e) {
    console.warn("NewsAPI failed:", e);
    return [];
  }
}

function dedup(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.title.toLowerCase().replace(/\s+/g, "").slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  try {
    // Fetch all sources in parallel
    const [newsApiArticles, ...rssResults] = await Promise.all([
      fetchNewsAPI(),
      ...RSS_FEEDS.map((f) => fetchRSS(f.url, f.source)),
    ]);

    const all = dedup(
      [...newsApiArticles, ...rssResults.flat()]
        .filter((a) => a.title && a.url)
        .sort((a, b) => b.impactScore - a.impactScore || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    ).slice(0, 60);

    return NextResponse.json({ articles: all, total: all.length });
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
