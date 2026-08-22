"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, Tag, Eye, X, Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', category: 'Academic' });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await apiGet('campusCore/notices');
      if (res.success) {
        setNotices(res.notices || []);
      }
    } catch (err) {
      console.error(err);
    } fontally: () => {};
    setLoading(false);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return;
    setCreating(true);
    try {
      const res = await apiPost('campusCore/notices', newNotice);
      if (res.success) {
        alert('Notice published successfully!');
        setShowCreateModal(false);
        setNewNotice({ title: '', content: '', category: 'Academic' });
        loadNotices();
      } else {
        alert(res.error || 'Failed to publish notice.');
      }
    } catch (err: any) {
      alert(err.message || 'Error publishing notice.');
    } finally {
      setCreating(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Event: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      Academic: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      HR: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      General: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    };
    return colors[cat] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Notices Board...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-violet-400" /> Notices Board
          </h1>
          <p className="text-sm text-[#C4B5FD]/60 mt-1">School notices, circulars, and announcements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all"
        >
          <Plus size={14} /> Publish Circular
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <FileText size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-sm text-slate-300 font-medium">No notices published yet.</p>
          <p className="text-xs text-slate-500 mt-1">Circulars published by administrators or vice principals will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} onClick={() => setSelectedNotice(n)}
              className="bg-white/5 rounded-xl border border-white/10 p-4 cursor-pointer hover:bg-white/[0.07] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{n.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    By {n.author_name || n.author || 'Administration'} · {new Date(n.published_at || n.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold ${getCategoryColor(n.category || 'General')}`}>
                  {n.category || 'General'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setSelectedNotice(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold ${getCategoryColor(selectedNotice.category || 'General')}`}>
              {selectedNotice.category || 'General'}
            </span>
            <h3 className="font-bold text-base text-white mt-2">{selectedNotice.title}</h3>
            <p className="text-[10px] text-slate-400 mt-1">
              By {selectedNotice.author_name || selectedNotice.author || 'Administration'} · {new Date(selectedNotice.published_at || selectedNotice.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</p>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-bold text-base text-white mb-4">Publish Notice / Circular</h3>
            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="e.g. Mid-Term Examination Schedule"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Category</label>
                <select
                  value={newNotice.category}
                  onChange={e => setNewNotice({ ...newNotice, category: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500"
                >
                  <option value="Academic">Academic</option>
                  <option value="Event">Event</option>
                  <option value="HR">HR</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#C4B5FD] mb-1">Content</label>
                <textarea
                  required
                  rows={5}
                  value={newNotice.content}
                  onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
                  placeholder="Write the full notice details here..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] text-white text-xs font-bold disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
