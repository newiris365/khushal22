"use client";

import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function StaffCiaMarksPage() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get('assessmentId');
  const [marksData, setMarksData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentId) {
      fetchMarks(assessmentId);
    }
  }, [assessmentId]);

  const fetchMarks = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet(`campusCore/faculty/cia/marks/${id}`);
      if (res.success) {
        setMarksData(res.marks || []);
      } else {
        setError(res.error || 'Failed to fetch marks.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error loading CIA marks.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/staff/cia" className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={24} className="text-violet-400" />
          CIA Marks Entry & Audit
        </h1>
      </div>

      {assessmentId && isLoading ? (
        <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <span>Fetching CIA marks data...</span>
        </div>
      ) : assessmentId && marksData.length > 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white mb-4">Assessment ID: {assessmentId}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase">
                  <th className="pb-2">Student ID</th>
                  <th className="pb-2">Marks Obtained</th>
                  <th className="pb-2">Max Marks</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {marksData.map((m: any, idx: number) => (
                  <tr key={m.id || idx}>
                    <td className="py-2.5 font-mono">{m.student_id}</td>
                    <td className="py-2.5 font-bold text-emerald-400">{m.marks_obtained}</td>
                    <td className="py-2.5 text-slate-400">{m.max_marks || 100}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                        Recorded
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-slate-500" />
          <p className="text-slate-400">Use the main CIA page to select an assessment and view or enter marks.</p>
          <Link href="/staff/cia" className="mt-4 inline-block text-violet-400 hover:text-violet-300 underline text-sm">
            Go to CIA Assessments Desk
          </Link>
        </div>
      )}
    </div>
  );
}
