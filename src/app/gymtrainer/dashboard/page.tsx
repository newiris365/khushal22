"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Dumbbell, Users, Calendar, Clock, ChevronRight, RefreshCw, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { apiGet } from '@/lib/api';

interface GymSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  slot_type: string;
  is_cancelled?: boolean;
}

export default function GymTrainerDashboard() {
  const [slots, setSlots] = useState<GymSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet('/fitzone/gym/slots');
      if (res.success && Array.isArray(res.slots)) {
        setSlots(res.slots);
      } else {
        setError(res.error || 'Failed to load gym slots.');
      }
    } catch {
      setError('Connection error while fetching gym slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const todaySlots = slots.filter(s => s.date === todayStr);
  const upcomingSlots = slots.filter(s => s.date !== todayStr);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-white">
      {/* Header */}
      <div className="bg-[#13102A]/85 backdrop-blur-md p-6 rounded-3xl border border-[#10B981]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-[#10B981]" />
            Gym Trainer Operations
          </h1>
          <p className="text-[#10B981]/70 mt-1 text-sm">
            Monitor daily gym slots, manage student check-ins, run virtual classes & log fitness metrics.
          </p>
        </div>
        <button
          onClick={fetchSlots}
          className="px-4 py-2 bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/40 text-[#10B981] font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Schedule
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Today's Slots Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Today&apos;s Gym Slots ({todayStr})
          </h2>
          <span className="text-xs font-mono text-emerald-400/60 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {todaySlots.length} Slots Scheduled
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-emerald-400/60 flex items-center justify-center gap-2 bg-[#13102A]/40 rounded-3xl border border-white/5">
            <RefreshCw className="w-5 h-5 animate-spin" /> Loading today&apos;s slots...
          </div>
        ) : todaySlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {todaySlots.map((slot) => {
              const occupancyPc = Math.min(100, Math.round((slot.booked_count / slot.capacity) * 100));
              return (
                <div
                  key={slot.id}
                  className={`bg-[#13102A]/60 backdrop-blur-md rounded-2xl border p-5 flex flex-col justify-between transition-all hover:border-[#10B981]/50 ${
                    slot.is_cancelled ? 'border-rose-500/30 bg-rose-950/10' : 'border-[#10B981]/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                        {slot.slot_type}
                      </span>
                      {slot.is_cancelled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Cancelled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-lg font-bold text-white">
                      <Clock className="w-5 h-5 text-[#10B981]" />
                      {slot.start_time} - {slot.end_time}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white/60">Booked Capacity</span>
                        <span className="font-mono text-emerald-400">{slot.booked_count} / {slot.capacity}</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            occupancyPc >= 90 ? 'bg-amber-400' : 'bg-[#10B981]'
                          }`}
                          style={{ width: `${occupancyPc}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-5">
                    <Link
                      href={`/gymtrainer/slots/${slot.id}`}
                      className="w-full py-2.5 bg-[#10B981]/20 hover:bg-[#10B981] text-[#10B981] hover:text-white font-bold rounded-xl border border-[#10B981]/30 transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      View Roster & Check In <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-white/50 bg-[#13102A]/40 rounded-3xl border border-white/5">
            No gym slots found for today. View all upcoming slots below.
          </div>
        )}
      </div>

      {/* All / Upcoming Slots Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white/90">All Scheduled Gym Slots</h2>
        {slots.length > 0 ? (
          <div className="bg-[#13102A]/50 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-emerald-400/70 bg-[#0D0A1A]/30">
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Timing</th>
                    <th className="py-3.5 px-6">Slot Type</th>
                    <th className="py-3.5 px-6">Bookings / Capacity</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {slots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white">{slot.date}</td>
                      <td className="py-4 px-6 font-semibold">{slot.start_time} - {slot.end_time}</td>
                      <td className="py-4 px-6 uppercase text-[10px] font-bold text-emerald-400">{slot.slot_type}</td>
                      <td className="py-4 px-6 font-mono">{slot.booked_count} / {slot.capacity}</td>
                      <td className="py-4 px-6">
                        {slot.is_cancelled ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400">Cancelled</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">Active</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/gymtrainer/slots/${slot.id}`}
                          className="px-3 py-1.5 bg-[#10B981]/20 hover:bg-[#10B981] text-[#10B981] hover:text-white font-bold rounded-lg transition-all text-[11px] inline-flex items-center gap-1"
                        >
                          View Roster <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="p-8 text-center text-xs text-white/50 bg-[#13102A]/40 rounded-3xl border border-white/5">
              No gym slots created yet.
            </div>
          )
        )}
      </div>
    </div>
  );
}
