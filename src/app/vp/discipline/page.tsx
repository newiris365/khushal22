"use client";

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, User, Filter, Plus, X, Loader2, Edit3 } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '../../../lib/api';

export default function DisciplinePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    category: 'Behavioral',
    severity: 'Minor',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [updateNotes, setUpdateNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, studentsRes] = await Promise.all([
        apiGet('school/discipline'),
        apiGet('campusCore/students')
      ]);
      if (incRes.success) setIncidents(incRes.incidents || []);
      if (studentsRes.success) setStudents(studentsRes.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.description) return;
    setSubmitting(true);
    try {
      const res = await apiPost('school/discipline', form);
      if (res.success) {
        alert('Discipline incident recorded successfully!');
        setShowLogModal(false);
        setForm({
          student_id: '',
          category: 'Behavioral',
          severity: 'Minor',
          description: '',
          incident_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        loadData();
      } else {
        alert(res.error || 'Failed to log incident.');
      }
    } catch (err: any) {
      alert(err.message || 'Error logging incident.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setSubmitting(true);
    try {
      const res = await apiPatch(`school/discipline/${id}`, { status: newStatus, notes: updateNotes || undefined });
      if (res.success) {
        alert(`Incident status updated to ${newStatus}`);
        setSelectedIncident(null);
        setUpdateNotes('');
        loadData();
      } else {
        alert(res.error || 'Failed to update incident.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating incident.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'all' 
    ? incidents 
    : incidents.filter(i => 
        i.status?.toLowerCase() === filter.toLowerCase() || 
        i.severity?.toLowerCase() === filter.toLowerCase()
      );

  const getSeverityColor = (s: string) => {
    if (s === 'Severe') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (s === 'Major') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Discipline Incidents...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={24} className="text-violet-400" /> Student Discipline Oversight
          </h1>
          <p className="text-sm text-[#C4B5FD]/60 mt-1">Track and manage student behavioral incidents across the institution</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
              <option value="all">All Incidents</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="severe">Severe</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all"
          >
            <Plus size={14} /> Log Incident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: incidents.length, color: 'text-white' },
          { label: 'Open Incidents', value: incidents.filter(i => i.status === 'Open').length, color: 'text-yellow-400' },
          { label: 'Severe / Major', value: incidents.filter(i => i.severity === 'Severe' || i.severity === 'Major').length, color: 'text-red-400' },
          { label: 'Resolved', value: incidents.filter(i => i.status === 'Resolved').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <Shield size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-sm text-slate-300 font-medium">No discipline records found.</p>
          <p className="text-xs text-slate-500 mt-1">Reported student discipline incidents will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inc, idx) => {
            const studentName = inc.students?.name || 'Student';
            const className = inc.students?.class_name || 'Class';
            const reporterName = inc.reporter?.name || 'Staff Member';

            return (
              <div key={inc.id || idx} className="bg-white/5 rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400 shrink-0">
                      {studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{studentName} <span className="text-xs font-normal text-slate-400">({className})</span></h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Category: <strong className="text-slate-300">{inc.category}</strong> · Reported by {reporterName} · Date: {inc.incident_date}
                      </p>
                      <p className="text-xs text-slate-300 mt-2">{inc.description}</p>
                      {inc.notes && (
                        <p className="text-[11px] text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-lg p-2 mt-2">
                          <strong>Notes:</strong> {inc.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold border ${getSeverityColor(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold ${
                        inc.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                    <button
                      onClick={() => { setSelectedIncident(inc); setUpdateNotes(inc.notes || ''); }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                    >
                      <Edit3 size={11} /> Review
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowLogModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-bold text-base text-white mb-4">Log Discipline Incident</h3>
            <form onSubmit={handleLogIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Select Student</label>
                <select
                  required
                  value={form.student_id}
                  onChange={e => setForm({ ...form, student_id: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_number || s.class_name || 'Student'})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500"
                  >
                    <option value="Behavioral">Behavioral</option>
                    <option value="Academic">Academic</option>
                    <option value="Attendance">Attendance</option>
                    <option value="Property Damage">Property Damage</option>
                    <option value="Bullying">Bullying</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm({ ...form, severity: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Incident Date</label>
                <input
                  type="date"
                  required
                  value={form.incident_date}
                  onChange={e => setForm({ ...form, incident_date: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the incident..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] text-white text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Logging...' : 'Submit Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setSelectedIncident(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-bold text-base text-white mb-2">Review Incident Record</h3>
            <p className="text-xs text-slate-400 mb-4">
              Student: <strong className="text-white">{selectedIncident.students?.name}</strong> · Category: {selectedIncident.category}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Resolution / Action Notes</label>
                <textarea
                  rows={3}
                  value={updateNotes}
                  onChange={e => setUpdateNotes(e.target.value)}
                  placeholder="Add administrative review notes..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => handleUpdateStatus(selectedIncident.id, 'Resolved')}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedIncident.id, 'Open')}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  Mark Open
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
