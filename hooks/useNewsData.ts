"use client";
import { useQuery } from "@tanstack/react-query";

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage: string | null;
  impactScore: number;
  impactLevel: "HIGH" | "MEDIUM" | "LOW";
}

async function fetchNews(): Promise<{ articles: NewsArticle[] }> {
  const res = await fetch("/api/news");
  if (!res.ok) throw new Error("News fetch failed");
  return res.json();
}

export function useNewsData() {
  return useQuery<{ articles: NewsArticle[] }>({
    queryKey: ["news"],
    queryFn: fetchNews,
    refetchInterval: 300_000, // refresh every 5 minutes
    staleTime: 120_000,
  });
}
