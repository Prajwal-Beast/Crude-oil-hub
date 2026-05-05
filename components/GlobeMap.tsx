"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";
import { OIL_HUBS, SUPPLY_ROUTES, HUB_COLORS, type OilHub } from "@/lib/constants";
import { useNewsData } from "@/hooks/useNewsData";
import { X, MapPin, Zap } from "lucide-react";

// Dynamically import Globe to prevent SSR errors (WebGL requires browser)
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface GlobePoint {
  lat: number;
  lng: number;
  name: string;
  type: OilHub["type"];
  description: string;
  country: string;
  dailyOutput?: string;
  color: string;
  altitude: number;
  radius: number;
}

interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  label: string;
  color: string;
}

export default function GlobeMap() {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const { data: newsData } = useNewsData();
  const [selectedHub, setSelectedHub] = useState<GlobePoint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Auto-rotate and initial position
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 30, lng: 30, altitude: 2.0 }, 1000);
    }
  }, []);

  const points: GlobePoint[] = OIL_HUBS.map((hub) => ({
    lat: hub.lat,
    lng: hub.lng,
    name: hub.name,
    type: hub.type,
    description: hub.description,
    country: hub.country,
    dailyOutput: hub.dailyOutput,
    color: HUB_COLORS[hub.type],
    altitude: hub.type === "chokepoint" ? 0.08 : 0.04,
    radius: hub.type === "production" ? 0.6 : hub.type === "chokepoint" ? 0.8 : 0.5,
  }));

  const arcs: ArcData[] = SUPPLY_ROUTES.map((r) => ({
    ...r,
    color: "rgba(251,191,36,0.5)", // amber with transparency
  }));

  const getRelatedNews = useCallback(
    (hubName: string) => {
      if (!newsData?.articles) return [];
      const terms = hubName.toLowerCase().split(" ");
      return newsData.articles
        .filter((a) =>
          terms.some(
            (t) =>
              a.title.toLowerCase().includes(t) ||
              (a.description ?? "").toLowerCase().includes(t)
          )
        )
        .slice(0, 3);
    },
    [newsData]
  );

  const typeLabels: Record<OilHub["type"], string> = {
    production: "Production Basin",
    chokepoint: "Strategic Chokepoint",
    opec: "OPEC+ Member",
    refinery: "Refinery Hub",
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-950 rounded-xl overflow-hidden">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-gray-900/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-700/50">
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Legend</div>
        {Object.entries(HUB_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {typeLabels[type as OilHub["type"]]}
          </div>
        ))}
      </div>

      {/* Hub detail panel */}
      {selectedHub && (
        <div className="absolute top-3 right-3 z-10 w-72 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: HUB_COLORS[selectedHub.type] }}
              >
                {typeLabels[selectedHub.type]}
              </div>
              <h3 className="text-white font-bold text-base leading-tight">{selectedHub.name}</h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                <MapPin size={10} />
                {selectedHub.country}
              </div>
            </div>
            <button
              onClick={() => setSelectedHub(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-gray-300 text-xs leading-relaxed mb-3">{selectedHub.description}</p>

          {selectedHub.dailyOutput && (
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 mb-3">
              <Zap size={12} className="text-amber-400" />
              <span className="text-xs text-gray-400">Volume:</span>
              <span className="text-xs text-amber-300 font-semibold">{selectedHub.dailyOutput}</span>
            </div>
          )}

          {/* Related news */}
          {(() => {
            const related = getRelatedNews(selectedHub.name);
            return related.length > 0 ? (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Related News</div>
                <div className="space-y-2">
                  {related.map((article, i) => (
                    <a
                      key={i}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-sky-400 hover:text-sky-300 transition-colors leading-snug line-clamp-2"
                    >
                      {article.title}
                    </a>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* The Globe */}
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.15}
        // Points
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="radius"
        pointLabel={(d: object) => {
          const p = d as GlobePoint;
          return `<div style="background:#1f2937;border:1px solid #374151;padding:8px 12px;border-radius:8px;font-size:12px;color:#f9fafb;max-width:200px"><strong>${p.name}</strong><br/><span style="color:#9ca3af">${p.country}</span></div>`;
        }}
        onPointClick={(d: object) => setSelectedHub(d as GlobePoint)}
        // Arcs (supply routes)
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude={0.15}
        arcStroke={0.5}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={3000}
        // Auto-rotate
        enablePointerInteraction={true}
      />
    </div>
  );
}
