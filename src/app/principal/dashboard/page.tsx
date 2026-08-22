"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, GraduationCap, TrendingUp, AlertTriangle, 
  Calendar, CheckCircle2, XCircle, Clock, Send, Plus, Trash2, 
  Edit3, Building2, MessageSquare, AlertCircle, FileSpreadsheet, Sparkles, IndianRupee 
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../lib/api';

type TabType = 'overview' | 'grades' | 'teachers' | 'fees' | 'engagement' | 'infrastructure';

export default function PrincipalDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  // States for stats and metrics
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    attendance: 0,
    pendingPTMs: 0,
    sectionsCompletion: 0,
    absentsToday: 0,
    totalGrades: 0
  });
  const [gradeStrength, setGradeStrength] = useState<any[]>([]);
  
  // Tab data states
  const [gradeAnalytics, setGradeAnalytics] = useState<any[]>([]);
  const [teacherActivities, setTeacherActivities] = useState<any[]>([]);
  const [feeOversight, setFeeOversight] = useState<{ totalCollected: number; targetFees: number; defaulters: any[] }>({
    totalCollected: 0,
    targetFees: 0,
    defaulters: []
  });
  const [parentEngagement, setParentEngagement] = useState<{ ptmStats: any; pendingResponsesCount: number; slaBreachedCount: number; teacherSlaStats: any[] }>({
    ptmStats: {},
    pendingResponsesCount: 0,
    slaBreachedCount: 0,
    teacherSlaStats: []
  });
  const [classSections, setClassSections] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);

  // Bulk Defaulter whatsapp messaging states
  const [selectedDefaulters, setSelectedDefaulters] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState(
    "Dear {parent_name}, this is a final notice regarding the outstanding fee balance of ₹{balance} for {student_name} in {grade}. Please clear the due amount immediately to avoid suspension. - IRIS 365"
  );
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Manage section modal/form states
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [formGrade, setFormGrade] = useState('');
  const [formSection, setFormSection] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formCapacity, setFormCapacity] = useState('40');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview') {
      loadTabData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/school/principal/metrics');
      if (res.success) {
        setStats({
          students: res.totalStudents || 0,
          faculty: res.totalFaculty || 0,
          attendance: res.todaysAttendancePct || 0,
          pendingPTMs: res.pendingPTMCount || 0,
          sectionsCompletion: res.sectionsCompletionPct || 0,
          absentsToday: res.totalAbsentsToday || 0,
          totalGrades: res.totalGrades || 0
        });
        setGradeStrength(res.totalStrengthPerGrade || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    try {
      if (activeTab === 'grades') {
        const res = await apiGet('/school/analytics/grades');
        if (res.success) setGradeAnalytics(res.analytics || []);
      } else if (activeTab === 'teachers') {
        const res = await apiGet('/school/analytics/teacher-activity');
        if (res.success) setTeacherActivities(res.activities || []);
      } else if (activeTab === 'fees') {
        const res = await apiGet('/school/analytics/fees');
        if (res.success) {
          setFeeOversight({
            totalCollected: res.totalCollected || 0,
            targetFees: res.targetFees || 0,
            defaulters: res.defaulters || []
          });
        }
      } else if (activeTab === 'engagement') {
        const res: any = await apiGet('/school/analytics/parent-engagement');
        if (res.success) {
          setParentEngagement({
            ptmStats: res.ptmStats || null,
            pendingResponsesCount: res.pendingResponsesCount || 0,
            slaBreachedCount: res.slaBreachedCount || 0,
            teacherSlaStats: res.teacherSlaStats || []
          });
        }
      } else if (activeTab === 'infrastructure') {
        const [secRes, teachRes] = await Promise.all([
          apiGet('/school/classes'),
          apiGet('/school/teachers')
        ]);
        if (secRes.success) setClassSections(secRes.class_sections || []);
        if (teachRes.success) setTeachersList(teachRes.teachers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectDefaulter = (id: string) => {
    setSelectedDefaulters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllDefaulters = () => {
    if (selectedDefaulters.length === feeOversight.defaulters.length) {
      setSelectedDefaulters([]);
    } else {
      setSelectedDefaulters(feeOversight.defaulters.map(d => d.id));
    }
  };

  const triggerBulkNotice = async () => {
    if (selectedDefaulters.length === 0) return alert('Select at least one parent/student first.');
    setSendingBroadcast(true);
    try {
      const res = await apiPost('/school/notifications/bulk-whatsapp', {
        student_ids: selectedDefaulters,
        message_template: customMessage
      });
      if (res.success) {
        alert(res.message || 'WhatsApp broadcast triggered successfully!');
        setSelectedDefaulters([]);
      } else {
        alert(res.error || 'Failed to send WhatsApp broadcast.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Network error triggering WhatsApp broadcast.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleCreateOrUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      grade: Number(formGrade),
      section: formSection,
      class_teacher_id: formTeacherId || null,
      room_number: formRoomNumber || null,
      capacity: Number(formCapacity)
    };

    try {
      if (editSectionId) {
        const data = await apiPut(`/school/classes/${editSectionId}`, payload);
        if (data.success) {
          alert('Class section updated successfully!');
          loadTabData();
          resetForm();
        } else {
          alert(data.error || 'Failed to update section');
        }
      } else {
        const data = await apiPost('/school/classes', payload);
        if (data.success) {
          alert('Class section created!');
          loadTabData();
          resetForm();
        } else {
          alert(data.error || 'Failed to create section');
        }
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditSectionClick = (sec: any) => {
    setEditSectionId(sec.id);
    setFormGrade(sec.grade.toString());
    setFormSection(sec.section);
    setFormTeacherId(sec.class_teacher_id || '');
    setFormRoomNumber(sec.room_number || '');
    setFormCapacity(sec.capacity?.toString() || '40');
    setShowSectionForm(true);
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      const data = await apiDelete(`/school/classes/${id}`);
      if (data.success) {
        alert('Section deleted.');
        loadTabData();
      } else {
        alert(data.error || 'Failed to delete section');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setEditSectionId(null);
    setFormGrade('');
    setFormSection('');
    setFormTeacherId('');
    setFormRoomNumber('');
    setFormCapacity('40');
    setShowSectionForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#06B6D4] animate-pulse flex items-center gap-2">
          <Clock className="w-5 h-5 animate-spin" /> Compiling Principal Dashboard...
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'grades', label: 'Grade Analytics', icon: GraduationCap },
    { id: 'teachers', label: 'Teacher Activity', icon: Users },
    { id: 'fees', label: 'Fee Oversight', icon: IndianRupee },
    { id: 'engagement', label: 'Parent Engagement', icon: MessageSquare },
    { id: 'infrastructure', label: 'Infrastructure Setup', icon: Building2 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <GraduationCap size={28} className="text-[#06B6D4]" />
            Principal Suite
          </h1>
          <p className="text-xs text-[#C4B5FD]/50">Real-time academic, compliance, and financial oversight console</p>
        </div>
        <div className="flex items-center gap-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-3 py-1.5 rounded-lg text-xs">
          <Sparkles className="w-4 h-4 text-[#22D3EE] animate-pulse" />
          <span className="text-[#22D3EE] font-bold">School Institution Mode</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isSelected 
                  ? 'bg-[#06B6D4]/20 text-[#22D3EE] border border-[#06B6D4]/30' 
                  : 'text-[#C4B5FD]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: stats.students, icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Total Grades', value: stats.totalGrades, icon: FileSpreadsheet, color: 'text-pink-400', bg: 'bg-pink-500/10' },
              { label: 'Today\'s Attendance', value: `${stats.attendance}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Pending PTMs', value: stats.pendingPTMs, icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map(s => (
              <div key={s.label} className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl p-5 border border-white/5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 tracking-wider">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Live Attendance Register Status Widget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl p-6 border border-[#06B6D4]/20 space-y-4">
              <h3 className="text-sm font-bold text-[#22D3EE] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#22D3EE]" /> Live Attendance Status
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/3 p-4 rounded-xl border border-white/5 text-center">
                  <p className="text-3xl font-black text-white">{stats.sectionsCompletion}%</p>
                  <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-semibold mt-1 block">Sections Completed</span>
                </div>
                <div className="bg-white/3 p-4 rounded-xl border border-white/5 text-center">
                  <p className="text-3xl font-black text-red-400">{stats.absentsToday}</p>
                  <span className="text-[9px] text-red-400/60 uppercase font-semibold mt-1 block">Total Absent Students</span>
                </div>
              </div>

              <div className="w-full bg-white/5 rounded-full h-3.5 border border-white/10 overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] rounded-full transition-all duration-1000"
                  style={{ width: `${stats.sectionsCompletion}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-[#C4B5FD]/40 text-center italic">Morning attendance registers close by 9:30 AM</p>
            </div>

            {/* Student Strength per Grade Bar charts */}
            <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6 space-y-4">
              <h3 className="text-sm font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Total Students per Grade</h3>
              {gradeStrength.length === 0 ? (
                <p className="text-[#C4B5FD]/40 text-xs italic py-6">No grade strength records logged.</p>
              ) : (
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
                  {gradeStrength.map((g: any) => {
                    const maxCount = Math.max(...gradeStrength.map((x: any) => x.count), 1);
                    const percent = Math.round((g.count / maxCount) * 100);
                    return (
                      <div key={g.grade} className="flex items-center gap-3 text-xs">
                        <span className="w-16 font-bold text-white">Grade {g.grade}</span>
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-[#06B6D4] rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="w-20 text-right font-bold text-[#22D3EE]">{g.count} Students</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: GRADE ANALYTICS ─── */}
      {activeTab === 'grades' && (
        <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6 space-y-6 animate-fadeIn">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
            Grade-Wise Academic & Compliance Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[#C4B5FD]/50">
                  <th className="py-3 font-semibold">Grade</th>
                  <th className="py-3 font-semibold text-center">Student Count</th>
                  <th className="py-3 font-semibold text-center">Avg Attendance</th>
                  <th className="py-3 font-semibold text-center">Avg Academic Score</th>
                  <th className="py-3 font-semibold text-right">Target Fees</th>
                  <th className="py-3 font-semibold text-right">Fees Collected</th>
                  <th className="py-3 font-semibold text-right">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {gradeAnalytics.map(g => (
                  <tr key={g.grade} className="hover:bg-white/3 transition-colors">
                    <td className="py-3.5 font-bold">Grade {g.grade}</td>
                    <td className="py-3.5 text-center font-bold text-slate-300">{g.studentCount}</td>
                    <td className="py-3.5 text-center font-mono">
                      <span className={`px-2.5 py-1 rounded-lg ${g.attendanceAvg >= 75 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {g.attendanceAvg}%
                      </span>
                    </td>
                    <td className="py-3.5 text-center font-bold">
                      <span className={`px-2 py-1 rounded ${g.academicAvg >= 75 ? 'text-emerald-400' : g.academicAvg >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {g.academicAvg}%
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-400">₹{g.targetFees.toLocaleString()}</td>
                    <td className="py-3.5 text-right font-mono text-emerald-400">₹{g.totalPaid.toLocaleString()}</td>
                    <td className="py-3.5 text-right font-black text-[#22D3EE]">{g.feeCollectionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: TEACHER ACCOUNTABILITY ─── */}
      {activeTab === 'teachers' && (
        <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6 space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Class Teacher Activity Monitor</h3>
            <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Verify daily compliance records submission by Class Teachers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teacherActivities.map(act => (
              <div key={act.id} className="p-4 rounded-xl bg-white/3 border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <div>
                    <h4 className="font-heading font-extrabold text-sm text-white">Grade {act.grade}-{act.section}</h4>
                    <span className="text-[10px] text-[#C4B5FD]/50 mt-0.5 block">Teacher: <strong>{act.teacherName}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center bg-black/25 p-2 rounded-lg">
                    <span className="text-[#C4B5FD]/70 text-[10px] uppercase font-bold">Morning Attendance</span>
                    {act.attendanceSubmitted ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Submitted</span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Pending</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center bg-black/25 p-2 rounded-lg">
                    <span className="text-[#C4B5FD]/70 text-[10px] uppercase font-bold">Daily Diary entry</span>
                    {act.diarySubmitted ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Submitted</span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: FEE OVERSIGHT ─── */}
      {activeTab === 'fees' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Revenue oversight card */}
          <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl p-6 border border-[#06B6D4]/30 flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center text-[#22D3EE]">
                <IndianRupee size={24} />
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#C4B5FD]/50 font-extrabold tracking-wider">Fee Collection Compliance</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-white">₹{feeOversight.totalCollected.toLocaleString()}</span>
                  <span className="text-xs text-[#C4B5FD]/50">collected out of ₹{feeOversight.targetFees.toLocaleString()} target</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-2xl font-black text-[#22D3EE]">
                {feeOversight.targetFees > 0 ? Math.round((feeOversight.totalCollected / feeOversight.targetFees) * 100) : 0}%
              </span>
              <p className="text-[9px] uppercase font-bold text-[#C4B5FD]/50 tracking-widest mt-0.5">Collection Rate</p>
            </div>
          </div>

          {/* Top Defaulters & Bulk WhatsApp Broadcast panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Defaulters list */}
            <div className="lg:col-span-2 bg-[#13102A]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Outstanding Fee Defaulters</h3>
                <button 
                  onClick={handleSelectAllDefaulters}
                  className="text-[10px] font-bold text-[#22D3EE] hover:underline"
                >
                  {selectedDefaulters.length === feeOversight.defaulters.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {feeOversight.defaulters.length === 0 ? (
                <p className="text-xs text-[#C4B5FD]/50 py-6 italic text-center">No active fee defaulters logged!</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {feeOversight.defaulters.map(d => {
                    const isChecked = selectedDefaulters.includes(d.id);
                    return (
                      <div 
                        key={d.id}
                        onClick={() => handleSelectDefaulter(d.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center text-xs ${
                          isChecked 
                            ? 'bg-[#06B6D4]/10 border-[#06B6D4] text-white' 
                            : 'bg-white/3 border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {}} // handled by div click
                            className="rounded border-white/10 text-[#06B6D4] focus:ring-0 focus:ring-offset-0 bg-transparent w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-white">{d.name}</p>
                            <span className="text-[10px] text-[#C4B5FD]/50 font-mono">Grade {d.grade}-{d.section} • Roll: {d.roll_number}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <strong className="text-red-400 font-bold block">₹{d.balance.toLocaleString()}</strong>
                          <span className="text-[9px] text-[#C4B5FD]/40">Guardian: {d.guardianName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notification triggers */}
            <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#22D3EE]" /> Bulk parent broadcast
              </h3>
              
              <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-xl p-3 text-[11px] text-[#22D3EE]/80">
                Selected: <strong>{selectedDefaulters.length} parents</strong> to notify.
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">WhatsApp Template Message</label>
                <textarea 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="bg-black/35 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] resize-none"
                  placeholder="Insert message notification..."
                />
                <span className="text-[8px] text-[#C4B5FD]/35">Dynamic values available: &#123;student_name&#125;, &#123;parent_name&#125;, &#123;grade&#125;, &#123;balance&#125;</span>
              </div>

              <button
                onClick={triggerBulkNotice}
                disabled={sendingBroadcast || selectedDefaulters.length === 0}
                className="w-full mt-auto py-2.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#06B6D4]/20 transition-all"
              >
                {sendingBroadcast ? "Sending Broadcast..." : "Send Final Notices via WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: PARENT SLA ─── */}
      {activeTab === 'engagement' && (
        <div className="space-y-6 animate-fadeIn">
          {/* PTM & communication counts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl p-5 border border-white/5 text-center">
              <span className="text-3xl font-black text-white">{parentEngagement.ptmStats?.pending || 0}</span>
              <p className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 mt-1 tracking-wider">Pending PTM Bookings</p>
            </div>
            <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl p-5 border border-white/5 text-center">
              <span className="text-3xl font-black text-white">{parentEngagement.pendingResponsesCount}</span>
              <p className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 mt-1 tracking-wider">Active Parent Threads</p>
            </div>
            <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl p-5 border border-red-500/20 text-center bg-red-500/5">
              <span className="text-3xl font-black text-red-400">{parentEngagement.slaBreachedCount}</span>
              <p className="text-[10px] uppercase font-bold text-red-400/60 mt-1 tracking-wider">SLA Breached Threads</p>
            </div>
          </div>

          {/* SLA breaches table */}
          <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              Teacher Response SLA Tracking (Breach limit: 24 Hours)
            </h3>
            
            {parentEngagement.teacherSlaStats?.length === 0 ? (
              <p className="text-xs text-[#C4B5FD]/50 py-8 italic text-center">All parent message response times are healthy and within SLA target!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#C4B5FD]/50">
                      <th className="py-2.5 font-semibold">Teacher Name</th>
                      <th className="py-2.5 font-semibold">Parent Name</th>
                      <th className="py-2.5 font-semibold">Latest Message</th>
                      <th className="py-2.5 font-semibold text-center">Response delay</th>
                      <th className="py-2.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white">
                    {parentEngagement.teacherSlaStats?.map((stat, idx) => (
                      <tr key={idx} className="hover:bg-white/3 transition-colors">
                        <td className="py-3 font-bold">{stat.teacherName}</td>
                        <td className="py-3 text-slate-300">{stat.parentName}</td>
                        <td className="py-3 text-slate-400 italic max-w-xs truncate">"{stat.latestMessage}"</td>
                        <td className="py-3 text-center font-mono font-bold text-amber-400">{stat.delayHours} Hours overdue</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                            stat.slaStatus === 'Breached' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {stat.slaStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 6: INFRASTRUCTURE SETUP ─── */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* List of current sections */}
          <div className="lg:col-span-2 bg-[#13102A]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Class Sections Setup</h3>
              <button 
                onClick={() => setShowSectionForm(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/30 text-[#22D3EE] font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            {classSections.length === 0 ? (
              <p className="text-xs text-[#C4B5FD]/50 py-10 text-center italic">No class sections created. Setup grade configurations now.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#C4B5FD]/50">
                      <th className="py-2.5 font-semibold">Grade</th>
                      <th className="py-2.5 font-semibold">Section</th>
                      <th className="py-2.5 font-semibold">Class Teacher</th>
                      <th className="py-2.5 font-semibold">Room Number</th>
                      <th className="py-2.5 font-semibold text-center">Capacity</th>
                      <th className="py-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white">
                    {classSections.map(sec => (
                      <tr key={sec.id} className="hover:bg-white/3 transition-colors">
                        <td className="py-3 font-bold">Grade {sec.grade}</td>
                        <td className="py-3 font-mono font-bold text-[#22D3EE]">{sec.section}</td>
                        <td className="py-3 font-semibold text-slate-300">
                          {sec.users?.name || 'Not Assigned'}
                        </td>
                        <td className="py-3 font-mono text-slate-400">{sec.room_number || '—'}</td>
                        <td className="py-3 text-center">{sec.capacity || 40}</td>
                        <td className="py-3 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditSectionClick(sec)}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSection(sec.id)}
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form panel */}
          {showSectionForm && (
            <div className="bg-[#13102A]/60 backdrop-blur-sm rounded-2xl border border-[#06B6D4]/30 p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {editSectionId ? "Edit Section Details" : "Create New Section"}
                </h3>
                <button onClick={resetForm} className="text-xs text-[#C4B5FD]/50 hover:text-white">Cancel</button>
              </div>

              <form onSubmit={handleCreateOrUpdateSection} className="space-y-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Grade Level (1-12)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="12" 
                    required
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06B6D4]"
                    placeholder="e.g. 5"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Section Code</label>
                  <input 
                    type="text" 
                    maxLength={2} 
                    required
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06B6D4] uppercase"
                    placeholder="e.g. A"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Class Teacher Assignment</label>
                  <select 
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06B6D4]"
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachersList.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.users?.name || t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Room Placement</label>
                  <input 
                    type="text" 
                    value={formRoomNumber}
                    onChange={(e) => setFormRoomNumber(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06B6D4]"
                    placeholder="e.g. Room 102"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Max Capacity</label>
                  <input 
                    type="number" 
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#06B6D4]"
                    placeholder="40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-[#06B6D4]/20 transition-all mt-4"
                >
                  {editSectionId ? "Save Grade Details" : "Register Section"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
