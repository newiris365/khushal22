"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, BookOpen, Users, Clock, FileText, TrendingUp, 
  Calendar, CheckCircle, MessageSquare, AlertCircle, Award, 
  ShieldAlert, Sparkles, Plus, Send, X 
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

type ScheduleType = 'teaching' | 'home';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    myClasses: 0,
    totalStudents: 0,
    todayAttendance: 0,
    pendingAssignments: 0,
    upcomingClasses: 0,
    leaveRequests: 0,
  });
  const [scheduleType, setScheduleType] = useState<ScheduleType>('teaching');
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Class Teacher context states
  const [classOverview, setClassOverview] = useState<{
    hasClass: boolean;
    class_section_id?: string;
    grade?: number;
    section?: string;
    attendanceStatus?: string;
    pendingLeavesCount?: number;
    activeSlaCount?: number;
  }>({ hasClass: false });

  // Behavioral incident log modal states
  const [students, setStudents] = useState<any[]>([]);
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [behaviorStudentId, setBehaviorStudentId] = useState('');
  const [behaviorType, setBehaviorType] = useState<'Incident' | 'Achievement'>('Achievement');
  const [behaviorTitle, setBehaviorTitle] = useState('');
  const [behaviorDesc, setBehaviorDesc] = useState('');
  const [submittingBehavior, setSubmittingBehavior] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch timetable based on toggle
      const timetableRes = await apiGet(`/faculty/timetable?schedule_type=${scheduleType}`);
      if (timetableRes.success && timetableRes.timetable) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todayClasses = timetableRes.timetable.filter((t: any) => t.day_of_week === today);
        setTodaySchedule(todayClasses);
        setStats(s => ({ 
          ...s, 
          myClasses: new Set(todayClasses.map((t: any) => t.department_name || t.subject)).size, 
          upcomingClasses: todayClasses.length 
        }));
      }

      // 2. Fetch pending leave applications
      const leavesRes = await apiGet('/faculty/leaves/pending');
      if (leavesRes.success && leavesRes.leaves) {
        setStats(s => ({ ...s, leaveRequests: leavesRes.leaves.length }));
      }

      // 3. Fetch students count (and list for behavior modal)
      const studentsRes = await apiGet('/faculty/students');
      if (studentsRes.success && studentsRes.students) {
        setStudents(studentsRes.students || []);
        setStats(s => ({ ...s, totalStudents: studentsRes.students.length }));
      }

      const overviewRes: any = await apiGet('/school/teacher/my-class-overview');
      if (overviewRes.success) {
        setClassOverview({
          hasClass: overviewRes.hasClass || false,
          class_section_id: overviewRes.class_section_id,
          grade: overviewRes.grade,
          section: overviewRes.section,
          attendanceStatus: overviewRes.attendanceStatus,
          pendingLeavesCount: overviewRes.pendingLeavesCount,
          activeSlaCount: overviewRes.activeSlaCount
        });
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [scheduleType]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handlePostBehavior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!behaviorStudentId || !behaviorTitle || !behaviorDesc) {
      return alert('Please fill in all behavioral fields.');
    }
    setSubmittingBehavior(true);
    try {
      const res = await apiPost('/school/behavior', {
        student_id: behaviorStudentId,
        log_type: behaviorType,
        title: behaviorTitle,
        description: behaviorDesc
      });
      if (res.success) {
        alert('Behavioral log successfully posted!');
        setShowBehaviorModal(false);
        setBehaviorStudentId('');
        setBehaviorTitle('');
        setBehaviorDesc('');
      } else {
        alert(res.error || 'Failed to post behavioral log.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingBehavior(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse flex items-center gap-2">
          <Clock className="w-5 h-5 animate-spin" /> Compiling Teacher Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard size={24} className="text-violet-400" />
            Teacher Dashboard
          </h1>
          <p className="text-xs text-[#C4B5FD]/60 mt-1">Welcome back! Manage your home class, schedules, and student logs.</p>
        </div>
        
        <button
          onClick={() => setShowBehaviorModal(true)}
          className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-violet-600/20 transition-all"
        >
          <Plus size={14} /> Log Student Behavior
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Subjects', value: stats.myClasses, icon: BookOpen, color: 'text-violet-400' },
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-400' },
          { label: 'Today\'s Classes', value: stats.upcomingClasses, icon: Clock, color: 'text-emerald-400' },
          { label: 'Leave Tasks', value: stats.leaveRequests, icon: FileText, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Class Teacher Overview Widget */}
      {classOverview.hasClass && (
        <div className="bg-[#1D1B36]/60 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                My Class Overview: Grade {classOverview.grade}-{classOverview.section}
              </h3>
            </div>
            <span className="text-[10px] bg-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded border border-violet-500/30">
              Class Teacher
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attendance register */}
            <div className="p-4 rounded-xl bg-black/25 border border-white/5 flex justify-between items-center text-xs">
              <div>
                <span className="text-[#C4B5FD]/50 text-[10px] uppercase font-bold">Register Status</span>
                <p className="text-sm font-black text-white mt-1">Today's Attendance</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${
                classOverview.attendanceStatus === 'Submitted' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
              }`}>
                {classOverview.attendanceStatus}
              </span>
            </div>

            {/* Leave Applications count */}
            <Link 
              href="/teacher/leave"
              className="p-4 rounded-xl bg-black/25 border border-white/5 hover:bg-white/5 transition-all flex justify-between items-center text-xs"
            >
              <div>
                <span className="text-[#C4B5FD]/50 text-[10px] uppercase font-bold">Leave Compliance</span>
                <p className="text-sm font-black text-white mt-1">Pending Leave Requests</p>
              </div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                classOverview.pendingLeavesCount && classOverview.pendingLeavesCount > 0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-slate-400'
              }`}>
                {classOverview.pendingLeavesCount || 0}
              </span>
            </Link>

            {/* Active message response counts */}
            <Link 
              href="/teacher/messages"
              className="p-4 rounded-xl bg-black/25 border border-white/5 hover:bg-white/5 transition-all flex justify-between items-center text-xs"
            >
              <div>
                <span className="text-[#C4B5FD]/50 text-[10px] uppercase font-bold">Response SLA Tracker</span>
                <p className="text-sm font-black text-white mt-1">Unresponded Parent Messages</p>
              </div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                classOverview.activeSlaCount && classOverview.activeSlaCount > 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-white/5 text-slate-400'
              }`}>
                {classOverview.activeSlaCount || 0}
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Schedule and Action Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Schedule List */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={14} className="text-violet-400" /> Today's Schedule
            </h3>

            {/* Toggle switch */}
            {classOverview.hasClass && (
              <div className="flex gap-1 p-0.5 bg-black/35 rounded-lg border border-white/10 text-[10px]">
                <button
                  onClick={() => setScheduleType('teaching')}
                  className={`px-2 py-1 rounded font-bold transition-all ${
                    scheduleType === 'teaching' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Teaching
                </button>
                <button
                  onClick={() => setScheduleType('home')}
                  className={`px-2 py-1 rounded font-bold transition-all ${
                    scheduleType === 'home' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Home Class
                </button>
              </div>
            )}
          </div>

          {todaySchedule.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No class periods scheduled today.</p>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {todaySchedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="w-1 h-8 rounded-full bg-violet-400" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">
                      {s.subject} {s.class_sections ? `— Grade ${s.class_sections.grade}-${s.class_sections.section}` : s.department_name ? `— ${s.department_name}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400">{s.time_slot} · Room {s.room_number || s.room || '—'}</p>
                  </div>
                  <CheckCircle size={12} className="text-emerald-400/50" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Daily Register', href: '/teacher/attendance', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                { label: 'View Timetable', href: '/teacher/timetable', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                { label: 'CCE Grade Upload', href: '/teacher/results', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                { label: 'Homework Logs', href: '/teacher/assignments', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                { label: 'Apply Leave', href: '/teacher/leave', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                { label: 'Study Materials', href: '/teacher/study-materials', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className={`p-3 rounded-lg border text-xs font-medium text-center hover:brightness-110 transition-all ${a.color}`}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No recent activity.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                    <p className="text-[11px] text-slate-300">{a.text}</p>
                    <span className="text-[9px] text-slate-500">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Behavioral Incident Modal */}
      {showBehaviorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1A32] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-400" /> Log Student Behavior
              </h3>
              <button 
                onClick={() => setShowBehaviorModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePostBehavior} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Select Student</label>
                <select
                  required
                  value={behaviorStudentId}
                  onChange={(e) => setBehaviorStudentId(e.target.value)}
                  className="bg-black/35 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((st: any) => (
                    <option key={st.id} value={st.id}>{st.name || st.users?.full_name} ({st.roll_number || 'No Roll'})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Log Type</label>
                <div className="flex gap-2">
                  {[
                    { type: 'Achievement', label: 'Achievement / Star', icon: Award, color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
                    { type: 'Incident', label: 'Behavioral Incident', icon: ShieldAlert, color: 'border-red-500 text-red-400 bg-red-500/10' }
                  ].map(item => {
                    const isSelected = behaviorType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setBehaviorType(item.type as any)}
                        className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                          isSelected ? item.color : 'border-white/5 bg-white/3 text-slate-400'
                        }`}
                      >
                        <item.icon size={14} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Title (e.g. Star of the week)</label>
                <input 
                  type="text"
                  required
                  value={behaviorTitle}
                  onChange={(e) => setBehaviorTitle(e.target.value)}
                  className="bg-black/35 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
                  placeholder="Enter title..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Description Details</label>
                <textarea 
                  required
                  rows={4}
                  value={behaviorDesc}
                  onChange={(e) => setBehaviorDesc(e.target.value)}
                  className="bg-black/35 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Describe student achievements or infractions..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingBehavior}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {submittingBehavior ? "Logging entry..." : "Save Behavioral Record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
