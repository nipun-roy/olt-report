'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import AuthStatus from '@/components/AuthStatus';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Share2,
  Trash2,
  Edit2,
  RefreshCw,
  RotateCcw,
  Zap,
  ArrowRight,
  User,
  Tag,
  AlertCircle,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronRight,
  Flame,
  ShieldAlert,
  Send,
  SlidersHorizontal,
} from 'lucide-react';

interface WorkNote {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  targetId: string | null;
  assignedTo: string | null;
  createdBy: string | null;
  resolutionNote: string | null;
  createdAt: string | Date;
  startedAt: string | Date | null;
  completedAt: string | Date | null;
  updatedAt: string | Date;
}

// Preset Quick Templates for fast entry
const QUICK_PRESETS = [
  {
    label: 'মেইন ও ব্যাকআপ লিংক ডাউন',
    title: 'মেইন এবং ব্যাকআপ লিংক ডাউন — সংযোগ বিচ্ছিন্ন',
    category: 'LINK_DOWN',
    priority: 'CRITICAL' as const,
    description: 'একই সাথে মেইন লিংক এবং ব্যাকআপ লিংক ডাউন হয়েছে। অবিলম্বে আপস্ট্রিম বা ব্যাকবোন রাউটার চেক প্রয়োজন।',
    icon: '⚡',
  },
  {
    label: 'ONU ডিভাইস পাওয়ার অফ',
    title: 'ONU ডিভাইস পাওয়ার অফ / আনরিচেবল',
    category: 'POWER_OFF',
    priority: 'HIGH' as const,
    description: 'ONU ডিভাইস অফলাইন/পাওয়ার অফ অবস্থায় পাওয়া যাচ্ছে। গ্রাহক প্রান্তে বিদ্যুৎ বা এডাপ্টার চেক করতে হবে।',
    icon: '🔌',
  },
  {
    label: 'ফাইবার কাটা / লস বৃদ্ধি',
    title: 'ফাইবার কোর কাটা বা অতিরিক্ত অপটিক্যাল লস',
    category: 'FIBER_CUT',
    priority: 'CRITICAL' as const,
    description: 'অপটিক্যাল সিগন্যাল মাত্রাতিরিক্ত ড্রপ করেছে। ফিল্ড টিম পাঠিয়ে প্যাচকর্ড ও স্প্লাইস জয়েন্ট পরিদর্শন জরুরি।',
    icon: '✂️',
  },
  {
    label: 'আপস্ট্রিম নেটওয়ার্ক সমস্যা',
    title: 'আপস্ট্রিম ব্যান্ডউইথ ও লেটেন্সি সমস্যা',
    category: 'LINK_DOWN',
    priority: 'HIGH' as const,
    description: 'আপস্ট্রিম আইআইজি / গেটওয়ে লেভেলে প্যাকেট ড্রপ বা সংযোগ বিচ্ছিন্নতা লক্ষ্য করা গেছে।',
    icon: '🌐',
  },
  {
    label: 'কাস্টমার রাউটার কনফিগ',
    title: 'কাস্টমার PPPoE সংযোগ ও রাউটার কনফিগারেশন',
    category: 'CUSTOMER_ISSUE',
    priority: 'MEDIUM' as const,
    description: 'কাস্টমার রাউটার কনফিগারেশন বা ম্যাক বাইন্ডিং রিসেট করতে হবে।',
    icon: '👤',
  },
];

