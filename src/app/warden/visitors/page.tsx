"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, Plus, LogOut, Check, X, AlertCircle, RefreshCw
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  relation: string;
  visit_purpose: string;
  approval_status?: string;
  status?: string;
  is_approved?: boolean;
  expected_time?: string;
  in_time?: string;
  out_time?: string;
  gate_pass_id?: string;
  students?: { users?: { full_name: string }; name?: string; roll_number: string };
  hostel_rooms?: { room_number: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
  inside: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-slate-500/20 text-slate-400',
  expired: 'bg-slate-500/20 text-slate-400',
};

export default function WardenVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const [form, setForm] = useState({
    student_id: '',
    visitor_name: '',
    visitor_phone: '',
    visitor_id_type: 'Aadhaar',
    visitor_id_number: '',
    purpose: '',
    relation: ''
  });

  const [message, setMessage] = useState<string | null>(null);

  const fetchVisitors = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await apiGet('hostel/visitors');
      if (res.success) {
        setVisitors(res.visitors || res.data || []);
      } else {
        setHasError(true);
        setVisitors([]);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
      setVisitors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchVisitors(); }, []);

  const handleApprove = async (id: string, approve: boolean) => {
    setActionLoading(true);
    try {
      const res = await apiPost(`hostel/visitors/${id}/approve`, { approve });
      if (res.success) {
        setMessage(approve ? 'Visitor pass approved.' : 'Visitor pass rejected.');
        fetchVisitors();
      } else {
        // Fallback to campusCore route if needed
        const fallbackRes = await apiPut(`campusCore/hostel/visitors/${id}/approve`, { approve });
        if (fallbackRes.success) {
          setMessage(approve ? 'Visitor pass approved.' : 'Visitor pass rejected.');
          fetchVisitors();
        } else {
          alert(res.error || 'Failed to update visitor pass status.');
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckin = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiPost(`hostel/visitors/${id}/checkin`, {});
      if (res.success) {
        setMessage('Visitor checked in successfully.');
        fetchVisitors();
      } else {
        alert(res.error || 'Failed to check in visitor.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error checking in visitor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiPost(`hostel/visitors/${id}/checkout`, {});
      if (res.success) {
        setMessage('Visitor checked out successfully.');
        fetchVisitors();
      } else {
        alert(res.error || 'Failed to check out visitor.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error checking out visitor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitor_name || !form.student_id) return;
    setActionLoading(true);
    try {
      const res = await apiPost('hostel/visitors', form);
      if (res.success) {
        setMessage('Visitor registered successfully!');
        setShowRegisterForm(false);
        setForm({ student_id: '', visitor_name: '', visitor_phone: '', visitor_id_type: 'Aadhaar', visitor_id_number: '', purpose: '', relation: '' });
        fetchVisitors();
      } else {
        alert(res.error || 'Failed to register visitor.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error registering visitor.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = visitors.filter(v => {
    if (statusFilter === 'all') return true;
    const currentStatus = v.approval_status || v.status || 'pending';
    return currentStatus === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} className="text-emerald-400" />
          Visitor Approvals & Pass Control
        </h1>
        <button
          onClick={() => setShowRegisterForm(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Plus size={16} /> Register Visitor Pass
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
      )}

      {/* Register Form */}
      {showRegisterForm && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Register Main Gate Visitor Pass</h3>
            <button onClick={() => setShowRegisterForm(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
          </div>
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={form.student_id}
                onChange={e => setForm({ ...form, student_id: e.target.value })}
                placeholder="Student ID / Roll No"
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                required
              />
              <input
                type="text"
                value={form.visitor_name}
                onChange={e => setForm({ ...form, visitor_name: e.target.value })}
                placeholder="Visitor Full Name"
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                required
              />
              <input
                type="text"
                value={form.visitor_phone}
                onChange={e => setForm({ ...form, visitor_phone: e.target.value })}
                placeholder="Visitor Phone Number"
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={form.visitor_id_type}
                onChange={e => setForm({ ...form, visitor_id_type: e.target.value })}
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
              </select>
              <input
                type="text"
                value={form.visitor_id_number}
                onChange={e => setForm({ ...form, visitor_id_number: e.target.value })}
                placeholder="ID Proof Number"
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                required
              />
              <input
                type="text"
                value={form.relation}
                onChange={e => setForm({ ...form, relation: e.target.value })}
                placeholder="Relation (Parent, Relative...)"
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <input
              type="text"
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              placeholder="Purpose of Visit"
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Submit Gate Pass
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {['all', 'pending', 'approved', 'inside', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-xs capitalize transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white font-bold' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : hasError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="text-sm font-medium">Couldn't load visitor applications</p>
          <button
            onClick={fetchVisitors}
            className="inline-flex items-center gap-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p>No visitor requests in this status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const statusKey = v.approval_status || v.status || 'pending';
            return (
              <div key={v.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {v.visitor_name?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{v.visitor_name}</p>
                      <p className="text-xs text-slate-400">
                        {v.relation || 'Visitor'} — Host: {v.students?.users?.full_name || v.students?.name || 'Student'} ({v.students?.roll_number || '—'})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[statusKey] || 'bg-slate-500/20 text-slate-400'}`}>
                      {statusKey}
                    </span>
                  </div>
                </div>

                {expandedId === v.id && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div><p className="text-slate-400">Phone</p><p className="text-white font-medium">{v.visitor_phone || '—'}</p></div>
                      <div><p className="text-slate-400">Purpose</p><p className="text-white font-medium">{v.visit_purpose || '—'}</p></div>
                      <div><p className="text-slate-400">Gate Pass ID</p><p className="text-emerald-400 font-mono font-bold">{v.gate_pass_id || v.id.slice(0, 8)}</p></div>
                      <div><p className="text-slate-400">Room</p><p className="text-white font-medium">{v.hostel_rooms?.room_number || '—'}</p></div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                      {(statusKey === 'pending' || statusKey === 'requested') && (
                        <>
                          <button
                            onClick={() => handleApprove(v.id, true)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <Check size={14} /> Approve Pass
                          </button>
                          <button
                            onClick={() => handleApprove(v.id, false)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <X size={14} /> Reject Pass
                          </button>
                        </>
                      )}

                      {(statusKey === 'approved') && (
                        <button
                          onClick={() => handleCheckin(v.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Clock size={14} /> Gate Check-In
                        </button>
                      )}

                      {(statusKey === 'inside') && (
                        <button
                          onClick={() => handleCheckout(v.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <LogOut size={14} /> Gate Check-Out
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
