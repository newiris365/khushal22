"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { usePortalAuth } from '../../hooks/usePortalAuth';
import {
  LayoutDashboard, GraduationCap, BarChart3, Target, Users, UserCircle,
  Wand2, ClipboardList, BookOpen, UserCheck, CalendarDays, FileText,
  Bell, Award, IndianRupee, Briefcase, TrendingUp, Settings, UtensilsCrossed,
  Award as AwardIcon, FileBarChart, AlertTriangle, CheckCircle
} from 'lucide-react';

const hodLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/hod/dashboard', icon: LayoutDashboard },
  { label: 'Department Students', href: '/hod/students', icon: Users },
  { label: 'Faculty Management', href: '/hod/faculty', icon: UserCheck },
  { label: 'Auto Timetable', href: '/hod/timetable/auto', icon: Wand2 },
  { label: 'Timetable View', href: '/hod/timetable', icon: ClipboardList },
  { label: 'Attendance Reports', href: '/hod/attendance', icon: CalendarDays },
  { label: 'Exam Results', href: '/hod/exams', icon: FileText },
  { label: 'Leave Approvals', href: '/hod/leaves', icon: CheckCircle },
  { label: 'Fee Defaulters', href: '/hod/fees', icon: IndianRupee },
  { label: 'OBE Programs', href: '/hod/obe/programs', icon: GraduationCap },
  { label: 'CO-PO Attainment', href: '/hod/obe/po-attainment', icon: Target },
  { label: 'Gap Analysis', href: '/hod/obe/gap-analysis', icon: BarChart3 },
  { label: 'Faculty Development', href: '/hod/faculty-development', icon: BookOpen },
  { label: 'NAAC Compliance', href: '/hod/naac', icon: Award },
  { label: 'Department Analytics', href: '/hod/analytics', icon: TrendingUp },
  { label: 'Student Achievements', href: '/hod/achievements', icon: AwardIcon },
  { label: 'Placements', href: '/hod/placements', icon: Briefcase },
  { label: 'Notices', href: '/hod/notices', icon: Bell },
  { label: 'Events', href: '/hod/events', icon: CalendarDays },
  { label: 'Canteen', href: '/hod/canteen', icon: UtensilsCrossed },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

// OBE is college-only; hide these links for school-type institutes
const OBE_LABELS = new Set(['OBE Programs', 'CO-PO Attainment', 'Gap Analysis', 'NAAC Compliance']);

export default function HodLayout({ children }: { children: React.ReactNode }) {
  const { authorized, instituteType } = usePortalAuth(['HOD', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-violet-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  const visibleLinks = instituteType === 'school'
    ? hodLinks.filter(l => !OBE_LABELS.has(l.label))
    : hodLinks;

  return (
    <PortalShell
      portalName="HOD Portal"
      portalBadge="HOD"
      sidebarLinks={visibleLinks}
      accentColor="#0891B2"
    >
      {children}
    </PortalShell>
  );
}
