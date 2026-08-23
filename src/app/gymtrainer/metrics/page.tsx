"use client";

import React, { useState } from 'react';
import { 
  Activity, Scale, Ruler, HeartPulse, CheckCircle2, AlertCircle, RefreshCw, UserCheck
} from 'lucide-react';
import { apiPost } from '@/lib/api';

export default function LogFitnessMetricsPage() {
  const [studentId, setStudentId] = useState('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [bodyFatPc, setBodyFatPc] = useState<string>('');
  const [chestCm, setChestCm] = useState<string>('');
  const [waistCm, setWaistCm] = useState<string>('');
  const [hipsCm, setHipsCm] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loggedRecord, setLoggedRecord] = useState<any | null>(null);

  // Live BMI calculation
  const weightNum = parseFloat(weightKg);
  const heightNum = parseFloat(heightCm);
  let liveBmi: number | null = null;
  if (!isNaN(weightNum) && !isNaN(heightNum) && heightNum > 0) {
    const hMeter = heightNum / 100;
    liveBmi = parseFloat((weightNum / (hMeter * hMeter)).toFixed(2));
  }

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-400' };
    if (bmi < 25.0) return { label: 'Normal / Healthy', color: 'text-emerald-400' };
    if (bmi < 30.0) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'Obese', color: 'text-rose-400' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoggedRecord(null);

    if (!studentId.trim()) {
      setError('Student ID is required.');
      return;
    }
    if (!weightKg || isNaN(weightNum) || weightNum <= 0) {
      setError('Please enter a valid weight in kg.');
      return;
    }
    if (!heightCm || isNaN(heightNum) || heightNum <= 0) {
      setError('Please enter a valid height in cm.');
      return;
    }

    setLoading(true);

    const payload: any = {
      student_id: studentId.trim(),
      weight_kg: weightNum,
      height_cm: heightNum
    };

    if (bodyFatPc) payload.body_fat_percent = parseFloat(bodyFatPc);
    if (chestCm) payload.chest_cm = parseFloat(chestCm);
    if (waistCm) payload.waist_cm = parseFloat(waistCm);
    if (hipsCm) payload.hips_cm = parseFloat(hipsCm);
    if (notes.trim()) payload.notes = notes.trim();

    try {
      const res = await apiPost('/fitzone/gym/metrics', payload);
      if (res.success) {
        setSuccess('Fitness metrics logged successfully!');
        setLoggedRecord(res.metrics);
        // Reset inputs
        setWeightKg('');
        setHeightCm('');
        setBodyFatPc('');
        setChestCm('');
        setWaistCm('');
        setHipsCm('');
        setNotes('');
      } else {
        setError(res.error || 'Failed to log fitness metrics.');
      }
    } catch {
      setError('An error occurred while connecting to fitzone service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="bg-[#13102A]/85 backdrop-blur-md p-6 rounded-3xl border border-[#10B981]/30 shadow-xl">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
          <Activity className="w-7 h-7 text-[#10B981]" />
          Log Student Fitness Metrics
        </h1>
        <p className="text-xs text-[#10B981]/70 mt-1">
          Record student weight, height, body fat, measurements, and track BMI progress automatically.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-[#13102A]/60 backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-2">
            1. Student Identification
          </h2>
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Student ID (UUID) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. s0000000-0000-0000-0000-000000000001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-[#0D0A1A] border border-[#10B981]/30 py-2.5 px-4 rounded-xl text-xs text-white outline-none focus:border-[#10B981] font-mono"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-2">
            2. Core Physical Metrics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" /> Weight (kg) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 72.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-4 rounded-xl text-xs text-white outline-none focus:border-[#10B981] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-emerald-400" /> Height (cm) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="e.g. 175.0"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-4 rounded-xl text-xs text-white outline-none focus:border-[#10B981] font-mono"
              />
            </div>
          </div>

          {/* Live BMI Indicator */}
          {liveBmi !== null && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-semibold text-white/70">Calculated Body Mass Index (BMI):</span>
              <div className="text-right">
                <span className="text-xl font-black font-mono text-emerald-400">{liveBmi}</span>
                <span className={`block text-[10px] font-bold ${getBmiCategory(liveBmi).color}`}>
                  {getBmiCategory(liveBmi).label}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-2">
            3. Body Composition & Measurements (Optional)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 16.5"
                value={bodyFatPc}
                onChange={(e) => setBodyFatPc(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3 rounded-xl text-xs text-white outline-none focus:border-[#10B981] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Chest (cm)</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 98.0"
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3 rounded-xl text-xs text-white outline-none focus:border-[#10B981] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Waist (cm)</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 82.0"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3 rounded-xl text-xs text-white outline-none focus:border-[#10B981] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Hips (cm)</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 95.0"
                value={hipsCm}
                onChange={(e) => setHipsCm(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3 rounded-xl text-xs text-white outline-none focus:border-[#10B981] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Trainer Notes / Assessment</label>
            <textarea
              rows={3}
              placeholder="e.g. Good progress on strength gain. Recommend increasing cardio by 15 mins..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-4 rounded-xl text-xs text-white outline-none focus:border-[#10B981]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          Log Metrics Record
        </button>
      </form>

      {/* Logged Record Summary */}
      {loggedRecord && (
        <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-3xl border border-emerald-500/30 space-y-3">
          <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Last Logged Record Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-[#0D0A1A] rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px]">WEIGHT</span>
              <span className="text-white font-bold">{loggedRecord.weight_kg} kg</span>
            </div>
            <div className="p-3 bg-[#0D0A1A] rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px]">HEIGHT</span>
              <span className="text-white font-bold">{loggedRecord.height_cm} cm</span>
            </div>
            <div className="p-3 bg-[#0D0A1A] rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px]">BMI</span>
              <span className="text-emerald-400 font-bold">{loggedRecord.bmi}</span>
            </div>
            <div className="p-3 bg-[#0D0A1A] rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px]">BODY FAT</span>
              <span className="text-white font-bold">{loggedRecord.body_fat_percent || 'N/A'}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
