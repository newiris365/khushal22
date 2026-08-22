"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, Trash2, Scale, 
  IndianRupee, AlertCircle, RefreshCw, Plus, X
} from 'lucide-react';
import { apiGet, apiPut, apiPost } from '../../../../lib/api';

interface StockItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  min_required: number;
  cost_per_unit: number;
}

interface WasteLog {
  id: string;
  item_name: string;
  qty: number;
  unit: string;
  reason: string;
  cost: number;
  logged_at: string;
}

export default function VendorInventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Waste form states
  const [wasteItem, setWasteItem] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('Spoiled');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await apiGet('canteen/inventory');
      if (res.success) {
        setStock(res.stock || []);
        setWasteLogs(res.wasteLogs || []);
        if (res.stock && res.stock.length > 0) {
          setWasteItem(res.stock[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setStock([]);
      setWasteLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (id: string, newQty: number) => {
    const targetQty = Math.max(0, newQty);
    try {
      const res = await apiPut(`canteen/inventory/${id}`, { qty: targetQty });
      if (res.success) {
        setStock(prev => prev.map(s => s.id === id ? { ...s, qty: targetQty } : s));
      }
    } catch (err) {
      setStock(prev => prev.map(s => s.id === id ? { ...s, qty: targetQty } : s));
    }
  };

  const handleReportWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = stock.find(s => s.id === wasteItem);
    const qtyNum = Number(wasteQty);

    if (!targetItem || !qtyNum || qtyNum <= 0) return;

    setActionLoading(true);
    try {
      const res = await apiPost('canteen/inventory/waste', {
        item_id: wasteItem,
        qty: qtyNum,
        reason: wasteReason
      });

      if (res.success) {
        alert(`Reported waste: ${qtyNum}${targetItem.unit} of ${targetItem.name}.`);
        setWasteQty('');
        setWasteReason('Spoiled');
        loadInventory();
      } else {
        alert(res.error || 'Failed to log waste.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error logging waste.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalWasteCost = wasteLogs.reduce((s, w) => s + w.cost, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-[#13102A]/80 border border-white/5 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Kitchen Inventory & Waste Records</h2>
            <p className="text-xs text-[#A78BFA]/70 mt-0.5">Audit raw materials stock, manage thresholds, and log kitchen wastage.</p>
          </div>
        </div>
        <button
          onClick={loadInventory}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#C4B5FD] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <span>Loading inventory database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Columns (2/3 width): Stock Levels Table */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#A78BFA]" /> Raw Material Stocks
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider border-b border-white/5 text-left">
                      <th className="pb-3 font-semibold">Ingredient</th>
                      <th className="pb-3 font-semibold">Available Qty</th>
                      <th className="pb-3 font-semibold">Min Alert Limit</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white">
                    {stock.map(s => {
                      const isLow = s.qty < s.min_required;
                      return (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-bold">{s.name}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={s.qty}
                                onChange={e => handleUpdateStock(s.id, parseFloat(e.target.value) || 0)}
                                className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white w-20"
                              />
                              <span className="text-[10px] text-[#C4B5FD]/60">{s.unit}</span>
                            </div>
                          </td>
                          <td className="py-3 text-[#C4B5FD]/60">{s.min_required} {s.unit}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              isLow ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {isLow ? 'LOW STOCK' : 'IN STOCK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {stock.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500">
                          No stock items registered in inventory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Waste Log Table */}
            <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-400" /> Recent Waste Audit Log</span>
                <span className="text-xs font-normal text-red-400 font-mono">Total Loss: ₹{totalWasteCost}</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider border-b border-white/5 text-left">
                      <th className="pb-3 font-semibold">Item</th>
                      <th className="pb-3 font-semibold">Wasted Qty</th>
                      <th className="pb-3 font-semibold">Reason</th>
                      <th className="pb-3 font-semibold text-right">Est Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white">
                    {wasteLogs.map(w => (
                      <tr key={w.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-bold">{w.item_name}</td>
                        <td className="py-3">{w.qty} {w.unit}</td>
                        <td className="py-3 text-[#C4B5FD]/70">{w.reason}</td>
                        <td className="py-3 text-right font-extrabold text-red-400">₹{w.cost}</td>
                      </tr>
                    ))}
                    {wasteLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500">
                          No waste records logged for current period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Log Waste Form */}
          <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-amber-400" /> Report Spoilage / Waste
            </h3>

            <form onSubmit={handleReportWaste} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#C4B5FD]/50 mb-1">Select Ingredient</label>
                <select
                  value={wasteItem}
                  onChange={e => setWasteItem(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  required
                >
                  <option value="">-- Choose Item --</option>
                  {stock.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.qty} {s.unit} available)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#C4B5FD]/50 mb-1">Wasted Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={wasteQty}
                  onChange={e => setWasteQty(e.target.value)}
                  placeholder="e.g. 1.5"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#C4B5FD]/50 mb-1">Reason for Waste</label>
                <select
                  value={wasteReason}
                  onChange={e => setWasteReason(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Spoiled">Spoiled / Expired</option>
                  <option value="Power Failure">Refrigerator Power Failure</option>
                  <option value="Preparation Overcooking">Preparation Overcooking</option>
                  <option value="Unsold Daily Prepared Food">Unsold Daily Prepared Food</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null} Submit Waste Log Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
