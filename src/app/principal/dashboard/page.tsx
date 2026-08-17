"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, GraduationCap, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function PrincipalDashboard() {
  const [stats, setStats] = useState({ students: 0, faculty: 0, attendance: 0, pendingPTMs: 0 });
  const [gradeStrength, setGradeStrength] = useState<any[]>([]);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [metricsRes, noticesRes] = await Promise.all([
          apiGet('school/principal/metrics'),
          apiGet('campusCore/notices'),
        ]);
        if (metricsRes.success) {
          setStats({
            students: metricsRes.totalStudents || 0,
            faculty: metricsRes.totalFaculty || 0,
            attendance: metricsRes.todaysAttendancePct || 0,
            pendingPTMs: metricsRes.pendingPTMCount || 0
          });
          setGradeStrength(metricsRes.totalStrengthPerGrade || []);
        }
        if (noticesRes.success) setRecentNotices((noticesRes.notices || []).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-purple-400 animate-pulse">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <LayoutDashboard size={24} className="text-purple-400" />
        Principal Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.students, icon: GraduationCap, color: 'text-blue-400' },
          { label: 'Faculty', value: stats.faculty, icon: Users, color: 'text-emerald-400' },
          { label: 'Today\'s Attendance', value: `${stats.attendance}%`, icon: TrendingUp, color: 'text-violet-400' },
          { label: 'Pending PTMs', value: stats.pendingPTMs, icon: Calendar, color: 'text-amber-400' },
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

      {/* Student Strength per Grade */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Student Strength per Grade</h2>
        {gradeStrength.length === 0 ? (
          <p className="text-slate-400 text-sm">No grade strength data available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gradeStrength.map((g: any) => {
              const maxCount = Math.max(...gradeStrength.map((x: any) => x.count), 1);
              const percent = Math.round((g.count / maxCount) * 100);
              return (
                <div key={g.grade} className="bg-white/5 rounded-lg p-4 border border-white/5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-200">Grade {g.grade}</span>
                    <span className="text-purple-400 font-bold">{g.count} Students</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Notices</h2>
        {recentNotices.length === 0 ? (
          <p className="text-slate-400 text-sm">No recent notices.</p>
        ) : (
          <div className="space-y-2">
            {recentNotices.map((n: any) => (
              <div key={n.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-slate-400">{n.priority} · {new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

