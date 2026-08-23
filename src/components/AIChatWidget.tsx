"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BrainCircuit, X, Send, ThumbsUp, ThumbsDown, 
  Sparkles, RefreshCw, MessageSquareCode, Clock, Check, Settings
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  rating?: 'up' | 'down';
  is_error?: boolean;
  retry_prompt?: string;
  action_preview?: {
    action_type: string;
    title: string;
    summary: string;
    fields: Record<string, any>;
    status?: 'pending' | 'confirmed' | 'cancelled';
  };
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLLMThinking, setIsLLMThinking] = useState(false);
  const [role, setRole] = useState<string>('student');
  const [sessionId, setSessionId] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [charCount, setCharCount] = useState(0);
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmingActionIdx, setConfirmingActionIdx] = useState<number | null>(null);
  const [nudges, setNudges] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [nudgePreferences, setNudgePreferences] = useState<{ enabled: boolean }>({ enabled: true });

  const handleConfirmAction = async (msgIdx: number, preview: any) => {
    setConfirmingActionIdx(msgIdx);
    const contact = botConfig?.escalation_contact || 'support@campus.edu.in';
    try {
      const res = await apiPost('/ai/actions/confirm', {
        action_type: preview.action_type,
        fields: preview.fields
      });
      if (res.success) {
        setMessages(prev => prev.map((m, i) => i === msgIdx ? {
          ...m,
          action_preview: { ...m.action_preview!, status: 'confirmed' }
        } : m));

        const confirmMsg: Message = {
          id: `msg_conf_${Date.now()}`,
          role: 'assistant',
          content: `✅ **Action Confirmed**: ${res.message || 'Your request has been successfully submitted and processed!'}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, confirmMsg]);
      } else {
        const errorMsg: Message = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `Sorry, something went wrong on my end while executing your request. Please try again in a moment, or reach out to ${contact} if it keeps happening.`,
          timestamp: new Date().toISOString(),
          is_error: true,
          retry_prompt: preview?.summary || 'Confirm action'
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: Message = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, something went wrong on my end while executing your request. Please try again in a moment, or reach out to ${contact} if it keeps happening.`,
        timestamp: new Date().toISOString(),
        is_error: true,
        retry_prompt: preview?.summary || 'Confirm action'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setConfirmingActionIdx(null);
    }
  };

  const handleCancelAction = (msgIdx: number) => {
    setMessages(prev => prev.map((m, i) => i === msgIdx ? {
      ...m,
      action_preview: { ...m.action_preview!, status: 'cancelled' }
    } : m));
  };

  const [botConfig, setBotConfig] = useState<{
    name?: string;
    avatar_url?: string | null;
    accent_color?: string;
    welcome_message?: string | null;
    role_greetings?: Record<string, string> | null;
    auto_open_on_urgent?: boolean;
    escalation_mode?: string;
    escalation_contact?: string;
  } | null>(null);

  const fetchNudges = async () => {
    try {
      const res = await apiGet('/ai/nudges');
      if (res.success && res.nudges) {
        setNudges(res.nudges);
        checkAndAutoOpenUrgentNudge(res.nudges);
      }
    } catch {}
  };

  const fetchNudgePrefs = async () => {
    try {
      const res = await apiGet('/ai/nudges/preferences');
      if (res.success && res.preferences) {
        setNudgePreferences({ enabled: res.preferences.enabled !== false });
      }
    } catch {}
  };

  const handleToggleNudgePrefs = async () => {
    const nextVal = !nudgePreferences.enabled;
    setNudgePreferences({ enabled: nextVal });
    try {
      await apiPut('/ai/nudges/preferences', { enabled: nextVal });
    } catch {}
  };

  const checkAndAutoOpenUrgentNudge = async (nudgeList: any[]) => {
    if (botConfig?.auto_open_on_urgent === false) return;
    if (typeof window === 'undefined') return;

    const hasAutoOpened = sessionStorage.getItem('iris_auto_opened_urgent');
    if (hasAutoOpened) return;

    const urgentUnread = nudgeList.find((n: any) => !n.was_read && (n.urgency === 'urgent' || n.priority === 'urgent' || n.priority === 'high'));
    if (urgentUnread) {
      sessionStorage.setItem('iris_auto_opened_urgent', 'true');
      setIsOpen(true);

      try {
        await apiPost(`/ai/nudges/${urgentUnread.id}/read`, {});
      } catch {}

      setMessages(prev => {
        const exists = prev.some(m => m.content.includes(urgentUnread.title));
        if (exists) return prev;
        return [
          {
            id: `nudge_${urgentUnread.id}`,
            role: 'assistant',
            content: `🚨 **Urgent Alert: ${urgentUnread.title}**\n\n${urgentUnread.message}`,
            timestamp: new Date().toISOString()
          },
          ...prev
        ];
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNudges();
      fetchNudgePrefs();
      const interval = setInterval(fetchNudges, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, botConfig]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousTokenRef = useRef<string | null>(null);

  const getWelcomeMessage = (roleName: string) => {
    const r = roleName.toLowerCase();
    switch (r) {
      case 'superadmin':
        return "Welcome, SuperAdmin. I can provide institution-wide stats including total students, revenue, and campus summaries. How can I help you manage the network today?";
      case 'admin':
        return "Welcome, Campus Administrator. I can provide campus-level statistics: student count, staff summaries, overall attendance rate, and fee collection. What would you like to review?";
      case 'student':
        return "Hi! I am IRIS, your AI campus concierge. Ask me about your attendance, outstanding fees, today's timetable, or registered courses.";
      case 'hod':
        return "Welcome, Head of Department. I can assist you with department-level student statistics, attendance rates, and faculty records. How can I support your department today?";
      case 'teacher':
        return "Welcome! I can help you with class-level inquiries: your teaching schedule, student attendance, or lecture timings.";
      case 'warden':
      case 'hostelwarden':
        return "Welcome, Warden. I can provide hostel room occupancy rates, current mess notices, or pending maintenance complaints. How can I help manage the hostel today?";
      case 'security':
      case 'gatesecurity':
        return "Welcome, Security Desk. I can show today's gate visitor logs, RFID entry/exit scans, or trigger gate access alerts.";
      case 'librarian':
        return "Welcome, Librarian. I can provide book inventory details, overdue/pending returns, and library operations status. How can I assist you?";
      case 'parent':
        return "Hello! I can provide child-level details: child's attendance rate, pending fees, and school transport/bus location. How can I help you today?";
      case 'driver':
        return "Welcome. I can provide transit details: your assigned route today, bus schedule, and passenger boardings.";
      case 'vendor':
      case 'canteenvendor':
        return "Welcome to the Canteen Console. I can show today's orders count, active menu items, or current queue status.";
      case 'staff':
        return "Welcome! I can provide general staff updates: recent announcements, your assigned tasks, and office hours.";
      default:
        return "Hi! I am IRIS, your AI campus concierge. How can I assist you with your campus queries today?";
    }
  };

  const loadBotConfig = async () => {
    try {
      const profileStr = typeof window !== 'undefined' ? localStorage.getItem('iris_user_profile') : null;
      let instId = '';
      if (profileStr) {
        try { instId = JSON.parse(profileStr).institution_id; } catch {}
      }
      const url = instId ? `/api/v1/core/ai/bot-config?institution_id=${instId}` : '/api/v1/core/ai/bot-config';
      const res = await apiGet(url);
      if (res.success && res.config) {
        setBotConfig(res.config);
      }
    } catch {}
  };

  useEffect(() => {
    loadBotConfig();
  }, [pathname, isAuthenticated]);

  const getCustomOrWelcomeMessage = (r: string) => {
    if (botConfig?.role_greetings) {
      const matchedKey = Object.keys(botConfig.role_greetings).find(
        k => k.toLowerCase() === r.toLowerCase()
      );
      if (matchedKey && botConfig.role_greetings[matchedKey]?.trim()) {
        return botConfig.role_greetings[matchedKey].trim();
      }
    }
    if (botConfig?.welcome_message?.trim()) {
      return botConfig.welcome_message.trim();
    }
    return getWelcomeMessage(r);
  };

  // Check auth & session reset on route or storage changes (#1)
  const syncAuthStateAndSession = () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('iris_jwt_token');
    const profileStr = localStorage.getItem('iris_user_profile');
    const hasToken = !!token;

    // Detect logout or token change
    if (previousTokenRef.current !== null && previousTokenRef.current !== token) {
      // Auth state changed! Clear stale session
      localStorage.removeItem('iris_ai_session_id');
      setMessages([]);
      setActiveProvider('');
      
      const newSession = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('iris_ai_session_id', newSession);
      setSessionId(newSession);
    }
    previousTokenRef.current = token;
    setIsAuthenticated(hasToken);

    let detectedRole = 'student';
    if (profileStr) {
      try {
        const prof = JSON.parse(profileStr);
        if (prof.role) detectedRole = prof.role.toLowerCase();
      } catch {}
    }
    setRole(detectedRole);

    let savedSession = localStorage.getItem('iris_ai_session_id');
    if (!savedSession) {
      savedSession = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('iris_ai_session_id', savedSession);
    }
    setSessionId(savedSession);
  };

  useEffect(() => {
    setMounted(true);
    syncAuthStateAndSession();

    const handleStorageChange = () => syncAuthStateAndSession();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]);

  const loadHistory = useCallback(async (sessId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
    const isMockToken = token && token.startsWith('mock-sandbox-jwt-token-value');
    
    // In local dev with mock tokens or when no token at all, skip the API call
    if (!token || isMockToken) {
      setMessages([
        {
          role: 'assistant',
          content: getCustomOrWelcomeMessage(role),
          timestamp: new Date().toISOString()
        }
      ]);
      return;
    }

    try {
      const res = await apiGet(`/ai/chat/history/${sessId}`);
      if (res.success && res.conversation?.messages?.length > 0) {
        const msgs = res.conversation.messages.map((m: any, idx: number) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(Date.now() - (res.conversation.messages.length - idx) * 60000).toISOString()
        }));
        setMessages(msgs);
      } else {
        // No previous history — show welcome message
        setMessages([
          {
            role: 'assistant',
            content: getCustomOrWelcomeMessage(role),
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch {
      setMessages([
        {
          role: 'assistant',
          content: getCustomOrWelcomeMessage(role),
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [role, getCustomOrWelcomeMessage]);

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      loadHistory(sessionId);
    }
  }, [role, isAuthenticated, sessionId, botConfig, loadHistory]);

  // Keyboard focus trap & Escape key listener (#4)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => inputRef.current?.focus(), 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || text.length > 500 || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setCharCount(0);
    setLoading(true);
    setIsLLMThinking(true);

    // Client-side fallback response generator (used when backend is unreachable)
    const getLocalFallbackResponse = (msg: string): string => {
      const m = msg.toLowerCase();
      const childName = 'your child';

      if (m.includes('attendance') || m.includes('present') || m.includes('absent')) {
        return `📊 **Attendance**\nYou can check ${childName}'s daily attendance in the **Attendance** section of the parent portal. It shows a calendar view with Present/Absent/Leave status for each day.\n\nTip: Maintain at least 75% attendance to stay above the criteria.`;
      }
      if (m.includes('fee') || m.includes('payment') || m.includes('dues')) {
        return `💰 **Fees**\nYou can view ${childName}'s fee status and make payments in the **Fee Status** section. Outstanding dues and payment history are shown there.`;
      }
      if (m.includes('bus') || m.includes('transport') || m.includes('location')) {
        return `🚌 **Transport**\nYou can track ${childName}'s school bus in real-time from the **Transit GPS** section. It shows live bus location and route status.`;
      }
      if (m.includes('ptm') || m.includes('meeting') || m.includes('parent teacher')) {
        return `📅 **PTM**\nYou can view and book Parent-Teacher Meeting slots from the **PTM Schedule** section. Available time slots with teachers are shown there.`;
      }
      if (m.includes('exam') || m.includes('result') || m.includes('marks')) {
        return `📝 **Exam Results**\nYou can check ${childName}'s exam results, SGPA, and grade transcripts in the **Exam Results** section.`;
      }
      if (m.includes('timetable') || m.includes('schedule') || m.includes('class')) {
        return `🗓️ **Timetable**\nYou can view ${childName}'s daily class schedule with subjects, rooms, and instructors in the **Timetable** section.`;
      }
      if (m.includes('leave') || m.includes('absence') || m.includes('sick')) {
        return `📋 **Leave Application**\nYou can apply for leave on behalf of ${childName} from the **Leave Application** section. Select dates, choose a reason, and submit.`;
      }
      if (m.includes('notice') || m.includes('announcement')) {
        return `📢 **Notices**\nCheck the **Notices** section for the latest school announcements and updates.`;
      }
      if (m.includes('message') || m.includes('teacher')) {
        return `💬 **Messages**\nYou can send messages to ${childName}'s teachers from the **Messages** section.`;
      }
      if (m.includes('complaint')) {
        return `⚠️ **Complaints**\nYou can file a complaint or report an issue from the **Complaints** section.`;
      }
      return `Hello! I am IRIS, your AI concierge. The backend server is currently unavailable, but I can still guide you.\n\nHere are some things I can help with:\n- **Attendance** — check daily records\n- **Fees** — view dues and payments\n- **Bus** — track school transport\n- **PTM** — book parent-teacher meetings\n- **Exams** — view results\n- **Leave** — apply for leave\n\nPlease use the sidebar navigation or ask me about any of these topics.`;
    };

    try {
      console.log('[AIChatWidget] Sending request to /ai/chat:', { message: text, session_id: sessionId });
      const res = await apiPost('/ai/chat', {
        message: text,
        session_id: sessionId
      });
      console.log('[AIChatWidget] Received response from /ai/chat:', res);

      if (res.success && res.response) {
        if (res.provider) {
          setActiveProvider(res.provider);
        }
        const assistantMsg: Message = {
          id: res.message_id,
          role: 'assistant',
          content: res.response,
          timestamp: new Date().toISOString(),
          action_preview: res.action_preview ? { ...res.action_preview, status: 'pending' } : undefined
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const contact = botConfig?.escalation_contact || 'support@campus.edu.in';
        // Show rate limit or error feedback as a friendly assistant bubble with retry
        const displayMsg = res.response || (res.error && !res.error.includes('500') && !res.error.includes('Error') ? res.error : `Sorry, something went wrong on my end. Please try again in a moment, or reach out to ${contact} if it keeps happening.`);
        const assistantMsg: Message = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: displayMsg,
          timestamp: new Date().toISOString(),
          is_error: true,
          retry_prompt: text
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch {
      // Client-side fallback when backend is unreachable or timed out (#3)
      setActiveProvider('offline');
      const responseText = getLocalFallbackResponse(text);
      
      const assistantMsg: Message = {
        id: `msg_mock_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        is_error: true,
        retry_prompt: text
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLLMThinking(false);
      setLoading(false);
    }
  };

  const handleRating = async (idx: number, ratingType: 'up' | 'down') => {
    const msg = messages[idx];
    if (!msg.id) return;

    try {
      const ratingVal = ratingType === 'up' ? 5 : 1;
      await apiPost(`/ai/chat/${msg.id}/feedback`, {
        rating: ratingVal,
        flagged: ratingType === 'down'
      });
      
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, rating: ratingType } : m));
    } catch {
      // Sandbox fallback rating UI
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, rating: ratingType } : m));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.length <= 550) {
      setInputMsg(text);
      setCharCount(text.length);
    }
  };

  // Basic Markdown renderer with full Multilingual & Devanagari script support
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      // 1. Table Row Matcher
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(c => c.trim() !== '');
        return (
          <div key={lIdx} className="flex border-b border-white/5 py-1 text-[11px] font-mono justify-between text-white/80">
            {cells.map((c, cIdx) => (
              <span key={cIdx} className="px-1.5">{c.trim()}</span>
            ))}
          </div>
        );
      }

      // Helper for bold matching in any script (Devanagari, Tamil, Latin, etc.)
      const parseBold = (text: string) => {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(text)) !== null) {
          parts.push(text.substring(lastIndex, match.index));
          parts.push(<strong key={match.index} className="text-white font-extrabold">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        parts.push(text.substring(lastIndex));
        return parts.length > 1 ? parts : text;
      };

      // 2. Bullets matcher (* , - , • )
      if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
        const bulletText = line.substring(2);
        return (
          <li key={lIdx} className="list-disc list-inside text-xs text-[#C4B5FD]/90 pl-1 mt-1 leading-relaxed">
            {parseBold(bulletText)}
          </li>
        );
      }

      // 3. Link matcher (e.g. /fees, /transit)
      const linkRegex = /(\/student\/\S+|\/fees|\/transit|\/library\/\S+|\/ai\/\S+)/g;
      if (linkRegex.test(line)) {
        const lineParts = line.split(linkRegex);
        return (
          <p key={lIdx} className="text-xs leading-relaxed mt-1 text-white/85">
            {lineParts.map((p, pIdx) => {
              if (linkRegex.test(p)) {
                return (
                  <Link key={pIdx} href={p} className="text-[#A78BFA] font-bold underline hover:text-white transition-all inline-flex items-center gap-0.5">
                    {p}
                  </Link>
                );
              }
              return parseBold(p);
            })}
          </p>
        );
      }

      return (
        <p key={lIdx} className="text-xs leading-relaxed mt-1 text-white/85">
          {parseBold(line)}
        </p>
      );
    });
  };

  const getQuickChips = () => {
    const r = role.toLowerCase();
    switch (r) {
      case 'superadmin':
        return ["Total students", "Total revenue", "Campus count", "System health"];
      case 'admin':
        return ["Total students", "Staff count", "Attendance rate", "Fee collection"];
      case 'student':
        return ["My attendance?", "Fee status", "Today's timetable", "Canteen menu", "Next exam?"];
      case 'hod':
        return ["Dept students", "Dept attendance", "Faculty list", "Dept notices"];
      case 'teacher':
        return ["My classes today", "My schedule", "Student attendance", "Room locations"];
      case 'warden':
      case 'hostelwarden':
        return ["Room occupancy", "Mess notices", "Pending complaints", "Hostel roster"];
      case 'security':
      case 'gatesecurity':
        return ["Today's visitor logs", "RFID scans today", "Gate alerts", "Incident log"];
      case 'librarian':
        return ["Book inventory", "Pending returns", "Library hours", "New arrivals"];
      case 'parent':
        return ["My child's attendance", "Child's fees", "Bus location", "PTM bookings"];
      case 'driver':
        return ["Today's route", "Bus schedule", "Passenger count", "Route status"];
      case 'vendor':
      case 'canteenvendor':
        return ["Today's orders", "Canteen menu", "Queue status", "Wallet status"];
      case 'staff':
        return ["Announcements", "My tasks", "Office hours", "Submit leave"];
      default:
        return ["My attendance?", "Fee status", "Today's timetable", "Canteen menu", "Next exam?"];
    }
  };

  if (!mounted || pathname === '/login' || !isAuthenticated) {
    return null;
  }

  const getProviderLabel = (prov: string) => {
    const bName = botConfig?.name || 'IRIS';
    if (!prov) return `${bName} Assistant (offline mode)`;
    const p = prov.toLowerCase();
    if (p === 'offline') return `${bName} Assistant (offline mode)`;
    if (p.includes('openai') || p.includes('gpt')) return 'OpenAI GPT-4o Active';
    if (p.includes('gemini')) return 'Google Gemini Active';
    if (p.includes('claude') || p.includes('anthropic')) return 'Anthropic Claude Active';
    if (p.includes('faq')) return `${bName} Knowledge Base Active`;
    return `${prov} Active`;
  };

  const accentHex = botConfig?.accent_color || '#6C2BD9';
  const botNameDisplay = botConfig?.name || 'IRIS Concierge';

  return (
    <>
      {/* 1. FLOATING CHAT BUBBLE BUTTON (#4 Accessibility) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? `Close ${botNameDisplay} Chat` : `Open ${botNameDisplay} Chat`}
        aria-expanded={isOpen}
        aria-controls="iris-chat-drawer"
        style={{ background: `linear-gradient(to top right, ${accentHex}, ${accentHex}cc)` }}
        className="fixed bottom-6 right-6 w-14 h-14 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-50 border border-white/10"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : botConfig?.avatar_url ? (
          <Image src={botConfig.avatar_url} alt="Bot Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <BrainCircuit className="w-6 h-6 animate-pulse" />
        )}
      </button>

      {/* 2. CHAT DRAWER PANEL (#4 Accessibility role="dialog", focus trap) */}
      {isOpen && (
        <div 
          ref={drawerRef}
          id="iris-chat-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={`${botNameDisplay} Chat Panel`}
          className="fixed bottom-24 right-6 w-[360px] md:w-[400px] h-[520px] bg-[#0D0A1A]/95 border border-[#8B5CF6]/20 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-white/5 bg-[#13102A]/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div 
                style={{ backgroundColor: `${accentHex}30`, borderColor: `${accentHex}60` }}
                className="p-1.5 rounded-lg border"
              >
                {botConfig?.avatar_url ? (
                  <Image src={botConfig.avatar_url} alt="Bot Avatar" width={20} height={20} className="w-5 h-5 rounded-lg object-cover" />
                ) : (
                  <BrainCircuit className="w-5 h-5" style={{ color: accentHex }} />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">{botNameDisplay}</h3>
                <span className="text-[9px] text-[#C4B5FD]/70 flex items-center gap-1 font-mono">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" /> {getProviderLabel(activeProvider)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Notification & Nudge Preferences"
                className={`p-1.5 rounded-lg hover:bg-white/5 transition-all ${showSettings ? 'text-violet-400 bg-white/10' : 'text-white/50 hover:text-white'}`}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMessages([{ role: 'assistant', content: 'Conversation reset. How can I help you?', timestamp: new Date().toISOString() }])}
                aria-label="Reset Conversation"
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Proactive Nudge Notification Preferences Panel */}
          {showSettings && (
            <div className="p-3 bg-[#13102A] border-b border-white/10 text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Proactive AI Nudges</h4>
                  <p className="text-[10px] text-white/50">Receive alerts for fees, attendance & study prep</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNudgePrefs}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${
                    nudgePreferences.enabled ? 'bg-violet-600' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    nudgePreferences.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Offline Fallback Banner (#3) */}
          {activeProvider === 'offline' && (
            <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-[10px] text-amber-300 font-mono">
              <span className="flex items-center gap-1">
                ⚡ Offline Mode Active (Rule-Based Fallback)
              </span>
              <button 
                onClick={() => { setActiveProvider(''); if (sessionId) loadHistory(sessionId); }}
                className="hover:underline text-amber-200 text-[9px]"
              >
                Retry Live
              </button>
            </div>
          )}

          {/* Drawer Body (Messages view with aria-live #4) */}
          <div 
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Chat messages history"
            className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[340px]"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                } space-y-1`}
              >
                <div 
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs border ${
                    msg.role === 'user'
                      ? 'bg-[#6C2BD9]/15 border-[#8B5CF6]/25 text-white rounded-br-none'
                      : 'bg-black/35 border-white/5 text-white/95 rounded-bl-none'
                  }`}
                >
                  {renderMessageContent(msg.content)}

                  {msg.action_preview && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-black/50 border border-violet-500/40 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-[#C4B5FD]">
                        <span>{msg.action_preview.title}</span>
                        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                          msg.action_preview.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : msg.action_preview.status === 'cancelled'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-violet-600/20 text-violet-300 border-violet-500/30'
                        }`}>
                          {msg.action_preview.status || 'pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/80 italic">{msg.action_preview.summary}</p>
                      
                      <div className="bg-white/5 p-2 rounded-xl text-[10px] space-y-1 font-mono text-white/70">
                        {Object.entries(msg.action_preview.fields).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="capitalize">{k.replace('_', ' ')}:</span>
                            <span className="text-white font-semibold">{String(v)}</span>
                          </div>
                        ))}
                      </div>

                      {msg.action_preview.status === 'pending' || !msg.action_preview.status ? (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmAction(idx, msg.action_preview)}
                            disabled={confirmingActionIdx === idx}
                            className="flex-1 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all disabled:opacity-50"
                          >
                            {confirmingActionIdx === idx ? 'Submitting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelAction(idx)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 font-semibold text-xs transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 pt-1">
                          ✓ {msg.action_preview.status === 'confirmed' ? 'Action Executed Successfully' : 'Action Cancelled'}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.is_error && msg.retry_prompt && (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(msg.retry_prompt!)}
                      className="mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin-slow" /> Retry Request
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1 text-[9px] text-white/30 font-mono">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.role === 'assistant' && idx > 0 && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleRating(idx, 'up')}
                        aria-label="Rate response thumbs up"
                        className={`hover:text-emerald-400 transition-all ${msg.rating === 'up' ? 'text-emerald-400' : ''}`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleRating(idx, 'down')}
                        aria-label="Rate response thumbs down"
                        className={`hover:text-red-400 transition-all ${msg.rating === 'down' ? 'text-red-400' : ''}`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Distinct LLM Thinking Indicator (#2) */}
            {loading && (
              <div className="flex items-start space-y-1">
                <div className="p-3 rounded-2xl bg-black/40 border border-[#8B5CF6]/30 rounded-bl-none flex items-center gap-2 text-xs text-[#C4B5FD]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span className="font-mono text-[10px] animate-pulse">
                    {isLLMThinking ? 'IRIS Intelligence is thinking...' : 'Processing response...'}
                  </span>
                  <div className="flex items-center gap-1 pl-1">
                    <span className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Drawer Footer input control */}
          <div className="p-4 border-t border-white/5 bg-[#13102A]/30 space-y-3">
            {/* Quick chips options */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none scroll-smooth">
              {getQuickChips().map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] text-[#C4B5FD] font-semibold whitespace-nowrap transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMsg); }}
              className="relative flex items-center"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder={`Ask ${botNameDisplay} anything...`}
                value={inputMsg}
                onChange={handleInputChange}
                aria-label={`Type your message to ${botNameDisplay}`}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-xs text-white placeholder-white/20 focus:border-white/30 transition-all"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || charCount > 500}
                aria-label="Send message"
                style={{ backgroundColor: accentHex }}
                className="absolute right-2.5 p-2 rounded-xl text-white transition-all shadow hover:brightness-110 disabled:opacity-30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex justify-between items-center text-[9px] text-white/35 font-mono px-1">
              <span>IRIS 365 Concierge Assistant</span>
              <span className={charCount > 500 ? 'text-red-400 font-bold' : ''}>
                {charCount}/500 chars
              </span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
