"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, BookOpen, FileText, AlertTriangle, Upload, ClipboardList, UserCircle, CalendarClock, IndianRupee, DoorOpen, Users } from 'lucide-react';
import { usePortalAuth } from '../../hooks/usePortalAuth';

const librarianLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/librarian/library', icon: LayoutDashboard },
  { label: 'Book Catalogue', href: '/librarian/library/catalogue', icon: BookOpen },
  { label: 'Issue / Return', href: '/librarian/library/issue', icon: Upload },
  { label: 'Overdue Books', href: '/librarian/library/overdue', icon: AlertTriangle },
  { label: 'Fines', href: '/librarian/library/fines', icon: IndianRupee },
  { label: 'Reservations', href: '/librarian/library/reservations', icon: CalendarClock },
  { label: 'Study Rooms', href: '/librarian/library/study-rooms', icon: DoorOpen },
  { label: 'Book Clubs', href: '/librarian/library/book-clubs', icon: Users },
  { label: 'E-Books', href: '/librarian/library/ebooks', icon: FileText },
  { label: 'Reports', href: '/librarian/library/reports', icon: ClipboardList },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function LibrarianLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = usePortalAuth(['Librarian', 'SuperAdmin']);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A071B] flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse text-sm font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Librarian Portal"
      portalBadge="Librarian"
      sidebarLinks={librarianLinks}
      accentColor="#06B6D4"
    >
      {children}
    </PortalShell>
  );
}