// Helper: Format Elapsed Time into Bengali and English
function formatElapsedTime(createdAt: string | Date, now: number) {
  const createdTime = new Date(createdAt).getTime();
  const diffMs = Math.max(0, now - createdTime);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return {
      text: 'মাত্র কয়েক সেকেন্ড',
      short: 'এইমাত্র',
      urgency: 'low' as const,
      diffMinutes: diffMin,
      diffHours: diffHour,
    };
  }

  if (diffMin < 60) {
    return {
      text: `${diffMin} মিনিট`,
      short: `${diffMin}m`,
      urgency: 'low' as const,
      diffMinutes: diffMin,
      diffHours: diffHour,
    };
  }

  if (diffHour < 24) {
    const remainMin = diffMin % 60;
    const urgency = diffHour >= 3 ? ('critical' as const) : ('medium' as const);
    return {
      text: `${diffHour} ঘণ্টা ${remainMin > 0 ? `${remainMin} মিনিট` : ''}`,
      short: `${diffHour}h ${remainMin}m`,
      urgency,
      diffMinutes: diffMin,
      diffHours: diffHour,
    };
  }

  const remainHour = diffHour % 24;
  return {
    text: `${diffDay} দিন ${remainHour > 0 ? `${remainHour} ঘণ্টা` : ''}`,
    short: `${diffDay}d ${remainHour}h`,
    urgency: 'critical' as const,
    diffMinutes: diffMin,
    diffHours: diffHour,
  };
}

