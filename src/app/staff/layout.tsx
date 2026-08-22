"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, CalendarDays, ClipboardList, FileText,
  BookOpen, Users, Award, Bell, UserCircle
} from 'lucide-react';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const staffLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'My Timetable', href: '/staff/timetable', icon: ClipboardList },
  { label: 'Attendance', href: '/staff/attendance', icon: CalendarDays },
  { label: 'CIA Marks', href: '/staff/cia', icon: FileText },
  { label: 'Leave Approvals', href: '/staff/leaves', icon: Award },
  { label: 'Study Materials', href: '/staff/study-materials', icon: BookOpen },
  { label: 'Notices', href: '/staff/notices', icon: Bell },
  { label: 'Students', href: '/staff/students', icon: Users },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = usePortalAuth(['Staff', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-blue-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Staff Portal"
      portalBadge="Staff"
      sidebarLinks={staffLinks}
      accentColor="#2563EB"
    >
      {children}
    </PortalShell>
  );
}
