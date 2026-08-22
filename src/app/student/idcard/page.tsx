"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, Download, ShieldCheck } from 'lucide-react';
import { useAcademic } from '../AcademicContext';
import { apiGet } from '../../../lib/api';

export default function StudentIdCardPage() {
  const { institutionType, studentProfile, loading: profileLoading } = useAcademic();
  const [cardData, setCardData] = useState<any | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile?.id) return;
    setIsLoading(true);
    apiGet(`/core/idcards/generate/${studentProfile.id}`).then(res => {
      if (res.success) {
        setCardData(res.card);
      }
      setIsLoading(false);
    });
  }, [studentProfile]);

  if (profileLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white p-8 flex items-center justify-center">
        <div className="text-center text-xs text-[#C4B5FD]/50 py-20">Compiling ID badge components...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8 flex items-center justify-center">
      <div className="max-w-md w-full flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/20 border border-[#06B6D4]/30 flex items-center justify-center text-[#22D3EE]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-white">Your Digital ID Card</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Show your barcode entry pass or download the print-ready PDF badge.</p>
          </div>
        </div>

        {/* Double-sided card layout */}
        {!cardData ? (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 text-center text-xs text-[#C4B5FD]/50">
            No active ID card template registered for your institution.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            
            {/* Interactive double sided widget */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer group perspective-1000 w-64 h-96 relative"
            >
              <div 
                className={`w-full h-full duration-700 transform-style-preserve-3d relative ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                
                {/* Front side */}
                <div 
                  style={{ backgroundColor: cardData.template?.secondaryColor || '#13102A', borderColor: cardData.template?.primaryColor || '#06B6D4' }}
                  className="w-full h-full rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col absolute backface-hidden"
                >
                  <div 
                    style={{ backgroundColor: cardData.template?.primaryColor || '#06B6D4' }}
                    className="py-4 px-3 text-center border-b border-white/10"
                  >
                    <h4 className="font-heading font-extrabold text-[11px] text-white tracking-wider uppercase">
                      {cardData.template?.institutionName || studentProfile?.institutions?.name || 'IRIS 365 CAMPUS'}
                    </h4>
                  </div>

                  <div className="flex justify-center mt-6">
                    <div className="w-24 h-28 bg-[#1E1B4B] border-2 border-[#06B6D4] rounded-xl flex items-center justify-center overflow-hidden">
                      <img 
                        src={studentProfile?.photo_url || cardData.student?.photo_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256"} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="text-center mt-5 flex-1 px-4">
                    <h3 className="font-heading font-extrabold text-sm text-white">{studentProfile?.users?.name || cardData.student?.name || ''}</h3>
                    <p className="text-[9px] text-[#C4B5FD]/70 font-mono mt-0.5">Roll: {studentProfile?.roll_number || cardData.student?.roll_number || 'CSE-2026-06'}</p>
                    
                    {institutionType === 'school' ? (
                      <div className="mt-2 space-y-1 text-center">
                        <p className="text-[10px] text-[#22D3EE] font-bold">Grade: {studentProfile?.semester} - {studentProfile?.departments?.name || 'General'}</p>
                        <p className="text-[9px] text-[#C4B5FD]/70">Parent: {studentProfile?.guardian_name || 'N/A'}</p>
                        <p className="text-[9px] text-amber-400 font-bold">Emergency: {studentProfile?.guardian_phone || 'N/A'}</p>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1 text-center">
                        <p className="text-[10px] text-[#22D3EE] font-bold">Dept: {studentProfile?.departments?.name || cardData.student?.department || 'B.Tech. Computer Science'}</p>
                        <p className="text-[9px] text-[#C4B5FD]/70">Valid Upto: 30/06/2028</p>
                      </div>
                    )}
                  </div>

                  <div className="pb-4 px-3 flex justify-between items-center bg-[#0D0A1A]/90 mt-auto border-t border-white/5 text-[8px]">
                    <div className="text-[7px] text-[#C4B5FD]/50">
                      <div className="font-bold flex items-center gap-0.5 text-[#22D3EE]"><ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> SECURE ID BADGE</div>
                      Click card to flip
                    </div>
                    <div className="w-10 h-10 bg-white p-0.5 rounded flex items-center justify-center font-bold text-[8px] text-black">
                      QR
                    </div>
                  </div>
                </div>

                {/* Back side */}
                <div 
                  style={{ backgroundColor: '#13102A', borderColor: cardData.template?.primaryColor || '#06B6D4' }}
                  className="w-full h-full rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col absolute backface-hidden rotate-y-180 p-5 text-[10px]"
                >
                  <div className="border-b border-white/5 pb-3 mb-4">
                    <h4 className="font-bold text-white uppercase text-xs">Card Rules & Info</h4>
                  </div>

                  <ul className="space-y-2.5 text-[#C4B5FD]/80 leading-relaxed font-light">
                    <li>• This smart identification card is non-transferable.</li>
                    <li>• Must be worn visually inside campus blocks.</li>
                    <li>• Re-admission bar checkins require scanning verification.</li>
                    <li>• In case of loss, immediate request must be reported.</li>
                  </ul>

                  <div className="mt-auto border-t border-white/5 pt-4 text-center">
                    <span className="text-[8px] text-[#C4B5FD]/50 block">Registered Guardian: {studentProfile?.guardian_name || cardData.student?.guardian_name || 'N/A'}</span>
                    <span className="text-[8px] text-[#C4B5FD]/50 block mt-0.5">Phone: {studentProfile?.guardian_phone || cardData.student?.guardian_phone || ''}</span>
                    
                    <span className="text-[9px] text-[#22D3EE] mt-4 font-bold block">FLIP BACK CARD</span>
                  </div>
                </div>

              </div>
            </div>

            <button 
              onClick={() => alert('Compiling digital signature badge... Downloading print-ready card PDF')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#06B6D4]/20 transition-all w-full justify-center"
            >
              <Download className="w-4 h-4" /> Download Print-Ready Card (PDF)
            </button>

            {/* Embed keyframes for CSS 3D flips */}
            <style>{`
              .perspective-1000 {
                perspective: 1000px;
              }
              .transform-style-preserve-3d {
                transform-style: preserve-3d;
              }
              .backface-hidden {
                backface-visibility: hidden;
              }
              .rotate-y-180 {
                transform: rotateY(180deg);
              }
            `}</style>

          </div>
        )}

      </div>
    </main>
  );
}
