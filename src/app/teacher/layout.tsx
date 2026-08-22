"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, CalendarDays, Dumbbell, FileText, ClipboardList, GraduationCap, UserCircle,
  UtensilsCrossed, Bell, MessageSquare, BookOpen, Calendar, FileUp,
  Award, Search, Settings
} from 'lucide-react';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const rawTeacherLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/teacher/attendance', icon: CalendarDays },
  { label: 'Timetable', href: '/teacher/timetable', icon: ClipboardList },
  { label: 'Exam Results', href: '/teacher/results', icon: FileText },
  { label: 'Messages', href: '/teacher/messages', icon: MessageSquare },
  { label: 'Study Materials', href: '/teacher/study-materials', icon: BookOpen },
  { label: 'Assignments', href: '/teacher/assignments', icon: FileUp },
  { label: 'Canteen', href: '/teacher/canteen', icon: UtensilsCrossed },
  { label: 'Notices', href: '/teacher/notices', icon: Bell },
  { label: 'Events', href: '/teacher/events', icon: Award },
  { label: 'Leave Application', href: '/teacher/leave', icon: Calendar },
  { label: 'Gym Bookings', href: '/teacher/gym', icon: Dumbbell },
  { label: 'OBE Setup', href: '/teacher/obe/courses', icon: GraduationCap },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { authorized, instituteType } = usePortalAuth(['Teacher', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-violet-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  const sidebarLinks = instituteType === 'school'
    ? rawTeacherLinks.filter(l => l.label !== 'OBE Setup')
    : rawTeacherLinks;

  return (
    <PortalShell
      portalName="Faculty Portal"
      portalBadge="Teacher"
      sidebarLinks={sidebarLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
