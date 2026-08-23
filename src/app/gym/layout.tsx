"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Dumbbell, Calendar, ClipboardList, Activity, TrendingUp, UserCircle } from 'lucide-react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const gymLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/student/gym', icon: Dumbbell },
  { label: 'Book Slot', href: '/student/gym/book', icon: Calendar },
  { label: 'My Bookings', href: '/student/gym/bookings', icon: ClipboardList },
  { label: 'Workout Log', href: '/student/gym/workout', icon: Activity },
  { label: 'Progress Charts', href: '/student/gym/progress', icon: TrendingUp },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

function GymLayoutContent({ children }: { children: React.ReactNode }) {
  const { authorized } = usePortalAuth(['Student', 'Parent', 'Staff', 'Gym Trainer', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-amber-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="FitZone"
      portalBadge="Gym"
      sidebarLinks={gymLinks}
      accentColor="#F59E0B"
    >
      {children}
    </PortalShell>
  );
}

const GymLayout = dynamic(() => Promise.resolve(GymLayoutContent), { ssr: false });

export default function GymLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <GymLayout>{children}</GymLayout>;
}
