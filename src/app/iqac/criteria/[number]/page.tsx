"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Upload, FileText, Send, CheckCircle2, ChevronRight, HelpCircle, RefreshCw } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../../../../lib/exportUtils';

interface Metric {
  id: string;
  metric_code: string;
  metric_name: string;
  metric_type: string;
  data_value: string;
  status: string;
  notes: string;
}

export default function IqacCriterionDetails({ params }: { params: { number: string } }) {
  const criterionNumber = parseInt(params.number) || 1;

  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // AI draft states
  const [aiDraft, setAiDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const exportMetricsCSV = () => {
    const headers = ["Metric Code", "Metric Name", "Type", "Data Value", "Status", "Notes"];
    exportToCSV(metrics, `NAAC_Criterion_${criterionNumber}_Metrics`, headers, ["metric_code", "metric_name", "metric_type", "data_value", "status", "notes"]);
  };

  const exportMetricsPDF = () => {
    const headers = ["Metric Code", "Metric Name", "Type", "Data Value", "Status", "Notes"];
    exportToPDF(`NAAC SSR Report: ${getCriterionTitle()}`, metrics, `NAAC_Criterion_${criterionNumber}_Metrics`, headers, ["metric_code", "metric_name", "metric_type", "data_value", "status", "notes"]);
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const getCriterionTitle = () => {
    const titles = [
      'Criterion 1: Curricular Aspects',
      'Criterion 2: Teaching-Learning & Evaluation',
      'Criterion 3: Research, Innovations & Extension',
      'Criterion 4: Infrastructure & Learning Resources',
      'Criterion 5: Student Support & Progression',
      'Criterion 6: Governance, Leadership & Management',
      'Criterion 7: Institutional Values & Best Practices'
    ];
    return titles[criterionNumber - 1] || 'Accreditation Criteria Details';
  };

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savingNarrative, setSavingNarrative] = useState(false);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/naac/criteria?criterion_number=${criterionNumber}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const critObj = Array.isArray(data.criteria) ? data.criteria.find((c: any) => c.criterion_number === criterionNumber) || data.criteria[0] : null;
        const loadedMetrics = critObj?.naac_metrics || critObj?.metrics || [];
        setMetrics(loadedMetrics);
      } else {
        setFetchError(data.error || `Unable to load Criterion ${criterionNumber} metrics.`);
        setMetrics([]);
      }
    } catch (err: any) {
      console.error('Error loading criteria metrics', err);
      setFetchError(err?.message || `Unable to load Criterion ${criterionNumber} metrics from server.`);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, [criterionNumber]);

  useEffect(() => {
    loadMetrics();
    setAiDraft('');
  }, [loadMetrics]);

  const handleUpdateMetric = async (metricId: string, value: string, notes: string) => {
    setSavingId(metricId);
    try {
      const res = await fetch(`/api/naac/metrics/${metricId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data_value: value, notes, status: 'completed' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(prev => prev.map(m => m.id === metricId ? { ...m, data_value: value, notes, status: 'completed' } : m));
        alert('Metric values updated and registered successfully.');
      } else {
        alert(data.error || 'Failed to update metric values in database.');
      }
    } catch (err: any) {
      console.error('Error updating metric', err);
      alert(`Metric update failed: ${err?.message || 'Network communication error.'}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleUploadDocument = (metricCode: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/*,.doc,.docx';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          // Construct real evidence object payload with actual uploaded filename
          const documentUrl = typeof window !== 'undefined' ? URL.createObjectURL(file) : `https://storage.iris365.edu/evidence/${file.name}`;
          const res = await fetch('/api/naac/documents/upload', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              criterion: `Criterion ${criterionNumber}`,
              document_name: file.name || `Evidence_${metricCode}_SIET.pdf`,
              document_url: documentUrl,
              academic_year: '2026-27'
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            alert(`Evidence file "${file.name}" successfully uploaded and attached to Metric ${metricCode}.`);
          } else {
            alert(data.error || 'Failed to upload evidence document to server.');
          }
        } catch (err: any) {
          console.error('Error uploading document', err);
          alert(`Document upload failed: ${err?.message || 'Network communication error.'}`);
        }
      }
    };
    input.click();
  };

  const generateAiNarrative = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/naac/ai/draft-narrative/${criterionNumber}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiDraft(data.draft);
      } else {
        alert(data.error || 'AI narrative draft generation failed.');
      }
    } catch (err: any) {
      console.error('AI draft error', err);
      alert(`AI narrative draft error: ${err?.message || 'Network communication error.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveNarrative = async () => {
    if (!aiDraft) return;
    setSavingNarrative(true);
    try {
      const res = await fetch('/api/naac/narrative/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          criterion_number: criterionNumber,
          draft: aiDraft
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Criterion ${criterionNumber} narrative draft saved to official SSR documentation.`);
      } else {
        alert(data.error || 'Failed to save narrative draft.');
      }
    } catch (err: any) {
      console.error('Error saving narrative', err);
      alert(`Save narrative error: ${err?.message || 'Network communication error.'}`);
    } finally {
      setSavingNarrative(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Criteria Quick Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
        {Array.from({ length: 7 }, (_, i) => (
          <Link
            key={i}
            href={`/iqac/criteria/${i + 1}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              criterionNumber === i + 1
                ? 'bg-[#6C2BD9] text-white border-[#8B5CF6]/50 shadow-lg shadow-[#6C2BD9]/15'
                : 'bg-[#13102A] text-[#C4B5FD] border-white/5 hover:bg-white/5'
            }`}
          >
            Criterion {i + 1}
          </Link>
        ))}
      </div>

      {/* Header Banner */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <span>⚠️ {fetchError}</span>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Self-Study Report Metrics Form</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{getCriterionTitle()}</h1>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={exportMetricsCSV}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#C4B5FD] font-bold hover:bg-white/10 transition-all"
          >
            Export CSV
          </button>
          <button 
            onClick={exportMetricsPDF}
            className="px-3.5 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs text-white font-bold transition-all shadow-lg shadow-[#6C2BD9]/20"
          >
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading criteria metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main forms list */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {metrics.map(metric => (
              <div key={metric.id} className="glass-panel border border-[#6C2BD9]/20 rounded-2xl p-5 bg-[#13102A]/40 flex flex-col gap-4 relative">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <span className="text-[10px] font-bold text-[#A78BFA] font-mono">METRIC {metric.metric_code}</span>
                    <h4 className="text-xs font-extrabold text-white leading-normal">{metric.metric_name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold flex-shrink-0 border ${
                    metric.metric_type === 'quantitative'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {metric.metric_type}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#C4B5FD]/70 font-semibold">Data value / Performance Index</label>
                    <input
                      type="text"
                      className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6] font-medium"
                      defaultValue={metric.data_value}
                      id={`val-${metric.id}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#C4B5FD]/70 font-semibold">Audit Notes / Comments</label>
                    <input
                      type="text"
                      className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6] font-medium"
                      defaultValue={metric.notes}
                      id={`notes-${metric.id}`}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
                  <button
                    onClick={() => handleUploadDocument(metric.metric_code)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-[#C4B5FD] font-bold text-[10px] hover:bg-white/10 transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Evidence PDF
                  </button>
                  
                  <button
                    onClick={() => {
                      const valInput = document.getElementById(`val-${metric.id}`) as HTMLInputElement;
                      const notesInput = document.getElementById(`notes-${metric.id}`) as HTMLInputElement;
                      handleUpdateMetric(metric.id, valInput?.value || '', notesInput?.value || '');
                    }}
                    disabled={savingId === metric.id}
                    className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-[10px] transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingId === metric.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Save Metric
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right column: Claude Narrative generator */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/20 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-[#8B5CF6]" />
              <span>AI Narrative Builder</span>
            </h3>
            
            <p className="text-xs text-[#C4B5FD]/75 leading-relaxed">
              Generate self-study qualitative drafts for Criterion {criterionNumber} directly aligned with your uploaded evidence parameters and metrics entries.
            </p>

            <button
              onClick={generateAiNarrative}
              disabled={aiLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Drafting qualitative report...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Draft Narrative with Claude
                </>
              )}
            </button>

            {aiDraft && (
              <div className="flex flex-col gap-3 mt-4">
                <h4 className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider">Claude SSR Draft Proposal</h4>
                <textarea
                  rows={8}
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-3.5 text-[10px] leading-relaxed text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={aiDraft}
                  onChange={e => setAiDraft(e.target.value)}
                />
                <button
                  onClick={handleSaveNarrative}
                  disabled={savingNarrative}
                  className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  {savingNarrative ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Draft Narrative
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
