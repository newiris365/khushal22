"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Eye, BarChart3, Star, User, ChevronDown, ChevronUp, Sparkles, Loader2, X } from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

interface Appraisal {
  id: string;
  employee_name: string;
  department: string;
  designation: string;
  self_rating: number;
  hod_rating: number | null;
  vp_rating: number | null;
  status: string;
  self_comments: string;
  hod_comments: string;
  vp_comments: string;
  cycle_name: string;
}

export default function VicePrincipalAppraisalsPage() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<{ id: string; rating: number; comments: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('hr/appraisal/cycles');
      if (res.success && Array.isArray(res.cycles)) {
        const list: Appraisal[] = [];
        res.cycles.forEach((cycle: any) => {
          (cycle.appraisals || []).forEach((a: any) => {
            list.push({
              id: a.id,
              employee_name: a.employee_name || a.users?.name || 'Staff Member',
              department: a.department || 'General',
              designation: a.designation || 'Faculty',
              self_rating: a.self_score || a.self_rating || 4,
              hod_rating: a.hod_score || a.hod_rating || null,
              vp_rating: a.vp_score || a.vp_rating || null,
              status: a.status || 'pending_vp',
              self_comments: a.self_comments || '',
              hod_comments: a.hod_comments || '',
              vp_comments: a.vp_comments || '',
              cycle_name: cycle.name || 'Annual Review'
            });
          });
        });
        setAppraisals(list);
      } else {
        setAppraisals([]);
      }
    } catch (err) {
      console.error(err);
      setAppraisals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleVpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm) return;
    setSaving(true);
    try {
      const res = await apiPut(`hr/appraisal/${reviewForm.id}/vp-review`, {
        vp_score: reviewForm.rating,
        vp_rating: reviewForm.rating,
        vp_comments: reviewForm.comments
      });
      if (res.success) {
        alert('VP appraisal review submitted successfully!');
        setReviewForm(null);
        loadData();
      } else {
        alert(res.error || 'Failed to submit VP review.');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting VP review.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'finalized':
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Finalized</span>;
      case 'pending_principal':
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">VP Reviewed (Pending Principal)</span>;
      default:
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Awaiting VP Review</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Vice Principal Appraisals...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={24} className="text-violet-400" /> Faculty Appraisals Oversight
          </h1>
          <p className="text-sm text-[#C4B5FD]/60 mt-1">Review faculty self-assessments & HOD evaluations before Principal finalization</p>
        </div>
        <button onClick={loadData} className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{appraisals.length}</p>
          <p className="text-xs text-slate-400 font-semibold">Total Submissions</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-yellow-400">{appraisals.filter(a => !a.vp_rating).length}</p>
          <p className="text-xs text-yellow-400 font-semibold">Pending VP Review</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-emerald-400">{appraisals.filter(a => a.vp_rating).length}</p>
          <p className="text-xs text-emerald-400 font-semibold">VP Reviewed</p>
        </div>
      </div>

      {appraisals.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <BarChart3 size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-sm text-slate-300 font-medium">No performance appraisals pending VP review.</p>
          <p className="text-xs text-slate-500 mt-1">Appraisal submission cycles initiated by HR will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appraisals.map(a => (
            <div key={a.id} className="bg-white/5 rounded-xl border border-white/10 p-4 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{a.employee_name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.designation} · {a.department} · {a.cycle_name}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-300">Self Rating: <strong>{a.self_rating}/5</strong></span>
                    {a.hod_rating && <span className="text-xs text-slate-300">HOD Rating: <strong>{a.hod_rating}/5</strong></span>}
                    {a.vp_rating && <span className="text-xs text-violet-300 font-bold">VP Rating: {a.vp_rating}/5</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(a.status)}
                  {!a.vp_rating && (
                    <button
                      onClick={() => setReviewForm({ id: a.id, rating: 4, comments: '' })}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-[#8B5CF6] text-white text-xs font-bold shadow-md shadow-violet-600/20"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setReviewForm(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-bold text-base text-white mb-2">Submit Vice Principal Review</h3>
            <form onSubmit={handleVpSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">VP Rating Score (1 - 5)</label>
                <select
                  value={reviewForm.rating}
                  onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500"
                >
                  <option value={5}>5 - Outstanding</option>
                  <option value={4}>4 - Exceeds Expectations</option>
                  <option value={3}>3 - Meets Expectations</option>
                  <option value={2}>2 - Needs Improvement</option>
                  <option value={1}>1 - Unsatisfactory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Vice Principal Remarks & Evaluation</label>
                <textarea
                  required
                  rows={4}
                  value={reviewForm.comments}
                  onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })}
                  placeholder="Provide evaluation notes regarding academic performance, leadership, and conduct..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewForm(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] text-white text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit VP Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
