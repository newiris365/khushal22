"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Search, Plus, Upload, X } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface Material {
  id: string;
  title: string;
  subject: string;
  category: string;
  file_url: string;
  file_type: string;
  download_count: number;
  uploaded_by_name: string;
  created_at: string;
}

const CATEGORIES = ['All', 'Notes', 'Lab Manual', 'Textbook', 'Video', 'PPT', 'Question Bank', 'Syllabus'];

export default function FacultyStudyMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: '',
    category: 'Notes',
    file_url: '',
    file_type: 'pdf',
    description: '',
  });

  const loadMaterials = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiGet('campusCore/study-materials');
      if (res && res.success) {
        setMaterials(res.materials || []);
      } else {
        setFetchError(res?.error || 'Unable to load study materials.');
        setMaterials([]);
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err?.message || 'Unable to load study materials from server.');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMaterials(); }, []);

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.file_url) {
      setSaveMsg('Title and file/link URL are required.');
      return;
    }
    setIsUploading(true);
    setSaveMsg('');
    try {
      const res = await apiPost('campusCore/study-materials', uploadForm);
      if (res && res.success) {
        setSaveMsg('Material uploaded successfully!');
        setShowUpload(false);
        setUploadForm({ title: '', subject: '', category: 'Notes', file_url: '', file_type: 'pdf', description: '' });
        loadMaterials();
      } else {
        setSaveMsg(res?.error || 'Failed to upload study material');
      }
    } catch (err: any) {
      console.error(err);
      setSaveMsg(err?.message || 'Error uploading study material');
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = materials.filter(m =>
    (category === 'All' || m.category === category) &&
    (!search || m.title.toLowerCase().includes(search.toLowerCase()) || m.subject?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen size={24} className="text-blue-400" />
          Study Materials
        </h1>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <Plus size={16} /> Upload Material
        </button>
      </div>

      {saveMsg && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
          saveMsg.includes('successfully')
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span>{saveMsg.includes('successfully') ? '✅' : '⚠️'} {saveMsg}</span>
        </div>
      )}

      {fetchError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <span>⚠️ {fetchError}</span>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Upload size={18} className="text-blue-400" /> Upload Study Material
              </h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 mb-1 block">Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g. Unit 3 Data Structures Notes"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 mb-1 block">Subject</label>
                <input
                  type="text"
                  value={uploadForm.subject}
                  onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })}
                  placeholder="e.g. CS201 - Data Structures"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">File Type</label>
                  <select
                    value={uploadForm.file_type}
                    onChange={e => setUploadForm({ ...uploadForm, file_type: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="docx">Word Document</option>
                    <option value="pptx">PPT Presentation</option>
                    <option value="mp4">Video Link</option>
                    <option value="zip">Archive / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 mb-1 block">File / Document URL *</label>
                <input
                  type="url"
                  value={uploadForm.file_url}
                  onChange={e => setUploadForm({ ...uploadForm, file_url: e.target.value })}
                  placeholder="https://drive.google.com/... or cloud storage URL"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Publish Material'}
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="Search materials..." />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${category === c ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No materials found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4 hover:border-blue-500/30 transition-all">
              <div className="text-2xl">{m.file_type === 'pdf' ? '📄' : m.file_type === 'mp4' ? '🎥' : '📁'}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{m.title}</p>
                <p className="text-xs text-slate-400">{m.subject} · {m.category} · {m.uploaded_by_name || 'Faculty'}</p>
              </div>
              <span className="text-xs text-slate-400">{m.download_count || 0} downloads</span>
              <a href={m.file_url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-xs hover:bg-blue-600/30">
                <Download size={14} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
