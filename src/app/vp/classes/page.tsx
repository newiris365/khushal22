"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, CheckCircle, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes, teachersRes] = await Promise.all([
        apiGet('school/classes'),
        apiGet('school/teachers'),
      ]);
      if (classesRes.success) setClasses(classesRes.class_sections || classesRes.classes || []);
      if (teachersRes.success) setTeachers(teachersRes.teachers || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load class monitoring data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Class Monitoring...
        </div>
      </div>
    );
  }

  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || c.students || 0), 0);
  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 40), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen size={24} className="text-violet-400" /> Class Monitoring
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Real-time overview of all class sections in the institution</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Class Sections', value: classes.length, icon: BookOpen, color: 'text-violet-400' },
          { label: 'Enrolled Students', value: totalStudents, icon: Users, color: 'text-blue-400' },
          { label: 'Total Capacity', value: totalCapacity, icon: Clock, color: 'text-emerald-400' },
          { label: 'Capacity Utilization', value: totalCapacity > 0 ? `${Math.round((totalStudents / totalCapacity) * 100)}%` : '0%', icon: TrendingUp, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
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

      {classes.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <BookOpen size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-sm text-slate-300 font-medium">No class sections registered.</p>
          <p className="text-xs text-slate-500 mt-1">Create class sections in Infrastructure Setup to begin monitoring.</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-6 gap-px bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {['Grade & Section', 'Class Teacher', 'Room Number', 'Enrolled Students', 'Max Capacity', 'Occupancy'].map(h => (
              <div key={h} className="px-4 py-3">{h}</div>
            ))}
          </div>
          {classes.map(c => {
            const count = c.student_count || c.students || 0;
            const cap = c.capacity || 40;
            const occRate = cap > 0 ? Math.round((count / cap) * 100) : 0;
            return (
              <div key={c.id} className="grid grid-cols-6 gap-px bg-white/[0.02] text-sm border-t border-white/5">
                <div className="px-4 py-3 font-bold text-white">Grade {c.grade}-{c.section}</div>
                <div className="px-4 py-3 text-slate-300">{c.users?.name || c.class_teacher_name || 'Not Assigned'}</div>
                <div className="px-4 py-3 text-slate-400 text-xs font-mono">{c.room_number || '—'}</div>
                <div className="px-4 py-3 text-slate-300 font-semibold">{count}</div>
                <div className="px-4 py-3 text-slate-400">{cap}</div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${occRate >= 90 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(occRate, 100)}%` }} />
                    </div>
                    <span className="text-xs text-slate-300">{occRate}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
