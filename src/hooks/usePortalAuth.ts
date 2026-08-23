"use client";

import { useState, useEffect, useRef } from 'react';

export const ROLE_DASHBOARD_MAP: Record<string, string> = {
  SuperAdmin: '/admin/global',
  Admin: '/admin/dashboard',
  Principal: '/principal/dashboard',
  'Vice Principal': '/vp/dashboard',
  Director: '/director/dashboard',
  HOD: '/hod/dashboard',
  Teacher: '/teacher/timetable',
  Staff: '/staff/dashboard',
  Student: '/student/dashboard',
  Parent: '/parent/dashboard',
  Warden: '/warden/dashboard',
  Security: '/gate',
  Vendor: '/vendor/dashboard',
  Driver: '/driver/dashboard',
  Librarian: '/librarian/library',
  'Admissions Officer': '/officer/admissions',
  'Gym Trainer': '/gymtrainer/dashboard',
};

export interface PortalAuthResult {
  authorized: boolean;
  userRole: string;
  instituteType: string;
  userProfile: any | null;
}

export function usePortalAuth(allowedRoles: string[]): PortalAuthResult {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [instituteType, setInstituteType] = useState<string>('college');
  const [userProfile, setUserProfile] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
      window.location.href = '/login';
      return;
    }

    const role = parsed.role || '';
    const instType = parsed.institute_type || 'college';
    setUserRole(role);
    setInstituteType(instType);
    setUserProfile(parsed);

    // If mock-sandbox token (Quick Login / Demo mode), allow immediately
    if (token.startsWith('mock-sandbox')) {
      setAuthorized(true);
      return;
    }

    const roleSet = new Set(allowedRoles);
    if (!roleSet.has(role)) {
      const redirect = ROLE_DASHBOARD_MAP[role] || '/dashboard';
      window.location.href = redirect;
      return;
    }

    setAuthorized(true);

    const deviceId = localStorage.getItem('iris_client_device_id') || '';
    fetch('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(deviceId ? { 'X-Client-Device-ID': deviceId } : {})
      }
    })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('iris_jwt_token');
          localStorage.removeItem('iris_user_profile');
          window.location.href = '/login';
        }
      })
      .catch(err => console.error('Auth verification failed:', err));
  }, []);

  return { authorized, userRole, instituteType, userProfile };
}
