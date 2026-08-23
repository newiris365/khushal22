"use client";

import React, { useState } from 'react';
import {
  AlertTriangle, Phone, MapPin, Send, CheckCircle2
} from 'lucide-react';
import { apiPost } from '../../../lib/api';

const INCIDENT_TYPES = [
  { value: 'breakdown', label: 'Breakdown', icon: '🔧', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'accident', label: 'Accident', icon: '💥', color: 'bg-red-500/20 text-red-400' },
  { value: 'traffic', label: 'Traffic Jam', icon: '🚗', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'medical', label: 'Medical Emergency', icon: '🏥', color: 'bg-red-600/20 text-red-300' },
  { value: 'other', label: 'Other', icon: '⚠️', color: 'bg-slate-500/20 text-slate-400' },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-emerald-400' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400' },
  { value: 'high', label: 'High', color: 'text-red-400' },
  { value: 'critical', label: 'Critical', color: 'text-red-300' },
];

export default function DriverEmergencyPage() {
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState('high');
  const [description, setDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [reportError, setReportError] = useState<string | null>(null);
  const [failureCount, setFailureCount] = useState(0);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error('Location error:', err);
        }
      );
    }
  };

  const handleReport = async () => {
    if (!incidentType || !description) return;
    setIsReporting(true);
    setResult(null);
    setReportError(null);

    // Get location if not already obtained
    if (!location) {
      getLocation();
    }

    try {
      const res = await apiPost('campusCore/driver/incident', {
        incident_type: incidentType,
        description,
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        severity,
      });
      if (res && res.success) {
        setResult(res);
        setIncidentType('');
        setDescription('');
        setFailureCount(0);
      } else {
        setReportError(res?.error || 'Emergency alert could not be sent to server dispatch.');
        setFailureCount(prev => prev + 1);
      }
    } catch (err: any) {
      console.error(err);
      setReportError(err?.message || 'Network failure! Emergency alert DID NOT reach the server dispatch.');
      setFailureCount(prev => prev + 1);
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <AlertTriangle size={24} className="text-red-400" />
        Report Emergency
      </h1>

      {result?.success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <p className="text-emerald-400 font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} /> Emergency Reported Successfully
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Admin and warden have been alerted with your location. Stay safe.
          </p>
        </div>
      )}

      {reportError && (
        <div className="bg-red-600/20 border-2 border-red-500 rounded-xl p-5 shadow-2xl space-y-4 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle size={28} className="text-red-400 flex-shrink-0 animate-bounce" />
              <div>
                <h3 className="text-red-300 font-extrabold text-lg uppercase tracking-wide">🚨 EMERGENCY BROADCAST FAILED TO SEND</h3>
                <p className="text-red-200 text-sm mt-1">{reportError}</p>
              </div>
            </div>
            <button
              onClick={handleReport}
              disabled={isReporting}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold shadow-lg flex-shrink-0"
            >
              {isReporting ? 'Retrying...' : '🔄 Retry Dispatch'}
            </button>
          </div>

          <div className="bg-red-950/80 border border-red-500/40 rounded-lg p-4 text-xs text-red-200 space-y-2">
            <p className="font-bold text-sm text-white uppercase flex items-center gap-2">
              <Phone size={16} className="text-red-400" /> CRITICAL: Call Direct Emergency Lines Immediately
            </p>
            <p className="text-slate-300">
              The automated dispatch system is offline or unreachable. Do not wait — call campus control directly:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-white text-xs">
              <div className="bg-red-900/40 p-2 rounded border border-red-500/30">
                <span className="text-slate-400 block text-[10px]">CAMPUS SECURITY</span>
                <a href="tel:+919876543210" className="text-amber-300 font-bold underline">+91 98765 43210</a>
              </div>
              <div className="bg-red-900/40 p-2 rounded border border-red-500/30">
                <span className="text-slate-400 block text-[10px]">TRANSPORT DESK</span>
                <a href="tel:+919876543211" className="text-amber-300 font-bold underline">+91 98765 43211</a>
              </div>
              <div className="bg-red-900/40 p-2 rounded border border-red-500/30">
                <span className="text-slate-400 block text-[10px]">POLICE CONTROL</span>
                <a href="tel:112" className="text-amber-300 font-bold underline">112</a>
              </div>
              <div className="bg-red-900/40 p-2 rounded border border-red-500/30">
                <span className="text-slate-400 block text-[10px]">AMBULANCE</span>
                <a href="tel:108" className="text-amber-300 font-bold underline">108</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Status */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${
        location ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'
      }`}>
        <MapPin size={20} className={location ? 'text-emerald-400' : 'text-amber-400'} />
        <div>
          <p className={`text-sm font-medium ${location ? 'text-emerald-400' : 'text-amber-400'}`}>
            {location ? 'Location Captured' : 'Location not captured'}
          </p>
          {location && (
            <p className="text-xs text-slate-400">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
          )}
        </div>
        {!location && (
          <button onClick={getLocation}
            className="ml-auto px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-500">
            Get Location
          </button>
        )}
      </div>

      {/* Incident Type Selection */}
      <div>
        <label className="text-sm text-slate-300 mb-2 block">What happened? *</label>
        <div className="grid grid-cols-2 gap-3">
          {INCIDENT_TYPES.map(t => (
            <button key={t.value} onClick={() => setIncidentType(t.value)}
              className={`p-4 rounded-xl border text-left transition-all ${
                incidentType === t.value
                  ? `${t.color} border-current`
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}>
              <span className="text-2xl">{t.icon}</span>
              <p className="text-sm font-medium text-white mt-1">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="text-sm text-slate-300 mb-2 block">Severity</label>
        <div className="flex gap-2">
          {SEVERITY_LEVELS.map(s => (
            <button key={s.value} onClick={() => setSeverity(s.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                severity === s.value ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm text-slate-300 mb-1 block">Description *</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm h-24"
          placeholder="Describe the situation in detail..." />
      </div>

      {/* Submit */}
      <button onClick={handleReport} disabled={isReporting || !incidentType || !description}
        className="w-full py-4 bg-red-600 text-white rounded-xl text-lg font-bold hover:bg-red-500 flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-red-500/20">
        <Send size={20} /> {isReporting ? 'Reporting...' : 'REPORT EMERGENCY'}
      </button>

      {/* Emergency Contacts */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Emergency Contacts</h3>
        <div className="space-y-2">
          {[
            { label: 'Admin Office', phone: '0291-XXX-XXXX' },
            { label: 'Campus Security', phone: '1800-XXX-XXXX' },
            { label: 'Police Control Room', phone: '100' },
            { label: 'Ambulance', phone: '108' },
          ].map(c => (
            <div key={c.label} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-sm text-slate-300">{c.label}</span>
              <a href={`tel:${c.phone}`} className="text-sm text-emerald-400 flex items-center gap-1">
                <Phone size={14} /> {c.phone}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
