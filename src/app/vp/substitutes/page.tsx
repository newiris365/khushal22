"use client";

import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Clock, Plus, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function SubstitutesPage() {
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [newSubstituteForm, setNewSubstituteForm] = useState({
    timetable_id: '',
    substitute_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, teachersRes] = await Promise.all([
        apiGet('campusCore/timetable/substitutes'),
        apiGet('school/teachers')
      ]);
      if (subsRes.success) setSubstitutes(subsRes.substitutes || []);
      if (teachersRes.success) setAvailableTeachers(teachersRes.teachers || []);
    } catch (err) {
      console.error('Error loading substitutes data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedSub || !selectedTeacherId) return;
    setSubmitting(true);
    try {
      const payload = {
        timetable_id: selectedSub.timetable_id || selectedSub.id,
        substitute_id: selectedTeacherId,
        date: selectedSub.date || new Date().toISOString().split('T')[0]
      };
      const res = await apiPost('campusCore/timetable/substitute', payload);
      if (res.success) {
        alert('Substitute assigned successfully!');
        setShowAssignModal(false);
        setSelectedSub(null);
        setSelectedTeacherId('');
        loadData();
      } else {
        alert(res.error || 'Failed to assign substitute.');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning substitute.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Substitute Scheduler...
        </div>
      </div>
    );
  }

  const unassigned = substitutes.filter(s => !s.substitute_id || s.status === 'Unassigned');
  const confirmed = substitutes.filter(s => s.substitute_id || s.status === 'Confirmed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck size={24} className="text-violet-400" /> Substitute Scheduler
          </h1>
          <p className="text-sm text-[#C4B5FD]/60 mt-1">Manage substitute teacher assignments for absent faculty</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{unassigned.length}</p>
          <p className="text-xs text-yellow-400 font-semibold">Unassigned</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{confirmed.length}</p>
          <p className="text-xs text-emerald-400 font-semibold">Confirmed</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{substitutes.length}</p>
          <p className="text-xs text-slate-400 font-semibold">Total Requests</p>
        </div>
      </div>

      {substitutes.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <UserCheck size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-sm text-slate-300 font-medium">No substitute assignments logged yet.</p>
          <p className="text-xs text-slate-500 mt-1">Pending substitute teacher requests will appear here automatically.</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Substitute Assignments</h3>
            <span className="text-xs text-[#C4B5FD]/60">{substitutes.length} total entries</span>
          </div>
          <div className="divide-y divide-white/5">
            {substitutes.map(s => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                <div>
                  <p className="text-sm text-white font-medium">
                    {s.timetable?.class_name || s.class || 'Class Period'} — {s.timetable?.subject_name || s.subject || 'Subject'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Original: {s.original_teacher?.name || s.originalTeacher || 'Faculty'} ➔ Substitute: <strong className="text-violet-300">{s.substitute_teacher?.name || s.substitute || 'Unassigned'}</strong> · {s.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                    s.substitute_id || s.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {s.substitute_id || s.status === 'Confirmed' ? 'Confirmed' : 'Unassigned'}
                  </span>
                  {(!s.substitute_id && s.status !== 'Confirmed') && (
                    <button
                      onClick={() => { setSelectedSub(s); setShowAssignModal(true); }}
                      className="text-xs px-3 py-1 rounded-lg bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] hover:bg-[#6C2BD9]/30 transition-colors font-medium"
                    >
                      Assign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-bold text-base text-white mb-1">Assign Substitute Teacher</h3>
            <p className="text-xs text-slate-400 mb-4">Select an available faculty member for {selectedSub?.date}</p>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {availableTeachers.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No teachers found in directory.</p>
              ) : (
                availableTeachers.map(t => {
                  const teacherId = t.id || t.users?.id;
                  const teacherName = t.users?.name || t.name || 'Teacher';
                  const isSelected = selectedTeacherId === teacherId;
                  return (
                    <button key={teacherId} onClick={() => setSelectedTeacherId(teacherId)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/50 text-white font-bold'
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/[0.07]'
                      }`}>
                      {teacherName}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleAssign} disabled={!selectedTeacherId || submitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                {submitting ? 'Confirming...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
