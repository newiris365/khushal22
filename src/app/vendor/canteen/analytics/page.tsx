"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Sparkles, AlertTriangle, 
  IndianRupee, ShoppingBag, ArrowUpRight, CloudSun, CalendarCheck, RefreshCw 
} from 'lucide-react';
import { apiGet } from '../../../../lib/api';

const FORECASTS = [
  { day: 'Tomorrow (Thursday)', event: 'Sports Meet Selection', tempFactor: 'High (38°C)', forecast: 'Energy drinks, fresh juices & sandwiches will spike by +45%. Recommended: pre-slice extra 5kg paneer & prep 30 extra juice bottles.', status: 'attention' },
  { day: 'Friday', event: 'Normal Academic Day', tempFactor: 'Mild (32°C)', forecast: 'Stable meal plan lunch volume expected (~120 thalis). Normal raw inventory levels recommended.', status: 'stable' },
  { day: 'Saturday', event: 'Weekend Hostel Special', tempFactor: 'Warm (35°C)', forecast: 'Hostellers stay in. Evening snacks (Pyaz Kachori, samosas) projected to spike +30% around 5 PM. Recommended: increase potato stock by 10kg.', status: 'opportunity' }
];

export default function VendorAnalyticsPage() {
  const [hourlyData, setHourlyData] = useState<{ time: string; orders: number; revenue: number }[]>([]);
  const [forecasts] = useState(FORECASTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiGet('canteen/analytics/hourly');
      if (res.success && res.hourly) {
        setHourlyData(res.hourly);
      } else {
        setHourlyData([]);
      }
    } catch (err) {
      console.error(err);
      setHourlyData([]);
    } finally {
      setLoading(false);
    }
  };

  const maxOrders = Math.max(...hourlyData.map(h => h.orders), 1);
  const totalRev = hourlyData.reduce((s, h) => s + h.revenue, 0);
  const totalOrders = hourlyData.reduce((s, h) => s + h.orders, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-[#13102A]/80 border border-white/5 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Canteen Sales & Demand Forecasts</h2>
            <p className="text-xs text-[#A78BFA]/70 mt-0.5">Track kitchen revenue trends and review predictive inventory insights.</p>
          </div>
        </div>
        <button
          onClick={loadAnalytics}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#C4B5FD] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">Today's Total Sales</div>
          <div className="text-3xl font-black text-white mt-1.5 flex items-center gap-1">
            <IndianRupee className="w-6 h-6 text-[#A78BFA]" />
            {totalRev.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> Realtime Live Aggregation
          </p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">Total Orders Processed</div>
          <div className="text-3xl font-black text-white mt-1.5 flex items-center gap-1.5">
            <ShoppingBag className="w-6 h-6 text-[#A78BFA]" />
            {totalOrders}
          </div>
          <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> Hourly Order Counter
          </p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">Demand Accuracy</div>
          <div className="text-3xl font-black text-white mt-1.5">94.2%</div>
          <p className="text-[10px] text-[#A78BFA]/60 mt-1">Waste reduction optimization index</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Hourly Volume Chart */}
        <div className="lg:col-span-3 glass-panel border border-white/5 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#A78BFA]" /> Today's Hourly Transaction Stream
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-56 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : hourlyData.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500">No transaction data recorded for today yet.</div>
          ) : (
            <div className="flex items-end gap-3 h-56 mt-4">
              {hourlyData.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <span className="text-[8px] font-mono text-[#C4B5FD]/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{h.revenue}
                  </span>
                  <div 
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#6C2BD9] to-[#8B5CF6] group-hover:to-[#A78BFA] transition-all"
                    style={{ height: `${(h.orders / maxOrders) * 120}px`, minHeight: '6px' }}
                  />
                  <span className="text-[9px] font-mono text-[#C4B5FD]/50">{h.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Predictive AI Demand Column */}
        <div className="lg:col-span-2 glass-panel border border-white/5 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> AI Predictive Forecasts
          </h3>

          <div className="space-y-3">
            {forecasts.map((f, i) => (
              <div key={i} className="bg-slate-900/60 border border-white/5 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{f.day}</span>
                  <span className="text-[9px] font-normal text-amber-400">{f.event}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{f.forecast}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
