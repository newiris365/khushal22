"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';

interface AcademicContextType {
  institutionType: 'school' | 'college';
  semLabel: string; // "Grade" or "Semester"
  deptLabel: string; // "Section" or "Department"
  studentProfile: any;
  loading: boolean;
}

const AcademicContext = createContext<AcademicContextType>({
  institutionType: 'college',
  semLabel: 'Semester',
  deptLabel: 'Department',
  studentProfile: null,
  loading: true
});

export function AcademicProvider({ children }: { children: React.ReactNode }) {
  const [institutionType, setInstitutionType] = useState<'school' | 'college'>('college');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiGet('/core/students/me');
        if (res.success && res.student) {
          setStudentProfile(res.student);
          const type = res.student.institutions?.type || 'college';
          setInstitutionType(type);
        }
      } catch (err) {
        console.error('Failed to fetch student academic context:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const semLabel = institutionType === 'school' ? 'Grade' : 'Semester';
  const deptLabel = institutionType === 'school' ? 'Section' : 'Department';

  return (
    <AcademicContext.Provider value={{ institutionType, semLabel, deptLabel, studentProfile, loading }}>
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademic() {
  return useContext(AcademicContext);
}
