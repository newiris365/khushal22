"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Users, FileText, Award, IndianRupee,
  ClipboardList, BarChart3, GraduationCap, UserCircle
} from 'lucide-react';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const principalLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/principal/dashboard', icon: LayoutDashboard },
  { label: 'Staff Directory', href: '/principal/hr/staff', icon: Users },
  { label: 'Appraisals', href: '/principal/hr/appraisals', icon: ClipboardList },
  { label: 'Increments', href: '/principal/hr/increments', icon: IndianRupee },
  { label: 'Reports', href: '/principal/hr/reports', icon: BarChart3 },
  { label: 'Academics', href: '/principal/academics', icon: GraduationCap },
  { label: 'Notices', href: '/principal/notices', icon: FileText },
  { label: 'Achievements', href: '/principal/achievements', icon: Award },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = usePortalAuth(['Principal', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-violet-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Principal Suite"
      portalBadge="Principal"
      sidebarLinks={principalLinks}
      accentColor="#6C2BD9"
    >
      {children}
    </PortalShell>
  );
}
