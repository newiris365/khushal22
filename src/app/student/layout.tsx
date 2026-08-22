"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { AcademicProvider } from './AcademicContext';
import {
  QrCode, Calendar, CalendarDays, CreditCard, ShoppingBag, Home, BookOpen,
  Award, Dumbbell, Bus, MessageCircle, FileText, Bell, User, CheckCircle, Briefcase,
  Upload, Download, Wallet, CalendarCheck, UserCircle, GraduationCap, ClipboardList, UtensilsCrossed,
  UserCheck, Users, Clock, HeartHandshake
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
  { label: 'Hostel Hub', href: '/hostel', icon: Home },
  { label: 'Hostel Check-in', href: '/student/hostel/checkin', icon: UserCheck },
  { label: 'Roommate Matching', href: '/student/hostel/preferences', icon: Users },
  { label: 'Night Roll Call', href: '/student/hostel/rollcall', icon: Clock },
  { label: 'Wellness Check-in', href: '/student/hostel/wellness', icon: HeartHandshake },
  { label: 'Library', href: '/student/library/research', icon: BookOpen },
  { label: 'Placements', href: '/student/placements', icon: Briefcase },
  { label: 'Events', href: '/student/events', icon: Award },
  { label: 'FitZone', href: '/student/gym', icon: Dumbbell },
  { label: 'Transit GPS', href: '/transit', icon: Bus },
  { label: 'Exam Results', href: '/student/results', icon: FileText },
  { label: 'Exam Enrollment', href: '/student/exams', icon: ClipboardList },
  { label: 'Notices', href: '/student/notices', icon: Bell },
  { label: 'ID Card', href: '/student/idcard', icon: User },
  { label: 'Digital Gate Pass', href: '/gate/my-pass', icon: QrCode },
  { label: 'AI Assistant', href: '/ai/search', icon: MessageCircle, badge: 'AI' },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

function getSchoolStudentLinks(profile: any): SidebarLink[] {
  const isFeatureEnabled = (featureKey: string) => {
    if (!profile) return true;
    if (Array.isArray(profile.disabled_features)) {
      return !profile.disabled_features.includes(featureKey);
    }
    if (profile.features && typeof profile.features === 'object') {
      return profile.features[featureKey] !== false;
    }
    return true;
  };

  const links: SidebarLink[] = [
    { label: 'Attendance QR', href: '/student/dashboard', icon: QrCode },
    { label: 'My Attendance', href: '/student/attendance', icon: CheckCircle },
    { label: 'Homework & Diary', href: '/student/diary', icon: BookOpen },
    { label: 'Timetable', href: '/student/timetable', icon: CalendarDays },
    { label: 'Fee Ledger', href: '/student/fees', icon: CreditCard },
    { label: 'Exam Results', href: '/student/results', icon: FileText },
  ];

  if (isFeatureEnabled('canteen')) {
    links.push({ label: 'Canteen', href: '/student/canteen', icon: ShoppingBag });
  }

  if (isFeatureEnabled('transit')) {
    links.push({ label: 'Transit GPS', href: '/transit', icon: Bus });
  }

  if (isFeatureEnabled('hostel')) {
    links.push(
      { label: 'Hostel Hub', href: '/hostel', icon: Home },
      { label: 'Hostel Check-in', href: '/student/hostel/checkin', icon: UserCheck },
      { label: 'Roommate Matching', href: '/student/hostel/preferences', icon: Users },
      { label: 'Night Roll Call', href: '/student/hostel/rollcall', icon: Clock },
      { label: 'Wellness Check-in', href: '/student/hostel/wellness', icon: HeartHandshake }
    );
  }

  links.push(
    { label: 'Leave Application', href: '/student/leave', icon: CalendarCheck },
    { label: 'Notices', href: '/student/notices', icon: Bell },
    { label: 'ID Card', href: '/student/idcard', icon: User },
    { label: 'Digital Gate Pass', href: '/gate/my-pass', icon: QrCode },
    { label: 'AI Assistant', href: '/ai/search', icon: MessageCircle, badge: 'AI' },
    { label: 'Profile', href: '/profile', icon: UserCircle }
  );

  return links;
}

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [instituteType, setInstituteType] = useState<string>('college');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s request timeout

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
    setInstituteType(instType);
    setUserProfile(parsed);

    // Mock sandbox token bypass — gated to non-production environment
    if (token.startsWith('mock-sandbox') && process.env.NODE_ENV !== 'production') {
      setAuthorized(true);
      clearTimeout(timeoutId);
      return;
    }

    if (role !== 'Student') {
      window.location.href = '/login';
      clearTimeout(timeoutId);
      return;
    }

    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('iris_client_device_id') : '';
    // Backend validation before rendering children
    fetch('/api/v1/auth/me', {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(deviceId ? { 'X-Client-Device-ID': deviceId } : {})
      }
    })
      .then(async r => {
        if (cancelled) return;
        if (!r.ok || r.status === 401 || r.status === 403) {
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
          setInstituteType(freshType);
          setUserProfile(data.profile);
          if (freshType !== instType) {
            parsed.institute_type = freshType;
            localStorage.setItem('iris_user_profile', JSON.stringify(parsed));
          }
          setAuthorized(true);
        } else {
          localStorage.removeItem('iris_jwt_token');
          localStorage.removeItem('iris_user_profile');
          window.location.href = '/login';
        }
      })
      .catch(err => {
        if (cancelled) return;
        if (err.name === 'AbortError') {
          console.warn('Auth validation request timed out after 10s.');
        }
        if (token.startsWith('mock-sandbox') && process.env.NODE_ENV !== 'production') {
          setAuthorized(true);
        } else {
          localStorage.removeItem('iris_jwt_token');
          localStorage.removeItem('iris_user_profile');
          window.location.href = '/login';
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  if (!hasMounted || !authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0D0A1A]">
        <p className="text-slate-400 text-sm">Checking access...</p>
      </div>
    );
  }

  const activeLinks = instituteType === 'school'
    ? getSchoolStudentLinks(userProfile)
    : studentLinks;

  return (
    <AcademicProvider>
      <PortalShell
        portalName="Student Portal"
        portalBadge="Student"
        sidebarLinks={activeLinks}
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
