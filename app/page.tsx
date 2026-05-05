import Header from "@/components/Header";
import PriceChart from "@/components/PriceChart";
import NewsFeed from "@/components/NewsFeed";
import AlertsPanel from "@/components/AlertsPanel";
import GlobeWrapper from "@/components/GlobeWrapper";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950">
      {/* Sticky header with tickers */}
      <Header />

      {/* Main cockpit layout */}
      <main className="flex-1 overflow-hidden p-3 grid grid-cols-12 grid-rows-12 gap-3">
        {/* 3D Globe (left-center, large) */}
        <div className="col-span-7 row-span-7">
          <GlobeWrapper />
        </div>

        {/* Price Chart (right, top) */}
        <div className="col-span-5 row-span-7">
          <PriceChart />
        </div>

        {/* Intelligence Feed (bottom-left) */}
        <div className="col-span-9 row-span-5">
          <NewsFeed />
        </div>

        {/* Smart Alerts (bottom-right) */}
        <div className="col-span-3 row-span-5">
          <AlertsPanel />
        </div>
      </main>
    </div>
  );
}
