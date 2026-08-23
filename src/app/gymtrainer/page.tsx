"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GymTrainerPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/gymtrainer/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A071B] flex items-center justify-center text-white/50 text-xs">
      Redirecting to Gym Trainer Dashboard...
    </div>
  );
}
