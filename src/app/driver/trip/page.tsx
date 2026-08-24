"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayCircle, StopCircle, Navigation, Wifi, WifiOff, Clock, MapPin, Users
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';

export default function DriverTripPage() {
  const [assignments, setAssignments] = useState<any>(null);
  const [todayTrip, setTodayTrip] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<'inactive' | 'active' | 'error'>('inactive');
  const [serverSyncStatus, setServerSyncStatus] = useState<'synced' | 'server_error' | 'device_error' | 'inactive'>('inactive');
  const [lastGpsTime, setLastGpsTime] = useState<string>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);



  const emitGps = useCallback(async () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setServerSyncStatus('device_error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setLastGpsTime(new Date().toLocaleTimeString());
        setGpsStatus('active');

        // Emit via API to server which broadcasts via Socket.io
        try {
          const res = await apiPost('transit/location', {
            bus_id: assignments?.bus_id,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
          });
          if (res && res.success !== false) {
            setServerSyncStatus('synced');
          } else {
            setServerSyncStatus('server_error');
          }
        } catch (err) {
          console.error('GPS emit failed:', err);
          setServerSyncStatus('server_error');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGpsStatus('error');
        setServerSyncStatus('device_error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [assignments]);

  const gpsWatchRef = useRef<number | null>(null);

  const startGpsEmission = useCallback(() => {
    setGpsStatus('active');
    emitGps(); // immediate first fix

    // Use watchPosition for continuous real GPS tracking (more reliable than setInterval)
    if (navigator.geolocation) {
      gpsWatchRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, speed, heading } = pos.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          setLastGpsTime(new Date().toLocaleTimeString());
          setGpsStatus('active');

          try {
            const res = await apiPost('transit/location', {
              bus_route_id: assignments.find((a: any) => a.today_trip)?.bus_route_id || '',
              latitude,
              longitude,
              speed: speed || 0,
              heading: heading || 0,
            });
            if (res && res.success !== false) {
              setServerSyncStatus('synced');
            } else {
              setServerSyncStatus('server_error');
            }
          } catch (err) {
            console.error('GPS watch emit failed:', err);
            setServerSyncStatus('server_error');
          }
        },
        (err) => {
          console.error('Watch position error:', err);
          setGpsStatus('error');
          setServerSyncStatus('device_error');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
      );
    }

    // Start timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, [emitGps, assignments]);

  const stopGpsEmission = () => {
    if (gpsWatchRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
    setGpsStatus('inactive');
    setServerSyncStatus('inactive');
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('transit/driver/today');
        if (res.success && res.assignments) {
          setAssignments(res.assignments);
          const trip = res.assignments.find((a: any) => a.today_trip)?.today_trip || null;
          setTodayTrip(trip);
          if (trip?.status === 'active') startGpsEmission();
        } else {
          // Fallback check legacy endpoint
          const tripRes = await apiGet('transit/today-trip');
          const trip = tripRes.trip || null;
          setTodayTrip(trip);
          if (trip?.status === 'active') startGpsEmission();
        }
      } catch (err: any) {
        console.error(err);
        setActionError('Failed to load initial trip assignment from server.');
      }
    };
    load();
  }, [startGpsEmission]);

  const handleStartTrip = async () => {
    if (!assignments) return;
    setActionError(null);
    try {
      const res = await apiPost('campusCore/driver/trip/start', {
        bus_id: assignments.bus_id,
        route_id: assignments.route_id,
        trip_type: new Date().getHours() < 12 ? 'morning' : 'evening',
      });
      if (res && res.success) {
        setTodayTrip({ trip_id: res.trip_id, status: 'active' });
        startGpsEmission();
      } else {
        setActionError(res?.error || 'Failed to start trip on server.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to start trip due to network error.');
    }
  };

  const handleEndTrip = async () => {
    if (!todayTrip) return;
    setActionError(null);
    try {
      const res = await apiPut(`campusCore/driver/trip/${todayTrip.trip_id}/end`, {});
      if (res && res.success) {
        setTodayTrip({ ...todayTrip, status: 'completed' });
        stopGpsEmission();
        stopTimer();
      } else {
        setActionError(res?.error || 'Failed to end trip on server.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to end trip due to network error.');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTripActive = todayTrip?.status === 'active';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <PlayCircle size={24} className="text-orange-400" />
        Trip Console
      </h1>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
          <span>⚠️ {actionError}</span>
        </div>
      )}

      {/* GPS & Server Delivery Status Banner */}
      <div className={`rounded-xl p-4 flex items-center justify-between ${
        serverSyncStatus === 'synced' ? 'bg-emerald-500/10 border border-emerald-500/30' :
        serverSyncStatus === 'server_error' ? 'bg-amber-500/10 border border-amber-500/30' :
        serverSyncStatus === 'device_error' ? 'bg-red-500/10 border border-red-500/30' :
        'bg-slate-500/10 border border-slate-500/30'
      }`}>
        <div className="flex items-center gap-3">
          {serverSyncStatus === 'synced' ? <Wifi size={20} className="text-emerald-400 animate-pulse" /> :
           serverSyncStatus === 'server_error' ? <WifiOff size={20} className="text-amber-400 animate-bounce" /> :
           serverSyncStatus === 'device_error' ? <WifiOff size={20} className="text-red-400" /> :
           <WifiOff size={20} className="text-slate-400" />}
          <div>
            <p className={`font-medium ${
              serverSyncStatus === 'synced' ? 'text-emerald-400' :
              serverSyncStatus === 'server_error' ? 'text-amber-400 font-bold' :
              serverSyncStatus === 'device_error' ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {serverSyncStatus === 'synced' ? 'Broadcasting Live GPS (Server Connected)' :
               serverSyncStatus === 'server_error' ? '⚠️ GPS Locked on Device, but Server Sync Failing (Parents/Dashboard cannot see live bus)' :
               serverSyncStatus === 'device_error' ? 'Device Location Error (Turn on GPS)' :
               'GPS Inactive'}
            </p>
            {lastGpsTime && <p className="text-xs text-slate-400">Last Fix: {lastGpsTime} {gpsCoords ? `(${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)})` : ''}</p>}
          </div>
        </div>
      </div>

      {/* Trip Timer */}
      {isTripActive && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
          <p className="text-sm text-slate-400 mb-2">Trip Duration</p>
          <p className="text-5xl font-mono font-bold text-white">{formatTime(elapsed)}</p>
          <p className="text-xs text-slate-400 mt-2">
            Started at {todayTrip.actual_start ? new Date(todayTrip.actual_start).toLocaleTimeString() : '—'}
          </p>
        </div>
      )}

      {/* Big Action Button */}
      <div className="space-y-4">
        {!isTripActive && todayTrip?.status !== 'completed' && assignments ? (
          <button onClick={handleStartTrip}
            className="w-full py-6 bg-emerald-600 text-white rounded-2xl text-2xl font-bold hover:bg-emerald-500 flex items-center justify-center gap-4 shadow-lg shadow-emerald-500/20">
            <PlayCircle size={36} /> START TRIP
          </button>
        ) : isTripActive ? (
          <button onClick={handleEndTrip}
            className="w-full py-6 bg-red-600 text-white rounded-2xl text-2xl font-bold hover:bg-red-500 flex items-center justify-center gap-4 shadow-lg shadow-red-500/20">
            <StopCircle size={36} /> END TRIP
          </button>
        ) : (
          <div className="bg-slate-500/10 rounded-xl p-6 text-center border border-slate-500/30">
            <p className="text-slate-400">Today&apos;s trip is completed.</p>
          </div>
        )}
      </div>

      {/* Route Info */}
      {assignments && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" /> Route Info
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Bus</p>
              <p className="text-white font-mono">{assignments.vehicle_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Route</p>
              <p className="text-white">{assignments.route_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Distance</p>
              <p className="text-white">{assignments.distance_km || '—'} km</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Duration</p>
              <p className="text-white">{assignments.duration_minutes || '—'} min</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/driver/stops" className="bg-white/5 rounded-xl border border-white/10 p-4 text-center hover:bg-white/10">
          <MapPin size={20} className="mx-auto mb-2 text-blue-400" />
          <p className="text-sm text-white">Stops</p>
        </a>
        <a href="/driver/headcount" className="bg-white/5 rounded-xl border border-white/10 p-4 text-center hover:bg-white/10">
          <Users size={20} className="mx-auto mb-2 text-violet-400" />
          <p className="text-sm text-white">Headcount</p>
        </a>
      </div>
    </div>
  );
}
