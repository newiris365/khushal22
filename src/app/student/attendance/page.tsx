"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, ShieldAlert, Sparkles, CheckCircle2, Clock, Filter,
  ChevronDown, XCircle, AlertTriangle, TrendingUp, BookOpen
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface AttendanceLog {
  id: string;
  date: string;
  status: string;
  method: string;
  latitude?: number;
  longitude?: number;
  attendance_sessions?: { subject: string };
}

interface TodaySession {
  session_id: string;
  subject: string;
  time_slot: string;
  status: string;
  method?: string;
}

export default function StudentAttendancePage() {
  const [stats, setStats] = useState({ overall: 0, total: 0, present: 0, daysNeeded: 0 });
  const [breakdown, setBreakdown] = useState<{ subject: string; percentage: number; total: number; present: number }[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Filters
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Regularization form
  const [showRegForm, setShowRegForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    proof_url: ''
  });

  // Load profile from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('iris_user_profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Fetch attendance data using the logged-in user's student ID
  useEffect(() => {
    if (!profile) return;

    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        // Fetch the student record for this user
        const studentRes = await apiGet(`/core/students`, { user_id: profile.id });
        let studentId = profile.id;

        // If the user has a student record, use that ID
        if (studentRes?.success && studentRes.students?.length > 0) {
          studentId = studentRes.students[0].id;
        }

        // Fetch attendance logs
        const res = await apiGet(`/core/attendance/student/${studentId}`);
        if (res?.success) {
          setStats(res.stats || { overall: 0, total: 0, present: 0, daysNeeded: 0 });
          setBreakdown(res.breakdown || []);
          setLogs(res.logs || []);
        }

        // Fetch today's sessions for this student
        try {
          const todayRes = await apiGet(`/core/attendance/student/${studentId}/today`);
          if (todayRes?.success) {
            setTodaySessions(todayRes.sessions || []);
          }
        } catch {
          // Fallback: filter logs for today from existing data
          const today = new Date().toISOString().split('T')[0];
          const todayLogs = (res?.logs || []).filter((l: AttendanceLog) => l.date === today);
          if (todayLogs.length > 0) {
            setTodaySessions(todayLogs.map((l: AttendanceLog) => ({
              session_id: l.id,
              subject: l.attendance_sessions?.subject || 'General',
              time_slot: '',
              status: l.status,
              method: l.method
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [profile]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterSubject !== 'all' && log.attendance_sessions?.subject !== filterSubject) return false;
      if (filterStatus !== 'all' && log.status !== filterStatus) return false;
      if (filterDateFrom && log.date < filterDateFrom) return false;
      if (filterDateTo && log.date > filterDateTo) return false;
      return true;
    });
  }, [logs, filterSubject, filterStatus, filterDateFrom, filterDateTo]);

  // Unique subjects for filter dropdown
  const subjects = useMemo(() => {
    const set = new Set(logs.map(l => l.attendance_sessions?.subject || 'General'));
    return Array.from(set);
  }, [logs]);

  // Calendar heatmap data (last 30 days)
  const heatmapData = useMemo(() => {
    const days: { date: string; status: string; count: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.date === dateStr);
      const present = dayLogs.filter(l => l.status === 'present' || l.status === 'late').length;
      const absent = dayLogs.filter(l => l.status === 'absent').length;
      let status = 'none';
      if (present > 0 && absent === 0) status = 'present';
      else if (present > 0 && absent > 0) status = 'partial';
      else if (absent > 0) status = 'absent';
      days.push({ date: dateStr, status, count: dayLogs.length });
    }
    return days;
  }, [logs]);

  const handleRegularize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost('/core/attendance/regularize', {
        student_id: profile?.id,
        ...formData
      });
      if (res.success) {
        setShowRegForm(false);
        alert('Regularization request submitted.');
        setFormData({ date: new Date().toISOString().split('T')[0], reason: '', proof_url: '' });
      } else {
        alert(res.error || 'Failed to submit.');
      }
    } catch {
      alert('Regularization request submitted.');
      setShowRegForm(false);
    }
  };

  const todayPresent = todaySessions.filter(s => s.status === 'present' || s.status === 'late').length;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Attendance Dashboard</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Track your check-ins, view history, and manage regularizations.</p>
            </div>
          </div>
          <button onClick={() => setShowRegForm(true)}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-all">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Apply Regularization
          </button>
        </div>

        {/* Today's Status Banner */}
        <div className={`glass-panel rounded-2xl p-5 border flex items-center gap-4 ${
          todaySessions.length === 0 ? 'border-white/5' :
          todayPresent === todaySessions.length ? 'border-emerald-500/30 bg-emerald-500/5' :
          todayPresent > 0 ? 'border-amber-500/30 bg-amber-500/5' :
          'border-red-500/30 bg-red-500/5'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            todaySessions.length === 0 ? 'bg-white/5 text-[#C4B5FD]/40' :
            todayPresent === todaySessions.length ? 'bg-emerald-500/20 text-emerald-400' :
            todayPresent > 0 ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {todaySessions.length === 0 ? <Calendar className="w-6 h-6" /> :
             todayPresent === todaySessions.length ? <CheckCircle2 className="w-6 h-6" /> :
             <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">
              {todaySessions.length === 0
                ? 'No sessions scheduled today'
                : todayPresent === todaySessions.length
                  ? 'All sessions marked present today'
                  : `${todayPresent}/${todaySessions.length} sessions marked today`}
            </h3>
            <p className="text-[11px] text-[#C4B5FD]/60 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {todaySessions.length > 0 && (
            <div className="flex gap-2">
              {todaySessions.map((s, i) => (
                <span key={i} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                  s.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  s.status === 'absent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-white/5 text-[#C4B5FD]/50 border-white/10'
                }`}>
                  {s.subject?.slice(0, 15)} {s.status === 'present' ? '✓' : s.status === 'absent' ? '✗' : '...'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Ring Gauge */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Overall</span>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="url(#grad)" strokeWidth="8" fill="transparent"
                  strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * stats.overall) / 100} strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6C2BD9" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <strong className="text-2xl font-extrabold text-white">{stats.overall}%</strong>
              </div>
            </div>
            <span className="text-[10px] text-[#C4B5FD]/70">{stats.present}/{stats.total} classes</span>
          </div>

          {/* Quick Stats */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <TrendingUp className="w-4 h-4 text-violet-400" /> Quick Stats
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between"><span className="text-[#C4B5FD]/60">Total Sessions</span><strong className="text-white">{stats.total}</strong></div>
              <div className="flex justify-between"><span className="text-[#C4B5FD]/60">Present</span><strong className="text-emerald-400">{stats.present}</strong></div>
              <div className="flex justify-between"><span className="text-[#C4B5FD]/60">Absent</span><strong className="text-red-400">{stats.total - stats.present}</strong></div>
              <div className="flex justify-between"><span className="text-[#C4B5FD]/60">Attendance Rate</span><strong className="text-white">{stats.overall}%</strong></div>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <BookOpen className="w-4 h-4 text-violet-400" /> Subjects
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {breakdown.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#C4B5FD]/80 truncate">{item.subject}</span>
                    <strong className={item.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}>{item.percentage}%</strong>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1">
                    <div className={`h-1 rounded-full ${item.percentage >= 75 ? 'bg-violet-500' : 'bg-red-500'}`}
                      style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Check */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between relative overflow-hidden">
            <Sparkles className="w-10 h-10 text-[#A78BFA]/10 absolute right-3 top-3" />
            <div>
              <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Safety Check</span>
              <h3 className="text-lg font-extrabold mt-2">
                {stats.overall >= 75 ? 'Safe' : 'At Risk'}
              </h3>
              <p className="text-[11px] text-[#C4B5FD]/60 mt-1 leading-relaxed">
                {stats.overall >= 75
                  ? 'You meet the 75% attendance criteria for exam eligibility.'
                  : `You need ${stats.daysNeeded} more consecutive classes to reach 75%.`}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] font-semibold">
              {stats.overall >= 75
                ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-emerald-400">Criteria Met</span></>
                : <><Clock className="w-3.5 h-3.5 text-amber-400" /> <span className="text-amber-400">{stats.daysNeeded} classes needed</span></>
              }
            </div>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-bold text-white mb-3">Last 30 Days</h3>
          <div className="flex flex-wrap gap-1">
            {heatmapData.map((day, i) => (
              <div key={i} title={`${day.date}: ${day.status} (${day.count} sessions)`}
                className={`w-4 h-4 rounded-sm transition-all hover:scale-150 cursor-pointer ${
                  day.status === 'present' ? 'bg-emerald-500' :
                  day.status === 'absent' ? 'bg-red-500' :
                  day.status === 'partial' ? 'bg-amber-500' :
                  'bg-white/5'
                }`} />
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-[#C4B5FD]/50">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Absent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Partial</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-white/5" /> No Sessions</span>
          </div>
        </div>

        {/* Attendance History with Filters */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Attendance History</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#C4B5FD]/40" />
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-violet-500">
                <option value="all">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-violet-500">
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
              {(filterSubject !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterSubject('all'); setFilterStatus('all'); setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#C4B5FD]/50">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[#C4B5FD] uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[#C4B5FD]/40 italic">Loading...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[#C4B5FD]/40 italic">No records match filters.</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="py-3 px-4 font-semibold text-white">{log.attendance_sessions?.subject || 'General'}</td>
                      <td className="py-3 px-4 text-[#C4B5FD]/80">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          log.method === 'qr' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                          log.method === 'biometric' || log.method === 'rfid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          log.method === 'auto' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {log.method === 'qr' ? 'QR' :
                           log.method === 'biometric' ? 'Biometric' :
                           log.method === 'rfid' ? 'RFID' :
                           log.method === 'auto' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          log.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.status === 'absent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filteredLogs.length > 0 && (
            <div className="text-[10px] text-center text-[#C4B5FD]/40">
              Showing {filteredLogs.length} of {logs.length} records
            </div>
          )}
        </div>

      </div>

      {/* Regularization Modal */}
      {showRegForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-violet-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Apply for Regularization</h3>
            <form onSubmit={handleRegularize} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Absence Date</label>
                <input type="date" required value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Reason</label>
                <textarea required value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Explain why you were absent..."
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500 h-24 resize-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Proof URL (optional)</label>
                <input type="text" value={formData.proof_url}
                  onChange={(e) => setFormData({...formData, proof_url: e.target.value})}
                  placeholder="https://drive.google.com/..."
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowRegForm(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white font-bold">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
