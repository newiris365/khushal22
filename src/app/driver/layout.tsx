"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, PlayCircle, MapPin, Users, AlertTriangle, Bus, UserCircle, Navigation, CalendarCheck, FileText
} from 'lucide-react';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const driverLinks: SidebarLink[] = [
  { label: 'My Bus', href: '/driver/dashboard', icon: Bus },
  { label: 'Start/End Trip', href: '/driver/trip', icon: PlayCircle },
  { label: 'Stops', href: '/driver/stops', icon: MapPin },
  { label: 'Headcount', href: '/driver/headcount', icon: Users },
  { label: 'Live Map', href: '/transit/track', icon: Navigation },
  { label: 'Leave Application', href: '/driver/leave', icon: CalendarCheck },
  { label: 'Payslips', href: '/driver/payslips', icon: FileText },
  { label: 'Emergency', href: '/driver/emergency', icon: AlertTriangle },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = usePortalAuth(['Driver', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-orange-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Driver Portal"
      portalBadge="Driver"
      sidebarLinks={driverLinks}
      accentColor="#EA580C"
    >
      {children}
    </PortalShell>
  );
}
