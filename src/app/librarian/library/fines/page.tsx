"use client";

import React, { useState, useEffect } from 'react';
import { IndianRupee, Search, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function LibraryFinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchFines(); }, []);

  const fetchFines = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await apiGet('library/fines');
      if (res.success) {
        setFines(res.fines || res.data || []);
      } else {
        setHasError(true);
        setFines([]);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
      setFines([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await apiPost(`library/fines/${id}/pay`, { payment_method: 'cash' });
      if (res.success) {
        fetchFines();
      } else {
        alert(res.error || 'Failed to mark fine as paid.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error marking fine as paid.');
    }
  };

  const filtered = fines.filter(f => {
    const matchSearch = !searchQuery ||
      f.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.book_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === 'all' || f.status === filter;
    return matchSearch && matchFilter;
  });

  const totalUnpaid = fines.filter(f => f.status === 'unpaid').reduce((acc, f) => acc + (f.amount || 0), 0);
  const totalPaid = fines.filter(f => f.status === 'paid').reduce((acc, f) => acc + (f.amount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <IndianRupee size={24} className="text-cyan-400" /> Fine Management
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-amber-400">₹{totalUnpaid}</p>
          <p className="text-xs text-slate-400">Unpaid</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-emerald-400">₹{totalPaid}</p>
          <p className="text-xs text-slate-400">Collected</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{fines.length}</p>
          <p className="text-xs text-slate-400">Total Fines</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student or reason..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'unpaid', 'paid'].map(f => (
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
          <p className="text-sm font-medium">Couldn't load fine records</p>
          <button
            onClick={fetchFines}
            className="inline-flex items-center gap-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <IndianRupee size={40} className="mx-auto mb-3 opacity-50" />
          <p>No fines found. Library is in good standing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{f.student_name || 'Student'}</p>
                  <p className="text-xs text-slate-400">{f.reason || 'Overdue return'} · {f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}</p>
                  {f.book_title && (
                    <p className="text-xs text-slate-500">Book: {f.book_title}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-amber-400">₹{f.amount || 0}</span>
                  {f.status === 'unpaid' ? (
                    <button
                      onClick={() => handleMarkPaid(f.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Mark Paid
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={14} /> Paid
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
