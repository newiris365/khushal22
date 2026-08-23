"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Dumbbell, Users, CheckCircle2, Clock, AlertCircle, ArrowLeft, RefreshCw, QrCode, ShieldCheck, XCircle
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

interface StudentInfo {
  name?: string;
  roll_number?: string;
  departments?: { name: string } | null;
}

interface Booking {
  id: string;
  slot_id: string;
  student_id: string;
  status: 'booked' | 'checked_in' | 'cancelled' | 'no_show';
  checkin_time?: string;
  qr_code?: string;
  created_at: string;
  students?: StudentInfo;
  gym_slots?: {
    date: string;
    start_time: string;
    end_time: string;
    slot_type: string;
  };
}

export default function SlotRosterPage() {
  const params = useParams();
  const slotId = params.slotId as string;
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotInfo, setSlotInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual QR input state
  const [qrCodeInput, setQrCodeInput] = useState('');

  const fetchBookings = async () => {
    if (!slotId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/fitzone/gym/bookings/slot/${slotId}`);
      if (res.success && Array.isArray(res.bookings)) {
        setBookings(res.bookings);
        if (res.bookings.length > 0 && res.bookings[0].gym_slots) {
          setSlotInfo(res.bookings[0].gym_slots);
        }
      } else {
        setError(res.error || 'Failed to load slot bookings.');
      }
    } catch {
      setError('Error connecting to gym booking service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [slotId]);

  const handleCheckin = async (bookingId: string, qrCode?: string) => {
    setCheckinLoading(bookingId);
    setError(null);
    setSuccess(null);
    try {
      const payload = qrCode ? { qr_code: qrCode } : {};
      const res = await apiPost(`/fitzone/gym/bookings/${bookingId}/checkin`, payload);
      if (res.success) {
        setSuccess(res.message || 'Student checked in successfully!');
        await fetchBookings();
      } else {
        setError(res.error || 'Check-in failed.');
      }
    } catch {
      setError('An error occurred during check-in.');
    } finally {
      setCheckinLoading(null);
    }
  };

  const handleQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;
    const targetBooking = bookings.find(b => b.qr_code === qrCodeInput.trim() || b.id === qrCodeInput.trim());
    if (targetBooking) {
      await handleCheckin(targetBooking.id, qrCodeInput.trim());
      setQrCodeInput('');
    } else {
      setError('No matching booking found for this QR code or ID in this slot.');
    }
  };

  // Helper to compute 10-minute checkin window status
  const getWindowStatus = (booking: Booking) => {
    const slotData = slotInfo || booking.gym_slots;
    if (!slotData?.date || !slotData?.start_time) {
      return { expired: false, label: 'Window Open' };
    }
    const slotStart = new Date(`${slotData.date}T${slotData.start_time}`);
    const tenMinAfter = new Date(slotStart.getTime() + 10 * 60 * 1000);
    const now = new Date();

    if (now > tenMinAfter) {
      return { expired: true, label: 'Check-In Window Closed (10 min limit)' };
    } else if (now < slotStart) {
      return { expired: false, label: 'Upcoming Slot' };
    } else {
      const remainingSecs = Math.max(0, Math.floor((tenMinAfter.getTime() - now.getTime()) / 1000));
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;
      return { expired: false, label: `Window Open (${mins}m ${secs}s left)` };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* Top Nav */}
      <div className="flex items-center gap-3">
        <Link
          href="/gymtrainer/dashboard"
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-[#10B981]" />
            Gym Slot Roster & Check-In
          </h1>
          <p className="text-xs text-white/50">Slot ID: {slotId}</p>
        </div>
      </div>

      {/* Banner / Notices */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* QR Code Scanner Form */}
      <div className="bg-[#13102A]/85 backdrop-blur-md p-5 rounded-3xl border border-[#10B981]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <QrCode className="w-4 h-4" /> Quick QR / Booking Code Check-In
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            Scan or type student booking QR code to trigger immediate check-in.
          </p>
        </div>
        <form onSubmit={handleQrSubmit} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Enter QR Code or Booking ID..."
            value={qrCodeInput}
            onChange={(e) => setQrCodeInput(e.target.value)}
            className="bg-[#0D0A1A] border border-[#10B981]/30 py-2 px-4 rounded-xl text-xs text-white outline-none focus:border-[#10B981] w-full md:w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shrink-0"
          >
            Check In
          </button>
        </form>
      </div>

      {/* Roster Table */}
      <div className="bg-[#13102A]/50 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0D0A1A]/30">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#10B981]" />
            Booked Students Roster ({bookings.length})
          </span>
          <button
            onClick={fetchBookings}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Roster
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-white/50 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#10B981]" /> Loading slot roster...
            </div>
          ) : bookings.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-emerald-400/70 bg-[#0D0A1A]/20">
                  <th className="py-3.5 px-6">Student Name</th>
                  <th className="py-3.5 px-6">Roll Number</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Window Status</th>
                  <th className="py-3.5 px-6">Check-In Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {bookings.map((booking) => {
                  const windowInfo = getWindowStatus(booking);
                  const isCheckedIn = booking.status === 'checked_in';
                  const isNoShow = booking.status === 'no_show';
                  const isCancelled = booking.status === 'cancelled';

                  return (
                    <tr key={booking.id} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">
                        {booking.students?.name || 'Student'}
                      </td>
                      <td className="py-4 px-6 font-mono text-emerald-400">
                        {booking.students?.roll_number || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-white/70">
                        {booking.students?.departments?.name || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-semibold ${windowInfo.expired ? 'text-rose-400' : 'text-amber-300'}`}>
                          {windowInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {isCheckedIn ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Checked In
                          </span>
                        ) : isNoShow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" /> No-Show
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white/40 flex items-center gap-1 w-fit">
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Booked (Pending)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isCheckedIn ? (
                          <span className="text-[10px] text-emerald-400/80 font-mono">
                            Checked in at {booking.checkin_time ? new Date(booking.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'OK'}
                          </span>
                        ) : isNoShow || isCancelled ? (
                          <span className="text-[10px] text-white/40 font-semibold">Closed</span>
                        ) : (
                          <button
                            onClick={() => handleCheckin(booking.id)}
                            disabled={checkinLoading === booking.id}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all text-[11px] inline-flex items-center gap-1 ${
                              windowInfo.expired 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white'
                                : 'bg-[#10B981] hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                            }`}
                          >
                            {checkinLoading === booking.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {windowInfo.expired ? 'Process No-Show' : 'Check In Student'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-xs text-white/50 space-y-2">
              <AlertCircle className="w-8 h-8 text-white/30 mx-auto" />
              <p className="font-semibold text-white">No Bookings Found</p>
              <p>No students have booked into this gym slot yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
