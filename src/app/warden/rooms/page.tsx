"use client";

import React, { useState, useEffect } from 'react';
import {
  Home, LogOut, UserPlus, ArrowLeftRight, CheckCircle2, AlertCircle, X, RefreshCw
} from 'lucide-react';
import { apiGet, apiPut, apiPost } from '../../../lib/api';

interface Allocation {
  id: string;
  student_id: string;
  room_id: string;
  allotted_date: string;
  vacated_date: string;
  is_current: boolean;
  deposit_amount?: number;
  deposit_status: string;
  students?: { name?: string; roll_number: string; users?: { full_name: string } };
  hostel_rooms?: { id?: string; room_number: string; capacity: number; occupied: number; hostel_blocks?: { name: string } };
}

interface UnallocatedStudent {
  student_id: string;
  full_name: string;
  roll_number: string;
  department_name: string;
  semester: number;
  batch_year: string;
}

export default function WardenRoomsPage() {
  const [activeTab, setActiveTab] = useState<'allocated' | 'unallocated'>('allocated');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [unallocated, setUnallocated] = useState<UnallocatedStudent[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkoutReason, setCheckoutReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showVacateModal, setShowVacateModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState<any>(null);

  const [allocateForm, setAllocateForm] = useState({
    room_id: '',
    student_id: '',
    allotted_date: new Date().toISOString().split('T')[0],
    deposit_amount: 10000,
    deposit_status: 'paid'
  });

  const [vacateForm, setVacateForm] = useState({
    vacated_date: new Date().toISOString().split('T')[0],
    vacating_reason: '',
    refund_amount: 10000
  });

  const [swapForm, setSwapForm] = useState({
    student_id: '',
    target_room_id: '',
    reason: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allocRes, unallocRes, roomsRes] = await Promise.all([
        apiGet('hostel/allocations'),
        apiGet('campusCore/hostel/unallocated-students'),
        apiGet('hostel/rooms?status=available'),
      ]);
      if (allocRes.success) setAllocations(allocRes.allocations || []);
      if (unallocRes.success) setUnallocated(unallocRes.students || []);
      if (roomsRes.success) setAvailableRooms(roomsRes.rooms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckout = async (allocationId: string) => {
    setActionLoading(true);
    try {
      const res = await apiPut(`campusCore/hostel/allocations/${allocationId}/checkout`, {
        reason: checkoutReason,
        deposit_action: 'refunded',
      });
      if (res.success) {
        setAllocations(allocations.map(a => a.id === allocationId ? { ...a, is_current: false, vacated_date: new Date().toISOString().split('T')[0] } : a));
        setExpandedId(null);
        setCheckoutReason('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateForm.room_id || !allocateForm.student_id) {
      setErrorMsg('Please select room and student.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await apiPost('hostel/allocations', allocateForm);
      if (res.success) {
        setSuccessMsg('Room allocated successfully!');
        setShowAllocateModal(false);
        fetchData();
      } else {
        setErrorMsg(res.error || 'Failed to allocate room.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error allocating room.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVacateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlloc) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await apiPut(`hostel/allocations/${selectedAlloc.id}/vacate`, vacateForm);
      if (res.success) {
        setSuccessMsg('Room vacated successfully.');
        setShowVacateModal(false);
        fetchData();
      } else {
        setErrorMsg(res.error || 'Failed to vacate room.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error vacating room.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapForm.student_id || !swapForm.target_room_id) {
      setErrorMsg('Please specify student and target room.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await apiPost('hostel/allocations/swap', swapForm);
      if (res.success) {
        setSuccessMsg('Room swap processed successfully.');
        setShowSwapModal(false);
        fetchData();
      } else {
        setErrorMsg(res.error || 'Failed to swap rooms.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error swapping rooms.');
    } finally {
      setActionLoading(false);
    }
  };

  const openVacateModal = (alloc: any) => {
    setSelectedAlloc(alloc);
    setVacateForm({
      vacated_date: new Date().toISOString().split('T')[0],
      vacating_reason: '',
      refund_amount: alloc.deposit_amount || 10000
    });
    setShowVacateModal(true);
  };

  const openSwapModal = (alloc: any) => {
    setSwapForm({
      student_id: alloc.student_id,
      target_room_id: '',
      reason: ''
    });
    setShowSwapModal(true);
  };

  const activeAllocations = allocations.filter(a => a.is_current);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Home size={24} className="text-emerald-400" />
          Room Management & Allocations
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowAllocateModal(true); setErrorMsg(''); setSuccessMsg(''); }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <UserPlus size={14} /> Allocate Room
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('allocated')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'allocated' ? 'bg-emerald-600 text-white font-bold' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
        >
          Active Allocations ({activeAllocations.length})
        </button>
        <button
          onClick={() => setActiveTab('unallocated')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'unallocated' ? 'bg-emerald-600 text-white font-bold' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
        >
          Unallocated Students ({unallocated.length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : activeTab === 'allocated' ? (
        <>
          {activeAllocations.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No active allocations.</div>
          ) : (
            <div className="space-y-3">
              {activeAllocations.map(a => (
                <div key={a.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        {a.hostel_rooms?.room_number || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{a.students?.users?.full_name || a.students?.name || 'Student'}</p>
                        <p className="text-xs text-slate-400">Room {a.hostel_rooms?.room_number} — {a.hostel_rooms?.hostel_blocks?.name || 'Block'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Since {a.allotted_date}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${a.deposit_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        Deposit: {a.deposit_status}
                      </span>
                    </div>
                  </div>

                  {expandedId === a.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div><p className="text-xs text-slate-400">Roll Number</p><p className="text-white">{a.students?.roll_number}</p></div>
                        <div><p className="text-xs text-slate-400">Room Capacity</p><p className="text-white">{a.hostel_rooms?.occupied ?? 1}/{a.hostel_rooms?.capacity ?? 2}</p></div>
                        <div><p className="text-xs text-slate-400">Allotted Date</p><p className="text-white">{a.allotted_date}</p></div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          onClick={() => openSwapModal(a)}
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <ArrowLeftRight size={14} /> Swap Bed
                        </button>
                        <button
                          onClick={() => openVacateModal(a)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          Vacate Room
                        </button>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <label className="text-xs text-slate-400 mb-1 block">Fast Checkout Clearance</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={checkoutReason}
                            onChange={e => setCheckoutReason(e.target.value)}
                            placeholder="e.g. Graduation, Transfer, Drop-out"
                            className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs"
                          />
                          <button
                            onClick={() => handleCheckout(a.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                          >
                            <LogOut size={14} /> Checkout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {unallocated.length === 0 ? (
            <div className="text-center py-12 text-slate-400">All registered students have room allocations.</div>
          ) : (
            unallocated.map(st => (
              <div key={st.student_id} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{st.full_name}</p>
                  <p className="text-xs text-slate-400">Roll: {st.roll_number} · Dept: {st.department_name || 'General'}</p>
                </div>
                <button
                  onClick={() => {
                    setAllocateForm(f => ({ ...f, student_id: st.student_id }));
                    setShowAllocateModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus size={14} /> Allocate
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Allocate Room Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#13102A] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Allocate Room to Student</h2>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleAllocateSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Student ID / Roll No</label>
                <input
                  type="text"
                  value={allocateForm.student_id}
                  onChange={e => setAllocateForm({ ...allocateForm, student_id: e.target.value })}
                  placeholder="Enter Student UUID or Select from Unallocated"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Available Room</label>
                <select
                  value={allocateForm.room_id}
                  onChange={e => setAllocateForm({ ...allocateForm, room_id: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                  required
                >
                  <option value="">-- Choose Room --</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.hostel_blocks?.name || 'Block'}) — {r.occupied || 0}/{r.capacity} Capacity
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Allotted Date</label>
                  <input
                    type="date"
                    value={allocateForm.allotted_date}
                    onChange={e => setAllocateForm({ ...allocateForm, allotted_date: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Deposit Amount (₹)</label>
                  <input
                    type="number"
                    value={allocateForm.deposit_amount}
                    onChange={e => setAllocateForm({ ...allocateForm, deposit_amount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : null} Submit Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vacate Room Modal */}
      {showVacateModal && selectedAlloc && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#13102A] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Vacate Room — {selectedAlloc.hostel_rooms?.room_number}</h2>
              <button onClick={() => setShowVacateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleVacateSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Vacating Reason</label>
                <input
                  type="text"
                  value={vacateForm.vacating_reason}
                  onChange={e => setVacateForm({ ...vacateForm, vacating_reason: e.target.value })}
                  placeholder="e.g. Course Completion / Voluntary Exit"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Vacated Date</label>
                  <input
                    type="date"
                    value={vacateForm.vacated_date}
                    onChange={e => setVacateForm({ ...vacateForm, vacated_date: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Refund Amount (₹)</label>
                  <input
                    type="number"
                    value={vacateForm.refund_amount}
                    onChange={e => setVacateForm({ ...vacateForm, refund_amount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVacateModal(false)}
                  className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : null} Confirm Vacate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swap Bed Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#13102A] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Bed / Room Swap</h2>
              <button onClick={() => setShowSwapModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSwapSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target New Room</label>
                <select
                  value={swapForm.target_room_id}
                  onChange={e => setSwapForm({ ...swapForm, target_room_id: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                  required
                >
                  <option value="">-- Select Target Room --</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.hostel_blocks?.name || 'Block'}) — {r.occupied || 0}/{r.capacity} Capacity
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Reason for Swap</label>
                <input
                  type="text"
                  value={swapForm.reason}
                  onChange={e => setSwapForm({ ...swapForm, reason: e.target.value })}
                  placeholder="e.g. Mutual Agreement / Medical Requirement"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : null} Execute Swap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
