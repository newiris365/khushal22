"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { 
  Users, CheckSquare, Sparkles, Award, CalendarClock, ListOrdered, UserCircle
} from 'lucide-react';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const officerLinks: SidebarLink[] = [
  { label: 'Application Queue', href: '/officer/admissions', icon: Users },
  { label: 'Verification Desk', href: '/officer/admissions/verify', icon: CheckSquare },
  { label: 'Auto Shortlisting', href: '/officer/admissions/shortlist', icon: Sparkles },
  { label: 'Merit Lists', href: '/officer/admissions/merit', icon: ListOrdered },
  { label: 'Offers System', href: '/officer/admissions/offers', icon: Award },
  { label: 'Counseling Ops', href: '/officer/admissions/counseling', icon: CalendarClock },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = usePortalAuth(['Admissions Officer', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-purple-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Admissions Officer Portal"
      portalBadge="Officer"
      sidebarLinks={officerLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
