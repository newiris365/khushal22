"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, AlertCircle, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface StaffLeaveItem {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at?: string;
}

export default function StaffLeavePage() {
  const [leaves, setLeaves] = useState<StaffLeaveItem[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [form, setForm] = useState({
    leave_type: 'Casual Leave',
    from_date: '',
    to_date: '',
    reason: ''
  });

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await apiGet('campusCore/leaves/my-staff');
      if (res.success) {
        setLeaves(res.leaves || []);
        setBalances(res.balances || []);
      } else {
        setHasError(true);
        setLeaves([]);
        setBalances([]);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
      setLeaves([]);
      setBalances([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date || !form.reason) {
      setPostError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setPostError(null);

    try {
      const res = await apiPost('campusCore/leaves/my-staff', form);
      if (res.success) {
        setShowForm(false);
        setForm({ leave_type: 'Casual Leave', from_date: '', to_date: '', reason: '' });
        fetchLeaves();
      } else {
        setPostError(res.error || 'Failed to submit leave application.');
      }
    } catch (err: any) {
      setPostError(err?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle size={12} /> Approved</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1"><Clock size={12} /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar size={24} className="text-blue-400" /> My Leave Applications
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg"
        >
          <Plus size={16} /> Apply for Leave
        </button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { type: 'Casual Leave', total: 12, remaining: 8 },
          { type: 'Medical Leave', total: 10, remaining: 10 },
          { type: 'Earned Leave', total: 15, remaining: 12 }
        ].map((bal, idx) => (
          <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 font-medium">{bal.type}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white">{bal.remaining}</span>
              <span className="text-xs text-slate-500">/ {bal.total} days remaining</span>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Leave Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13102A] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white">New Leave Application</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {postError && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-400">
                {postError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Leave Type</label>
                <select
                  value={form.leave_type}
                  onChange={e => setForm({ ...form, leave_type: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Duty Leave">Duty Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">From Date</label>
                  <input
                    type="date"
                    value={form.from_date}
                    onChange={e => setForm({ ...form, from_date: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">To Date</label>
                  <input
                    type="date"
                    value={form.to_date}
                    onChange={e => setForm({ ...form, to_date: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Reason</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="State the reason for leave..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : null} Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave History List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-sm font-bold text-white mb-4">Leave Application Log</h2>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-blue-400" />
            <span>Loading leave history...</span>
          </div>
        ) : hasError ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 space-y-3">
            <AlertCircle size={32} className="mx-auto text-red-400" />
            <p className="text-sm font-medium">Failed to load leave records.</p>
            <button
              onClick={fetchLeaves}
              className="inline-flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No leave applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase">
                  <th className="pb-3 font-semibold">Leave Type</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold">{l.leave_type}</td>
                    <td className="py-3 text-slate-300">{l.start_date} to {l.end_date}</td>
                    <td className="py-3 text-slate-400">{l.reason}</td>
                    <td className="py-3">{getStatusBadge(l.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
