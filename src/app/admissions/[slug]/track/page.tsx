"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileSearch, ChevronRight, RefreshCw, CheckCircle, Clock, 
  UserCheck, Award, GraduationCap, XCircle, Download, CheckCircle2,
  Calendar, MapPin, Video, AlertCircle, ShieldCheck
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function TrackApplicationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [appNumber, setAppNumber] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');

  const fetchTrackData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setActionMessage(null);
    setLoading(true);

    try {
      const res = await apiGet(`/admissions/track?application_number=${encodeURIComponent(appNumber)}&dob=${encodeURIComponent(dob)}`);
      if (res.success && res.applicant) {
        setResult(res);
      } else {
        setError(res.error || 'Application number or date of birth mismatch.');
      }
    } catch {
      setError('Failed to connect to admissions service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await apiPost('/admissions/track/offer/accept', {
        application_number: appNumber,
        dob: dob,
        offer_id: offerRecord?.id
      });
      if (res.success) {
        setActionMessage(res.message || 'Offer accepted! Please complete seat confirmation payment.');
        setShowPaymentModal(true);
        await fetchTrackData();
      } else {
        setError(res.error || 'Failed to accept offer.');
      }
    } catch {
      setError('An error occurred while accepting the offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await apiPost('/admissions/track/offer/decline', {
        application_number: appNumber,
        dob: dob,
        offer_id: offerRecord?.id,
        reason: declineReason
      });
      if (res.success) {
        setActionMessage('Offer declined successfully. Your seat has been released.');
        setShowDeclineModal(false);
        await fetchTrackData();
      } else {
        setError(res.error || 'Failed to decline offer.');
      }
    } catch {
      setError('An error occurred while declining the offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookCounseling = async (sessionId: string, time: string) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await apiPost('/admissions/track/counseling/book', {
        application_number: appNumber,
        dob: dob,
        session_id: sessionId,
        slot_time: time
      });
      if (res.success) {
        setActionMessage('Counseling slot booked successfully!');
        await fetchTrackData();
      } else {
        setError(res.error || 'Failed to book counseling slot.');
      }
    } catch {
      setError('An error occurred while booking counseling slot.');
    } finally {
      setActionLoading(false);
    }
  };

  const applicant = result?.applicant;
  const offers = result?.offers || [];
  const offerRecord = offers.length > 0 ? offers[0] : null;
  const counselingSlots = result?.counseling_slots || [];
  const counselingSessions = result?.counseling_sessions || [];

  const getStatusStep = (status: string) => {
    const steps = ['submitted', 'under_review', 'shortlisted', 'merit_listed', 'offered', 'admitted'];
    return steps.indexOf(status);
  };

  const currentStepIdx = applicant ? getStatusStep(applicant.status) : 0;

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-8 flex items-center justify-center relative">
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#6C2BD9]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl w-full bg-[#13102A]/85 backdrop-blur-md rounded-3xl border border-[#6C2BD9]/30 p-6 md:p-10 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#6C2BD9]/20 pb-5 mb-8">
          <div className="flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-[#A78BFA]" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Track Application Status</h2>
              <p className="text-xs text-[#A78BFA]/60 mt-0.5">Enter application details to view real-time status and decision offers.</p>
            </div>
          </div>

          {result && (
            <button
              onClick={() => { setResult(null); setError(''); }}
              className="text-xs text-[#A78BFA] hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10"
            >
              New Search
            </button>
          )}
        </div>

        {/* Action Error / Success Banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {actionMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {!result ? (
          <form onSubmit={fetchTrackData} className="space-y-5">
            <div>
              <label className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-wider">Application ID Number</label>
              <input 
                type="text" 
                required
                placeholder="Format: SIET-2026-XXXXXX"
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-[#0D0A1A] border border-[#6C2BD9]/20 focus:border-[#8B5CF6] rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-wider">Date of Birth</label>
              <input 
                type="date" 
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-[#0D0A1A] border border-[#6C2BD9]/20 focus:border-[#8B5CF6] rounded-xl text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Track Application Progress
            </button>
          </form>
        ) : (
          <div className="space-y-8">
            {/* Quick Profile Brief */}
            <div className="p-4 border border-[#6C2BD9]/25 rounded-2xl bg-[#0D0A1A]/40 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-sm text-white">{applicant.first_name} {applicant.last_name}</p>
                <p className="text-[#A78BFA]/60 mt-1">Application No: {applicant.application_number}</p>
                {applicant.merit_score && (
                  <p className="text-emerald-400 text-[10px] font-bold mt-0.5">Merit Score: {applicant.merit_score}</p>
                )}
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] uppercase">
                  {applicant.status?.replace('_', ' ')}
                </span>
                <p className="text-[#A78BFA]/50 text-[10px] mt-1">
                  Submitted: {applicant.created_at ? new Date(applicant.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Timeline Progress Tracker */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-widest block">Application Pipeline Progress</span>
              
              <div className="relative pl-8 space-y-6">
                <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-[#6C2BD9]/25" />

                {[
                  { label: 'Submitted', desc: 'Application locked and processing fees cleared.', step: 0, icon: CheckCircle },
                  { label: 'Under Review', desc: 'Academics marksheets and category certificates undergoing audit checks.', step: 1, icon: Clock },
                  { label: 'Shortlisted', desc: 'Candidate meets minimum cutoffs and eligibility criteria.', step: 2, icon: UserCheck },
                  { label: 'Merit Listed', desc: 'Assigned index rankings for seat allocation.', step: 3, icon: Award },
                  { label: 'Offer Sent', desc: 'Provisional allocation offer issued for confirmation.', step: 4, icon: GraduationCap },
                  { label: 'Admitted', desc: 'Seat securement fee received and student record enrolled.', step: 5, icon: CheckCircle }
                ].map((s) => {
                  const isCurrent = currentStepIdx === s.step;
                  const isCompleted = currentStepIdx >= s.step;
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="relative flex gap-4">
                      <div className={`absolute -left-[29px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border text-[10px] z-10 ${
                        isCompleted ? 'bg-[#6C2BD9] border-[#A78BFA] text-white' : 'bg-[#0D0A1A] border-[#6C2BD9]/30 text-[#A78BFA]/40'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isCurrent ? 'text-[#A78BFA]' : isCompleted ? 'text-white' : 'text-[#A78BFA]/40'}`}>
                          {s.label}
                        </p>
                        <p className="text-[10px] text-[#A78BFA]/50 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Offer Decision Section (If Offered or Has Offer) */}
            {(applicant.status === 'offered' || offerRecord) && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#6C2BD9]/20 to-[#0D0A1A] border border-[#6C2BD9]/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="font-heading font-bold text-sm text-white">Provisional Admission Offer</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                    offerRecord?.status === 'accepted' || applicant.status === 'admitted'
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : offerRecord?.status === 'rejected' || applicant.status === 'withdrawn'
                      ? 'bg-red-500/20 border-red-500/30 text-red-400'
                      : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  }`}>
                    {offerRecord?.status || applicant.status}
                  </span>
                </div>

                <p className="text-xs text-[#C4B5FD]/80 leading-relaxed font-light">
                  Congratulations! You have been awarded a provisional seat allocation for{' '}
                  <strong className="text-white font-semibold">
                    {offerRecord?.programs?.name || 'B.Tech Computer Science Engineering'}
                  </strong>.
                </p>

                {/* Offer Letter Link */}
                {offerRecord?.offer_letter_url && (
                  <a
                    href={offerRecord.offer_letter_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#A78BFA] hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Official Offer Letter (PDF)
                  </a>
                )}

                {/* Offer Actions */}
                {offerRecord?.status !== 'accepted' && offerRecord?.status !== 'rejected' && applicant.status !== 'admitted' && applicant.status !== 'withdrawn' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAcceptOffer}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Accept Offer & Reserve Seat
                    </button>
                    <button
                      onClick={() => setShowDeclineModal(true)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-bold text-xs transition-all disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {(offerRecord?.status === 'accepted' || applicant.status === 'admitted') && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Seat allocation accepted! Please finalize seat confirmation fee.
                    </span>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[10px] hover:bg-emerald-400 transition-all"
                    >
                      Pay Fee (₹10,000)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Counseling Booking Section */}
            <div className="p-6 rounded-2xl bg-[#13102A] border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#06B6D4]" />
                <h3 className="font-heading font-bold text-sm text-white">Admissions Counseling Session</h3>
              </div>

              {counselingSlots.length > 0 ? (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2">
                  <div className="flex justify-between items-center text-white font-bold">
                    <span>Booked Counseling Slot</span>
                    <span className="text-emerald-400 uppercase text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                      {counselingSlots[0].status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#C4B5FD]/70">
                    Scheduled: {new Date(counselingSlots[0].slot_time || Date.now()).toLocaleString()}
                  </p>
                  {counselingSlots[0].counseling_sessions?.meeting_link && (
                    <a
                      href={counselingSlots[0].counseling_sessions.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#06B6D4] hover:underline font-bold mt-1"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Virtual Counseling Meeting
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#C4B5FD]/70 font-light">
                    Select a preferred date & time for your 1-on-1 counseling interaction with admissions counselors:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { time: new Date(Date.now() + 86400000).toISOString(), label: 'Tomorrow, 10:00 AM' },
                      { time: new Date(Date.now() + 86400000 + 7200000).toISOString(), label: 'Tomorrow, 02:00 PM' },
                      { time: new Date(Date.now() + 172800000).toISOString(), label: 'Day after, 11:30 AM' },
                      { time: new Date(Date.now() + 172800000 + 10800000).toISOString(), label: 'Day after, 03:30 PM' }
                    ].map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => handleBookCounseling(counselingSessions[0]?.id || 'c1111111-1111-1111-1111-111111111111', slot.time)}
                        disabled={actionLoading}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#06B6D4]/50 hover:bg-[#06B6D4]/10 text-xs text-white font-medium text-left transition-all disabled:opacity-50 flex items-center justify-between"
                      >
                        <span>{slot.label}</span>
                        <ChevronRight className="w-3 h-3 text-[#C4B5FD]/40" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#13102A] border border-red-500/30 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-base text-white">Decline Admission Offer</h3>
              <p className="text-xs text-[#C4B5FD]/70">
                Are you sure you want to decline this provisional admission offer? This action will release your seat allocation.
              </p>
              <form onSubmit={handleDeclineOffer} className="space-y-4">
                <textarea
                  required
                  placeholder="Please state reason for declining (e.g. joined another institute, financial reasons)..."
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-[#C4B5FD]/40 focus:outline-none focus:border-red-500/50 h-24 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeclineModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#C4B5FD]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                  >
                    Confirm Decline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mock Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#13102A] border border-emerald-500/30 rounded-2xl p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Seat Confirmation Payment</h3>
              <p className="text-xs text-[#C4B5FD]/70">
                Amount Payable: <strong className="text-white">₹10,000</strong> (Provisional Seat Booking Fee)
              </p>

              {paymentDone ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  Transaction Verified! Payment receipt has been emailed to you.
                </div>
              ) : (
                <button
                  onClick={() => setPaymentDone(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Pay ₹10,000 via Razorpay Sandbox
                </button>
              )}

              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-xs text-[#C4B5FD]/50 hover:text-white block mx-auto mt-2"
              >
                Close Window
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
