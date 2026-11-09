'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Search,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Zap,
  Tag,
  Folder,
  MessageSquare,
  Sparkles,
  X,
  FileText,
  RotateCcw,
  CheckCircle2,
  Flame,
  Layers,
  ArrowRight,
  ExternalLink,
  Globe,
  PhoneCall,
  CheckCheck,
  Radio,
  Wrench,
} from 'lucide-react';

interface Snippet {
  id: string;
  title: string;
  content: string;
  categoryId?: string;
  categoryName?: string;
  tags?: string;
  isPinned: boolean;
  copyCount: number;
  createdAt: string | Date;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function SmsAssistantPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Dynamic variable values storage: { [snippetId]: { [varName]: value } }
  const [variableInputs, setVariableInputs] = useState<Record<string, Record<string, string>>>({});

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalContent, setModalContent] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('');
  const [modalTags, setModalTags] = useState<string>('');
  const [modalPinned, setModalPinned] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete modal
  const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch Snippets & Categories
  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/snippets');
      const data = await res.json();
      if (data.success) {
        setSnippets(data.snippets || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load snippets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  // Helper to show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Helper to extract variables {variable_name} from text
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([a-zA-Z0-9_\u0980-\u09FF]+)\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
  };

  // Interpolate text with variable inputs
  const getRenderedContent = (snippet: Snippet): string => {
    const vars = extractVariables(snippet.content);
    if (vars.length === 0) return snippet.content;

    const values = variableInputs[snippet.id] || {};
    let rendered = snippet.content;

    vars.forEach((v) => {
      const val = values[v];
      const replacement = val !== undefined && val.trim() !== '' ? val.trim() : `{${v}}`;
      rendered = rendered.split(`{${v}}`).join(replacement);
    });

    return rendered;
  };

  // Handle Input change for dynamic variables
  const handleVariableChange = (snippetId: string, varName: string, value: string) => {
    setVariableInputs((prev) => ({
      ...prev,
      [snippetId]: {
        ...(prev[snippetId] || {}),
        [varName]: value,
      },
    }));
  };

  // Reset variable inputs for a snippet
  const handleResetVariables = (snippetId: string) => {
    setVariableInputs((prev) => ({
      ...prev,
      [snippetId]: {},
    }));
  };

  // 1-Click Copy logic for full Snippet cards
  const handleCopy = async (snippet: Snippet) => {
    const textToCopy = getRenderedContent(snippet);

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSnippetId(snippet.id);
      showToast(`"${snippet.title}" ক্লিপবোর্ডে কপি হয়েছে!`);

      // Increment copy count in database
      fetch('/api/snippets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: snippet.id, action: 'increment_copy' }),
      });

      // Update state locally
      setSnippets((prev) =>
        prev.map((s) => (s.id === snippet.id ? { ...s, copyCount: s.copyCount + 1 } : s))
      );

      setTimeout(() => {
        setCopiedSnippetId((curr) => (curr === snippet.id ? null : curr));
      }, 2000);
    } catch (err) {
      alert('কপি করতে ব্যর্থ হয়েছে: ' + err);
    }
  };

  // Copy quick English remark
  const handleCopyQuickEnglish = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`ইংরেজি রিমার্ক কপি হয়েছে: "${label}"`);
    } catch (err) {
      alert('কপি করতে সমস্যা হয়েছে: ' + err);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (snippet: Snippet) => {
    try {
      const newPinned = !snippet.isPinned;
      setSnippets((prev) =>
        prev.map((s) => (s.id === snippet.id ? { ...s, isPinned: newPinned } : s))
      );

      await fetch('/api/snippets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: snippet.id, action: 'toggle_pin' }),
      });

      showToast(newPinned ? 'মেসেজটি সবার উপরে পিন করা হয়েছে!' : 'আনপিন করা হয়েছে');
    } catch (err) {
      console.error(err);
    }
  };

  // Open modal for Create or Edit
  const openModal = (snippet?: Snippet) => {
    if (snippet) {
      setEditingSnippet(snippet);
      setModalTitle(snippet.title);
      setModalContent(snippet.content);
      setModalCategory(snippet.categoryName || 'Payment');
      setModalTags(snippet.tags || '');
      setModalPinned(snippet.isPinned);
    } else {
      setEditingSnippet(null);
      setModalTitle('');
      setModalContent('');
      setModalCategory(categories[0]?.name || 'Payment');
      setModalTags('');
      setModalPinned(false);
    }
    setShowModal(true);
  };

  // Save Snippet (Create or Update)
  const handleSaveSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalContent.trim()) {
      alert('অনুগ্রহ করে শিরোনাম ও মূল টেক্সট পূরণ করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSnippet) {
        // Update
        const res = await fetch('/api/snippets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSnippet.id,
            title: modalTitle,
            content: modalContent,
            categoryName: modalCategory,
            tags: modalTags,
            isPinned: modalPinned,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('মেসেজ সফলভাবে আপডেট হয়েছে!');
          fetchSnippets();
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to update');
        }
      } else {
        // Create
        const res = await fetch('/api/snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: modalTitle,
            content: modalContent,
            categoryName: modalCategory,
            tags: modalTags,
            isPinned: modalPinned,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('নতুন মেসেজ টেমপ্লেট তৈরি হয়েছে!');
          fetchSnippets();
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to create');
        }
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Snippet
  const handleDeleteSnippet = async () => {
    if (!snippetToDelete) return;
    try {
      const res = await fetch(`/api/snippets?id=${snippetToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSnippets((prev) => prev.filter((s) => s.id !== snippetToDelete.id));
        showToast('মেসেজটি মুছে ফেলা হয়েছে।');
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSnippetToDelete(null);
    }
  };

  // Insert variable tag into modal textarea
  const insertVariable = (varName: string) => {
    setModalContent((prev) => `${prev}{${varName}}`);
  };

  // Filtered Snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.categoryName !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.title} ${item.content} ${item.tags || ''} ${item.categoryName || ''}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [snippets, selectedCategory, searchQuery]);

  // Quick English presets specifically for client conversation outcomes
  const quickEnglishPresets = [
    {
      label: 'কথা হয়েছে, সমস্যা নেই',
      situation: 'Client confirmed internet is fine',
      text: 'Spoke with the client. Confirmed that the internet connection is running smoothly and no issues were found at present. Service is fully operational.',
      icon: <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      label: 'টিকেট সমাধান ও ক্লোজ',
      situation: 'Resolution message for ticket',
      text: 'Dear client, as per our conversation, your internet connection is now working properly with no reported issues. Ticket has been marked as resolved. Thank you.',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />,
    },
    {
      label: 'অপটিক্যাল সিগন্যাল নরমাল',
      situation: 'Optical loss verified normal',
      text: 'Spoke with customer. Optical RX power verified at optimal level. Customer confirmed browsing speed and stability are fine. No further issue.',
      icon: <Radio className="w-3.5 h-3.5 text-purple-400" />,
    },
    {
      label: 'ফোন রিসিভ করেনি',
      situation: 'Client unanswered / follow-up pending',
      text: 'Attempted to contact the client regarding line status, but the call was unanswered. Line shows online in OLT. A follow-up attempt will be made.',
      icon: <PhoneCall className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      label: 'রাউটার রিস্টার্ট করানো হয়েছে',
      situation: 'Guided client to reboot',
      text: 'Communicated with client. Guided to power-cycle the Wi-Fi router and ONU. Link re-established with clean latency. Client confirmed issue resolved.',
      icon: <RotateCcw className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      label: 'তার মেরামত সম্পন্ন',
      situation: 'Drop cable spliced & restored',
      text: 'Field maintenance team inspected optical link. Repaired damaged fiber drop core; optical signal restored to normal. Customer verified stable connection.',
      icon: <Wrench className="w-3.5 h-3.5 text-teal-400" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 pb-20 selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white font-medium text-xs rounded-xl shadow-2xl shadow-emerald-950/50 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Navigation */}
      <header className="sticky top-0 z-40 bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <MessageSquare className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Quick SMS &amp; Snippet Manager
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono">
                  1-Click Copy
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Auto English Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ডাইনামিক ভেরিয়েবল ও অটো-ইংলিশ রিমার্কস সহ রেডিমেড মেসেজ ড্যাশবোর্ড
              </p>
            </div>
          </div>

          {/* Navigation Switcher between OLT Report & SMS Manager */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="OLT অপটিক্যাল রিপোর্ট জেনারেটরে ফিরে যান"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>OLT Report</span>
            </Link>

            <button
              onClick={() => openModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন SMS টেমপ্লেট</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {/* NEW FEATURE: Quick English Remarks Section ("client r sathe kotha hoye se.. kno issue pasche na akhon") */}
        <div className="bg-gradient-to-r from-[#0f172a] via-[#131d38] to-[#0f172a] border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Auto English Client Remarks (ক্লায়েন্টের সাথে কথা বলা শেষে রেডি রিমার্ক)</span>
              </h2>
            </div>
            <span className="text-[11px] text-indigo-300 font-medium">
              যেকোনো কার্ডে ক্লিক করলেই ইংরেজি টেক্সট সাথে সাথে কপি হবে 📋
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {quickEnglishPresets.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => handleCopyQuickEnglish(preset.text, preset.label)}
                className="group cursor-pointer bg-[#090d16]/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/60 rounded-xl p-3 transition-all flex flex-col justify-between text-left shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                      {preset.icon}
                      <span>{preset.label}</span>
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-400 flex items-center gap-0.5 transition font-semibold">
                      <Copy className="w-3 h-3" />
                      <span>কপি করুন</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2">
                    "{preset.text}"
                  </p>
                </div>
                <div className="mt-2.5 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                  <span className="truncate">{preset.situation}</span>
                  <span className="text-indigo-400 group-hover:text-indigo-300 font-mono text-[9px] shrink-0">1-Click Copy</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Bar & Instant Filter */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="মেসেজের নাম, ট্যাগ বা টেক্সট লিখে খুঁজুন... (Ctrl + K)"
                className="w-full bg-[#090d16] border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                <span>Ctrl</span>
                <span>+</span>
                <span>K</span>
              </div>
            </div>

            {/* Clear Search */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                মুছে ফেলুন
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#090d16] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              সকল ({snippets.length})
            </button>

            {categories.map((cat) => {
              const count = snippets.filter((s) => s.categoryName === cat.name).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat.name
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                      : 'bg-[#090d16] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Snippets Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              দেখাচ্ছে <strong>{filteredSnippets.length}</strong> টি টেমপ্লেট
            </span>
            <span className="flex items-center gap-1 text-[11px] text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{`{ভেরিয়েবল}`} থাকলে ইনপুট বক্স স্বয়ংক্রিয়ভাবে সক্রিয় হবে</span>
            </span>
          </div>

          {filteredSnippets.length === 0 ? (
            <div className="bg-[#0f172a] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">কোনো SMS টেমপ্লেট পাওয়া যায়নি</p>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                + নতুন মেসেজ যোগ করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSnippets.map((snippet) => {
                const vars = extractVariables(snippet.content);
                const isCopied = copiedSnippetId === snippet.id;
                const rendered = getRenderedContent(snippet);
                const values = variableInputs[snippet.id] || {};
                const hasFilledVars = Object.values(values).some((v) => v.trim() !== '');

                return (
                  <div
                    key={snippet.id}
                    className={`bg-[#0f172a] border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-700 shadow-lg ${
                      snippet.isPinned
                        ? 'border-indigo-500/50 bg-gradient-to-b from-[#131b33] to-[#0f172a]'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {snippet.isPinned && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Pin className="w-2.5 h-2.5 fill-amber-400" />
                                <span>PINNED</span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {snippet.categoryName || 'General'}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-white mt-1.5">{snippet.title}</h3>
                        </div>

                        {/* Top Actions: Pin, Edit, Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleTogglePin(snippet)}
                            className={`p-1.5 rounded-lg transition ${
                              snippet.isPinned
                                ? 'text-amber-400 hover:bg-amber-400/10'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                            title={snippet.isPinned ? 'আনপিন করুন' : 'উপরে পিন করুন'}
                          >
                            <Pin className={`w-3.5 h-3.5 ${snippet.isPinned ? 'fill-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={() => openModal(snippet)}
                            className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSnippetToDelete(snippet)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Variables Inputs Section (if placeholders exist) */}
                      {vars.length > 0 && (
                        <div className="my-3 p-3 bg-[#090d16] border border-indigo-500/20 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>ডাইনামিক তথ্য পূরণ করুন:</span>
                            </span>
                            {hasFilledVars && (
                              <button
                                onClick={() => handleResetVariables(snippet.id)}
                                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                                title="সব ভ্যালু ক্লিয়ার করুন"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>রিসেট</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {vars.map((v) => (
                              <div key={v}>
                                <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-0.5 truncate">
                                  {`{${v}}`}
                                </label>
                                <input
                                  type="text"
                                  value={values[v] || ''}
                                  onChange={(e) => handleVariableChange(snippet.id, v, e.target.value)}
                                  placeholder={`যেমন: ${v}`}
                                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Preview Box */}
                      <div className="relative mt-2 p-3 bg-[#090d16] rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap select-all">
                        {rendered}
                      </div>

                      {/* Tags */}
                      {snippet.tags && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                          {snippet.tags.split(',').map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded border border-slate-800"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Copy Count & 1-Click Copy Button */}
                    <div className="flex items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        {snippet.copyCount > 0 ? (
                          <span className="flex items-center gap-1 text-amber-400/90 font-semibold">
                            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>{snippet.copyCount} বার ব্যবহৃত</span>
                          </span>
                        ) : (
                          <span>ব্যবহার হয়নি</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopy(snippet)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>মেসেজ কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Snippet Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>{editingSnippet ? 'SMS টেমপ্লেট এডিট করুন' : 'নতুন SMS টেমপ্লেট তৈরি'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSnippet} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  টেমপ্লেটের নাম / টাইটেল *
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="যেমন: Spoke with client - No issue found"
                  className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ক্যাটাগরি</label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="English Remarks (ইংরেজি রিমার্কস)">English Remarks (ইংরেজি রিমার্কস)</option>
                  <option value="General">General (সাধারণ)</option>
                </select>
              </div>

              {/* Content with Variable Insert Helpers */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    মূল মেসেজের টেক্সট *
                  </label>
                  <span className="text-[10px] text-indigo-400">
                    {`{name}, {amount} ইত্যাদি ভেরিয়েবল ব্যবহার করতে পারেন`}
                  </span>
                </div>

                {/* Quick Insert Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold">ক্লিক করে যোগ করুন:</span>
                  {['name', 'amount', 'trx_id', 'due_date', 'area', 'onu_id', 'port', 'phone', 'ticket_id', 'time'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/30 transition"
                    >
                      +{`{${v}}`}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={5}
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder="যেমন: Spoke with client {name}. Confirmed connection is working properly..."
                  className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none font-sans"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ট্যাগসমূহ (কমা দিয়ে লিখুন)
                </label>
                <input
                  type="text"
                  value={modalTags}
                  onChange={(e) => setModalTags(e.target.value)}
                  placeholder="যেমন: english, client, resolved, support"
                  className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {/* Pinned Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={modalPinned}
                  onChange={(e) => setModalPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#090d16] border-slate-700"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-300 select-none">
                  মেসেজটি সবার উপরে পিন (Favorite / Pin) করে রাখুন
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {snippetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">মেসেজটি ডিলিট করবেন?</h3>
              <p className="text-xs text-slate-400 mt-1 truncate">
                "{snippetToDelete.title}"
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSnippetToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteSnippet}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition"
              >
                ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
