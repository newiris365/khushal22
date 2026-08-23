"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ScanLine, Search, CheckCircle2, XCircle, AlertTriangle, Users,
  UserCheck, Shield, Clock, Eye
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function SecurityGatePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // Visitor passes & Gate Activity
  const [visitors, setVisitors] = useState<any[]>([]);
  const [showVisitors, setShowVisitors] = useState(false);
  const [gateLogs, setGateLogs] = useState<any[]>([]);
  const [logSuccessMsg, setLogSuccessMsg] = useState('');
  const [logErrorMsg, setLogErrorMsg] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    loadGateActivity();
  }, []);

  const loadGateActivity = async () => {
    try {
      const res = await apiGet('campusCore/gate/entry-logs');
      if (res && res.success) {
        setGateLogs(res.logs || []);
      } else {
        setFetchError(res?.error || 'Unable to load today gate activity logs.');
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err?.message || 'Unable to load gate activity logs from server.');
    }
  };

  const handleScan = async () => {
    if (!searchQuery.trim()) return;
    setIsScanning(true);
    setError('');
    setLogSuccessMsg('');
    setLogErrorMsg('');
    setScanResult(null);
    try {
      const res = await apiGet(`campusCore/gate/scan/${encodeURIComponent(searchQuery.trim())}`);
      if (res && res.success) {
        setScanResult(res);
        setRecentScans([{ ...res, query: searchQuery, time: new Date().toISOString() }, ...recentScans.slice(0, 9)]);
      } else {
        setError(res?.error || 'Scan lookup failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Scan lookup failed due to network error.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogMovement = async (direction: 'entry' | 'exit') => {
    if (!scanResult?.person) return;
    setIsLogging(true);
    setLogSuccessMsg('');
    setLogErrorMsg('');
    try {
      const res = await apiPost('campusCore/gate/log-entry', {
        person_id: scanResult.person.student_roll || scanResult.person.user_id,
        user_id: scanResult.person.user_id,
        person_name: scanResult.person.full_name,
        person_type: scanResult.person.person_type || 'student',
        gate_number: 'Gate 1',
        direction
      });

      if (res && res.success) {
        setLogSuccessMsg(`Successfully logged ${direction.toUpperCase()} for ${scanResult.person.full_name}!`);
        loadGateActivity();
      } else {
        setLogErrorMsg(res?.error || `Failed to log ${direction}.`);
      }
    } catch (err: any) {
      setLogErrorMsg(err?.message || `Failed to log ${direction} due to network error.`);
    } finally {
      setIsLogging(false);
    }
  };

  const loadVisitors = async () => {
    setFetchError(null);
    try {
      const res = await apiGet('campusCore/gate/visitors-today');
      if (res && res.success) {
        setVisitors(res.visitors || []);
      } else {
        setFetchError(res?.error || 'Unable to load visitor passes.');
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Unable to load visitor passes from server.');
    }
    setShowVisitors(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleScan();
  };

  const isRestricted = scanResult?.restriction?.is_restricted;
  const personFound = scanResult?.found;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ScanLine size={24} className="text-emerald-400" />
        Gate Scanner
      </h1>

      {/* Search / Scan Input */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan ID, enter roll number, name, email, or phone..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-white text-lg"
              autoFocus
            />
          </div>
          <button onClick={handleScan} disabled={isScanning || !searchQuery.trim()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 flex items-center gap-2 disabled:opacity-50 text-lg font-medium">
            <ScanLine size={20} /> {isScanning ? 'Scanning...' : 'Scan'}
          </button>
          <button onClick={loadVisitors}
            className="px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 flex items-center gap-2 text-sm">
            <Users size={18} /> Visitors
          </button>
        </div>
      </div>

      {/* Scan Result */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 flex items-center gap-2"><XCircle size={18} /> {error}</p>
        </div>
      )}

      {scanResult && personFound && (
        <div className={`rounded-xl border p-6 ${
          isRestricted ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          {isRestricted && (
            <div className="bg-red-600/20 rounded-lg p-4 mb-4 flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-400" />
              <div>
                <p className="text-red-400 font-bold text-lg">⚠ BLACKLISTED / RESTRICTED</p>
                <p className="text-red-300 text-sm">
                  {scanResult.restriction.type}: {scanResult.restriction.reason}
                  {scanResult.restriction.valid_until && ` (until ${scanResult.restriction.valid_until})`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            {scanResult.person?.photo_url ? (
              <Image src={scanResult.person.photo_url} alt="" width={64} height={64} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-2xl font-bold text-white">
                {scanResult.person?.full_name?.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${isRestricted ? 'text-red-400' : 'text-white'}`}>
                {scanResult.person?.full_name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <p className="text-xs text-slate-400">Role</p>
                  <p className="text-sm font-medium text-white">{scanResult.person?.role}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="text-sm font-medium text-white capitalize">{scanResult.person?.person_type}</p>
                </div>
                {scanResult.person?.student_roll && (
                  <div>
                    <p className="text-xs text-slate-400">Roll Number</p>
                    <p className="text-sm font-medium text-white">{scanResult.person?.student_roll}</p>
                  </div>
                )}
                {scanResult.person?.department && (
                  <div>
                    <p className="text-xs text-slate-400">Department</p>
                    <p className="text-sm font-medium text-white">{scanResult.person?.department}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className={`text-sm font-medium ${scanResult.person?.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                    {scanResult.person?.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              {isRestricted ? (
                <XCircle size={48} className="text-red-400" />
              ) : (
                <CheckCircle2 size={48} className="text-emerald-400" />
              )}
            </div>
          </div>

          {scanResult.visitor_pass && (
            <div className="mt-4 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
              <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
                <Users size={16} /> Approved Visitor Pass
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Pass for {scanResult.visitor_pass.visitor_name} — Status: {scanResult.visitor_pass.approval_status}
              </p>
            </div>
          )}

          {/* Explicit Entry / Exit Logging Controls */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Record Gate Movement for {scanResult.person?.full_name}</p>
              <p className="text-xs text-slate-400">Select direction to persist log to gate_entry_logs</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleLogMovement('entry')}
                disabled={isLogging}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <span>↓</span> Log ENTRY
              </button>
              <button
                onClick={() => handleLogMovement('exit')}
                disabled={isLogging}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <span>↑</span> Log EXIT
              </button>
            </div>
          </div>

          {logSuccessMsg && (
            <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold">
              {logSuccessMsg}
            </div>
          )}
          {logErrorMsg && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold">
              {logErrorMsg}
            </div>
          )}
        </div>
      )}

      {scanResult && !personFound && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
          <Eye size={40} className="mx-auto mb-3 text-amber-400" />
          <p className="text-amber-400 font-semibold">{scanResult.message || 'Person not found in system.'}</p>
          <p className="text-sm text-slate-400 mt-1">Try a different identifier or check the visitor passes.</p>
        </div>
      )}

      {/* Visitor Passes Panel */}
      {showVisitors && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={18} className="text-amber-400" /> Today&apos;s Approved Visitors
            </h2>
            <button onClick={() => setShowVisitors(false)} className="text-slate-400 hover:text-white text-sm">Close</button>
          </div>
          {visitors.length === 0 ? (
            <p className="text-slate-400 text-sm">No visitor passes found for today.</p>
          ) : (
            <div className="space-y-2">
              {visitors.map((v: any) => (
                <div key={v.id} className={`flex items-center justify-between rounded-lg p-3 border ${
                  v.approval_status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  v.approval_status === 'pending' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-white/5 border-white/5'
                }`}>
                  <div>
                    <p className="text-sm font-medium text-white">{v.visitor_name}</p>
                    <p className="text-xs text-slate-400">
                      Visiting: {v.student_name} ({v.student_roll}) — Room {v.room_number || '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {v.relation} — {v.visit_purpose || 'No purpose stated'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      v.approval_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      v.approval_status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {v.approval_status}
                    </span>
                    {v.expected_time && (
                      <p className="text-xs text-slate-400 mt-1">Expected: {new Date(v.expected_time).toLocaleTimeString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>⚠️ {fetchError}</span>
        </div>
      )}

      {/* Today's Gate Activity Log */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-400" /> Today&apos;s Gate Activity Log
          </h2>
          <button onClick={loadGateActivity} className="text-xs text-[#C4B5FD] hover:text-white flex items-center gap-1">
            Refresh Log
          </button>
        </div>
        {gateLogs.length === 0 ? (
          <p className="text-slate-400 text-sm">No person movement logs recorded yet today.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {gateLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5 text-sm">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    log.direction === 'entry' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {log.direction === 'entry' ? '↓ ENTRY' : '↑ EXIT'}
                  </span>
                  <div>
                    <span className="text-white font-medium">{log.person_name}</span>
                    <span className="text-xs text-slate-400 ml-2">({log.person_type} {log.person_id ? `• ${log.person_id}` : ''})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-300 font-medium">{log.gate_number || 'Gate 1'}</span>
                  <p className="text-[10px] text-slate-400">{new Date(log.scanned_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" /> Recent Scans
          </h2>
          <div className="space-y-2">
            {recentScans.map((scan, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/5 text-sm">
                <div className="flex items-center gap-2">
                  {scan.found ? (
                    scan.restriction?.is_restricted ? (
                      <XCircle size={14} className="text-red-400" />
                    ) : (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    )
                  ) : (
                    <Eye size={14} className="text-amber-400" />
                  )}
                  <span className="text-white">{scan.person?.full_name || scan.query}</span>
                  {scan.person?.student_roll && (
                    <span className="text-slate-400">({scan.person.student_roll})</span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{new Date(scan.time).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
