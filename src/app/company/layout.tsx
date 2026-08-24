"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { Briefcase, Users, Calendar } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const companyLinks: SidebarLink[] = [
  { label: 'Job Requirements', href: '/company/drives', icon: Briefcase },
  { label: 'Shortlists Review', href: '/company/students', icon: Users },
  { label: 'Interview Schedules', href: '/company/schedule', icon: Calendar },
];

function CompanyLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authorized } = usePortalAuth(['Company HR', 'SuperAdmin']);

  // If on HR login portal page, do not display navigation sidebar wrapper or trigger auth check
  if (pathname === '/company/portal') {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="text-purple-400 animate-pulse text-sm font-medium">Verifying recruiter authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Recruiter Panel"
      portalBadge="HR Partner"
      sidebarLinks={companyLinks}
      accentColor="#6C2BD9"
    >
      {children}
    </PortalShell>
  );
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <CompanyLayoutContent>{children}</CompanyLayoutContent>;
}
