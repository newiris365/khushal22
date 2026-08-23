"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, Plus, Clock, FileCheck2, AlertCircle, RefreshCw } from 'lucide-react';

interface LeaveApplication {
  id: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
}

export default function EmployeeLeavePortal() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New leave form states
  const [showApply, setShowApply] = useState(false);
  const [formData, setFormData] = useState({
    leave_type_id: '',
    from_date: '',
    to_date: '',
    reason: '',
    substitute_id: ''
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resHistory, resTypes] = await Promise.all([
        fetch('/api/v1/hr/leave/my-history', { headers: getAuthHeaders() }),
        fetch('/api/v1/hr/leave/types', { headers: getAuthHeaders() })
      ]);

      const dataHistory = await resHistory.json();
      const dataTypes = await resTypes.json();

      if (dataHistory.success && dataHistory.leaves) {
        setLeaves(dataHistory.leaves);
      }
      if (dataTypes.success && dataTypes.leaveTypes) {
        setLeaveTypes(dataTypes.leaveTypes);
        if (dataTypes.leaveTypes.length > 0) {
          setFormData(prev => ({ ...prev, leave_type_id: dataTypes.leaveTypes[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leave_type_id) {
      alert('Please select a leave type.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/hr/leave/apply', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          leave_type_id: formData.leave_type_id,
          from_date: formData.from_date,
          to_date: formData.to_date,
          reason: formData.reason
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowApply(false);
        setFormData(prev => ({ ...prev, from_date: '', to_date: '', reason: '' }));
        loadData();
      } else {
        alert(data.error || 'Failed to submit leave application.');
      }
    } catch (err: any) {
      alert('Network error submitting leave application.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">Approved</span>;
      case 'rejected':
        return <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 font-bold">Rejected</span>;
      default:
        return <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">Pending Approval</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link href="/hr/my/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#C4B5FD] hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Leave Management Registry</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">My Leave Requests</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Request leaves of absence, assign substitutions, and check approval workflow logs.
          </p>
        </div>
        <button
          onClick={() => setShowApply(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 border border-[#A78BFA]/20"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading leave history...</p>
        </div>
      ) : (
        <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl overflow-hidden bg-[#13102A]/40">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-extrabold text-sm text-white">Leave Applications Log</h3>
          </div>
          
          <div className="overflow-x-auto">
            {leaves.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#C4B5FD]/50">
                No leave applications recorded. Click "Apply for Leave" to submit a request.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Leave Duration</th>
                    <th className="py-4 px-6">Total Days</th>
                    <th className="py-4 px-6">Reason Description</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Applied Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-xs text-white">
                      <td className="py-4 px-6 font-bold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                        <span>{l.from_date} to {l.to_date}</span>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{l.total_days} Days</td>
                      <td className="py-4 px-6 text-[#C4B5FD]/90 font-medium">{l.reason}</td>
                      <td className="py-4 px-6">{getStatusBadge(l.status)}</td>
                      <td className="py-4 px-6 text-[10px] text-[#C4B5FD]/50 font-mono">
                        {l.applied_at ? new Date(l.applied_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* APPLY DIALOG */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Apply for Leave</h2>
              <button onClick={() => setShowApply(false)} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleApplySubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Leave Type</label>
                <select
                  className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={formData.leave_type_id}
                  onChange={e => setFormData({ ...formData, leave_type_id: e.target.value })}
                >
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">From Date *</label>
                  <input
                    type="date"
                    required
                    className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={formData.from_date}
                    onChange={e => setFormData({ ...formData, from_date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">To Date *</label>
                  <input
                    type="date"
                    required
                    className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={formData.to_date}
                    onChange={e => setFormData({ ...formData, to_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Provide reason detail..."
                  className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-4 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApply(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all"
                >
                  {saving ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
