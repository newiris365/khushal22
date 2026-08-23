"use client";

import React, { useState, useEffect } from 'react';
import { 
  Video, PlayCircle, Plus, Clock, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

interface VirtualClass {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: 'Cardio' | 'HIIT' | 'Strength' | 'Yoga' | 'Stretch';
  is_live?: boolean;
  scheduled_at?: string;
  created_at?: string;
}

export default function VirtualClassesPage() {
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Cardio' | 'HIIT' | 'Strength' | 'Yoga' | 'Stretch'>('HIIT');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet('/fitzone/gym/classes');
      if (res.success && Array.isArray(res.classes)) {
        setClasses(res.classes);
      } else {
        setError(res.error || 'Failed to load virtual classes.');
      }
    } catch {
      setError('Connection error while fetching virtual classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('Class title is required.');
      return;
    }

    setFormLoading(true);

    const payload: any = {
      title: title.trim(),
      category,
      difficulty,
      duration_minutes: Number(durationMinutes) || 45,
      is_live: isLive
    };

    if (description.trim()) payload.description = description.trim();
    if (videoUrl.trim()) payload.video_url = videoUrl.trim();
    if (thumbnailUrl.trim()) payload.thumbnail_url = thumbnailUrl.trim();
    if (scheduledAt.trim()) payload.scheduled_at = new Date(scheduledAt).toISOString();

    try {
      const res = await apiPost('/fitzone/gym/classes', payload);
      if (res.success) {
        setSuccess('Virtual class published successfully!');
        setShowCreateModal(false);
        // Reset form
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setThumbnailUrl('');
        setScheduledAt('');
        await fetchClasses();
      } else {
        setError(res.error || 'Failed to create virtual class.');
      }
    } catch {
      setError('An error occurred while creating class.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="bg-[#13102A]/85 backdrop-blur-md p-6 rounded-3xl border border-[#10B981]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
            <Video className="w-7 h-7 text-[#10B981]" />
            Virtual Classes & Live Streams
          </h1>
          <p className="text-xs text-[#10B981]/70 mt-1">
            Create, schedule and publish live gym workout sessions & recorded virtual training classes.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Virtual Class
        </button>
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

      {/* Classes Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-white/50 bg-[#13102A]/40 rounded-3xl border border-white/5 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#10B981]" /> Loading virtual classes...
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-[#13102A]/60 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#10B981]/50 transition-all shadow-xl"
            >
              <div className="relative aspect-video bg-[#0D0A1A] flex items-center justify-center border-b border-white/10">
                {cls.thumbnail_url ? (
                  /* eslint-disable-next-html-img-for-jsx-a11y */
                  <img src={cls.thumbnail_url} alt={cls.title} className="w-full h-full object-cover" />
                ) : (
                  <PlayCircle className="w-12 h-12 text-[#10B981]/60" />
                )}
                {cls.is_live && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" /> LIVE NOW
                  </span>
                )}
                <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white font-mono text-[10px] px-2 py-0.5 rounded-lg border border-white/10">
                  {cls.duration_minutes || 45} mins
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                    {cls.category || 'Fitness'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-white/5 text-white/70 border border-white/10">
                    {cls.difficulty || 'Intermediate'}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{cls.title}</h3>
                {cls.description && (
                  <p className="text-xs text-white/60 line-clamp-2">{cls.description}</p>
                )}

                {cls.scheduled_at && (
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    Scheduled: {new Date(cls.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#0D0A1A]/40 border-t border-white/5 flex gap-2">
                <a
                  href={cls.video_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-[#10B981]/20 hover:bg-[#10B981] text-[#10B981] hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4" /> Stream Video Class
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-white/50 bg-[#13102A]/40 rounded-3xl border border-white/5 space-y-2">
          <Video className="w-8 h-8 text-white/30 mx-auto" />
          <p className="font-semibold text-white">No Virtual Classes Created</p>
          <p>Click &quot;Create Virtual Class&quot; above to add your first workout class.</p>
        </div>
      )}

      {/* Modal to Create Class */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13102A] border border-[#10B981]/30 rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-[#10B981]" /> Create New Virtual Class
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-white/70 mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Body HIIT Burnout"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3.5 rounded-xl text-white outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-white/70 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3 rounded-xl text-white outline-none focus:border-[#10B981]"
                  >
                    <option value="Cardio">Cardio</option>
                    <option value="HIIT">HIIT</option>
                    <option value="Strength">Strength</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Stretch">Stretch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-white/70 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3 rounded-xl text-white outline-none focus:border-[#10B981]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-white/70 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3.5 rounded-xl text-white outline-none focus:border-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-white/70 mb-1">Scheduled Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3 rounded-xl text-white outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-white/70 mb-1">Video Stream / HLS URL</label>
                <input
                  type="url"
                  placeholder="https://stream.mux.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3.5 rounded-xl text-white outline-none focus:border-[#10B981] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/70 mb-1">Thumbnail Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3.5 rounded-xl text-white outline-none focus:border-[#10B981] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/70 mb-1">Class Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the workout goals, intensity level, and equipment needed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 py-2.5 px-3.5 rounded-xl text-white outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isLiveCheckbox"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                  className="w-4 h-4 accent-[#10B981]"
                />
                <label htmlFor="isLiveCheckbox" className="font-semibold text-white cursor-pointer">
                  Mark as Live Stream Broadcast
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  {formLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Publish Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
