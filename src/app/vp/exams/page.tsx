"use client";

import React, { useState, useEffect } from 'react';
import { GraduationCap, Clock, Users, FileText, CheckCircle, AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet('/core/exams');
      if (res.success) {
        setExams(res.exams || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load exam oversight data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Exam Oversight...
        </div>
      </div>
    );
  }

  const scheduled = exams.filter(e => e.status !== 'Completed').length;
  const totalStudents = exams.reduce((s, e) => s + (e.student_count || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GraduationCap size={24} className="text-violet-400" /> Exam Oversight
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Monitor upcoming exams, schedule details, and status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Scheduled Exams', value: exams.length, color: 'text-white' },
          { label: 'Active/Upcoming', value: scheduled, color: 'text-emerald-400' },
          { label: 'Total Enrolled', value: totalStudents, color: 'text-blue-400' },
          { label: 'Departments Covered', value: new Set(exams.map(e => e.departments?.name || 'General')).size, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {exams.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <GraduationCap size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-sm text-slate-300 font-medium">No exams currently scheduled.</p>
          <p className="text-xs text-slate-500 mt-1">Scheduled examination cycles will appear here for oversight.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{exam.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Department: {exam.departments?.name || 'General'} · Type: {exam.type || 'Finals'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {exam.start_date} to {exam.end_date}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Users size={10} /> {exam.student_count || 0} students
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {exam.type || 'Scheduled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
