"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Search, RefreshCw, FileText, User, AlertCircle, Clock } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import { useAcademic } from '../AcademicContext';

interface DiaryEntry {
  id: string;
  date: string;
  homework?: string;
  entry_text?: string;
  class_section_id?: string;
  users?: {
    name: string;
  };
  created_at?: string;
}

export default function StudentDiaryPage() {
  const { studentProfile, loading: profileLoading } = useAcademic();
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'homework' | 'notes'>('all');

  useEffect(() => {
    fetchDiary();
  }, []);

  const fetchDiary = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await apiGet('/school/diary');
      if (res.success && Array.isArray(res.diaries)) {
        setDiaries(res.diaries);
      } else if (res.success && Array.isArray(res.data)) {
        setDiaries(res.data);
      } else {
        setFetchError(true);
        setDiaries([]);
      }
    } catch (err) {
      console.error('Failed to fetch school diary entries:', err);
      setFetchError(true);
      setDiaries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = diaries.filter(entry => {
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'homework' && entry.homework && entry.homework.trim() !== '') ||
      (filterType === 'notes' && entry.entry_text && entry.entry_text.trim() !== '');

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (entry.homework && entry.homework.toLowerCase().includes(query)) ||
      (entry.entry_text && entry.entry_text.toLowerCase().includes(query)) ||
      (entry.users?.name && entry.users.name.toLowerCase().includes(query)) ||
      (entry.date && entry.date.includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Homework & Daily Diary</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">
                Track your daily subject homework, class notes, and teacher announcements.
              </p>
            </div>
          </div>

          <button
            onClick={fetchDiary}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#C4B5FD] hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
            <input
              type="text"
              placeholder="Search homework, teacher, or topic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#13102A] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#C4B5FD]/40 focus:outline-none focus:border-[#06B6D4]/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#13102A] p-1 rounded-xl border border-white/10 shrink-0">
            {(['all', 'homework', 'notes'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filterType === type
                    ? 'bg-[#06B6D4] text-white shadow-md'
                    : 'text-[#C4B5FD]/60 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All Entries' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Diary Content List */}
        <div className="flex flex-col gap-4">
          {fetchError && (
            <div className="glass-panel rounded-2xl p-5 border border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">Couldn't load your diary entries — the server may be unreachable.</p>
              </div>
              <button
                onClick={fetchDiary}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold hover:bg-red-500/30 transition-all"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-[#C4B5FD]/40 text-xs">
              <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-[#06B6D4]" />
              Loading diary entries...
            </div>
          ) : filteredEntries.length === 0 && !fetchError ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-[#C4B5FD]/40 text-xs italic">
              No homework or diary entries found matching your criteria.
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.id}
                className="glass-panel rounded-2xl p-6 border border-white/5 hover:border-[#06B6D4]/30 transition-all flex flex-col gap-4"
              >
                {/* Entry Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#06B6D4]" />
                    <span className="font-bold text-sm text-white">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {entry.users?.name && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#C4B5FD]/70 bg-white/5 px-2.5 py-1 rounded-lg">
                      <User className="w-3 h-3 text-[#A78BFA]" />
                      <span>{entry.users.name}</span>
                    </div>
                  )}
                </div>

                {/* Homework Section */}
                {entry.homework && entry.homework.trim() !== '' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">
                      Homework
                    </span>
                    <p className="text-xs text-white/90 leading-relaxed font-light whitespace-pre-wrap pl-1">
                      {entry.homework}
                    </p>
                  </div>
                )}

                {/* Teacher Note / Circular Section */}
                {entry.entry_text && entry.entry_text.trim() !== '' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 px-2 py-0.5 rounded w-fit">
                      Class Circular / Teacher Note
                    </span>
                    <p className="text-xs text-[#C4B5FD]/80 leading-relaxed font-light whitespace-pre-wrap pl-1">
                      {entry.entry_text}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
