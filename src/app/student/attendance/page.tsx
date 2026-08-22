"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Calendar, CheckCircle2, XCircle, Clock, AlertTriangle, 
  TrendingUp, BarChart3, GraduationCap, User, Hash, AlertCircle 
} from 'lucide-react';
import { useAcademic } from '../AcademicContext';
import { apiGet } from '../../../lib/api';

export default function StudentAttendancePage() {
  const { institutionType, semLabel, deptLabel, studentProfile, loading: profileLoading } = useAcademic();
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  useEffect(() => {
    if (!studentProfile?.id) return;
    setLoading(true);
    apiGet(`/core/attendance/student/${studentProfile.id}`)
      .then(res => {
        if (res.success) {
          setAttendance(res);
          // Set initial selected subject for colleges
          if (res.breakdown && res.breakdown.length > 0) {
            setSelectedSubject(res.breakdown[0].subject);
          }
        }
      })
      .catch(err => console.error('Failed to fetch attendance:', err))
      .finally(() => setLoading(false));
  }, [studentProfile]);

  // Group daily logs for calendar view (Schools)
  const schoolMonthGroups = useMemo(() => {
    if (!attendance?.logs || institutionType !== 'school') return {};
    const groups: Record<string, any[]> = {};
    
    attendance.logs.forEach((log: any) => {
      // date is YYYY-MM-DD
      const dateParts = log.date.split('-');
      if (dateParts.length < 3) return;
      const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[monthName]) groups[monthName] = [];
      groups[monthName].push({
        ...log,
        dayNum: dateObj.getDate(),
        dateObj
      });
    });

    // Sort logs inside each month by date
    Object.keys(groups).forEach(month => {
      groups[month].sort((a, b) => a.dayNum - b.dayNum);
    });

    return groups;
  }, [attendance, institutionType]);

  const filteredCollegeLogs = useMemo(() => {
    if (!attendance?.logs || institutionType !== 'college' || !selectedSubject) return [];
    return attendance.logs.filter((l: any) => l.attendance_sessions?.subject === selectedSubject);
  }, [attendance, institutionType, selectedSubject]);

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="h-16 bg-white/5 rounded-2xl animate-pulse flex items-center justify-between px-6">
            <div className="w-1/3 h-6 bg-white/10 rounded"></div>
            <div className="w-24 h-6 bg-white/10 rounded"></div>
          </div>
          {/* Info bar Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse"></div>
            ))}
          </div>
          {/* Content area Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 h-64 bg-white/5 rounded-2xl animate-pulse"></div>
            <div className="lg:col-span-8 h-96 bg-white/5 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const overallStats = attendance?.stats || { overall: 100, total: 0, present: 0, daysNeeded: 0 };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white pb-12">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg">Student Attendance Manager</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Dynamic attendance monitoring and compliance check</p>
            </div>
          </div>

          {/* Student Info Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <User className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-[#C4B5FD]/70">Name:</span>
              <span className="font-bold text-white">{studentProfile?.users?.name}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <Hash className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-[#C4B5FD]/70">Roll No:</span>
              <span className="font-mono font-bold text-white">{studentProfile?.roll_number}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <GraduationCap className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-[#C4B5FD]/70">{deptLabel}:</span>
              <span className="font-bold text-white">{studentProfile?.departments?.name || 'General'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6C2BD9]/20 border border-[#6C2BD9]/30">
              <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-[#A78BFA]">{semLabel}:</span>
              <span className="font-black text-white">{studentProfile?.semester}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* overall summary panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C4B5FD]/50">Overall Attendance</span>
            
            <div className="relative w-36 h-36 flex items-center justify-center mt-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke={overallStats.overall >= 75 ? "#10B981" : "#EF4444"} 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 - (251.2 * overallStats.overall) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-heading font-black">{overallStats.overall}%</span>
                <span className="text-[9px] text-[#C4B5FD]/40 uppercase mt-0.5">Verified</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-6 border-t border-white/5 pt-4">
              <div className="text-center">
                <span className="text-[9px] uppercase tracking-wide text-[#C4B5FD]/40">Attended</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{overallStats.present} Classes</p>
              </div>
              <div className="text-center">
                <span className="text-[9px] uppercase tracking-wide text-[#C4B5FD]/40">Total</span>
                <p className="text-base font-bold text-white mt-0.5">{overallStats.total} Classes</p>
              </div>
            </div>

            {overallStats.daysNeeded > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 w-full text-left">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-red-400">Below Compliance Target (75%)</p>
                  <p className="text-[10px] text-red-300/80 mt-1">You must attend the next {overallStats.daysNeeded} consecutive classes to cross 75%.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Branch Content */}
        <div className="lg:col-span-8 space-y-6">
          {institutionType === 'school' ? (
            /* School Monthly Calendar View */
            <div className="space-y-6">
              {Object.keys(schoolMonthGroups).length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-12 text-center">
                  <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-[#C4B5FD]/50">No daily school attendance records found.</p>
                </div>
              ) : (
                Object.entries(schoolMonthGroups).map(([monthName, logs]) => (
                  <div key={monthName} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
                    <h3 className="text-sm font-bold text-white mb-4 border-b border-white/5 pb-2">{monthName}</h3>
                    
                    {/* Calendar grid view */}
                    <div className="grid grid-cols-7 sm:grid-cols-10 gap-3">
                      {logs.map((dayLog: any) => {
                        let statusColor = "bg-white/5 border-white/5 text-white/50";
                        if (dayLog.status === 'Present') statusColor = "bg-emerald-500/20 border-emerald-500/30 text-emerald-400";
                        else if (dayLog.status === 'Absent') statusColor = "bg-red-500/20 border-red-500/30 text-red-400";
                        else if (dayLog.status === 'Half-Day') statusColor = "bg-amber-500/20 border-amber-500/30 text-amber-400";
                        else if (dayLog.status === 'Leave') statusColor = "bg-sky-500/20 border-sky-500/30 text-sky-400";

                        return (
                          <div 
                            key={dayLog.id}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center ${statusColor}`}
                          >
                            <span className="text-xs font-black">{dayLog.dayNum}</span>
                            <span className="text-[8px] uppercase font-semibold mt-0.5 tracking-tighter opacity-80">{dayLog.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* College Subject-wise view */
            <div className="space-y-6">
              {/* Subject selector header */}
              <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
                <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-4">Subject-wise Attendance Rates</h3>
                <div className="flex flex-wrap gap-2">
                  {attendance?.breakdown?.map((sub: any) => {
                    const isSelected = sub.subject === selectedSubject;
                    return (
                      <button
                        key={sub.subject}
                        onClick={() => setSelectedSubject(sub.subject)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#22D3EE]'
                            : 'bg-white/3 border-white/5 text-[#C4B5FD]/70 hover:bg-white/5'
                        }`}
                      >
                        {sub.subject} ({sub.percentage}%)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected subject logs */}
              {selectedSubject && (
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
                  <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-4">
                    Daily Logs — {selectedSubject}
                  </h3>
                  
                  {filteredCollegeLogs.length === 0 ? (
                    <p className="text-xs text-[#C4B5FD]/40 text-center py-6">No logs available for this subject.</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {filteredCollegeLogs.map((log: any) => {
                        const isPresent = log.status?.toLowerCase() === 'present' || log.status?.toLowerCase() === 'late';
                        return (
                          <div 
                            key={log.id} 
                            className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              {isPresent ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className="font-medium text-white">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <span className={`font-bold uppercase ${isPresent ? 'text-emerald-400' : 'text-red-400'}`}>
                              {log.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
