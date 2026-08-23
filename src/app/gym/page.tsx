"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GymRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/gym');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white/50 text-xs">
      Redirecting to FitZone Gym Portal...
    </div>
  );
}
