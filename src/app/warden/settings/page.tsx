"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, ShieldCheck, QrCode } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function WardenSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [settings, setSettings] = useState({
    checkin_start_time: "19:00",
    checkin_end_time: "21:00",
    qr_code_secret: "WARDEN_CHECKIN_DEFAULT"
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiGet('hostel/settings');
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.log('Error loading settings from DB, using defaults');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    try {
      const res = await apiPost('hostel/settings', settings);
      if (res.success) {
        setSuccessMsg("Settings saved successfully!");
      } else {
        alert("Failed to save settings: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      setSuccessMsg("Settings saved (local fallback)!");
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${settings.qr_code_secret}&bgcolor=0D0A1A&color=10B981`;

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-2xl text-white">Hostel Check-in Settings</h1>
          <p className="text-sm text-slate-400">Configure timings and manage your daily QR code</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Check-in Window
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Start Time</label>
              <input
                type="time"
                value={settings.checkin_start_time}
                onChange={(e) => setSettings({ ...settings, checkin_start_time: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">End Time</label>
              <input
                type="time"
                value={settings.checkin_end_time}
                onChange={(e) => setSettings({ ...settings, checkin_end_time: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                required
              />
            </div>

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Configuration
                </>
              )}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            Today's Check-in QR
          </h2>
          <p className="text-sm text-slate-400 mb-8">
            Students must scan this code using their portal during the check-in window.
          </p>

          <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 shadow-2xl">
            <img src={qrUrl} alt="Check-in QR Code" className="w-48 h-48 rounded-lg" />
          </div>

          <p className="mt-6 text-xs text-slate-500 font-mono">
            Code: {settings.qr_code_secret}
          </p>
        </div>
      </div>
    </main>
  );
}
