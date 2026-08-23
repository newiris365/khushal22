"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, CheckCircle2, Volume2, 
  ChefHat, AlertCircle, RefreshCw
} from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';

interface QueueOrder {
  id: string;
  order_number: string;
  token_number: number;
  status: 'Received' | 'Preparing' | 'Ready' | 'Delivered';
  total_amount: number;
  items: { item_name: string; qty: number }[];
  special_instructions?: string;
  created_at: string;
}

export default function VendorQueuePage() {
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [activeCounter, setActiveCounter] = useState('Counter-01');
  const [counterOpen, setCounterOpen] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const prevOrderCountRef = useRef(orders.length);

  const playNewOrderSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadQueue = useCallback(async () => {
    try {
      const res = await apiGet('canteen/orders/queue');
      if (res.success && res.queue) {
        setOrders(res.queue);
        setConnectionError(false);
        if (res.queue.length > prevOrderCountRef.current) {
          playNewOrderSound();
        }
        prevOrderCountRef.current = res.queue.length;
      } else {
        setConnectionError(true);
      }
    } catch (err) {
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const poll = setInterval(() => {
      loadQueue();
    }, 8000);
    return () => clearInterval(poll);
  }, [loadQueue]);

  const [actionError, setActionError] = useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: 'Received' | 'Preparing' | 'Ready' | 'Delivered' = 'Received';
    if (currentStatus === 'Received') nextStatus = 'Preparing';
    else if (currentStatus === 'Preparing') nextStatus = 'Ready';
    else if (currentStatus === 'Ready') nextStatus = 'Delivered';

    setActionError(null);
    try {
      const res = await apiPut(`canteen/orders/${orderId}/status`, { status: nextStatus });
      if (res && res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o).filter(o => o.status !== 'Delivered'));
      } else {
        setActionError(res?.error || 'Could not update order status, please retry.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Could not update order status due to network error, please retry.');
    }
  };

  const receivedOrders = orders.filter(o => o.status === 'Received');
  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Ready');

  return (
    <div className="flex flex-col gap-6">
      {connectionError && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Connection lost to live kitchen feed. Retrying...</span>
          </div>
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
        </div>
      )}

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Upper Status strip */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/25 p-5 rounded-3xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <ChefHat className="text-[#A78BFA] w-5 h-5 animate-pulse" />
            Kitchen Order Stream
          </h2>
          <p className="text-xs text-[#A78BFA]/70 mt-1">
            Active Counter: {activeCounter} | Realtime Socket Broadcast Status Board
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadQueue}
            className="flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-[#C4B5FD]/70 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
          
          <div className="bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-white">Counter Status</span>
            <button 
              onClick={() => setCounterOpen(!counterOpen)}
              className={`w-8 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                counterOpen ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {counterOpen ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <span>Loading order queue...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1: Received */}
          <div className="flex flex-col gap-4 bg-[#13102A]/35 border border-white/5 p-4 rounded-2xl min-h-[500px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Incoming Orders</span>
              <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold px-2 py-0.5 rounded text-[10px]">{receivedOrders.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {receivedOrders.map(order => (
                <div key={order.id} className="glass-panel border border-[#6C2BD9]/15 rounded-xl p-4 space-y-3 hover:border-[#6C2BD9]/45 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-[#A78BFA]">{order.order_number}</span>
                    <span className="text-sm font-extrabold text-white">#{order.token_number}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {order.items.map((it, i) => (
                      <div key={i} className="text-xs text-white">
                        <span className="font-bold text-[#A78BFA]">{it.qty}×</span> {it.item_name}
                      </div>
                    ))}
                  </div>

                  {order.special_instructions && (
                    <p className="text-[10px] text-amber-300 leading-snug bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      📝 {order.special_instructions}
                    </p>
                  )}

                  <button 
                    onClick={() => handleUpdateStatus(order.id, order.status)}
                    className="w-full bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Start Preparation
                  </button>
                </div>
              ))}
              {receivedOrders.length === 0 && (
                <div className="text-center py-10 text-[11px] text-[#C4B5FD]/30">No new incoming orders.</div>
              )}
            </div>
          </div>

          {/* COLUMN 2: Preparing */}
          <div className="flex flex-col gap-4 bg-[#13102A]/35 border border-white/5 p-4 rounded-2xl min-h-[500px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">In Preparation</span>
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">{preparingOrders.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {preparingOrders.map(order => (
                <div key={order.id} className="glass-panel border border-amber-500/20 rounded-xl p-4 space-y-3 hover:border-amber-500/40 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-amber-400">{order.order_number}</span>
                    <span className="text-sm font-extrabold text-white">#{order.token_number}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {order.items.map((it, i) => (
                      <div key={i} className="text-xs text-white">
                        <span className="font-bold text-amber-400">{it.qty}×</span> {it.item_name}
                      </div>
                    ))}
                  </div>

                  {order.special_instructions && (
                    <p className="text-[10px] text-amber-300 leading-snug bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      📝 {order.special_instructions}
                    </p>
                  )}

                  <button 
                    onClick={() => handleUpdateStatus(order.id, order.status)}
                    className="w-full bg-[#8B5CF6] hover:bg-[#A78BFA] text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Order Completed
                  </button>
                </div>
              ))}
              {preparingOrders.length === 0 && (
                <div className="text-center py-10 text-[11px] text-[#C4B5FD]/30">No orders actively in preparation.</div>
              )}
            </div>
          </div>

          {/* COLUMN 3: Ready for Pickup */}
          <div className="flex flex-col gap-4 bg-[#13102A]/35 border border-white/5 p-4 rounded-2xl min-h-[500px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Ready for Pickup</span>
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">{readyOrders.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {readyOrders.map(order => (
                <div key={order.id} className="glass-panel border border-emerald-500/25 rounded-xl p-4 space-y-3 hover:border-emerald-500/50 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-emerald-400">{order.order_number}</span>
                    <span className="text-sm font-extrabold text-white">#{order.token_number}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {order.items.map((it, i) => (
                      <div key={i} className="text-xs text-white">
                        <span className="font-bold text-emerald-400">{it.qty}×</span> {it.item_name}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleUpdateStatus(order.id, order.status)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Pickup
                  </button>
                </div>
              ))}
              {readyOrders.length === 0 && (
                <div className="text-center py-10 text-[11px] text-[#C4B5FD]/30">No orders waiting for pickup.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
