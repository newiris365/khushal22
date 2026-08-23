"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Dumbbell, Activity, Video, CalendarDays, UserCircle
} from 'lucide-react';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const trainerLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/gymtrainer/dashboard', icon: LayoutDashboard },
  { label: 'Trainer Sessions', href: '/gymtrainer/sessions', icon: CalendarDays },
  { label: 'Fitness Metrics', href: '/gymtrainer/metrics', icon: Activity },
  { label: 'Virtual Classes', href: '/gymtrainer/classes', icon: Video },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function GymTrainerLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = usePortalAuth(['Gym Trainer', 'Staff', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-emerald-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Gym Trainer Portal"
      portalBadge="Trainer"
      sidebarLinks={trainerLinks}
      accentColor="#10B981"
    >
      {children}
    </PortalShell>
  );
}
