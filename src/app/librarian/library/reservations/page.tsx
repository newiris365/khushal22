"use client";

import React, { useState, useEffect } from 'react';
import { CalendarClock, Search, CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../../lib/api';

export default function LibraryReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await apiGet('library/reservations');
      if (res.success) {
        setReservations(res.reservations || res.data || []);
      } else {
        setHasError(true);
        setReservations([]);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await apiDelete(`library/reservations/${id}`);
      if (res.success) {
        fetchReservations();
      } else {
        alert(res.error || 'Failed to cancel reservation.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error cancelling reservation.');
    }
  };

  const handleFulfill = async (id: string) => {
    try {
      const res = await apiPost(`library/reservations/${id}/fulfill`, {});
      if (res.success) {
        fetchReservations();
      } else {
        alert(res.error || 'Failed to fulfill reservation.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error fulfilling reservation.');
    }
  };

  const filtered = reservations.filter(r => {
    const matchSearch = !searchQuery ||
      r.book_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = reservations.filter(r => r.status === 'pending' || r.status === 'waiting' || r.status === 'notified').length;
  const fulfilledCount = reservations.filter(r => r.status === 'fulfilled').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarClock size={24} className="text-cyan-400" /> Book Reservations
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
          <p className="text-xs text-slate-400">Pending</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-emerald-400">{fulfilledCount}</p>
          <p className="text-xs text-slate-400">Fulfilled</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{reservations.length}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by book or student..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'fulfilled', 'cancelled', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-colors ${filter === f ? 'bg-cyan-600 text-white font-bold' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : hasError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="text-sm font-medium">Couldn't load book reservations</p>
          <button
            onClick={fetchReservations}
            className="inline-flex items-center gap-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CalendarClock size={40} className="mx-auto mb-3 opacity-50" />
          <p>No reservations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{r.book_title || 'Book'}</p>
                  <p className="text-xs text-slate-400">Reserved by: {r.student_name || 'Student'}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Date: {r.reserved_at ? new Date(r.reserved_at).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(r.status === 'pending' || r.status === 'waiting' || r.status === 'notified') && (
                    <>
                      <button
                        onClick={() => handleFulfill(r.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Fulfill
                      </button>
                      <button
                        onClick={() => handleCancel(r.id)}
                        className="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {r.status === 'fulfilled' && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={14} /> Fulfilled
                    </span>
                  )}
                  {(r.status === 'cancelled' || r.status === 'expired') && (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <XCircle size={14} /> {r.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