// Helper: Format Duration between Created and Completed
function formatResolutionDuration(createdAt: string | Date, completedAt: string | Date | null) {
  if (!completedAt) return null;
  const start = new Date(createdAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = Math.max(0, end - start);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '১ মিনিটের কম';
  if (diffMin < 60) return `${diffMin} মিনিট`;
  if (diffHour < 24) {
    const remMin = diffMin % 60;
    return `${diffHour} ঘণ্টা ${remMin > 0 ? `${remMin} মিনিট` : ''}`;
  }
  const remHour = diffHour % 24;
  return `${diffDay} দিন ${remHour > 0 ? `${remHour} ঘণ্টা` : ''}`;
}

// Helper: Format readable Date/Time in Bengali
function formatBengaliDateTime(dateStr: string | Date | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('bn-BD', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function WorkNotesPage() {
  const [notes, setNotes] = useState<WorkNote[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    criticalPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live timer for real-time elapsed counter
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 20000); // update every 20 seconds
    return () => clearInterval(timer);
  }, []);

  // Filter & Search states
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'urgency' | 'newest' | 'oldest'>('urgency');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<WorkNote | null>(null);
  const [completingNote, setCompletingNote] = useState<WorkNote | null>(null);
  const [resolutionInput, setResolutionInput] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form input state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('GENERAL');
  const [formPriority, setFormPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [formTargetId, setFormTargetId] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Shift handover copy feedback
  const [copiedHandover, setCopiedHandover] = useState(false);

  // Fetch notes from API
  const fetchNotes = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/notes?sortBy=' + sortBy);
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [sortBy]);

  // Handle Preset Click
  const handleApplyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setFormTitle(preset.title);
    setFormDesc(preset.description);
    setFormCategory(preset.category);
    setFormPriority(preset.priority);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('GENERAL');
    setFormPriority('HIGH');
    setFormTargetId('');
    setFormAssignedTo('');
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (note: WorkNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormDesc(note.description || '');
    setFormCategory(note.category || 'GENERAL');
    setFormPriority(note.priority);
    setFormTargetId(note.targetId || '');
    setFormAssignedTo(note.assignedTo || '');
    setFormError('');
    setShowAddModal(true);
  };

  // Submit Note (Create or Edit)
  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('অনুগ্রহ করে কাজের শিরোনাম লিখুন।');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingNote) {
        // Edit PATCH
        const res = await fetch('/api/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNote.id,
            title: formTitle.trim(),
            description: formDesc.trim(),
            category: formCategory,
            priority: formPriority,
            targetId: formTargetId.trim(),
            assignedTo: formAssignedTo.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          fetchNotes(true);
        } else {
          setFormError(data.error || 'আপডেট করতে সমস্যা হয়েছে।');
        }
      } else {
        // Create POST
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDesc.trim(),
            category: formCategory,
            priority: formPriority,
            targetId: formTargetId.trim(),
            assignedTo: formAssignedTo.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          fetchNotes(true);
        } else {
          setFormError(data.error || 'তৈরি করতে সমস্যা হয়েছে।');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'নেটওয়ার্ক এরর।');
    } finally {
      setSubmitting(false);
    }
  };

  // Change Status (Pending -> In Progress or Reopen)
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchNotes(true);
      }
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  // Open Complete Modal
  const openCompleteModal = (note: WorkNote) => {
    setCompletingNote(note);
    setResolutionInput('');
  };

  // Confirm Complete
  const confirmComplete = async () => {
    if (!completingNote) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: completingNote.id,
          status: 'COMPLETED',
          resolutionNote: resolutionInput.trim() || 'কাজটি সফলভাবে সম্পন্ন করা হয়েছে।',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCompletingNote(null);
        fetchNotes(true);
      }
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmId(null);
        fetchNotes(true);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Copy Shift Handover for WhatsApp / Telegram
  const handleCopyHandover = () => {
    const pendingList = notes.filter((n) => n.status === 'PENDING');
    const inProgList = notes.filter((n) => n.status === 'IN_PROGRESS');
    const compCount = notes.filter((n) => n.status === 'COMPLETED').length;

    const dateStr = new Date().toLocaleString('bn-BD', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    let text = `📋 *OneSky NOC — কাজের স্থিতি ও পেন্ডিং রিপোর্ট*\n`;
    text += `📅 *সময়:* ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `⏳ *পেন্ডিং কাজসমূহ (${pendingList.length} টি):*\n`;
    if (pendingList.length === 0) {
      text += `✅ বর্তমানে কোনো পেন্ডিং কাজ নেই।\n`;
    } else {
      pendingList.forEach((n, idx) => {
        const timeInfo = formatElapsedTime(n.createdAt, Date.now());
        const pIcon = n.priority === 'CRITICAL' ? '🔴' : n.priority === 'HIGH' ? '🟠' : '🟡';
        text += `${idx + 1}. ${pIcon} *${n.title}*\n`;
        if (n.targetId) text += `   • টার্গেট/আইডি: ${n.targetId}\n`;
        text += `   • অপেক্ষমাণ সময়: ⏱️ ${timeInfo.text} ধরে পেন্ডিং\n`;
        if (n.assignedTo) text += `   • দায়িত্ব: 👤 ${n.assignedTo}\n`;
        if (n.description) text += `   • বিবরণ: ${n.description}\n`;
        text += `\n`;
      });
    }

    if (inProgList.length > 0) {
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `⚙️ *চলমান কাজসমূহ (${inProgList.length} টি):*\n`;
      inProgList.forEach((n, idx) => {
        const timeInfo = formatElapsedTime(n.createdAt, Date.now());
        text += `${idx + 1}. 🔵 *${n.title}* (চলমান ⏱️ ${timeInfo.text})\n`;
        if (n.assignedTo) text += `   • টেকনিশিয়ান: ${n.assignedTo}\n`;
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ *আজ সম্পন্ন কাজ:* ${compCount} টি\n`;
    text += `🔗 *লাইভ ড্যাশবোর্ড:* https://olt-report.vercel.app/notes`;

    navigator.clipboard.writeText(text);
    setCopiedHandover(true);
    setTimeout(() => setCopiedHandover(false), 2500);
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Status filter
      if (statusTab !== 'ALL' && n.status !== statusTab) return false;

      // Priority filter
      if (priorityFilter !== 'ALL' && n.priority !== priorityFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const full = `${n.title} ${n.description || ''} ${n.targetId || ''} ${n.assignedTo || ''} ${n.resolutionNote || ''}`.toLowerCase();
        if (!full.includes(q)) return false;
      }

      return true;
    });
  }, [notes, statusTab, priorityFilter, categoryFilter, searchQuery]);

  // Find longest waiting pending note
  const longestPending = useMemo(() => {
    const pendings = notes.filter((n) => n.status === 'PENDING');
    if (pendings.length === 0) return null;
    return pendings.reduce((oldest, cur) => {
      return new Date(cur.createdAt).getTime() < new Date(oldest.createdAt).getTime() ? cur : oldest;
    }, pendings[0]);
  }, [notes]);

  return (
    <div className="min-h-screen bg-[#080d1a] pb-16">
      {/* Top Header & Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <ClipboardList className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  OneSky Task &amp; Work Notes
                </h1>
                {counts.pending > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono animate-pulse">
                    {counts.pending} টি কাজ পেন্ডিং
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    সব কাজ সম্পন্ন
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                কোন কাজ কত সময় ধরে পেন্ডিং আছে এবং কোনটি সম্পন্ন হয়েছে তা লাইভ ট্র্যাকিং করুন
              </p>
            </div>
          </div>

          {/* Navigation & Action Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="OLT অপটিক্যাল রিপোর্ট জেনারেটরে ফিরে যান"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>OLT Report</span>
            </Link>

            <Link
              href="/sms"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="Quick SMS ও Snippet Assistant ড্যাশবোর্ড"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick SMS</span>
            </Link>

            <button
              onClick={handleCopyHandover}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow border ${
                copiedHandover
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
              }`}
              title="হোয়াটসঅ্যাপ বা টেলিগ্রাম শিফট হ্যান্ডওভারের জন্য কপি করুন"
            >
              {copiedHandover ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedHandover ? 'কপি হয়েছে!' : 'হ্যান্ডওভার কপি'}</span>
            </button>

            <button
              onClick={() => fetchNotes()}
              disabled={refreshing}
              className="p-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কাজ যোগ করুন</span>
            </button>

            <AuthStatus />
          </div>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Tasks */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>সর্বমোট কাজ</span>
            <ClipboardList className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">{counts.total}</div>
          <div className="mt-1 text-[11px] text-slate-500">সকল সংরক্ষিত রেকর্ড</div>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => setStatusTab('PENDING')}
          className={`cursor-pointer rounded-2xl p-3.5 flex flex-col justify-between transition border ${
            statusTab === 'PENDING'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-[#111827] border-amber-500/30 hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>পেন্ডিং (অপেক্ষমাণ)</span>
            </span>
            {counts.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 font-mono flex items-baseline gap-2">
            <span>{counts.pending}</span>
            {counts.criticalPending > 0 && (
              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                {counts.criticalPending} জরুরি
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-amber-300/70">কাজ এখনো শুরু হয়নি</div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setStatusTab('IN_PROGRESS')}
          className={`cursor-pointer rounded-2xl p-3.5 flex flex-col justify-between transition border ${
            statusTab === 'IN_PROGRESS'
              ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20'
              : 'bg-[#111827] border-sky-500/30 hover:border-sky-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-sky-300 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>কাজ চলমান</span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-400 font-mono">{counts.inProgress}</div>
          <div className="mt-1 text-[11px] text-sky-300/70">টিম বর্তমানে কাজ করছে</div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setStatusTab('COMPLETED')}
          className={`cursor-pointer rounded-2xl p-3.5 flex flex-col justify-between transition border ${
            statusTab === 'COMPLETED'
              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-[#111827] border-emerald-500/30 hover:border-emerald-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>সম্পন্ন / শেষ</span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
            {counts.completed}
          </div>
          <div className="mt-1 text-[11px] text-emerald-300/70">সমাধান সম্পন্ন হয়েছে</div>
        </div>

        {/* Longest Waiting Task */}
        <div className="col-span-2 md:col-span-1 bg-[#111827] border border-rose-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-300 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>দীর্ঘতম পেন্ডিং</span>
            </span>
          </div>
          {longestPending ? (
            <div>
              <div className="text-sm font-bold text-rose-400 font-mono truncate" title={longestPending.title}>
                {formatElapsedTime(longestPending.createdAt, now).text}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {longestPending.title}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 mt-2">বর্তমানে পেন্ডিং নেই</div>
          )}
          <div className="mt-1 text-[11px] text-rose-300/70">সবচেয়ে বেশি অপেক্ষমাণ</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusTab === 'ALL'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>সকল কাজ</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
                {counts.total}
              </span>
            </button>

            <button
              onClick={() => setStatusTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusTab === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>পেন্ডিং</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-950/60 text-amber-200 text-[10px] font-mono">
                {counts.pending}
              </span>
            </button>

            <button
              onClick={() => setStatusTab('IN_PROGRESS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusTab === 'IN_PROGRESS'
                  ? 'bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/20'
                  : 'text-sky-300/80 hover:text-sky-200 hover:bg-sky-500/10'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>চলমান</span>
              <span className="px-1.5 py-0.2 rounded-full bg-sky-950/60 text-sky-200 text-[10px] font-mono">
                {counts.inProgress}
              </span>
            </button>

            <button
              onClick={() => setStatusTab('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusTab === 'COMPLETED'
                  ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20'
                  : 'text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-600/10'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>সম্পন্ন / শেষ</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-200 text-[10px] font-mono">
                {counts.completed}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="শিরোনাম, ONU ID, টেকনিশিয়ান বা বিবরণ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="pt-2 border-t border-[#1e293b]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center flex-wrap gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#080d1a] border border-[#1e293b] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-sky-500 text-xs"
            >
              <option value="ALL">সকল প্রায়োরিটি</option>
              <option value="CRITICAL">🔴 জরুরি (Critical)</option>
              <option value="HIGH">🟠 উচ্চ (High)</option>
              <option value="MEDIUM">🟡 মাঝারি (Medium)</option>
              <option value="LOW">🔵 সাধারণ (Low)</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#080d1a] border border-[#1e293b] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-sky-500 text-xs"
            >
              <option value="ALL">সকল ক্যাটাগরি</option>
              <option value="LINK_DOWN">⚡ লিংক ডাউন</option>
              <option value="POWER_OFF">🔌 ONU পাওয়ার অফ</option>
              <option value="FIBER_CUT">✂️ ফাইবার কাটা</option>
              <option value="OPTICAL_LOSS">📉 অপটিক্যাল লস</option>
              <option value="CUSTOMER_ISSUE">👤 কাস্টমার ইস্যু</option>
              <option value="ROUTER_CONFIG">⚙️ রাউটার কনফিগ</option>
              <option value="GENERAL">📝 সাধারণ নোট</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>সাজান:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#080d1a] border border-[#1e293b] rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-sky-500 text-xs font-medium"
            >
              <option value="urgency">অপেক্ষমাণ সময় অনুসারে (সবচেয়ে জরুরি আগে)</option>
              <option value="oldest">দীর্ঘতম পেন্ডিং আগে (Oldest)</option>
              <option value="newest">নতুন তৈরি আগে (Newest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List / Cards */}
      {loading ? (
        <div className="text-center py-16 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
          <RefreshCw className="w-8 h-8 mx-auto text-sky-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-300">কাজের নোটসমূহ লোড হচ্ছে...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">কোনো কাজ খুঁজে পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || statusTab !== 'ALL'
                ? 'ফিল্টার পরিবর্তনের মাধ্যমে চেষ্টা করুন অথবা নতুন কাজ যুক্ত করুন।'
                : 'বর্তমানে কোনো কাজের রেকর্ড নেই। নতুন কাজের নোট যুক্ত করতে নিচের বোতামে চাপুন।'}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কাজ তৈরি করুন</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const timeInfo = formatElapsedTime(note.createdAt, now);
            const isCompleted = note.status === 'COMPLETED';
            const isInProgress = note.status === 'IN_PROGRESS';
            const isPending = note.status === 'PENDING';

            // Priority badge styles
            const priorityBadge =
              note.priority === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : note.priority === 'HIGH'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : note.priority === 'MEDIUM'
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

            // Card border & background
            const cardStyle = isCompleted
              ? 'bg-[#0b1220]/70 border-emerald-950/60 opacity-90'
              : isInProgress
              ? 'bg-[#0f172a] border-sky-500/40 shadow-lg shadow-sky-950/20 ring-1 ring-sky-500/20'
              : timeInfo.urgency === 'critical'
              ? 'bg-[#0f172a] border-rose-500/40 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/20'
              : 'bg-[#0f172a] border-[#1e293b] hover:border-slate-700';

            return (
              <div
                key={note.id}
                className={`rounded-2xl p-4 md:p-5 border transition-all ${cardStyle} space-y-3`}
              >
                {/* Header row: Status badge, Category, Priority, and Elapsed time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        <span>⏳ পেন্ডিং (Pending)</span>
                      </span>
                    )}
                    {isInProgress && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                        <span>⚙️ কাজ চলছে (In Progress)</span>
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>✅ সম্পন্ন / সমাধান শেষ</span>
                      </span>
                    )}

                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${priorityBadge}`}
                    >
                      {note.priority}
                    </span>

                    {/* Category */}
                    {note.category && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {note.category === 'LINK_DOWN'
                          ? '⚡ লিংক ডাউন'
                          : note.category === 'POWER_OFF'
                          ? '🔌 ONU পাওয়ার অফ'
                          : note.category === 'FIBER_CUT'
                          ? '✂️ ফাইবার কাটা'
                          : note.category === 'OPTICAL_LOSS'
                          ? '📉 অপটিক্যাল লস'
                          : note.category === 'CUSTOMER_ISSUE'
                          ? '👤 কাস্টমার'
                          : note.category}
                      </span>
                    )}

                    {/* Target ID / ONU ID / User */}
                    {note.targetId && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800/60">
                        {note.targetId}
                      </span>
                    )}
                  </div>

                  {/* ELAPSED TIME TRACKER (কত সময় ধরে আছে) */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {!isCompleted ? (
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${
                          timeInfo.urgency === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : timeInfo.urgency === 'medium'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                        title={`তৈরি হয়েছে: ${formatBengaliDateTime(note.createdAt)}`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>⏱️ {timeInfo.text} ধরে অপেক্ষমাণ</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-mono text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          সমাধান হতে সময় লেগেছে: {formatResolutionDuration(note.createdAt, note.completedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content: Title & Description */}
                <div>
                  <h3
                    className={`text-base font-bold text-white ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {note.title}
                  </h3>
                  {note.description && (
                    <p className="text-xs text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                      {note.description}
                    </p>
                  )}
                </div>

                {/* Completed Details Box (কখন শেষ হয়েছে ও সমাধান বিবরণ) */}
                {isCompleted && (
                  <div className="bg-[#080d1a] border border-emerald-500/20 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Check className="w-3 h-3" />
                        <span>কাজ সম্পন্ন হয়েছে: {formatBengaliDateTime(note.completedAt)}</span>
                      </span>
                      <span>তৈরি হয়েছিল: {formatBengaliDateTime(note.createdAt)}</span>
                    </div>
                    {note.resolutionNote && (
                      <p className="text-emerald-200/90 font-medium pt-1">
                        <span className="text-slate-400 font-normal">সমাধানের বিবরণ: </span>
                        {note.resolutionNote}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer: Metadata & Quick Action Buttons */}
                <div className="pt-2 border-t border-[#1e293b]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Assigned to and Created by */}
                  <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                    {note.assignedTo && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        <span>দায়িত্বপ্রাপ্ত:</span>
                        <strong className="text-white font-medium">{note.assignedTo}</strong>
                      </span>
                    )}
                    {note.createdBy && (
                      <span className="text-slate-500">তৈরি করেছেন: {note.createdBy}</span>
                    )}
                    <span className="text-slate-500 font-mono">
                      {formatBengaliDateTime(note.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Status actions */}
                    {isPending && (
                      <button
                        onClick={() => handleStatusChange(note.id, 'IN_PROGRESS')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition"
                        title="কাজ শুরু করুন"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-sky-400" />
                        <span>কাজ শুরু করুন</span>
                      </button>
                    )}

                    {!isCompleted ? (
                      <button
                        onClick={() => openCompleteModal(note)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
                        title="কাজ শেষ করুন"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>কাজ শেষ করুন</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(note.id, 'PENDING')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition"
                        title="পুনরায় পেন্ডিং হিসেবে মার্ক করুন"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>পুনরায় চালু করুন</span>
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModal(note)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                      title="নোট এডিট করুন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    {deleteConfirmId === note.id ? (
                      <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/40 rounded-lg p-1">
                        <span className="text-[10px] text-red-300 px-1 font-bold">মুছবেন?</span>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                        >
                          হ্যাঁ
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px]"
                        >
                          না
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(note.id)}
                        className="p-1.5 bg-slate-800 hover:bg-red-950/50 text-slate-400 hover:text-red-400 rounded-lg transition"
                        title="ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </main>

      {/* CREATE / EDIT NOTE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  {editingNote ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingNote ? 'কাজের নোট এডিট করুন' : 'নতুন কাজের নোট যুক্ত করুন'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    জরুরি সমস্যা বা ফিল্ড টাস্ক রেকর্ড করুন, কত সময় লাগছে তা ট্র্যাক হবে
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Bar (Only on create) */}
            {!editingNote && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  ⚡ দ্রুত টেমপ্লেট নির্বাচন (১-ক্লিক):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNote} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  কাজের শিরোনাম <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="উদাঃ মেইন ও ব্যাকআপ লিংক ডাউন / PON 1/2 হাই লস"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">প্রায়োরিটি</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="CRITICAL">🔴 জরুরি (Critical)</option>
                    <option value="HIGH">🟠 উচ্চ (High)</option>
                    <option value="MEDIUM">🟡 মাঝারি (Medium)</option>
                    <option value="LOW">🔵 সাধারণ (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ক্যাটাগরি</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="LINK_DOWN">⚡ লিংক ডাউন</option>
                    <option value="POWER_OFF">🔌 ONU পাওয়ার অফ</option>
                    <option value="FIBER_CUT">✂️ ফাইবার কাটা</option>
                    <option value="OPTICAL_LOSS">📉 অপটিক্যাল লস</option>
                    <option value="CUSTOMER_ISSUE">👤 কাস্টমার ইস্যু</option>
                    <option value="ROUTER_CONFIG">⚙️ রাউটার কনফিগ</option>
                    <option value="GENERAL">📝 সাধারণ নোট</option>
                  </select>
                </div>
              </div>

              {/* Target / ONU ID & Assigned To */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    টার্গেট / ONU ID / আইপি
                  </label>
                  <input
                    type="text"
                    placeholder="উদাঃ EPON0/1:14 বা 10.10.10.1"
                    value={formTargetId}
                    onChange={(e) => setFormTargetId(e.target.value)}
                    className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    দায়িত্বপ্রাপ্ত ব্যক্তি / টিম
                  </label>
                  <input
                    type="text"
                    placeholder="উদাঃ সাকিব / টিম আলফা"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  বিস্তারিত বিবরণ / সমস্যার নোট
                </label>
                <textarea
                  rows={3}
                  placeholder="সমস্যার বিস্তারিত বিবরণ বা করণীয় লিখে রাখুন..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                >
                  {submitting
                    ? 'সংরক্ষণ হচ্ছে...'
                    : editingNote
                    ? 'আপডেট সংরক্ষণ করুন'
                    : 'কাজ যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE RESOLUTION MODAL */}
      {completingNote && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-emerald-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">কাজটি সম্পন্ন করুন</h3>
                  <p className="text-[11px] text-slate-400">সমাধানের বিবরণ ও সময় রেকর্ড করা হবে</p>
                </div>
              </div>
              <button
                onClick={() => setCompletingNote(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task summary box */}
            <div className="bg-[#080d1a] border border-[#1e293b] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase">কাজের নাম:</span>
              <p className="text-xs font-bold text-white">{completingNote.title}</p>
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  পেন্ডিং ছিল: {formatElapsedTime(completingNote.createdAt, Date.now()).text}
                </span>
              </div>
            </div>

            {/* Resolution Note */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                কী সমাধান করা হলো? (Resolution Note)
              </label>
              <textarea
                rows={3}
                placeholder="উদাঃ ফাইবার জয়েন্ট সম্পন্ন করা হয়েছে, সিগন্যাল স্বাভাবিক -21.4 dBm এসেছে।"
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              ></textarea>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setCompletingNote(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                বাতিল
              </button>
              <button
                onClick={confirmComplete}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>✅ সম্পন্ন নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
