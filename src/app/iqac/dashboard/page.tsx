"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, AlertTriangle, RefreshCw, BarChart3,
  BookOpen, Users, Trophy
} from 'lucide-react';

interface CriteriaProgress {
  criterion: string;
  value: number;
  badge: string;
}

export default function IqacDashboard() {
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<CriteriaProgress[]>([]);
  const [docsUploaded, setDocsUploaded] = useState<number | null>(null);
  const [docsRequired, setDocsRequired] = useState<number | null>(null);
  
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/naac/dashboard', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCgpa(data.cgpa_estimate ?? null);
        setGrade(data.grade_prediction ?? null);
        setCriteria(data.criteria_progress || []);
        setDocsUploaded(data.evidence_uploaded ?? 0);
        setDocsRequired(data.evidence_required ?? 70);
      } else {
        setFetchError(data.error || 'Unable to load live NAAC readiness data.');
        setCriteria([]);
      }
    } catch (err: any) {
      console.error('Error loading NAAC dashboard data', err);
      setFetchError(err?.message || 'Unable to load live NAAC readiness data from server.');
      setCriteria([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/naac/sync-from-modules', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Auto-sync from modules completed.');
        loadData();
      } else {
        alert(data.error || 'Failed to sync NAAC modules.');
      }
    } catch (err: any) {
      console.error('Error in handleAutoSync', err);
      alert(`Sync failed: ${err?.message || 'Network error'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <span>⚠️ {fetchError}</span>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Accreditation Executive Cockpit</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">NAAC SSR Progress Dashboard</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Monitor self-study report data completeness criteria-wise, verify file submissions, and trigger integration sync triggers.
          </p>
        </div>
        
        <button
          onClick={handleAutoSync}
          disabled={syncing}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 border border-[#A78BFA]/20"
        >
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Auto-Sync Campus Data
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading NAAC scorecard details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Predicted Grade Widget */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col items-center justify-center gap-4 text-center">
            <h3 className="font-extrabold text-sm text-white w-full text-left border-b border-white/5 pb-3">Predicted Quality Grade</h3>
            
            <div className="flex flex-col items-center gap-1.5 my-3">
              <span className="text-6xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-md">
                {grade}
              </span>
              <span className="text-xs font-bold text-[#C4B5FD]/70">Estimated CGPA: {cgpa} / 4.00</span>
            </div>

            <div className="w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 text-xs text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-[#C4B5FD] font-semibold leading-normal">
                Self-study checklist has reached over 84% average documentation completeness.
              </p>
            </div>
          </div>

          {/* Evidence Documents Checklist */}
          <div className="lg:col-span-2 glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col justify-between gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-extrabold text-sm text-white">Evidence Upload Completeness</h3>
              <span className="text-xs font-bold text-[#A78BFA]">{docsUploaded} / {docsRequired} files</span>
            </div>

            <div className="flex flex-col gap-2 my-2">
              <div className="flex justify-between text-xs text-[#C4B5FD] font-semibold">
                <span>SSR File Uploads</span>
                <span>{Math.round((docsUploaded / docsRequired) * 100)}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#1D163F] overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] transition-all duration-1000"
                  style={{ width: `${(docsUploaded / docsRequired) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs mt-3 pt-3 border-t border-white/5 text-[#C4B5FD]/70 font-semibold">
              <div className="flex flex-col gap-1">
                <span>Institution Students</span>
                <span className="text-white font-extrabold text-lg">360 Active</span>
              </div>
              <div className="flex flex-col gap-1">
                <span>Faculty Members</span>
                <span className="text-white font-extrabold text-lg">28 Staff</span>
              </div>
              <div className="flex flex-col gap-1">
                <span>Publications Uploaded</span>
                <span className="text-white font-extrabold text-lg">18 Scopus</span>
              </div>
            </div>
          </div>

          {/* Criteria Progress lists */}
          <div className="lg:col-span-3 glass-panel border border-[#6C2BD9]/20 rounded-2xl p-6 bg-[#13102A]/20 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-white">Criteria Documentation Progress</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criteria.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-white/5 flex flex-col gap-2 hover:border-[#6C2BD9]/25 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white leading-normal truncate max-w-[80%]">{item.criterion}</span>
                    <span className="font-bold text-[#A78BFA]">{item.value}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1D163F] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.badge
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
