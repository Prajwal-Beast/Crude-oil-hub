"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";
import { OIL_HUBS, SUPPLY_ROUTES, HUB_COLORS, type OilHub } from "@/lib/constants";
import { useNewsData } from "@/hooks/useNewsData";
import { X, MapPin, Zap, Globe2 } from "lucide-react";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// ── Types ────────────────────────────────────────────────────────────────────
interface GlobePoint {
  lat: number; lng: number; name: string; type: OilHub["type"];
  description: string; country: string; dailyOutput?: string;
  color: string;
}

interface RingPoint {
  lat: number; lng: number; color: string; maxR: number; speed: number;
}

interface ArcData {
  startLat: number; startLng: number; endLat: number; endLng: number;
  label: string;
}

// ── Colour helpers ───────────────────────────────────────────────────────────
// ring color is a fn (t: 0→1) → rgba — fades out as ring expands
function ringColor(baseHex: string) {
  const r = parseInt(baseHex.slice(1, 3), 16);
  const g = parseInt(baseHex.slice(3, 5), 16);
  const b = parseInt(baseHex.slice(5, 7), 16);
  return () => (t: number) => `rgba(${r},${g},${b},${Math.max(0, 1 - t)})`;
}

const TYPE_LABELS: Record<OilHub["type"], string> = {
  production: "Production Basin",
  chokepoint: "Strategic Chokepoint",
  opec: "OPEC+ Member",
  refinery: "Refinery Hub",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function GlobeMap() {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const { data: newsData } = useNewsData();
  const [selected, setSelected] = useState<GlobePoint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Responsive sizing
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Initial camera + auto-rotate setup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!globeEl.current) return;
      globeEl.current.pointOfView({ lat: 25, lng: 30, altitude: 2.2 }, 1500);
      const controls = globeEl.current.controls() as { autoRotate: boolean; autoRotateSpeed: number };
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.4;
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Points (small glowing dots)
  const points: GlobePoint[] = OIL_HUBS.map((h) => ({
    lat: h.lat, lng: h.lng, name: h.name, type: h.type,
    description: h.description, country: h.country,
    dailyOutput: h.dailyOutput, color: HUB_COLORS[h.type],
  }));

  // Rings — pulsing halos on every hub
  const rings: RingPoint[] = OIL_HUBS.map((h) => ({
    lat: h.lat, lng: h.lng,
    color: HUB_COLORS[h.type],
    maxR: h.type === "chokepoint" ? 6 : h.type === "production" ? 5 : 4,
    speed: h.type === "chokepoint" ? 2.5 : 2,
  }));

  // Arcs — animated supply routes
  const arcs: ArcData[] = SUPPLY_ROUTES.map((r) => ({ ...r }));

  const getRelatedNews = useCallback(
    (name: string) => {
      if (!newsData?.articles) return [];
      const terms = name.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
      return newsData.articles
        .filter((a) =>
          terms.some(
            (t) =>
              a.title.toLowerCase().includes(t) ||
              (a.description ?? "").toLowerCase().includes(t)
          )
        )
        .slice(0, 4);
    },
    [newsData]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-xl overflow-hidden bg-[#030712]">

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 space-y-1.5">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Globe2 size={10} />Map Legend
        </div>
        {(Object.entries(HUB_COLORS) as [OilHub["type"], string][]).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-[11px] text-gray-300">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ backgroundColor: color }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: color }}
              />
            </span>
            {TYPE_LABELS[type]}
          </div>
        ))}
      </div>

      {/* Auto-rotate toggle */}
      <button
        onClick={() => {
          const next = !autoRotate;
          setAutoRotate(next);
          const controls = globeEl.current?.controls() as { autoRotate: boolean } | undefined;
          if (controls) controls.autoRotate = next;
        }}
        className={`absolute bottom-3 left-3 z-10 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
          autoRotate
            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
            : "bg-white/5 border-white/10 text-gray-400"
        }`}
      >
        {autoRotate ? "⟳ Rotating" : "⟳ Paused"}
      </button>

      {/* Selected hub panel */}
      {selected && (
        <div className="absolute top-3 right-3 z-10 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: HUB_COLORS[selected.type] }}
              >
                {TYPE_LABELS[selected.type]}
              </div>
              <h3 className="text-white font-bold text-[15px] leading-tight">{selected.name}</h3>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                <MapPin size={9} />{selected.country}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white p-1 transition-colors">
              <X size={14} />
            </button>
          </div>

          <p className="text-gray-300 text-xs leading-relaxed mb-3">{selected.description}</p>

          {selected.dailyOutput && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3 border"
              style={{ backgroundColor: `${HUB_COLORS[selected.type]}15`, borderColor: `${HUB_COLORS[selected.type]}40` }}
            >
              <Zap size={11} style={{ color: HUB_COLORS[selected.type] }} />
              <span className="text-[11px] text-gray-400">Volume:</span>
              <span className="text-[11px] font-bold" style={{ color: HUB_COLORS[selected.type] }}>
                {selected.dailyOutput}
              </span>
            </div>
          )}

          {(() => {
            const related = getRelatedNews(selected.name);
            return related.length > 0 ? (
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Related News</div>
                <div className="space-y-1.5">
                  {related.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[11px] text-sky-400 hover:text-sky-300 leading-snug line-clamp-2 transition-colors"
                    >
                      {a.title}
                    </a>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ── The Globe ─────────────────────────────────────────────────────── */}
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"

        // Earth textures — full color blue marble
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

        // Atmosphere — vivid deep-blue glow
        showAtmosphere={true}
        atmosphereColor="#1d4ed8"
        atmosphereAltitude={0.18}

        // ── Small glowing core dots ──────────────────────────────────────
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius={0.35}
        pointLabel={(d: object) => {
          const p = d as GlobePoint;
          return `<div style="background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.15);padding:6px 10px;border-radius:8px;font-size:12px;color:#f9fafb;pointer-events:none"><strong>${p.name}</strong><br/><span style="color:#9ca3af;font-size:11px">${p.country}</span></div>`;
        }}
        onPointClick={(d: object) => setSelected(d as GlobePoint)}

        // ── Pulsing rings ───────────────────────────────────────────────
        ringsData={rings}
        ringLat={(d: object) => (d as RingPoint).lat}
        ringLng={(d: object) => (d as RingPoint).lng}
        ringColor={(d: object) => ringColor((d as RingPoint).color)()}
        ringMaxRadius={(d: object) => (d as RingPoint).maxR}
        ringPropagationSpeed={(d: object) => (d as RingPoint).speed}
        ringRepeatPeriod={1200}
        ringAltitude={0.005}

        // ── Animated supply route arcs ──────────────────────────────────
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={() => ["rgba(251,191,36,0.0)", "rgba(251,191,36,0.8)", "rgba(251,191,36,0.0)"]}
        arcAltitude={0.2}
        arcStroke={0.4}
        arcDashLength={0.3}
        arcDashGap={0.15}
        arcDashAnimateTime={2500}

        enablePointerInteraction={true}
        onGlobeClick={() => {
          const controls = globeEl.current?.controls() as { autoRotate: boolean } | undefined;
          if (controls) controls.autoRotate = autoRotate;
        }}
      />
    </div>
  );
}
