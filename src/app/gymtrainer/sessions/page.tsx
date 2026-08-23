"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, User, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Filter, Check, X, FileText
} from 'lucide-react';
import { apiGet, apiPut } from '@/lib/api';

interface TrainerSession {
  id: string;
  trainer_id: string;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number;
  session_type: string;
  status: 'scheduled' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  students?: {
    name?: string;
    roll_number?: string;
    departments?: { name: string } | null;
  };
}

export default function TrainerSessionsPage() {
  const [trainerIdInput, setTrainerIdInput] = useState('');
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Status Filter
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Notes state per modal/session
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  const fetchSessions = async (tid?: string) => {
    const idToFetch = tid || trainerIdInput.trim();
    if (!idToFetch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/fitzone/gym/trainer-sessions/${idToFetch}`);
      if (res.success && Array.isArray(res.sessions)) {
        setSessions(res.sessions);
      } else {
        setError(res.error || 'Failed to load trainer sessions.');
        setSessions([]);
      }
    } catch {
      setError('Connection error while fetching trainer sessions.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId: string, newStatus: string, notes?: string) => {
    setActionLoading(sessionId);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiPut(`/fitzone/gym/trainer-sessions/${sessionId}/status`, {
        status: newStatus,
        notes: notes || sessionNotes
      });
      if (res.success) {
        setSuccess(`Session marked as ${newStatus}!`);
        setEditingSessionId(null);
        setSessionNotes('');
        await fetchSessions();
      } else {
        setError(res.error || 'Failed to update session status.');
      }
    } catch {
      setError('Error occurred while updating session status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSessions = selectedStatus === 'all' 
    ? sessions 
    : sessions.filter(s => s.status === selectedStatus);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="bg-[#13102A]/85 backdrop-blur-md p-6 rounded-3xl border border-[#10B981]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-[#10B981]" />
            Personal Trainer Sessions Management
          </h1>
          <p className="text-xs text-[#10B981]/70 mt-1">
            Accept, reject, complete, or reschedule 1-on-1 personal training sessions.
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); fetchSessions(); }} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Enter Trainer ID..."
            value={trainerIdInput}
            onChange={(e) => setTrainerIdInput(e.target.value)}
            className="bg-[#0D0A1A] border border-[#10B981]/30 py-2 px-3.5 rounded-xl text-xs text-white outline-none focus:border-[#10B981] w-full md:w-56"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shrink-0 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Load Sessions
          </button>
        </form>
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

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'scheduled', 'accepted', 'completed', 'rejected', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              selectedStatus === st
                ? 'bg-[#10B981] text-white shadow-lg shadow-emerald-950/40'
                : 'bg-[#13102A]/60 border border-white/5 text-white/60 hover:bg-white/5'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-white/50 bg-[#13102A]/40 rounded-3xl border border-white/5 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#10B981]" /> Fetching trainer sessions...
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-[#13102A]/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-[#10B981]/20 text-[#10B981]">
                    {session.session_type.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      session.status === 'accepted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : session.status === 'completed'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : session.status === 'rejected' || session.status === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm">{session.students?.name || 'Student Client'}</h3>
                  <p className="text-[11px] text-white/50 font-mono">
                    Roll: {session.students?.roll_number || 'N/A'} • {session.students?.departments?.name || 'Student'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <Clock className="w-4 h-4" />
                  {new Date(session.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} ({session.duration_minutes}m)
                </div>

                {session.notes && (
                  <p className="text-xs text-white/70 italic bg-white/5 p-2.5 rounded-xl border border-white/5">
                    &quot;{session.notes}&quot;
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                {session.status === 'scheduled' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(session.id, 'accepted')}
                      disabled={actionLoading === session.id}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(session.id, 'rejected')}
                      disabled={actionLoading === session.id}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}

                {session.status === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(session.id, 'completed')}
                    disabled={actionLoading === session.id}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                  </button>
                )}

                {(session.status === 'accepted' || session.status === 'scheduled') && (
                  <button
                    onClick={() => {
                      const notesPrompt = prompt('Enter notes or cancellation reason:', session.notes || '');
                      if (notesPrompt !== null) {
                        handleUpdateStatus(session.id, 'cancelled', notesPrompt);
                      }
                    }}
                    disabled={actionLoading === session.id}
                    className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold rounded-xl text-[11px] transition-all"
                  >
                    Cancel Session
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-white/50 bg-[#13102A]/40 rounded-3xl border border-white/5 space-y-2">
          <AlertCircle className="w-8 h-8 text-white/30 mx-auto" />
          <p className="font-semibold text-white">No Sessions Found</p>
          <p>Enter a valid Trainer ID above or check filters to load scheduled sessions.</p>
        </div>
      )}
    </div>
  );
}
