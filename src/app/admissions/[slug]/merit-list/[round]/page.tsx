"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Award, FileText, ChevronRight, Download, Users, 
  MapPin, ShieldCheck, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { apiGet } from '@/lib/api';

interface ProgramOption {
  id: string;
  name: string;
  code: string;
}

interface MeritEntry {
  rank: number;
  appNo: string;
  name: string;
  score: number;
  category: string;
  status: string;
}

export default function PublicMeritListsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const round = params.round as string;
  const router = useRouter();

  const [institutionName, setInstitutionName] = useState('');
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedRound, setSelectedRound] = useState(round || '1');
  const [loading, setLoading] = useState(false);

  const [cutoffs, setCutoffs] = useState<{ [cat: string]: number }>({});
  const [entries, setEntries] = useState<MeritEntry[]>([]);

  // 1. Fetch institution details & programs on mount
  useEffect(() => {
    if (!slug) return;
    async function loadPrograms() {
      try {
        const instRes = await apiGet(`/admissions/${slug}`);
        if (instRes.success && instRes.institution) {
          setInstitutionName(instRes.institution.name);
        }

        const res = await apiGet(`/admissions/${slug}/programs`);
        if (res.success && Array.isArray(res.programs)) {
          const progs: ProgramOption[] = res.programs.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code || p.name.split(' ').map((w: string) => w[0]).join('').toUpperCase()
          }));
          setPrograms(progs);
          if (progs.length > 0 && !selectedProgramId) {
            setSelectedProgramId(progs[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed loading admissions programs for merit list:', err);
      }
    }
    loadPrograms();
  }, [slug]);

  // 2. Fetch published merit list for round & program
  useEffect(() => {
    if (!slug || !selectedRound) return;
    async function loadMeritList() {
      setLoading(true);
      try {
        let url = `/admissions/merit-list/${selectedRound}?slug=${encodeURIComponent(slug)}`;
        if (selectedProgramId) {
          url += `&program_id=${encodeURIComponent(selectedProgramId)}`;
        }
        const res = await apiGet(url);
        if (res.success && Array.isArray(res.merit_lists) && res.merit_lists.length > 0) {
          const ml = res.merit_lists[0];
          setCutoffs(ml.cutoff_score ? { Minimum: ml.cutoff_score } : {});
          
          const mappedEntries: MeritEntry[] = (ml.merit_list_entries || []).map((e: any) => ({
            rank: e.rank,
            appNo: e.applicants?.application_number || e.applicant_id?.slice(0, 8) || 'N/A',
            name: e.applicants ? `${e.applicants.first_name || ''} ${e.applicants.last_name || ''}`.trim() : 'Candidate',
            score: e.merit_score || 0,
            category: e.category || 'General',
            status: e.status || 'listed'
          }));
          setEntries(mappedEntries);
        } else {
          setCutoffs({});
          setEntries([]);
        }
      } catch (err) {
        console.warn('Failed loading published merit list:', err);
        setCutoffs({});
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    loadMeritList();
  }, [slug, selectedRound, selectedProgramId]);

  const currentProgram = programs.find(p => p.id === selectedProgramId);

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-8">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#6C2BD9]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-[#13102A]/85 backdrop-blur-md p-6 rounded-3xl border border-[#6C2BD9]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Award className="w-8 h-8 text-[#A78BFA]" />
              Official Admissions Merit Lists
            </h1>
            <p className="text-[#A78BFA]/70 mt-1">
              {institutionName ? `${institutionName} — ` : ''}Select program and round to view published rankings & cutoffs.
            </p>
          </div>
          <button 
            onClick={() => alert('PDF Merit List download initiated.')}
            className="px-5 py-2.5 bg-[#6C2BD9]/25 hover:bg-[#6C2BD9]/45 border border-[#6C2BD9]/45 text-[#A78BFA] hover:text-white font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs shrink-0"
          >
            <Download className="w-4 h-4" /> Download PDF List
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#13102A]/50 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/15 p-5">
            <label className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-wider">Select Degree Program</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {programs.length > 0 ? (
                programs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProgramId(p.id)}
                    className={`px-4 py-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      selectedProgramId === p.id 
                        ? 'bg-[#6C2BD9]/20 border-[#8B5CF6] text-white' 
                        : 'bg-[#0D0A1A]/40 border-white/5 text-white/50 hover:bg-[#6C2BD9]/5'
                    }`}
                  >
                    <span className="block font-bold">{p.code}</span>
                    <span className="block mt-0.5 text-[10px] opacity-80 truncate">{p.name}</span>
                  </button>
                ))
              ) : (
                <div className="col-span-3 text-xs text-[#A78BFA]/50 py-2">Loading programs...</div>
              )}
            </div>
          </div>

          <div className="bg-[#13102A]/50 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/15 p-5">
            <label className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-wider">Select Admission Round</label>
            <div className="flex gap-3 mt-3">
              {['1', '2', '3'].map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRound(r)}
                  className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                    selectedRound === r 
                      ? 'bg-[#6C2BD9]/20 border-[#8B5CF6] text-white' 
                      : 'bg-[#0D0A1A]/40 border-white/5 text-white/50 hover:bg-[#6C2BD9]/5'
                  }`}
                >
                  Round {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cutoff Criteria */}
        {Object.keys(cutoffs).length > 0 && (
          <div className="bg-[#13102A]/50 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/15 p-5">
            <span className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-widest block mb-4">Round {selectedRound} Cutoff Percentiles — {currentProgram?.code}</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Object.keys(cutoffs).map((cat) => (
                <div key={cat} className="p-4 rounded-xl bg-[#0D0A1A]/50 border border-[#6C2BD9]/10 text-center">
                  <span className="text-[10px] text-[#A78BFA]/50 uppercase font-bold tracking-wider">{cat}</span>
                  <span className="block text-xl font-mono font-black text-white mt-1">{cutoffs[cat]}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranks Table */}
        <div className="bg-[#13102A]/50 backdrop-blur-md rounded-3xl border border-[#6C2BD9]/20 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#6C2BD9]/15 flex justify-between items-center bg-[#0D0A1A]/30">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A78BFA]" />
              Ranked Candidates List
            </span>
            <span className="text-[10px] font-mono text-[#A78BFA]/60">
              {loading ? 'Loading...' : `Showing ${entries.length} entries`}
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#A78BFA]/60 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Fetching published merit list...
              </div>
            ) : entries.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#6C2BD9]/10 text-[10px] uppercase font-bold text-[#A78BFA]/60 bg-[#0D0A1A]/20">
                    <th className="py-3.5 px-6">Overall Rank</th>
                    <th className="py-3.5 px-6">Application ID</th>
                    <th className="py-3.5 px-6">Candidate Name</th>
                    <th className="py-3.5 px-6">Merit Score</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Offer Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#6C2BD9]/10 text-xs">
                  {entries.map((entry) => (
                    <tr key={entry.rank} className="hover:bg-[#6C2BD9]/5 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white">#{entry.rank}</td>
                      <td className="py-4 px-6 font-mono text-[#A78BFA]">{entry.appNo}</td>
                      <td className="py-4 px-6 font-bold">{entry.name}</td>
                      <td className="py-4 px-6 font-mono font-bold text-emerald-400">{entry.score}%</td>
                      <td className="py-4 px-6">{entry.category}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.status === 'offered' || entry.status === 'admitted' 
                            ? 'bg-amber-500/15 text-amber-400' 
                            : 'bg-white/5 text-white/50'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-xs text-[#A78BFA]/50 space-y-2">
                <AlertCircle className="w-8 h-8 text-[#A78BFA]/40 mx-auto" />
                <p className="font-semibold text-white">No Published Merit List Found</p>
                <p>Round {selectedRound} merit list has not been published for this program yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button 
            onClick={() => router.push(`/admissions/${slug}`)}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all text-xs"
          >
            Admissions Gateway
          </button>
          <button 
            onClick={() => router.push(`/admissions/${slug}/apply`)}
            className="px-6 py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5"
          >
            Apply Online <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
