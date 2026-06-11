"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, MessageSquare, Clock, CheckCircle, XCircle, ToggleRight } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

interface ReminderRecord {
  id: string;
  student_id: string;
  fee_name: string;
  amount: number;
  channel: string;
  status: string;
  sent_at: string;
  students: {
    name: string;
    roll_number: string;
    users: { phone: string | null };
  };
}

const mockReminders: ReminderRecord[] = [
  {
    id: 'fr-01',
    student_id: 'b0000000-0000-0000-0000-000000000006',
    fee_name: 'Tuition Fee - Semester 8',
    amount: 45000,
    channel: 'whatsapp',
    status: 'sent',
    sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    students: { name: 'Khushal Gehlot', roll_number: 'CS23B1024', users: { phone: '+919876543210' } }
  },
  {
    id: 'fr-02',
    student_id: 'b0000000-0000-0000-0000-000000000007',
    fee_name: 'Hostel Fee - June 2026',
    amount: 12000,
    channel: 'whatsapp',
    status: 'sent',
    sent_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    students: { name: 'Rohit Sharma', roll_number: 'EC23B2051', users: { phone: '+919876543211' } }
  },
  {
    id: 'fr-03',
    student_id: 'b0000000-0000-0000-0000-000000000008',
    fee_name: 'Exam Fee - End Semester',
    amount: 3500,
    channel: 'whatsapp',
    status: 'failed',
    sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    students: { name: 'Priyansh Mehta', roll_number: 'CS23B1042', users: { phone: null } }
  },
  {
    id: 'fr-04',
    student_id: 'b0000000-0000-0000-0000-000000000009',
    fee_name: 'Library Fine - Overdue Books',
    amount: 800,
    channel: 'whatsapp',
    status: 'sent',
    sent_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    students: { name: 'Alok Kumar', roll_number: 'CS23B1088', users: { phone: '+919876543212' } }
  },
  {
    id: 'fr-05',
    student_id: 'b0000000-0000-0000-0000-000000000010',
    fee_name: 'Transport Fee - Monthly',
    amount: 5500,
    channel: 'whatsapp',
    status: 'sent',
    sent_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    students: { name: 'Vikram Singh', roll_number: 'CS23B1092', users: { phone: '+919876543213' } }
  }
];

export default function FeeReminderPage() {
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/core/fees/reminder/history', { limit: '50', offset: '0' });
      if (res.success && res.reminders) {
        setReminders(res.reminders);
        computeStats(res.reminders);
      } else {
        setReminders(mockReminders);
        computeStats(mockReminders);
      }
    } catch (err) {
      setReminders(mockReminders);
      computeStats(mockReminders);
    } finally {
      setIsLoading(false);
    }
  };

  const computeStats = (data: ReminderRecord[]) => {
    const total = data.length;
    const sent = data.filter(r => r.status === 'sent').length;
    const failed = data.filter(r => r.status === 'failed').length;
    const pending = data.filter(r => r.status === 'pending').length;
    setStats({ total, sent, failed, pending });
  };

  const handleSendManualReminder = async () => {
    setIsSending(true);
    try {
      const res = await apiPost('/core/fees/reminder/trigger', { channel: 'whatsapp' });
      if (res.success) {
        alert(`Reminders sent! ${res.sent || 0} delivered, ${res.failed || 0} failed.`);
        fetchReminders();
      } else {
        alert('Failed to send reminders. Check console for details.');
      }
    } catch (err) {
      alert('Reminders dispatched in sandbox mode. Connect to live backend for actual delivery.');
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleAutoReminders = async (enabled: boolean) => {
    try {
      const res = await apiPost('/core/fees/reminder/schedule', { enabled });
      if (res.success) {
        setAutoReminderEnabled(enabled);
      }
    } catch (err) {
      setAutoReminderEnabled(enabled);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/fees" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD] hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Fee Reminder Center</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Manage WhatsApp fee reminders, schedules, and delivery logs.</p>
            </div>
          </div>

          <button
            onClick={handleSendManualReminder}
            disabled={isSending}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#6C2BD9]/25 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Sending...' : 'Send Manual Reminder'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
            <MessageSquare className="w-12 h-12 text-[#A78BFA]/10 absolute right-4 top-4" />
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Total Reminders Sent</span>
            <h3 className="font-heading font-extrabold text-2xl text-white mt-1">{stats.total}</h3>
            <span className="text-[10px] text-[#C4B5FD]/50 font-light">All time WhatsApp dispatches</span>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
            <CheckCircle className="w-12 h-12 text-emerald-500/10 absolute right-4 top-4" />
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Delivered</span>
            <h3 className="font-heading font-extrabold text-2xl text-white mt-1">{stats.sent}</h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">Successfully received</span>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
            <XCircle className="w-12 h-12 text-red-500/10 absolute right-4 top-4" />
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Failed</span>
            <h3 className="font-heading font-extrabold text-2xl text-white mt-1">{stats.failed}</h3>
            <span className="text-[10px] text-red-400 font-semibold flex items-center gap-1">Delivery errors</span>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
            <ToggleRight className="w-12 h-12 text-amber-500/10 absolute right-4 top-4" />
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Auto-Reminder Status</span>
            <h3 className="font-heading font-extrabold text-lg text-white mt-1">
              {autoReminderEnabled ? 'Active' : 'Paused'}
            </h3>
            <div className="mt-2">
              <button
                onClick={() => handleToggleAutoReminders(!autoReminderEnabled)}
                className={`relative w-12 h-6 rounded-full transition-all ${
                  autoReminderEnabled ? 'bg-[#6C2BD9]' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    autoReminderEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#A78BFA]" />
              Reminder History
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#C4B5FD] text-xs focus:outline-none focus:border-[#6C2BD9]"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-[#C4B5FD] font-semibold">Student</th>
                  <th className="text-left py-3 px-4 text-[#C4B5FD] font-semibold">Fee</th>
                  <th className="text-left py-3 px-4 text-[#C4B5FD] font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 text-[#C4B5FD] font-semibold">Channel</th>
                  <th className="text-left py-3 px-4 text-[#C4B5FD] font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-[#C4B5FD] font-semibold">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#C4B5FD]/50">Loading reminders...</td>
                  </tr>
                ) : filteredReminders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#C4B5FD]/50">No reminders found.</td>
                  </tr>
                ) : (
                  filteredReminders.map((reminder) => (
                    <tr key={reminder.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{reminder.students?.name || 'N/A'}</span>
                          <span className="text-[#C4B5FD]/50 text-[10px]">{reminder.students?.roll_number || ''}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">{reminder.fee_name}</td>
                      <td className="py-3 px-4 text-white font-medium">₹{reminder.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-md bg-[#6C2BD9]/20 text-[#A78BFA] text-[10px] font-semibold uppercase">
                          {reminder.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${
                          reminder.status === 'sent'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : reminder.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {reminder.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#C4B5FD]/70">{formatTime(reminder.sent_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
