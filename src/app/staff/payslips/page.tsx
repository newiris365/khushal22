"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function StaffPayslipsPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => { fetchPayslips(); }, []);

  const fetchPayslips = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await apiGet('hr/payslips/me');
      if (res.success) {
        setPayslips(res.payslips || res.data || []);
      } else {
        setHasError(true);
        setPayslips([]);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
      setPayslips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (id: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
    window.open(`${API_BASE}/hr/payslips/download/${id}?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <FileText size={24} className="text-amber-400" /> My Payslips
      </h1>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-amber-400" />
          <span>Loading payslip history...</span>
        </div>
      ) : hasError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="text-sm font-medium">Couldn't load payslips.</p>
          <button
            onClick={fetchPayslips}
            className="inline-flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : payslips.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center text-slate-500">
          No payslip statements generated for your profile yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map(ps => (
            <div key={ps.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-sm">{ps.month} {ps.year}</h3>
                  <p className="text-xs text-slate-400">Net Pay: ₹{Number(ps.net_pay || ps.net_salary || 0).toLocaleString('en-IN')}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  DISBURSED
                </span>
              </div>
              <button
                onClick={() => handleDownload(ps.id)}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> Download PDF Statement
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
