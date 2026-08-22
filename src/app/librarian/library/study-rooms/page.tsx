"use client";

import React, { useState, useEffect } from 'react';
import { DoorOpen, Plus, Search, Clock, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function LibraryStudyRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ room_name: '', capacity: 6, floor: '1st Floor', amenities: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        apiGet('library/study-rooms'),
        apiGet('library/study-room-bookings'),
      ]);
      if (roomsRes.success) {
        setRooms(roomsRes.rooms || roomsRes.data || []);
      } else {
        setHasError(true);
      }
      if (bookingsRes.success) {
        setBookings(bookingsRes.bookings || bookingsRes.data || []);
      } else {
        setHasError(true);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.room_name) return;
    setSubmitting(true);
    try {
      const floorNum = parseInt(form.floor) || 1;
      const res = await apiPost('library/study-rooms', {
        name: form.room_name,
        capacity: form.capacity,
        floor: floorNum,
        amenities: form.amenities ? form.amenities.split(',').map(s => s.trim()) : []
      });

      if (res.success) {
        setShowForm(false);
        setForm({ room_name: '', capacity: 6, floor: '1st Floor', amenities: '' });
        fetchData();
      } else {
        alert(res.error || 'Failed to create study room.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error creating study room.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoomBookings = (roomId: string) => bookings.filter(b => b.room_id === roomId && b.status !== 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DoorOpen size={24} className="text-cyan-400" /> Study Rooms
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> Add Room
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">New Study Room</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.room_name}
                onChange={e => setForm({ ...form, room_name: e.target.value })}
                placeholder="Room name"
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                required
              />
              <input
                type="number"
                value={form.capacity}
                onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                placeholder="Capacity"
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                required
              />
              <select
                value={form.floor}
                onChange={e => setForm({ ...form, floor: e.target.value })}
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
              >
                <option value="0">Ground Floor</option>
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
              </select>
              <input
                type="text"
                value={form.amenities}
                onChange={e => setForm({ ...form, amenities: e.target.value })}
                placeholder="Amenities (whiteboard, projector...)"
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
              >
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : null} Create
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : hasError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="text-sm font-medium">Couldn't load study rooms or bookings</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <DoorOpen size={40} className="mx-auto mb-3 opacity-50" />
          <p>No study rooms configured. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => {
            const roomBookings = getRoomBookings(room.id);
            const isAvailable = room.is_available !== false;
            return (
              <div key={room.id} className="bg-white/5 rounded-xl border border-white/10 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{room.name || room.room_name}</h3>
                    <p className="text-xs text-slate-400">
                      {typeof room.floor === 'number' ? `${room.floor} Floor` : room.floor || '—'} · Capacity: {room.capacity}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {isAvailable ? 'Available' : 'Occupied'}
                  </span>
                </div>
                {room.amenities && (
                  <p className="text-[10px] text-slate-500 mb-2">
                    Amenities: {Array.isArray(room.amenities) ? room.amenities.join(', ') : room.amenities}
                  </p>
                )}
                {roomBookings.length > 0 && (
                  <div className="border-t border-white/5 pt-2 mt-2">
                    <p className="text-[10px] text-slate-400 mb-1">Today&apos;s Bookings:</p>
                    {roomBookings.slice(0, 3).map((b: any) => (
                      <p key={b.id} className="text-[10px] text-slate-300">
                        {b.student_name || 'Student'} · {b.start_time}–{b.end_time}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
