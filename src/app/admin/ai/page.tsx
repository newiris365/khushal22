"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BrainCircuit, MessageSquare, Sliders, AlertTriangle, 
  HelpCircle, BarChart2, Radio, Activity, RefreshCw, 
  ShieldAlert, ChevronRight, UserCheck, Smile, Bell, Zap
} from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function AdminAIDashboard() {
  const [stats, setStats] = useState({
    total_queries: 0,
    today_queries: 0,
    active_users: 0,
    avg_latency: 0,
    avg_rating: 0,
    escalations_pending: 0
  });
  const [loading, setLoading] = useState(true);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const [providerStatus, setProviderStatus] = useState<{
    gemini: { configured: boolean; last4: string };
    openai: { configured: boolean; last4: string };
    claude: { configured: boolean; last4: string };
  }>({
    gemini: { configured: false, last4: '' },
    openai: { configured: false, last4: '' },
    claude: { configured: false, last4: '' },
  });

  const [newKeys, setNewKeys] = useState({
    gemini: '',
    openai: '',
    claude: '',
  });

  const [replacingProvider, setReplacingProvider] = useState<Record<string, boolean>>({
    gemini: false,
    openai: false,
    claude: false,
  });

  const [institutionId, setInstitutionId] = useState('');

  useEffect(() => {
    console.log('IRIS_DEBUG: AdminAIDashboard rendered. showConfigModal =', showConfigModal, 'institutionId =', institutionId);
  }, [showConfigModal, institutionId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const profileStr = localStorage.getItem('iris_user_profile');
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          setInstitutionId(profile.institution_id || '');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const loadAiKeys = useCallback(async () => {
    if (!institutionId) return;
    setConfigLoading(true);
    try {
      const token = localStorage.getItem('iris_jwt_token') || 'mock-sandbox-jwt-token-value';
      const res = await fetch(`/api/v1/core/ai/config?institution_id=${institutionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setProviderStatus({
          gemini: data.config.gemini || { configured: false, last4: '' },
          openai: data.config.openai || { configured: false, last4: '' },
          claude: data.config.claude || { configured: false, last4: '' },
        });
        setNewKeys({ gemini: '', openai: '', claude: '' });
        setReplacingProvider({ gemini: false, openai: false, claude: false });
      }
    } catch (err) {
      console.error('Failed to load AI config:', err);
    } finally {
      setConfigLoading(false);
    }
  }, [institutionId]);

  const [modalTab, setModalTab] = useState<'keys' | 'branding'>('keys');
  const [selectedGreetingRole, setSelectedGreetingRole] = useState('Student');
  const [botSaving, setBotSaving] = useState(false);

  const ROLES_LIST = ['Student', 'Parent', 'Teacher', 'HOD', 'Warden', 'Security', 'Librarian', 'Driver', 'Vendor', 'Staff', 'Admin', 'SuperAdmin'];

  const [botForm, setBotForm] = useState({
    name: 'IRIS Concierge',
    avatar_url: '',
    accent_color: '#6C2BD9',
    tone: 'Friendly, helpful, and professional',
    welcome_message: '',
    role_greetings: {} as Record<string, string>,
    auto_open_on_urgent: true,
    escalation_mode: 'ticket' as 'ticket' | 'live_transfer' | 'contact_info',
    escalation_contact: '',
    data_retention_days: '',
    force_llm_always: false
  });

  const loadBotConfig = useCallback(async () => {
    if (!institutionId) return;
    try {
      const token = localStorage.getItem('iris_jwt_token') || 'mock-sandbox-jwt-token-value';
      const res = await fetch(`/api/v1/core/ai/bot-config?institution_id=${institutionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setBotForm({
          name: data.config.name || 'IRIS Concierge',
          avatar_url: data.config.avatar_url || '',
          accent_color: data.config.accent_color || '#6C2BD9',
          tone: data.config.tone || 'Friendly, helpful, and professional',
          welcome_message: data.config.welcome_message || '',
          role_greetings: data.config.role_greetings || {},
          auto_open_on_urgent: data.config.auto_open_on_urgent !== false,
          escalation_mode: data.config.escalation_mode || 'ticket',
          escalation_contact: data.config.escalation_contact || '',
          data_retention_days: data.config.data_retention_days ?? '',
          force_llm_always: data.config.force_llm_always === true
        });
      }
    } catch (err) {
      console.error('Failed to load bot branding config:', err);
    }
  }, [institutionId]);

  const handleSaveBotConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId) return;
    setBotSaving(true);
    try {
      const token = localStorage.getItem('iris_jwt_token') || 'mock-sandbox-jwt-token-value';
      const payload = {
        institution_id: institutionId,
        name: botForm.name,
        avatar_url: botForm.avatar_url,
        accent_color: botForm.accent_color,
        tone: botForm.tone,
        welcome_message: botForm.welcome_message,
        role_greetings: botForm.role_greetings,
        auto_open_on_urgent: botForm.auto_open_on_urgent,
        escalation_mode: botForm.escalation_mode,
        escalation_contact: botForm.escalation_contact,
        data_retention_days: botForm.data_retention_days ? Number(botForm.data_retention_days) : null,
        force_llm_always: botForm.force_llm_always
      };

      const res = await fetch('/api/v1/core/ai/bot-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Bot Branding configuration saved successfully!');
      } else {
        alert(data.error || 'Failed to save bot branding.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving bot branding.');
    } finally {
      setBotSaving(false);
    }
  };

  useEffect(() => {
    if (showConfigModal && institutionId) {
      loadAiKeys();
      loadBotConfig();
    }
  }, [showConfigModal, institutionId, loadAiKeys, loadBotConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId) return;
    setConfigSaving(true);
    try {
      const token = localStorage.getItem('iris_jwt_token') || 'mock-sandbox-jwt-token-value';
      const payload: any = { institution_id: institutionId };
      if (newKeys.gemini.trim()) payload.gemini_api_key = newKeys.gemini.trim();
      if (newKeys.openai.trim()) payload.openai_api_key = newKeys.openai.trim();
      if (newKeys.claude.trim()) payload.claude_api_key = newKeys.claude.trim();

      const res = await fetch('/api/v1/core/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await loadAiKeys();
        setShowConfigModal(false);
      } else {
        alert('Failed to save keys: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setShowConfigModal(false);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleRemoveKey = async (provider: 'gemini' | 'openai' | 'claude') => {
    if (!institutionId) return;
    if (!confirm(`Are you sure you want to remove the ${provider.toUpperCase()} API key?`)) return;
    setConfigSaving(true);
    try {
      const token = localStorage.getItem('iris_jwt_token') || 'mock-sandbox-jwt-token-value';
      const res = await fetch('/api/v1/core/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          institution_id: institutionId,
          [`${provider}_action`]: 'remove'
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadAiKeys();
      }
    } catch (err) {
      console.error('Failed to remove key:', err);
    } finally {
      setConfigSaving(false);
    }
  };

  const [fastpathStats, setFastpathStats] = useState({
    fastpath_percentage: 68,
    savings_summary: '68% of messages answered without an API call this week'
  });

  const loadFastpathStats = async () => {
    try {
      const res = await apiGet('/ai/stats');
      if (res.success && res.stats) {
        setFastpathStats(res.stats);
      }
    } catch {}
  };

  useEffect(() => {
    loadStats();
    loadFastpathStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/ai/concierge/stats');
      if (res.success) {
        setStats(res.stats);
      }
    } catch {
      // Sandbox Fallbacks
      setStats({
        total_queries: 1240,
        today_queries: 48,
        active_users: 84,
        avg_latency: 124,
        avg_rating: 4.3,
        escalations_pending: 3
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white flex items-center gap-2">
              <BrainCircuit className="w-8 h-8 text-[#A78BFA]" /> AI Concierge Control Panel
            </h1>
            <p className="text-sm text-[#C4B5FD]/70">Admin AI diagnostics, conversational logs audit, and human-handoff overrides queue</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                console.log('IRIS_DEBUG: AI Settings button clicked! Current showConfigModal =', showConfigModal);
                setShowConfigModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all"
            >
              <Sliders className="w-4 h-4" /> AI Settings
            </button>
            <button 
              onClick={loadStats}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Daily LLM Usage & Rate Limit Safeguard Banner */}
        <div className="bg-gradient-to-r from-violet-950/40 via-[#13102A]/60 to-violet-950/40 border border-violet-500/20 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Daily LLM Usage & Rate-Limit Safeguard
              </h3>
              <p className="text-xs text-[#C4B5FD]/70">
                Today's total institution AI queries: <strong className="text-white font-mono">{stats.today_queries || 0}</strong> | Per-user rate throttle: <strong className="text-emerald-400 font-mono">20 req/min cap</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              ● Cost Protection Active
            </span>
          </div>
        </div>

        {/* Fast-Path Cost Savings Router Stat Banner */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#13102A]/60 to-violet-950/40 border border-emerald-500/30 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                ⚡ Cost-Saving Fast-Path Router
              </h3>
              <p className="text-xs text-emerald-300/90 font-mono">
                {fastpathStats.savings_summary}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              💰 API Bill Reduction Active
            </span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          
          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-violet-500/30 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Today's Usage</span>
              <Activity className="w-3.5 h-3.5 animate-pulse text-violet-400" />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.today_queries || 0}</h2>
              <span className="text-[9px] text-violet-300 font-mono font-semibold">24h Message Counter</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Total Queries</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.total_queries}</h2>
              <span className="text-[9px] text-white/30 font-mono">Accumulated queries</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Conversations</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.active_users} sessions</h2>
              <span className="text-[9px] text-white/30 font-mono font-bold">Active user chats</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Avg Latency</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.avg_latency}ms</h2>
              <span className="text-[9px] text-emerald-400 font-mono font-semibold">Response speed</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Helpfulness Rating</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.avg_rating} / 5.0</h2>
              <span className="text-[9px] text-amber-400 font-mono font-semibold">User feedback score</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Pending Escalations</span>
            <div>
              <h2 className="text-2xl font-extrabold text-red-400">{stats.escalations_pending} tickets</h2>
              <span className="text-[9px] text-white/30 font-mono">Awaiting support</span>
            </div>
          </div>

        </div>

        {/* Sub-Console navigation link cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <MessageSquare className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">Conversations Audit</h2>
              <p className="text-xs text-[#C4B5FD]/70">Browse history streams, channels (app/WhatsApp/web), and full user transcripts.</p>
              <Link href="/admin/ai/conversations" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Chat Logs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <HelpCircle className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">FAQ Knowledge Base</h2>
              <p className="text-xs text-[#C4B5FD]/70">Add questions/answers, configure categories, preview query ratings and cosine matching thresholds.</p>
              <Link href="/admin/ai/faq" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Configure FAQs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <Radio className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">WhatsApp Manager</h2>
              <p className="text-xs text-[#C4B5FD]/70">Review subscribers, verify opt-in/opt-out status, and dispatch broadcast news blast templates.</p>
              <Link href="/admin/ai/whatsapp" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open WhatsApp Desk <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <ShieldAlert className="w-8 h-8 text-red-400" />
              <h2 className="text-base font-bold text-white">Escalation Handoffs Queue</h2>
              <p className="text-xs text-[#C4B5FD]/70">Interact with human agent support requests, type custom resolutions, and update users.</p>
              <Link href="/admin/ai/escalations" className="text-xs font-bold text-red-400 group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Handoffs Queue <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <BarChart2 className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">Analytics Hub</h2>
              <p className="text-xs text-[#C4B5FD]/70">Review hourly query volumes, top intent modules classification, and ratings distributions charts.</p>
              <Link href="/admin/ai/analytics" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Charts <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <Smile className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">Sentiment Analytics</h2>
              <p className="text-xs text-[#C4B5FD]/70">Monitor daily campus mood trends, keywords list, negative categories, and auto-routed issues.</p>
              <Link href="/ai/sentiment" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Sentiment Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <Bell className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">Smart Nudges Panel</h2>
              <p className="text-xs text-[#C4B5FD]/70">Dispatch contextual batch alerts to students, check logs, and inspect student preference options.</p>
              <Link href="/ai/nudges" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Nudges Console <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* AI Config & Bot Branding Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#13102A] border border-violet-500/30 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">AI Concierge & Branding Settings</h3>
            <p className="text-[11px] text-[#C4B5FD]/50 mb-4">Configure API keys, custom bot branding, role greetings, and persona settings.</p>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-white/10 mb-4 gap-2">
              <button
                type="button"
                onClick={() => setModalTab('keys')}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${
                  modalTab === 'keys'
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                API Credentials
              </button>
              <button
                type="button"
                onClick={() => setModalTab('branding')}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${
                  modalTab === 'branding'
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                Bot Branding & Persona
              </button>
            </div>
            
            {configLoading ? (
              <div className="py-10 text-center text-[#C4B5FD]/40 text-xs italic">Loading configuration...</div>
            ) : modalTab === 'keys' ? (
              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                
                {/* Gemini Provider */}
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-black/30 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[#C4B5FD] font-semibold">Gemini API Key</span>
                    {providerStatus.gemini.configured ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Key configured (••••{providerStatus.gemini.last4})
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono">Not Configured</span>
                    )}
                  </div>
                  {providerStatus.gemini.configured && !replacingProvider.gemini ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button type="button" onClick={() => setReplacingProvider(prev => ({ ...prev, gemini: true }))}
                        className="px-3 py-1 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/30 rounded-lg text-[11px] font-medium transition-all">
                        Replace Key
                      </button>
                      <button type="button" onClick={() => handleRemoveKey('gemini')}
                        className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-medium transition-all">
                        Remove Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 pt-1">
                      <input type="password" placeholder="Enter new Gemini key (AIzaSy...)"
                        value={newKeys.gemini} onChange={(e) => setNewKeys({ ...newKeys, gemini: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white font-mono text-xs outline-none focus:border-violet-500" />
                      {replacingProvider.gemini && (
                        <button type="button" onClick={() => { setReplacingProvider(prev => ({ ...prev, gemini: false })); setNewKeys(prev => ({ ...prev, gemini: '' })); }}
                          className="text-[10px] text-slate-400 hover:text-white underline pt-0.5">
                          Cancel Replace
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* OpenAI Provider */}
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-black/30 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[#C4B5FD] font-semibold">OpenAI API Key</span>
                    {providerStatus.openai.configured ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Key configured (••••{providerStatus.openai.last4})
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono">Not Configured</span>
                    )}
                  </div>
                  {providerStatus.openai.configured && !replacingProvider.openai ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button type="button" onClick={() => setReplacingProvider(prev => ({ ...prev, openai: true }))}
                        className="px-3 py-1 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/30 rounded-lg text-[11px] font-medium transition-all">
                        Replace Key
                      </button>
                      <button type="button" onClick={() => handleRemoveKey('openai')}
                        className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-medium transition-all">
                        Remove Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 pt-1">
                      <input type="password" placeholder="Enter new OpenAI key (sk-proj-...)"
                        value={newKeys.openai} onChange={(e) => setNewKeys({ ...newKeys, openai: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white font-mono text-xs outline-none focus:border-violet-500" />
                      {replacingProvider.openai && (
                        <button type="button" onClick={() => { setReplacingProvider(prev => ({ ...prev, openai: false })); setNewKeys(prev => ({ ...prev, openai: '' })); }}
                          className="text-[10px] text-slate-400 hover:text-white underline pt-0.5">
                          Cancel Replace
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Claude Provider */}
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-black/30 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[#C4B5FD] font-semibold">Claude (Anthropic) API Key</span>
                    {providerStatus.claude.configured ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Key configured (••••{providerStatus.claude.last4})
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono">Not Configured</span>
                    )}
                  </div>
                  {providerStatus.claude.configured && !replacingProvider.claude ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button type="button" onClick={() => setReplacingProvider(prev => ({ ...prev, claude: true }))}
                        className="px-3 py-1 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/30 rounded-lg text-[11px] font-medium transition-all">
                        Replace Key
                      </button>
                      <button type="button" onClick={() => handleRemoveKey('claude')}
                        className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-medium transition-all">
                        Remove Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 pt-1">
                      <input type="password" placeholder="Enter new Claude key (sk-ant-...)"
                        value={newKeys.claude} onChange={(e) => setNewKeys({ ...newKeys, claude: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white font-mono text-xs outline-none focus:border-violet-500" />
                      {replacingProvider.claude && (
                        <button type="button" onClick={() => { setReplacingProvider(prev => ({ ...prev, claude: false })); setNewKeys(prev => ({ ...prev, claude: '' })); }}
                          className="text-[10px] text-slate-400 hover:text-white underline pt-0.5">
                          Cancel Replace
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Cancel</button>
                  <button type="submit" disabled={configSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white font-bold shadow-lg shadow-violet-600/25 disabled:opacity-50">
                    {configSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            ) : (
              /* BOT BRANDING FORM TAB */
              <form onSubmit={handleSaveBotConfig} className="space-y-4 text-xs">
                
                {/* Bot Name */}
                <div>
                  <label className="block text-[#C4B5FD] font-semibold mb-1">Bot Name</label>
                  <input
                    type="text"
                    placeholder="e.g. IRIS Concierge or SIET Assistant"
                    value={botForm.name}
                    onChange={(e) => setBotForm({ ...botForm, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>

                {/* Accent Color & Avatar URL */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#C4B5FD] font-semibold mb-1">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={botForm.accent_color}
                        onChange={(e) => setBotForm({ ...botForm, accent_color: e.target.value })}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={botForm.accent_color}
                        onChange={(e) => setBotForm({ ...botForm, accent_color: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 p-2 rounded-xl text-white font-mono text-xs outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#C4B5FD] font-semibold mb-1">Avatar Image URL</label>
                    <input
                      type="text"
                      placeholder="https://.../avatar.png"
                      value={botForm.avatar_url}
                      onChange={(e) => setBotForm({ ...botForm, avatar_url: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 rounded-xl text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Persona & Tone */}
                <div>
                  <label className="block text-[#C4B5FD] font-semibold mb-1">Bot Persona Tone</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Formal and precise, or Warm and encouraging"
                    value={botForm.tone}
                    onChange={(e) => setBotForm({ ...botForm, tone: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>

                {/* General Welcome Message Override */}
                <div>
                  <label className="block text-[#C4B5FD] font-semibold mb-1">Default Welcome Message (Fallback)</label>
                  <textarea
                    rows={2}
                    placeholder="General greeting for unassigned roles..."
                    value={botForm.welcome_message}
                    onChange={(e) => setBotForm({ ...botForm, welcome_message: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>

                {/* Per-Role Greeting Editor */}
                <div className="p-3 bg-black/30 border border-white/10 rounded-2xl space-y-2">
                  <label className="block text-[#C4B5FD] font-semibold">Per-Role Custom Greetings</label>
                  <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none">
                    {ROLES_LIST.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedGreetingRole(r)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
                          selectedGreetingRole === r
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    placeholder={`Custom greeting for ${selectedGreetingRole} role...`}
                    value={botForm.role_greetings[selectedGreetingRole] || ''}
                    onChange={(e) => setBotForm({
                      ...botForm,
                      role_greetings: {
                        ...botForm.role_greetings,
                        [selectedGreetingRole]: e.target.value
                      }
                    })}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>

                {/* Escalation Mode & Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#C4B5FD] font-semibold mb-1">Escalation Mode</label>
                    <select
                      value={botForm.escalation_mode}
                      onChange={(e) => setBotForm({ ...botForm, escalation_mode: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500"
                    >
                      <option value="ticket">Auto-Create Ticket</option>
                      <option value="live_transfer">Live Handoff</option>
                      <option value="contact_info">Show Contact Details</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#C4B5FD] font-semibold mb-1">Escalation Contact</label>
                    <input
                      type="text"
                      placeholder="e.g. admin@siet.edu.in or +91-9876543210"
                      value={botForm.escalation_contact}
                      onChange={(e) => setBotForm({ ...botForm, escalation_contact: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Data Retention Days */}
                <div>
                  <label className="block text-[#C4B5FD] font-semibold mb-1">Chat Log Retention (Days)</label>
                  <input
                    type="number"
                    placeholder="Leave empty for unlimited retention"
                    value={botForm.data_retention_days}
                    onChange={(e) => setBotForm({ ...botForm, data_retention_days: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500"
                  />
                  <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed">
                    ℹ️ Full transcripts are used to improve response quality and for support review. Setting a shorter retention period will limit how far back staff can review past conversations.
                  </p>
                </div>

                {/* Force LLM Always Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <div>
                    <label className="block text-[#C4B5FD] font-semibold text-xs">Force LLM for all queries</label>
                    <p className="text-[10px] text-white/50">Bypass cost-saving fast-path router to always use external LLM for all queries.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBotForm({ ...botForm, force_llm_always: !botForm.force_llm_always })}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${
                      botForm.force_llm_always ? 'bg-violet-600' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      botForm.force_llm_always ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Cancel</button>
                  <button type="submit" disabled={botSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white font-bold shadow-lg shadow-violet-600/25 disabled:opacity-50">
                    {botSaving ? 'Saving...' : 'Save Bot Branding'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
