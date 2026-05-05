"use client";

import dynamic from "next/dynamic";

const GlobeMap = dynamic(() => import("@/components/GlobeMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900/60 rounded-xl border border-gray-700/50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading Globe...</p>
      </div>
    </div>
  ),
});

export default function GlobeWrapper() {
  return <GlobeMap />;
}
