"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Shield, 
  BookOpen, 
  Coffee, 
  Dumbbell, 
  Home, 
  Key, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Bot, 
  ChevronRight, 
  CreditCard, 
  Users, 
  CheckCircle,
  Activity,
  Terminal,
  Zap,
  Globe,
  GraduationCap,
  ChevronDown,
  Search,
  MessageSquare
} from 'lucide-react';

const MODULES = [
  {
    icon: Shield,
    title: "Campus Core",
    desc: "RFID gate biometric check-ins, automated class registers, and student profile indexing with strict data checks.",
    badge: "System Core",
    color: "from-blue-500/20 to-purple-500/20"
  },
  {
    icon: BookOpen,
    title: "Academics",
    desc: "Stateless grading charts, online assignment drops, and timetables coordinated with custom database triggers.",
    badge: "Core Service",
    color: "from-purple-500/20 to-pink-500/20"
  },
  {
    icon: Coffee,
    title: "Canteen Wallet",
    desc: "Cashless student wallet logs, RFID meal sweeps, and automatic transaction audits with zero race conditions.",
    badge: "Financial",
    color: "from-amber-500/20 to-orange-500/20"
  },
  {
    icon: Dumbbell,
    title: "FitZone Wellness",
    desc: "Gym checking scanners, locker assignment locks, and sports equipment inventory managed automatically.",
    badge: "Residential",
    color: "from-emerald-500/20 to-teal-500/20"
  },
  {
    icon: Calendar,
    title: "Events Desk",
    desc: "Seat mapping reservations, dynamic QR scanners, and automated check-ins with fast cache tables.",
    badge: "Student Life",
    color: "from-rose-500/20 to-red-500/20"
  },
  {
    icon: Key,
    title: "Hostel Key",
    desc: "Visitor log systems, warden approval modules, and night check-in monitoring with real-time alerts.",
    badge: "Security",
    color: "from-indigo-500/20 to-blue-500/20"
  }
];

const MOCK_LOGS = [
  { type: "ATTENDANCE", text: "RFID Gate Terminal 04 verified student roll 23CSE051: Present", time: "Just now" },
  { type: "PAYMENT", text: "Canteen Cashless Wallet check-out Order #4092: INR 85.00", time: "1m ago" },
  { type: "SECURITY", text: "Warden approved late-night entry request for roll 23ECE012", time: "3m ago" },
  { type: "HOSTEL", text: "Warden Jaswant Singh approved plumbing complaint for Room A-101", time: "5m ago" },
  { type: "TRANSIT", text: "Bus RJ19-PA-1024 GPS telemetry packet broadcasted: Speed 45km/h", time: "8m ago" },
  { type: "AI", text: "AI Assistant resolved student timetable query in 320ms", time: "10m ago" }
];

const FAQ_DATA = [
  {
    id: "q1",
    category: "Architecture",
    question: "What is IRIS 365 and how does it integrate campus ecosystems?",
    answer: "IRIS 365 is an integrated Operating System for educational institutions. It unifies administrative control, academic tracking, student residential life, transport telemetry, gate clearance, canteen management, and AI assistance into a single real-time cloud console."
  },
  {
    id: "q2",
    category: "Security",
    question: "How is student data protected across modules?",
    answer: "All telemetry, personal credentials, and transaction records are encrypted using AES-256 at rest and TLS 1.3 in transit. Strict Role-Based Access Control (RBAC) ensures students, faculty, wardens, drivers, and directors access only authorized data scopes."
  },
  {
    id: "q3",
    category: "Deployment",
    question: "Can IRIS 365 deploy on-premise or hybrid cloud setups?",
    answer: "Yes. While IRIS 365 is optimized for serverless cloud deployment, we support hybrid on-premise hardware appliances for local gate biometric terminals, canteen POS units, and local bus GPS relays."
  },
  {
    id: "q4",
    category: "Modules",
    question: "Is it possible to enable only specific modules (e.g., Canteen & Transport)?",
    answer: "Absolutely. IRIS 365 uses a modular micro-frontend design. You can enable specific sub-systems like Gate Pass & Transport and expand to full Academic or Residential modules later without downtime."
  },
  {
    id: "q5",
    category: "Support",
    question: "How can our campus schedule a customized demo?",
    answer: "You can click 'Request a Demo' in the navigation bar or scroll to the demo registration section to request instant staging environment access for your administration team."
  }
];

