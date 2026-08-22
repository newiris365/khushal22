"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { useAcademic } from '../AcademicContext';
import { apiGet } from '../../../lib/api';

export default function StudentTimetablePage() {
  const { institutionType, studentProfile, loading: profileLoading } = useAcademic();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    if (!studentProfile?.id) return;
    setIsLoading(true);
    apiGet(`/core/timetable/student/${studentProfile.id}`).then(res => {
      if (res?.success) {
        setTimetable(res.timetable || []);
      }
      setIsLoading(false);
    });
  }, [studentProfile]);

  const dailyLectures = timetable.filter(b => b.day_of_week === activeDay);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-12 bg-white/5 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-white">Class Timetable</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">
              {institutionType === 'school' 
                ? 'Inspect your daily grade schedules, class room placements, and teachers.'
                : 'Inspect your daily schedules, lecture room placements, and subject trainers.'
              }
            </p>
          </div>
        </div>

        {/* Days selector */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 border-b border-white/5">
          {days.map(d => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDay === d 
                  ? 'bg-[#06B6D4] text-white shadow-md shadow-[#06B6D4]/20' 
                  : 'bg-[#13102A] text-[#C4B5FD]/70 border border-white/5 hover:bg-white/5'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Lectures Timeline List */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Loading lecture schedule...</div>
          ) : dailyLectures.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 border border-white/5 text-center text-xs text-[#C4B5FD]/50 italic">
              No classes scheduled for {activeDay}. Enjoy your day off!
            </div>
          ) : (
            <div className="relative border-l border-[#06B6D4]/20 pl-6 space-y-6">
              {dailyLectures.map((item, idx) => (
                <div key={item.id || idx} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute w-3 h-3 rounded-full bg-[#06B6D4] border border-white -left-[32px] top-1.5 shadow-lg shadow-[#06B6D4]/50"></div>
                  
                  <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-wrap justify-between items-center gap-4 hover:border-[#06B6D4]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#22D3EE]">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-base text-white">{item.subject}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-[#C4B5FD]/70 mt-1 font-light flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> 
                            {institutionType === 'school' ? 'Fixed Class Room' : 'Lecture Hall'}: {item.room}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> 
                            {institutionType === 'school' ? 'Teacher' : 'Lecturer'}: {item.staff?.users?.name || 'Prof. Vyas'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono font-bold text-[10px] text-[#22D3EE] bg-[#06B6D4]/20 px-3 py-1.5 rounded-lg border border-[#06B6D4]/30">
                      {item.time_slot} <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
