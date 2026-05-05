"use client";

import { useState, useEffect } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { Bell, Plus, Trash2, BellRing } from "lucide-react";

interface Alert {
  id: string;
  commodity: "WTI" | "BRENT" | "NATURAL_GAS";
  condition: "above" | "below" | "change_pct";
  threshold: number;
  triggered: boolean;
  triggeredAt?: string;
}

const COMMODITY_LABELS: Record<Alert["commodity"], string> = {
  WTI: "WTI Crude",
  BRENT: "Brent Crude",
  NATURAL_GAS: "Natural Gas",
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function AlertsPanel() {
  const { data } = useMarketData();
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: generateId(), commodity: "WTI", condition: "change_pct", threshold: 3, triggered: false },
    { id: generateId(), commodity: "BRENT", condition: "above", threshold: 90, triggered: false },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState<Omit<Alert, "id" | "triggered">>({
    commodity: "WTI",
    condition: "above",
    threshold: 80,
  });
  const [triggeredAlerts, setTriggeredAlerts] = useState<string[]>([]);

  // Check alerts against live data
  useEffect(() => {
    if (!data) return;

    const prices: Record<Alert["commodity"], { price: number | null; changePct: number | null }> = {
      WTI: { price: data.wti.price, changePct: data.wti.changePct },
      BRENT: { price: data.brent.price, changePct: data.brent.changePct },
      NATURAL_GAS: { price: data.naturalGas.price, changePct: data.naturalGas.changePct },
    };

    setAlerts((prev) =>
      prev.map((alert) => {
        const commodity = prices[alert.commodity];
        let triggered = false;

        if (alert.condition === "above" && commodity.price != null) {
          triggered = commodity.price > alert.threshold;
        } else if (alert.condition === "below" && commodity.price != null) {
          triggered = commodity.price < alert.threshold;
        } else if (alert.condition === "change_pct" && commodity.changePct != null) {
          triggered = Math.abs(commodity.changePct) >= alert.threshold;
        }

        if (triggered && !alert.triggered) {
          setTriggeredAlerts((prev) => [...prev, alert.id]);
          return { ...alert, triggered: true, triggeredAt: new Date().toLocaleTimeString() };
        }

        return { ...alert, triggered };
      })
    );
  }, [data]);

  const addAlert = () => {
    setAlerts((prev) => [...prev, { ...newAlert, id: generateId(), triggered: false }]);
    setShowForm(false);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const activeCount = alerts.filter((a) => a.triggered).length;

  return (
    <div className="flex flex-col h-full bg-gray-900/60 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <BellRing size={16} className="text-red-400 animate-pulse" />
          ) : (
            <Bell size={16} className="text-amber-400" />
          )}
          <span className="text-white font-semibold text-sm">Smart Alerts</span>
          {activeCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              {activeCount} ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded-lg transition-colors font-medium"
        >
          <Plus size={12} />
          New Alert
        </button>
      </div>

      {/* New alert form */}
      {showForm && (
        <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700 flex-shrink-0">
          <div className="text-xs text-gray-400 font-semibold uppercase mb-2">Configure Alert</div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <select
              value={newAlert.commodity}
              onChange={(e) => setNewAlert((p) => ({ ...p, commodity: e.target.value as Alert["commodity"] }))}
              className="bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-amber-500"
            >
              {(["WTI", "BRENT", "NATURAL_GAS"] as Alert["commodity"][]).map((c) => (
                <option key={c} value={c}>{COMMODITY_LABELS[c]}</option>
              ))}
            </select>

            <select
              value={newAlert.condition}
              onChange={(e) => setNewAlert((p) => ({ ...p, condition: e.target.value as Alert["condition"] }))}
              className="bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-amber-500"
            >
              <option value="above">Price above</option>
              <option value="below">Price below</option>
              <option value="change_pct">% change ≥</option>
            </select>

            <div className="flex items-center gap-1">
              <input
                type="number"
                value={newAlert.threshold}
                onChange={(e) => setNewAlert((p) => ({ ...p, threshold: parseFloat(e.target.value) }))}
                className="w-full bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-amber-500"
                placeholder="Value"
              />
              <span className="text-gray-400 text-xs flex-shrink-0">
                {newAlert.condition === "change_pct" ? "%" : "$"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addAlert}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs py-1.5 rounded-lg transition-colors font-semibold"
            >
              Add Alert
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-1.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">
            No alerts configured. Add one above.
          </div>
        ) : (
          alerts.map((alert) => {
            const commodity = COMMODITY_LABELS[alert.commodity];
            const conditionText =
              alert.condition === "above"
                ? `above $${alert.threshold}`
                : alert.condition === "below"
                ? `below $${alert.threshold}`
                : `moves ≥ ${alert.threshold}%`;

            return (
              <div
                key={alert.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  alert.triggered
                    ? "bg-red-900/30 border-red-700/70 shadow-lg shadow-red-900/20"
                    : "bg-gray-800/40 border-gray-700/50"
                }`}
              >
                {/* Status dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    alert.triggered ? "bg-red-400 animate-pulse" : "bg-gray-600"
                  }`}
                />

                {/* Alert info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white">
                    {commodity}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {conditionText}
                  </div>
                  {alert.triggered && alert.triggeredAt && (
                    <div className="text-xs text-red-400 font-semibold mt-0.5">
                      ⚡ Triggered at {alert.triggeredAt}
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <div
                  className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                    alert.triggered
                      ? "bg-red-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {alert.triggered ? "TRIGGERED" : "WATCHING"}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-800 flex-shrink-0 text-xs text-gray-500">
        Alerts check every 60 seconds against live prices
      </div>
    </div>
  );
}
