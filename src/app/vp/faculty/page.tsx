"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, BookOpen, Filter, Loader2 } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet('/hr/employees');
      if (res.success && Array.isArray(res.data)) {
        setFaculty(res.data.filter((emp: any) => emp.designation?.toLowerCase().includes('teacher') || emp.designation?.toLowerCase().includes('faculty') || emp.department || true));
      } else {
        const schoolRes = await apiGet('school/teachers');
        if (schoolRes.success && Array.isArray(schoolRes.teachers)) {
          setFaculty(schoolRes.teachers);
        } else {
          setFaculty([]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load faculty directory.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = faculty.filter(f => {
    const nameStr = f.name || f.users?.name || f.full_name || '';
    const deptStr = f.department || f.specialization || 'General';
    const subjStr = f.subject || f.designation || '';
    
    const matchSearch = nameStr.toLowerCase().includes(search.toLowerCase()) || subjStr.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === 'all' || deptStr === dept;
    return matchSearch && matchDept;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Faculty Directory...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} className="text-violet-400" /> Faculty Directory
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Browse and manage active teaching staff members</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or designation..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#6C2BD9]" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <Users size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-sm text-slate-300 font-medium">No faculty members found.</p>
          <p className="text-xs text-slate-500 mt-1">Teachers registered in the institution will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((f, idx) => {
            const name = f.name || f.users?.name || f.full_name || `Faculty member ${idx + 1}`;
            const designation = f.designation || f.job_title || 'Faculty';
            const department = f.department || f.specialization || 'General';
            const email = f.email || f.users?.email || '';
            const phone = f.phone || f.contact || '';
            const status = f.status || 'Active';

            return (
              <div key={f.id || idx} className="bg-white/5 rounded-xl border border-white/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400 shrink-0">
                    {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white truncate">{name}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                        status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{designation} · {department}</p>
                    {email && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                          <Mail size={9} /> {email}
                        </span>
                      </div>
                    )}
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
