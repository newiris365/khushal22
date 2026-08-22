"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { usePortalAuth } from '../../hooks/usePortalAuth';
import {
  LayoutDashboard, Users, FileText,
  ClipboardList, GraduationCap, UserCircle, Calendar,
  Shield, BookOpen, UserCheck, AlertTriangle
} from 'lucide-react';

const vpLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/vp/dashboard', icon: LayoutDashboard },
  { label: 'Class Monitoring', href: '/vp/classes', icon: BookOpen },
  { label: 'Discipline', href: '/vp/discipline', icon: Shield },
  { label: 'Substitute Scheduler', href: '/vp/substitutes', icon: UserCheck },
  { label: 'Exam Oversight', href: '/vp/exams', icon: GraduationCap },
  { label: 'Faculty Directory', href: '/vp/faculty', icon: Users },
  { label: 'Appraisals', href: '/vp/appraisals', icon: ClipboardList },
  { label: 'Notices', href: '/vp/notices', icon: FileText },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function VicePrincipalLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = usePortalAuth(['Vice Principal', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-violet-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Vice Principal Suite"
      portalBadge="VP"
      sidebarLinks={vpLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
