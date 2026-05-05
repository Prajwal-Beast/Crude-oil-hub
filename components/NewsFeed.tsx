"use client";

import { useState } from "react";
import { useNewsData } from "@/hooks/useNewsData";
import { ExternalLink, Rss, AlertTriangle, TrendingUp, Minus, RefreshCw } from "lucide-react";

const IMPACT_CONFIG = {
  HIGH: {
    label: "HIGH IMPACT",
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-800/50",
    icon: <AlertTriangle size={11} />,
    dot: "bg-red-400",
  },
  MEDIUM: {
    label: "MEDIUM",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-800/50",
    icon: <TrendingUp size={11} />,
    dot: "bg-amber-400",
  },
  LOW: {
    label: "LOW",
    color: "text-gray-400",
    bg: "bg-gray-800/20",
    border: "border-gray-700/50",
    icon: <Minus size={11} />,
    dot: "bg-gray-500",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NewsFeed() {
  const { data, isLoading, refetch, isFetching } = useNewsData();
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  const filtered = data?.articles?.filter(
    (a) => filter === "ALL" || a.impactLevel === filter
  );

  return (
    <div className="flex flex-col h-full bg-gray-900/60 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Feed header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Rss size={16} className="text-amber-400" />
          <span className="text-white font-semibold text-sm">Intelligence Feed</span>
          {data?.articles && (
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
              {data.articles.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex gap-1">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                  filter === f
                    ? f === "HIGH"
                      ? "bg-red-900/60 text-red-400 border border-red-800"
                      : f === "MEDIUM"
                      ? "bg-amber-900/60 text-amber-400 border border-amber-800"
                      : f === "LOW"
                      ? "bg-gray-700 text-gray-300 border border-gray-600"
                      : "bg-gray-700 text-white border border-gray-600"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="text-gray-500 hover:text-amber-400 transition-colors"
            title="Refresh news"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Score legend */}
      <div className="px-4 py-2 flex items-center gap-4 border-b border-gray-800/50 flex-shrink-0">
        <span className="text-xs text-gray-500">Impact Score:</span>
        {Object.entries(IMPACT_CONFIG).map(([level, cfg]) => (
          <div key={level} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={cfg.color}>{cfg.label}</span>
            <span className="text-gray-600">
              {level === "HIGH" ? "≥6" : level === "MEDIUM" ? "3–5" : "0–2"}
            </span>
          </div>
        ))}
      </div>

      {/* Articles list */}
      <div className="flex-1 overflow-y-auto space-y-0 divide-y divide-gray-800/50 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No articles found</div>
        ) : (
          filtered?.map((article, i) => {
            const cfg = IMPACT_CONFIG[article.impactLevel];
            return (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block px-4 py-3 hover:bg-gray-800/40 transition-colors group ${
                  i === 0 && article.impactLevel === "HIGH" ? "bg-red-950/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Impact badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}
                    >
                      {cfg.icon}
                      <span className="text-[10px]">{article.impactScore}</span>
                    </div>
                  </div>

                  {/* Article content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-gray-200 group-hover:text-white transition-colors leading-snug line-clamp-2 font-medium">
                      {article.title}
                    </h4>
                    {article.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-600">{article.source}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-600">{timeAgo(article.publishedAt)}</span>
                    </div>
                  </div>

                  {/* External link icon */}
                  <ExternalLink
                    size={12}
                    className="flex-shrink-0 text-gray-700 group-hover:text-gray-400 transition-colors mt-0.5"
                  />
                </div>
              </a>
            );
          })
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-800 flex-shrink-0 text-xs text-gray-500 flex justify-between">
        <span>Ranked by Volatility Impact Score™</span>
        <span>Source: NewsAPI.org</span>
      </div>
    </div>
  );
}