const WhyIrisSection: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tiltX = -(y - rect.height / 2) / 18;
    const tiltY = (x - rect.width / 2) / 18;
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.transition = "none";
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
  };

  return (
    <section id="features" className="w-full max-w-[1240px] mx-auto px-6 sm:px-8 py-20 relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-12 lg:gap-16 items-center">
        {/* Left Column - Feature List */}
        <div className="text-left flex flex-col items-start">
          <div className="flex items-center gap-2 px-3.5 py-1 text-xs font-medium bg-[#8A2BE2]/10 text-white rounded-full border border-[#8A2BE2]/25">
            <span className="w-2 h-2 rounded-full bg-[#8A2BE2] animate-pulse" />
            <span className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Why IRIS 365</span>
            <span className="text-[8px] font-mono tracking-widest bg-white/10 px-1.5 py-0.5 rounded-full ml-1">AI-native</span>
          </div>

          <h2 className="text-3xl sm:text-[2.2rem] font-bold text-white font-orbitron mt-5 leading-[1.1] uppercase tracking-tight">
            One platform. <br /> Every operation.
          </h2>

          <p className="text-white/55 text-sm md:text-base font-sans font-light leading-relaxed mt-5 max-w-[520px]">
            From the moment a student walks through the gate to the time they graduate,
            IRIS 365 connects every operation — academic, physical, social, and logistical —
            into a single intelligent system.
          </p>

          <div className="flex flex-col mt-6 w-full max-w-[550px]">
            {[
              { label: "Smart Attendance", desc: "QR and biometric auto-marking, no manual registers ever." },
              { label: "AI Room and Resource Allocation", desc: "Hostel rooms, library seats, gym slots — all auto-assigned by AI." },
              { label: "Live Campus Tracking", desc: "Bus GPS, gate entry logs, canteen orders — all real-time." },
              { label: "Role-Based Access", desc: "11 different dashboards for every role from student to director." },
              { label: "Unified Wallet and Payments", desc: "One wallet for canteen, library fines, fees and gym across all modules." }
            ].map((row, idx, arr) => (
              <div key={idx} className="w-full">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8A2BE2]/45 shrink-0 flex items-center justify-center border border-[#8A2BE2]">
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                  <div className="font-sans text-sm text-white leading-normal">
                    <span className="font-semibold">{row.label}</span>
                    <span className="font-light text-xs text-white/55"> — {row.desc}</span>
                  </div>
                </div>
                {idx !== arr.length - 1 && <div className="border-t border-white/8 my-2" />}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2.5 mt-7 max-w-[550px]">
            {["Role-based Access", "Real-time Analytics", "QR Everywhere", "AI-powered", "PWA Ready", "Offline Support"].map((chip) => (
              <span key={chip} className="text-xs text-white/70 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 hover:bg-white/10 transition-all cursor-pointer">
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column - Today's Campus Live Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          className="rounded-3xl p-6 sm:p-7 border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl relative w-full"
        >
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-sans font-semibold text-sm sm:text-base text-white">Today's Campus Overview</h3>
              <p className="text-xs text-white/45 font-light mt-0.5">Live Real-time Feed</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          </div>

          <div className="space-y-3">
            {[
              { title: "🎓 Academic", stat: "23 classes today · 4 exams upcoming", dotColor: "#5B14B7" },
              { title: "🍽 Canteen", stat: "847 orders · ₹24,350 revenue today", dotColor: "#4B0082" },
              { title: "🚌 Transport", stat: "12 buses active · 3 routes on time", dotColor: "#0033A0" },
              { title: "🤖 AI Chatbot", stat: "142 queries resolved today", dotColor: "#8A2BE2" }
            ].map((card) => (
              <div key={card.title} className="rounded-xl p-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.06] transition-colors border border-white/5">
                <div className="flex items-center gap-3">
                  <div style={{ backgroundColor: card.dotColor }} className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                  <span className="font-semibold text-xs sm:text-sm text-white">{card.title}</span>
                </div>
                <span className="font-light text-xs text-white/50 text-right">{card.stat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [liveLogs, setLiveLogs] = useState(MOCK_LOGS);
  
  // FAQ States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Simulate incoming real-time telemetry logs
  useEffect(() => {
    const timer = setInterval(() => {
      const logTypes = ["ATTENDANCE", "PAYMENT", "SECURITY", "HOSTEL", "TRANSIT", "AI"];
      const rollNums = ["23CSE051", "23CSE052", "23ECE012", "23ME005"];
      const type = logTypes[Math.floor(Math.random() * logTypes.length)];
      let text = "";

      switch(type) {
        case "ATTENDANCE":
          text = `Student ${rollNums[Math.floor(Math.random() * rollNums.length)]} checked-in via Biometric: Present`;
          break;
        case "PAYMENT":
          text = `Canteen Order #${Math.floor(Math.random() * 9000 + 1000)} generated: INR ${Math.floor(Math.random() * 200 + 40)} via Wallet`;
          break;
        case "SECURITY":
          text = `Gate pass check-out logged for student ${rollNums[Math.floor(Math.random() * rollNums.length)]}`;
          break;
        case "HOSTEL":
          text = `Gym booking slot atomic allocation complete for user ${rollNums[Math.floor(Math.random() * rollNums.length)]}`;
          break;
        case "TRANSIT":
          text = `GPS coordinate updated: Lat ${26.29 + (Math.random() - 0.5) * 0.01}, Long ${73.02 + (Math.random() - 0.5) * 0.01}`;
          break;
        case "AI":
          text = `AI Concierge processed query semantic check: pgvector match threshold 0.82`;
          break;
      }

      setLiveLogs(prev => [
        { type, text, time: "Just now" },
        ...prev.map(p => ({ ...p, time: p.time === "Just now" ? "1m ago" : p.time.includes("m") ? `${parseInt(p.time) + 1}m ago` : p.time })).slice(0, 5)
      ]);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Filter FAQs
  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesQuery = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#050010] text-white flex flex-col font-sans antialiased overflow-x-hidden relative">
      {/* Ambient Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40 mix-blend-screen"
        src="/bg-video.mp4"
      />

      {/* Radial backdrop glows */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#6C2BD9]/10 blur-3xl -top-100 -left-100 pointer-events-none z-0"></div>
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#06B6D4]/5 blur-3xl top-[40%] right-[-20%] pointer-events-none z-0"></div>
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[#EC4899]/5 blur-3xl bottom-[-10%] left-[-10%] pointer-events-none z-0"></div>

      {/* Navigation Navbar */}
      <Header />

      {/* Hero Section */}
      <section id="hero" className="relative z-10 px-6 pt-28 pb-20 md:pt-40 md:pb-32 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-[#C4B5FD] text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Integrated Campus Management System</span>
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none max-w-4xl">
          The Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] via-[#8B5CF6] to-[#EC4899]">Operating System</span> of the Future
        </h1>

        <p className="text-sm sm:text-lg text-[#C4B5FD]/70 mt-6 max-w-2xl font-light leading-relaxed">
          IRIS 365 automates operations, cashless transactions, live transit, and AI concierge services for modern universities under a unified multi-tenant architecture.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link href="/home" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] text-white font-bold text-sm shadow-xl shadow-[#06B6D4]/10 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            <GraduationCap className="w-4 h-4" /> Apply for Admissions
          </Link>
          <Link href="/login?fresh=1" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all">
            Management Console →
          </Link>
          <a href="#modules" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 text-[#C4B5FD]/70 font-medium text-sm transition-all">
            Explore Modules
          </a>
        </div>
      </section>

      {/* Admissions Banner */}
      <section className="relative z-10 px-6 py-6 max-w-6xl mx-auto w-full">
        <Link href="/home" className="block group">
          <div className="relative overflow-hidden rounded-2xl border border-[#06B6D4]/30 bg-gradient-to-r from-[#06B6D4]/10 via-[#8B5CF6]/10 to-[#EC4899]/10 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-[#06B6D4]/60 transition-all duration-300">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4]/5 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#06B6D4]/20 shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Admissions Open</span>
                  <span className="text-[9px] font-mono text-[#C4B5FD]/40 uppercase tracking-wider">2026–27 Cycle</span>
                </div>
                <h3 className="font-heading font-bold text-white text-lg group-hover:text-[#06B6D4] transition-colors">Apply for Admissions at SIET Jodhpur</h3>
                <p className="text-xs text-[#C4B5FD]/60 mt-0.5">Register, choose programs, upload documents and pay fees — all in one place.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 px-6 py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] text-white font-bold text-sm shadow-lg shadow-[#06B6D4]/20 group-hover:brightness-110 transition-all">
              Start Application <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* Why IRIS Section */}
      <WhyIrisSection />

      {/* Features Showcase Section */}
      <section id="modules" className="relative z-10 px-6 py-20 bg-transparent border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-white">Consolidated Core Modules</h2>
            <p className="text-[#C4B5FD]/60 text-xs mt-2 max-w-md mx-auto">Every aspect of institutional lifecycle handled atomically with hardened multi-tenant role-based RLS isolation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((mod, index) => {
              const IconComponent = mod.icon;
              return (
                <div key={index} className="glass-panel hover:border-[#06B6D4]/50 rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-white/5 border border-white/10 text-[#C4B5FD] px-2 py-0.5 rounded-md">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white group-hover:text-[#06B6D4] transition-colors">{mod.title}</h3>
                  <p className="text-[#C4B5FD]/75 text-xs mt-2 leading-relaxed font-light">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section id="simulator" className="relative z-10 px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono uppercase mb-4">
              <Terminal className="w-3.5 h-3.5" />
              <span>Telemetry Gateway</span>
            </div>
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-white">Live Operations Simulator</h2>
            <p className="text-[#C4B5FD]/70 text-xs mt-4 leading-relaxed font-light">
              See the Express backend routing and PostgreSQL triggers execute in real-time. The console below updates dynamically as mock actions occur across our campus databases.
            </p>

            <div className="flex flex-col gap-4 mt-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Race Condition Prevention</h4>
                  <p className="text-xs text-[#C4B5FD]/60 mt-1 font-light">Custom PL/pgSQL database functions ensure data consistency during massive registration peaks.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Stateless JWT Fingerprinting</h4>
                  <p className="text-xs text-[#C4B5FD]/60 mt-1 font-light">Every request checks the user agent and IP subnet signatures against signed JWT claims to reject session hijacks.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#080512] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden font-mono">
            {/* Window bar controls */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <span className="text-[10px] text-white/40">iris-express-node-monitor.log</span>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto">
              {liveLogs.map((log, index) => (
                <div key={index} className="text-xs flex flex-col gap-1 border-l-2 pl-3 border-[#6C2BD9]/40 hover:border-[#06B6D4] transition-all">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      log.type === "ATTENDANCE" ? "bg-blue-500/10 text-blue-400" :
                      log.type === "PAYMENT" ? "bg-amber-500/10 text-amber-400" :
                      log.type === "SECURITY" ? "bg-rose-500/10 text-rose-400" :
                      log.type === "HOSTEL" ? "bg-purple-500/10 text-purple-400" :
                      log.type === "TRANSIT" ? "bg-teal-500/10 text-teal-400" :
                      "bg-fuchsia-500/10 text-fuchsia-400"
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-[9px] text-white/30">{log.time}</span>
                  </div>
                  <p className="text-white/85 text-[11px] mt-0.5 font-light">{log.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 py-20 bg-transparent border-t border-white/5 w-full">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-[#8A2BE2]/30 text-[#C4B5FD] text-[10px] font-orbitron font-bold uppercase tracking-wider mb-4">
              <MessageSquare className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Got Questions?</span>
            </div>
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-white">Frequently Asked Questions</h2>
            <p className="text-[#C4B5FD]/60 text-xs mt-2 font-sans">
              Find answers to architectural, deployment, and security specifications for the IRIS 365 OS.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-6 mb-10">
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search FAQ questions and answers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3.5 pl-12 rounded-2xl bg-white/3 border border-white/10 text-xs text-white placeholder-white/30 outline-none focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10 transition-all duration-300"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30 pointer-events-none" />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['All', 'Architecture', 'Security', 'Deployment', 'Modules', 'Support'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[10px] font-orbitron font-bold uppercase tracking-wider transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] text-white border-transparent shadow-md shadow-[#8A2BE2]/10"
                      : "bg-white/5 border border-white/10 text-[#C4B5FD]/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl border border-white/8 bg-[#090117]/80 hover:border-[#8A2BE2]/30 overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                      >
                        <div className="flex flex-col gap-1.5 text-left">
                          <span className="text-[9px] font-mono uppercase bg-white/5 border border-white/10 text-[#C4B5FD] px-2 py-0.5 rounded self-start tracking-wider">
                            {faq.category}
                          </span>
                          <span className="font-heading font-bold text-white text-sm tracking-wide mt-1">
                            {faq.question}
                          </span>
                        </div>
                        <div className={`w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/70 transition-transform duration-300 shrink-0 ${
                          isExpanded ? 'rotate-180 text-white' : ''
                        }`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <div className="px-6 pb-6 text-xs text-[#C4B5FD]/75 leading-relaxed font-sans border-t border-white/5 pt-4">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-xs text-[#C4B5FD]/45">
                  No matching queries found. Try searching for other keywords.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
