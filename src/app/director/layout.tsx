"use client";

import React, { useState, useEffect } from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Activity, CreditCard, TrendingUp, AlertTriangle,
  Award, ShieldAlert, Lightbulb, FileText, GraduationCap, Settings,
  Home, BarChart3, Target, Briefcase, Users, UserCircle
} from 'lucide-react';

const collegeDirectorLinks: SidebarLink[] = [
  { label: 'Campus Pulse', href: '/director/pulse', icon: Activity },
  { label: 'Overview', href: '/director', icon: LayoutDashboard },
  { label: 'Fee Recovery', href: '/director/fee-recovery', icon: CreditCard },
  { label: 'Attendance Trends', href: '/director/attendance-trends', icon: TrendingUp },
  { label: 'Complaint SLA', href: '/director/complaint-sla', icon: AlertTriangle },
  { label: 'NAAC Data', href: '/director/naac', icon: Award },
  { label: 'Anomaly Detection', href: '/director/anomalies', icon: ShieldAlert },
  { label: 'Analytics', href: '/director/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/director/alerts', icon: AlertTriangle },
  { label: 'AI Insights', href: '/director/insights', icon: Lightbulb },
  { label: 'Student Journey', href: '/director/journey', icon: Users },
  { label: 'Reports', href: '/director/reports', icon: FileText },
  { label: 'Students', href: '/director/students', icon: GraduationCap },
  { label: 'Goals', href: '/director/goals', icon: Target },
  { label: 'Board Reports', href: '/director/board-reports', icon: Briefcase },
  { label: 'Financial P&L', href: '/director/financial-pl', icon: CreditCard },
  { label: 'Benchmarks', href: '/director/benchmarks', icon: Users },
  { label: 'Settings', href: '/director/settings', icon: Settings },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

const schoolDirectorLinks: SidebarLink[] = [
  { label: 'Campus Pulse', href: '/director/pulse', icon: Activity },
  { label: 'Overview', href: '/director', icon: LayoutDashboard },
  { label: 'Fee Recovery', href: '/director/fee-recovery', icon: CreditCard },
  { label: 'Attendance Trends', href: '/director/attendance-trends', icon: TrendingUp },
  { label: 'Complaint SLA', href: '/director/complaint-sla', icon: AlertTriangle },
  { label: 'Anomaly Detection', href: '/director/anomalies', icon: ShieldAlert },
  { label: 'Analytics', href: '/director/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/director/alerts', icon: AlertTriangle },
  { label: 'AI Insights', href: '/director/insights', icon: Lightbulb },
  { label: 'Student Journey', href: '/director/journey', icon: Users },
  { label: 'Reports', href: '/director/reports', icon: FileText },
  { label: 'Students', href: '/director/students', icon: GraduationCap },
  { label: 'Goals', href: '/director/goals', icon: Target },
  { label: 'Board Reports', href: '/director/board-reports', icon: Briefcase },
  { label: 'Financial P&L', href: '/director/financial-pl', icon: CreditCard },
  { label: 'Benchmarks', href: '/director/benchmarks', icon: Users },
  { label: 'Settings', href: '/director/settings', icon: Settings },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  const [links, setLinks] = useState<SidebarLink[]>(collegeDirectorLinks);

  useEffect(() => {
    // 1. Read cached user profile from localStorage
    const savedProfile = typeof window !== 'undefined' ? localStorage.getItem('iris_user_profile') : null;
    let instType = 'college';
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.institute_type) {
          instType = parsed.institute_type;
        }
      } catch (e) {}
    }

    setLinks(instType === 'school' ? schoolDirectorLinks : collegeDirectorLinks);

    // 2. Fetch fresh profile from backend to ensure institute_type is up-to-date
    const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
    if (!token) return;

    fetch('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.profile) {
          const freshType = data.profile.institute_type || 'college';
          setLinks(freshType === 'school' ? schoolDirectorLinks : collegeDirectorLinks);

          // Update cached profile
          if (savedProfile) {
            try {
              const parsed = JSON.parse(savedProfile);
              parsed.institute_type = freshType;
              localStorage.setItem('iris_user_profile', JSON.stringify(parsed));
            } catch (e) {}
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <PortalShell
      portalName="Director Console"
      portalBadge="Director"
      sidebarLinks={links}
      accentColor="#F59E0B"
    >
      {children}
    </PortalShell>
  );
}
