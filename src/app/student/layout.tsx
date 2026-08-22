"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { AcademicProvider } from './AcademicContext';
import {
  QrCode, Calendar, CalendarDays, CreditCard, ShoppingBag, Home, BookOpen,
  Award, Dumbbell, Bus, MessageCircle, FileText, Bell, User, CheckCircle, Briefcase,
  Upload, Download, Wallet, CalendarCheck, UserCircle, GraduationCap, ClipboardList, UtensilsCrossed
} from 'lucide-react';

const studentLinks: SidebarLink[] = [
  { label: 'Attendance QR', href: '/student/dashboard', icon: QrCode },
  { label: 'My Attendance', href: '/student/attendance', icon: CheckCircle },
  { label: 'Timetable', href: '/student/timetable', icon: CalendarDays },
  { label: 'Academic Calendar', href: '/student/calendar', icon: Calendar },
  { label: 'Course Registration', href: '/student/courses', icon: GraduationCap },
  { label: 'Fee Ledger', href: '/student/fees', icon: CreditCard },
  { label: 'Assignments', href: '/student/assignments', icon: Upload },
  { label: 'Study Materials', href: '/student/study-materials', icon: Download },
  { label: 'Leave Application', href: '/student/leave', icon: CalendarCheck },
  { label: 'Campus Wallet', href: '/student/wallet', icon: Wallet },
  { label: 'Canteen', href: '/student/canteen', icon: ShoppingBag },
  { label: 'College Mess', href: '/student/mess', icon: UtensilsCrossed },
  { label: 'Hostel', href: '/hostel', icon: Home },
  { label: 'Library', href: '/student/library/research', icon: BookOpen },
  { label: 'Placements', href: '/student/placements', icon: Briefcase },
  { label: 'Events', href: '/student/events', icon: Award },
  { label: 'FitZone', href: '/student/gym', icon: Dumbbell },
  { label: 'Transit GPS', href: '/transit', icon: Bus },
  { label: 'Exam Results', href: '/student/results', icon: FileText },
  { label: 'Exam Enrollment', href: '/student/exams', icon: ClipboardList },
  { label: 'Notices', href: '/student/notices', icon: Bell },
  { label: 'ID Card', href: '/student/idcard', icon: User },
  { label: 'AI Assistant', href: '/ai/search', icon: MessageCircle, badge: 'AI' },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const authorizedRef = React.useRef<boolean | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    // Instant redirect if no token — avoids stuck "Checking access..." after sign out
    const token = localStorage.getItem('iris_jwt_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const savedProfile = localStorage.getItem('iris_user_profile');
    if (!savedProfile) {
      window.location.href = '/login';
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(savedProfile);
    } catch (e) {
      localStorage.removeItem('iris_jwt_token');
      localStorage.removeItem('iris_user_profile');
      localStorage.removeItem('iris_refresh_token');
      window.location.href = '/login';
      return;
    }

    const role = parsed.role || '';
    const instType = parsed.institute_type || 'college';

    // If mock sandbox token (Quick Login / Demo mode), allow immediately
    if (token.startsWith('mock-sandbox')) {
      setAuthorized(true);
      authorizedRef.current = true;
      return;
    }

    if (role !== 'Student') {
      window.location.href = '/login';
      return;
    }

    // Optimistically allow rendering while we validate with backend
    setAuthorized(true);
    authorizedRef.current = true;

    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('iris_client_device_id') : '';
    // Validate token with backend
    fetch('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(deviceId ? { 'X-Client-Device-ID': deviceId } : {})
      }
    })
      .then(async r => {
        if (cancelled) return;
        if (r.status === 401 || r.status === 403) {
          localStorage.removeItem('iris_jwt_token');
          localStorage.removeItem('iris_user_profile');
          localStorage.removeItem('iris_refresh_token');
          window.location.href = '/login';
          return;
        }
        const data = await r.json();
        if (data.success && data.profile) {
          const backendRole = data.profile.role || '';
          if (backendRole !== 'Student') {
            localStorage.removeItem('iris_jwt_token');
            localStorage.removeItem('iris_user_profile');
            localStorage.removeItem('iris_refresh_token');
            window.location.href = '/login';
            return;
          }
          const freshType = data.profile.institute_type || 'college';
          if (freshType !== instType) {
            parsed.institute_type = freshType;
            localStorage.setItem('iris_user_profile', JSON.stringify(parsed));
            window.location.reload();
          }
        }
      })
      .catch(() => {});

    // 3-second safety timeout — redirect to login if auth never resolves
    redirectTimeout = setTimeout(() => {
      if (authorizedRef.current !== true && !cancelled) {
        window.location.href = '/login';
      }
    }, 3000);

    return () => {
      cancelled = true;
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, []);

  if (!hasMounted || authorized !== true) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Checking access...</p>
      </div>
    );
  }

  return (
    <AcademicProvider>
      <PortalShell
        portalName="Student Portal"
        portalBadge="Student"
        sidebarLinks={studentLinks}
        accentColor="#06B6D4"
      >
        {children}
      </PortalShell>
    </AcademicProvider>
  );
}

const StudentLayout = dynamic(() => Promise.resolve(StudentLayoutContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#0D0A1A]">
      <p className="text-slate-400 text-sm">Checking access...</p>
    </div>
  )
});

export default StudentLayout;
