"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, CalendarDays, CreditCard, FileText, MessageSquare, Calendar, Link2, Bell, Bus, Wallet, UserCircle, Upload, AlertCircle, ClipboardList, Home, Dumbbell } from 'lucide-react';

const parentLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/parent/attendance', icon: CalendarDays },
  { label: 'Fee Status', href: '/parent/fees', icon: CreditCard },
  { label: 'Exam Results', href: '/parent/results', icon: FileText },
  { label: 'Wallet', href: '/parent/wallet', icon: Wallet },
  { label: 'Complaints', href: '/parent/complaints', icon: AlertCircle },
  { label: 'Messages', href: '/parent/messages', icon: MessageSquare },
  { label: 'PTM Schedule', href: '/parent/ptm', icon: Calendar },
  { label: 'Link Child', href: '/parent/link', icon: Link2 },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

function ParentLayoutContent({ children }: { children: React.ReactNode }) {
  const [links, setLinks] = useState<SidebarLink[]>(parentLinks);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [noChildLinked, setNoChildLinked] = useState(false);
  const authorizedRef = React.useRef<boolean | null>(null);

  useEffect(() => {
    setHasMounted(true);
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('iris_jwt_token') || '';
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const res = await fetch('/api/v1/parent/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.children) {
        setChildrenList(data.children);
        
        if (data.children.length === 0) {
          setNoChildLinked(true);
          return;
        }

        const verifiedChildren = data.children.filter((c: any) => c.verified);
        if (verifiedChildren.length === 0) {
          setPendingVerification(true);
          setAuthorized(true); // Allow shell to render but block pages
          return;
        }

        // We have verified children
        const savedChildId = localStorage.getItem('iris_selected_student_id');
        const defaultChild = verifiedChildren.find((c: any) => c.student_id === savedChildId) || verifiedChildren[0];
        setSelectedChildId(defaultChild.student_id);
        localStorage.setItem('iris_selected_student_id', defaultChild.student_id);

        setAuthorized(true);
        authorizedRef.current = true;
        applyLinks(defaultChild.institute_type);
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('iris_jwt_token');
        localStorage.removeItem('iris_user_profile');
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Failed to fetch linked children:', err);
    }
  };

  const applyLinks = (type: string) => {
    if (type === 'school') {
      setLinks([
        { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
        { label: 'Attendance', href: '/parent/attendance', icon: CalendarDays },
        { label: 'Assignments', href: '/parent/assignments', icon: Upload },
        { label: 'Timetable', href: '/parent/timetable', icon: CalendarDays },
        { label: 'Hostel', href: '/hostel', icon: Home },
        { label: 'Transit GPS', href: '/transit', icon: Bus },
        { label: 'FitZone Gym', href: '/gym', icon: Dumbbell },
        { label: 'Fee Status', href: '/parent/fees', icon: CreditCard },
        { label: 'Exam Results', href: '/parent/results', icon: FileText },
        { label: 'Leave Application', href: '/parent/leave', icon: ClipboardList },
        { label: 'Wallet', href: '/parent/wallet', icon: Wallet },
        { label: 'Complaints', href: '/parent/complaints', icon: AlertCircle },
        { label: 'Notices', href: '/parent/notices', icon: Bell },
        { label: 'Messages', href: '/parent/messages', icon: MessageSquare },
        { label: 'PTM Schedule', href: '/parent/ptm', icon: Calendar },
        { label: 'Link Child', href: '/parent/link', icon: Link2 },
        { label: 'Profile', href: '/profile', icon: UserCircle },
      ]);
    } else {
      setLinks(parentLinks);
    }
  };

  const handleSwitchChild = (studentId: string) => {
    localStorage.setItem('iris_selected_student_id', studentId);
    setSelectedChildId(studentId);
    window.location.reload();
  };

  if (!hasMounted || authorized === null) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Checking access...</p>
      </div>
    );
  }

  // Verification Pending Screen (Blocking Layout)
  if (pendingVerification) {
    return (
      <PortalShell
        portalName="Parent Portal"
        portalBadge="Verification Pending"
        sidebarLinks={[
          { label: 'Link Child', href: '/parent/link', icon: Link2 },
          { label: 'Profile', href: '/profile', icon: UserCircle }
        ]}
        accentColor="#EC4899"
      >
        <div className="max-w-md mx-auto my-12 p-8 bg-[#13102A]/80 border border-red-500/30 rounded-3xl backdrop-blur-md text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto text-xl animate-pulse">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Pending Verification</h2>
            <p className="text-xs text-slate-300">
              Your link request is pending admin approval. Access to student attendance, grades, fees, and tracking is locked until the registration details are verified.
            </p>
          </div>
          <div className="text-[10px] text-slate-400 bg-white/5 p-4 rounded-xl space-y-2 text-left">
            <span className="font-semibold text-slate-200 block border-b border-white/10 pb-1">Linked Profiles:</span>
            {childrenList.map((c, i) => (
              <div key={i} className="flex justify-between">
                <span>{c.name} ({c.roll_number})</span>
                <span className="text-amber-400 font-bold">Unverified</span>
              </div>
            ))}
          </div>
        </div>
      </PortalShell>
    );
  }

  // No Child Linked Screen
  if (noChildLinked) {
    return (
      <PortalShell
        portalName="Parent Portal"
        portalBadge="Parent"
        sidebarLinks={[
          { label: 'Link Child', href: '/parent/link', icon: Link2 },
          { label: 'Profile', href: '/profile', icon: UserCircle }
        ]}
        accentColor="#EC4899"
      >
        <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 w-full flex flex-col gap-6 text-white">
          <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
              <Link2 className="w-8 h-8 text-[#A78BFA]" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-white">No Child Linked</h2>
            <p className="text-xs text-[#C4B5FD]/60 max-w-md">
              You need to link your child&apos;s account to view their dashboard. Enter your child&apos;s roll number and verify via OTP.
            </p>
            <Link href="/parent/link"
              className="px-6 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-sm font-bold transition-all">
              Link Your Child
            </Link>
          </div>
        </div>
      </PortalShell>
    );
  }

  const verifiedChildren = childrenList.filter(c => c.verified);

  return (
    <PortalShell
      portalName="Parent Portal"
      portalBadge="Parent"
      sidebarLinks={links}
      accentColor="#EC4899"
    >
      <div className="w-full flex flex-col gap-4">
        {verifiedChildren.length > 1 && (
          <div className="flex justify-between items-center px-4 md:px-6 py-3 bg-[#13102A]/80 border border-[#6C2BD9]/20 rounded-2xl mx-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-[#A78BFA]/80 font-medium">Monitoring Ward:</span>
            </div>
            <select
              value={selectedChildId}
              onChange={(e) => handleSwitchChild(e.target.value)}
              className="bg-[#0D0A1A] border border-[#6C2BD9]/40 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              {verifiedChildren.map((c) => (
                <option key={c.student_id} value={c.student_id}>
                  {c.name} ({c.course} - Sem {c.semester})
                </option>
              ))}
            </select>
          </div>
        )}
        {children}
      </div>
    </PortalShell>
  );
}

const ParentLayout = dynamic(() => Promise.resolve(ParentLayoutContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#0D0A1A]">
      <p className="text-slate-400 text-sm">Checking access...</p>
    </div>
  )
});

export default ParentLayout;
