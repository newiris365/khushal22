"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Clock, Phone } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function WardenReportsPage() {
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [insideVisitors, setInsideVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'defaulters' | 'visitors'>('defaulters');

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const [defRes, visRes] = await Promise.all([
        apiGet('hostel/fees/defaulters'),
        apiGet('hostel/visitors/inside')
      ]);

      if (defRes.success) {
        setDefaulters(defRes.defaulters || []);
      }
      if (visRes.success) {
        setInsideVisitors(visRes.visitors || []);
      }
    } catch {
      setDefaulters([]);
      setInsideVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownloadPDF = (reportType: string) => {
    setSuccessMsg(`Initiated PDF generation for ${reportType} report...`);
    setTimeout(() => {
      setSuccessMsg('');
      const token = localStorage.getItem('iris_jwt_token');
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      window.open(`${API_BASE}/hostel/allocations/report/pdf?token=${token}`, '_blank');
    }, 1200);
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/warden/dashboard" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Warden Report Desk</h1>
            <p className="text-xs text-slate-400">Export audit sheets, check fee defaulters, and view active visitor alerts</p>
          </div>
        </div>
      </div>

      <div>
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`px-6 py-3 text-xs font-bold transition-all relative ${
              activeTab === 'defaulters' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rent Defaulters ({defaulters.length})
            {activeTab === 'defaulters' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-6 py-3 text-xs font-bold transition-all relative ${
              activeTab === 'visitors' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Visitor Overstay Monitor ({insideVisitors.length})
            {activeTab === 'visitors' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        </div>

        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={() => triggerDownloadPDF(activeTab === 'defaulters' ? 'Defaulters' : 'Visitors')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download PDF Report
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'defaulters' ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Guardian Contact</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Rent + Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {defaulters.map((def, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{def.students?.users?.full_name || def.students?.name || 'Student'}</td>
                    <td className="p-4 font-mono">{def.students?.roll_number || '—'}</td>
                    <td className="p-4 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{def.students?.guardian_phone || 'N/A'}</span>
                    </td>
                    <td className="p-4 text-amber-400 font-medium">
                      {def.due_date ? new Date(def.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-right font-extrabold text-red-400">
                      ₹{(def.amount || 0) + (def.penalty || 0)}
                    </td>
                  </tr>
                ))}
                {defaulters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No rent defaulters for the current period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Visitor Details</th>
                  <th className="p-4">Host Student</th>
                  <th className="p-4">Gate Pass ID</th>
                  <th className="p-4">Check-In Time</th>
                  <th className="p-4 text-right">Action Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {insideVisitors.map((vis, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{vis.visitor_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{vis.relation || 'Guest'} • {vis.visitor_phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{vis.students?.users?.full_name || vis.students?.name || 'Student'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{vis.students?.roll_number || '—'}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{vis.gate_pass_id || vis.id?.slice(0, 8)}</td>
                    <td className="p-4 text-slate-400 font-mono">
                      {vis.in_time ? new Date(vis.in_time).toLocaleString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        <Clock className="w-3.5 h-3.5" /> Inside Premises
                      </span>
                    </td>
                  </tr>
                ))}
                {insideVisitors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No active visitors inside the block.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
