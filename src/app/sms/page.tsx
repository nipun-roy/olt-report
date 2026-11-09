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
  Languages,
  CheckCheck,
  Radio,
  PhoneCall,
  Wrench,
  Send,
  Lightbulb,
  SlidersHorizontal,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type LanguageType = 'banglish' | 'bangla' | 'english';

interface Snippet {
  id: string;
  title: string;
  content: string;
  contentBangla?: string;
  contentBanglish?: string;
  contentEnglish?: string;
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

// Synonyms map for smart Bengali / Banglish / English keyword matching
const synonymMap: Record<string, string[]> = {
  kotha: ['kotha', 'kotha bolse', 'kotha hoyeche', 'bolsi', 'spoke', 'talk', 'talked', 'call', 'called', 'alochona', 'কথা', 'বলছি', 'হয়েছে'],
  issue: ['issue', 'issue nai', 'kono issue nai', 'somossa', 'somossha', 'problem', 'problem nai', 'thik', 'thikmoto', 'fine', 'resolved', 'solved', 'working', 'সমস্যা', 'নাই', 'সমাধান', 'সচল', 'স্বাভাবিক', 'ভালো', 'ঠিক'],
  payment: ['payment', 'taka', 'tk', 'bkash', 'nagad', 'rocket', 'porishodh', 'paid', 'pay', 'bikash', 'পেমেন্ট', 'টাকা', 'বিকাশ', 'নগদ', 'রকেট'],
  bill: ['bill', 'due', 'bkeya', 'baki', 'tarikh', 'last date', 'বিল', 'বকেয়া', 'বাকি', 'পরিশোধ'],
  fiber: ['fiber', 'tar', 'cable', 'chira', 'kata', 'down', 'maintenance', 'splice', 'repair', 'broken', 'cut', 'ফাইবার', 'তার', 'ক্যাবল', 'কাটা', 'ছেঁড়া', 'রক্ষণাবেক্ষণ'],
  router: ['router', 'wifi', 'restart', 'reboot', 'on off', 'bandho', 'chalu', 'রাউটার', 'রিস্টার্ট', 'রিবুট', 'ওয়াইফাই'],
  signal: ['loss', 'db', 'dbm', 'signal', 'optical', 'onu', 'los', 'red light', 'power', 'সিগন্যাল', 'লস', 'অপটিক্যাল', 'ওএনইউ', 'লাল'],
  call: ['phone', 'call', 'dhorche na', 'receive', 'busy', 'unanswered', 'no answer', 'ফোন', 'কল', 'রিসিভ', 'ধরে নাই'],
  welcome: ['new', 'notun', 'active', 'activation', 'connection', 'লাইন', 'নতুন', 'সংযোগ', 'সক্রিয়', 'অভিনন্দন'],
  link: ['main link', 'backup', 'backup link', 'down', 'power off', 'power', 'device power off', 'onu device', 'same time', 'dying gasp', 'লিঙ্ক', 'ব্যাকআপ', 'ডাউন', 'পাওয়ার অফ', 'অফ'],
  user_id: ['id', 'kon id', 'id share', 'user id', 'username', 'আইডি', 'আইডি দিন', 'ইউজার আইডি'],
  anydesk: ['anydesk', 'any desk', 'remote', 'access', 'এনিডেস্ক', 'শেয়ার'],
  ping: ['ping', 'ping enable', 'icmp', 'পিং', 'পিং এনেবল'],
  upstream: ['upstream', 'upstream network', 'আপস্ট্রিম', 'নেটওয়ার্ক'],
  allow_time: ['allow time', 'some time', 'সময় দিন', 'একটু সময়', 'সহযোগিতা', 'ধৈর্য্য', 'wait'],
  check_now: ['check korun', 'check koren', 'চেক করুন', 'সব ঠিক', 'এখন চেক'],
  working: ['kaj korchi', 'কাজ করছি', 'কাজ চলছে', 'চেষ্টা করছি'],
};

// Clean default sentences when dynamic values are NOT added/needed
const DEFAULT_CLEAN_SNIPPETS: Record<string, { bangla: string; banglish: string; english: string }> = {
  snip_dual_link_down: {
    bangla: '🚨 জরুরি নোটিশ: একই সাথে মেইন ও ব্যাকআপ লিঙ্ক ডাউন পাচ্ছি। ওএনইউ (ONU) পাওয়ার অফ দেখাচ্ছে। অনুগ্রহ করে পাওয়ার ও ফাইবার চেক করে দ্রুত আপডেট দিন। ⚡',
    banglish: '🚨 Emergency Alert: Main link ebong backup link ekshathe down pacchi. ONU device power off dekhacche. Doyakore power source ebong fiber check kore druto update din. ⚡',
    english: '🚨 Emergency Alert: We are getting main link and backup link down at the same time. Getting ONU device power off (Dying Gasp). Please check the power source/fiber and update us immediately. ⚡',
  },
  snip_maintenance_alert: {
    bangla: '⚠️ জরুরি বিজ্ঞপ্তি: ফাইবার অপটিক ক্যাবল ক্ষতিগ্রস্ত হওয়ায় সাময়িক ইন্টারনেট সংযোগ বিঘ্নিত হতে পারে। 🛠️ দ্রুত সমাধানের কাজ চলছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত। 🙏',
    banglish: '⚠️ Joruri biggopti: Fiber optical cable khotigrostho howay samoyik internet bighnito hote pare. 🛠️ Druto somadhaner kaj cholche. Samoyik osubidhar jonno amra antorikbhabe dukkhito. 🙏',
    english: '⚠️ Emergency Notice: Due to damaged optical fiber maintenance, internet service may be temporarily interrupted. 🛠️ Restoration work is in progress. We apologize for the inconvenience. 🙏',
  },
  snip_fiber_restored: {
    bangla: '🛠️ ফিল্ড টিম ফাইবার ক্যাবল মেরামত সম্পন্ন করেছে। অপটিক্যাল সিগন্যাল পাওয়ার স্বাভাবিক হয়েছে। 📶 সংযোগ বর্তমানে সম্পূর্ণ সচল রয়েছে। ✅',
    banglish: '🛠️ Field team fiber cable repair shompurno koreche. Optical RX power normal hoyeche. 📶 Connection bortomane shochol ache. ✅',
    english: '🛠️ Field maintenance team has completed fiber cable splicing. Optical RX power restored to normal. 📶 Connection is fully operational. ✅',
  },
  snip_high_loss_alert: {
    bangla: '🚨 টেকনিশিয়ান অ্যালার্ট: হাই অপটিক্যাল সিগন্যাল লস পাওয়া গেছে। 📉 দ্রুত ড্রপ ফাইবার ও স্প্লাইস ট্রে চেক করুন। ⚡',
    banglish: '🚨 Field Alert: High optical signal loss paowa geche. 📉 Druto drop fiber o splice tray check korun. ⚡',
    english: '🚨 Field Alert: High optical signal loss detected. 📉 Please inspect drop cable and splice tray immediately. ⚡',
  },
  snip_client_resolved: {
    bangla: '📞 গ্রাহকের সাথে কথা হয়েছে। ইন্টারনেট সংযোগ স্বাভাবিক রয়েছে এবং বর্তমানে কোনো সমস্যা নেই। ✅ লাইন সঠিকভাবে সচল রয়েছে। 📶',
    banglish: '📞 Client er sathe kotha hoyeche. Internet connection shavabik royeche ebong bortomane kono issue/somossa nei. ✅ Line thikbhabe shochol ache. 📶',
    english: '📞 Communicated with client. Internet connection is normal and currently experiencing no issues. ✅ Line is properly active and operating fine. 📶',
  },
  snip_ticket_resolved: {
    bangla: '🎫 সম্মানিত গ্রাহক, আপনার ইন্টারনেট সংযোগটি স্বাভাবিক করা হয়েছে এবং টিকেট সফলভাবে সমাধান করা হলো। ✅ সাথে থাকার জন্য ধন্যবাদ! 🙏',
    banglish: '🎫 Sommanito grahok, apnar internet connection shavabik kora hoyeche ebong ticket safolbhabe resolve kora holo. ✅ Dhonnobad! 🙏',
    english: '🎫 Valued Customer, your internet connection has been restored and ticket has been marked as resolved. ✅ Thank you for your patience! 🙏',
  },
  snip_customer_unreachable: {
    bangla: '📵 গ্রাহকের সাথে যোগাযোগের চেষ্টা করা হয়েছিল, কিন্তু তিনি কল রিসিভ করেননি। ওএলটি-তে সংযোগ সচল রয়েছে। পরবর্তীতে আবার যোগাযোগ করা হবে। 📞',
    banglish: '📵 Client er sathe call e jogayog er cheshta kora hoyechilo, kintu call receive koren ni. OLT te line online ache. Abar call kora hobe. 📞',
    english: '📵 Attempted to contact client, but the call was unanswered. Line shows online in OLT. A follow-up attempt will be made. 📞',
  },
  snip_router_rebooted: {
    bangla: '🔄 গ্রাহকের সাথে কথা বলা হয়েছে। রাউটার এবং ওএনইউ রিস্টার্ট দেওয়ার পর সংযোগ পুনরুদ্ধার হয়েছে। ব্রাউজিং স্বাভাবিক রয়েছে। ✅',
    banglish: '🔄 Client er sathe kotha bola hoyeche. Router o ONU restart dewar por connection normal hoyeche. Browsing thik ache. ✅',
    english: '🔄 Communicated with client. Guided to power-cycle the router and ONU. Connection re-established with clean latency. ✅',
  },
  snip_payment_received: {
    bangla: '💳 আপনার ইন্টারনেট বিল পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে। 💰 OneSky ব্রডব্যান্ডের সাথে থাকার জন্য আন্তরিক ধন্যবাদ! 🙏',
    banglish: '💳 Apnar internet bill payment safolbhabe grohon kora hoyeche. 💰 OneSky-r sathe thakar jonno antorik dhonnobad! 🙏',
    english: '💳 Your internet bill payment has been successfully received. 💰 Thank you for choosing OneSky Broadband! 🙏',
  },
  snip_bill_due_reminder: {
    bangla: '📅 সম্মানিত গ্রাহক, চলতি মাসের ইন্টারনেট বিল পরিশোধ করার বিনীত অনুরোধ করা হলো। ⚠️ নিরবচ্ছিন্ন সেবা বজায় রাখতে দ্রুত পরিশোধ করুন। 🙏',
    banglish: '📅 Sommanito grahok, cholti masher internet bill porishodh korar onurodh kora holo. ⚠️ Uninterrupted sheba pete druto porishodh korun. 🙏',
    english: '📅 Dear Customer, this is a reminder that your monthly internet bill payment is due. ⚠️ Please pay promptly to enjoy uninterrupted service. 🙏',
  },
  snip_new_activation: {
    bangla: '🎉 অভিনন্দন! আপনার ব্রডব্যান্ড ইন্টারনেট সংযোগটি সফলভাবে সক্রিয় করা হয়েছে। 🚀 নিরবচ্ছিন্ন সেবায় আমরা সবসময় আপনার পাশে আছি। OneSky-র সাথে থাকার জন্য ধন্যবাদ! 📞',
    banglish: '🎉 Obhinondon! Apnar broadband internet connection safolbhabe active kora hoyeche. 🚀 OneSky-r sathe thakar jonno dhonnobad! 📞',
    english: '🎉 Congratulations! Your broadband internet connection has been successfully activated. 🚀 Thank you for choosing OneSky Broadband! 📞',
  },
};

// Helpful Bengali display labels for variables
const variableLabels: Record<string, { label: string; placeholder: string }> = {
  name: { label: 'গ্রাহকের নাম', placeholder: 'যেমন: Rahim' },
  customer_name: { label: 'গ্রাহকের নাম', placeholder: 'যেমন: করিম সাহেব' },
  amount: { label: 'টাকার পরিমাণ', placeholder: 'যেমন: ৮০০' },
  location: { label: 'লোকেশন / এলাকা', placeholder: 'যেমন: মিরপুর-১০' },
  area: { label: 'এলাকার নাম', placeholder: 'যেমন: ধানমন্ডি' },
  time: { label: 'আনুমানিক সময়', placeholder: 'যেমন: ২ ঘণ্টা' },
  due_date: { label: 'বিল পরিশোধের তারিখ', placeholder: 'যেমন: ১০ তারিখ' },
  ticket_id: { label: 'টিকেট নম্বর', placeholder: 'যেমন: TKT-1042' },
  onu_id: { label: 'ONU আইডি', placeholder: 'যেমন: EPON01:23' },
  port: { label: 'পোর্ট', placeholder: 'যেমন: PON 1/2' },
  rx_power: { label: 'RX পাওয়ার (dBm)', placeholder: 'যেমন: -26.5' },
  phone: { label: 'ফোন নম্বর', placeholder: 'যেমন: 017XXXXXXXX' },
  trx_id: { label: 'TrxID', placeholder: 'যেমন: BK1289XX' },
  username: { label: 'ইউজারনেম', placeholder: 'যেমন: user_99' },
  package: { label: 'প্যাকেজ', placeholder: 'যেমন: 20 Mbps' },
  helpline: { label: 'হেল্পলাইন', placeholder: 'যেমন: 019XXXXXXXX' },
};

export default function SmsAssistantPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // SMART COMPOSER & KEYWORD RECOMMENDER STATE
  const [typedSms, setTypedSms] = useState<string>('');
  const [recommendedLang, setRecommendedLang] = useState<LanguageType>('banglish');

  // Global default language
  const [globalLang, setGlobalLang] = useState<LanguageType>('banglish');

  // Per-card language selection: { [snippetId]: 'banglish' | 'bangla' | 'english' }
  const [cardLang, setCardLang] = useState<Record<string, LanguageType>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Dynamic variable values storage: { [snippetId]: { [varName]: value } }
  const [variableInputs, setVariableInputs] = useState<Record<string, Record<string, string>>>({});
  // Track open/collapsed state of variable input panels
  const [expandedVariables, setExpandedVariables] = useState<Record<string, boolean>>({});

  const toggleVariableExpanded = (snippetId: string) => {
    setExpandedVariables((prev) => ({
      ...prev,
      [snippetId]: !prev[snippetId],
    }));
  };

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalBangla, setModalBangla] = useState<string>('');
  const [modalBanglish, setModalBanglish] = useState<string>('');
  const [modalEnglish, setModalEnglish] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('');
  const [modalTags, setModalTags] = useState<string>('');
  const [modalPinned, setModalPinned] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<LanguageType>('banglish');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete modal
  const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);

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

  // Helper to get active text for snippet based on selected language
  const getSnippetRawText = (snippet: Snippet, lang: LanguageType): string => {
    if (lang === 'bangla') {
      return snippet.contentBangla || snippet.content || snippet.contentBanglish || snippet.contentEnglish || '';
    }
    if (lang === 'banglish') {
      return snippet.contentBanglish || snippet.content || snippet.contentBangla || snippet.contentEnglish || '';
    }
    if (lang === 'english') {
      return snippet.contentEnglish || snippet.content || snippet.contentBanglish || snippet.contentBangla || '';
    }
    return snippet.content || '';
  };

  // Extract variables {variable_name} from all available versions
  const extractVariables = (snippet: Snippet): string[] => {
    const combined = `${snippet.content} ${snippet.contentBangla || ''} ${snippet.contentBanglish || ''} ${snippet.contentEnglish || ''}`;
    const matches = combined.match(/\{([a-zA-Z0-9_\u0980-\u09FF]+)\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
  };

  // Interpolate text with variable inputs or return natural clean default version
  const getRenderedContent = (snippet: Snippet, lang: LanguageType): string => {
    const vars = extractVariables(snippet);
    if (vars.length === 0) {
      return getSnippetRawText(snippet, lang);
    }

    const values = variableInputs[snippet.id] || {};
    const hasAnyValue = vars.some((v) => values[v] && values[v].trim() !== '');

    // DEFAULT STATE: Dynamic values NOT added - return clean default version without raw placeholders
    if (!hasAnyValue) {
      if (DEFAULT_CLEAN_SNIPPETS[snippet.id]?.[lang]) {
        return DEFAULT_CLEAN_SNIPPETS[snippet.id][lang];
      }
      // Fallback for custom user snippets: clean up unpopulated placeholders cleanly
      let clean = getSnippetRawText(snippet, lang);
      vars.forEach((v) => {
        clean = clean.replace(new RegExp(`\\{${v}\\}-এর`, 'g'), '');
        clean = clean.replace(new RegExp(`\\(\\s*\\{${v}\\}\\s*\\)`, 'g'), '');
        clean = clean.replace(new RegExp(`\\{${v}\\}`, 'g'), '');
      });
      return clean.replace(/[ \t]+/g, ' ').replace(/\s+([।,।?!.])/g, '$1').trim();
    }

    // DYNAMIC STATE: User explicitly provided values, substitute them
    let rendered = getSnippetRawText(snippet, lang);
    vars.forEach((v) => {
      const val = values[v]?.trim();
      if (val) {
        rendered = rendered.split(`{${v}}`).join(val);
      } else {
        rendered = rendered.replace(new RegExp(`\\{${v}\\}-এর`, 'g'), '');
        rendered = rendered.replace(new RegExp(`\\(\\s*\\{${v}\\}\\s*\\)`, 'g'), '');
        rendered = rendered.replace(new RegExp(`\\{${v}\\}`, 'g'), '');
      }
    });

    return rendered.replace(/[ \t]+/g, ' ').replace(/\s+([।,।?!.])/g, '$1').trim();
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

  // 1-Click Copy logic
  const handleCopy = async (snippet: Snippet, lang: LanguageType) => {
    const textToCopy = getRenderedContent(snippet, lang);
    const langLabel = lang === 'banglish' ? 'বাংলিশ' : lang === 'bangla' ? 'বাংলা' : 'English';

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSnippetId(snippet.id);
      showToast(`"${snippet.title}" (${langLabel}) কপি হয়েছে!`);

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

  // Copy raw text from composer
  const handleCopyComposer = async () => {
    if (!typedSms.trim()) return;
    try {
      await navigator.clipboard.writeText(typedSms);
      showToast('টাইপকৃত SMS ক্লিপবোর্ডে কপি হয়েছে!');
    } catch (err) {
      alert('কপি করতে ব্যর্থ হয়েছে');
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
      setModalBangla(snippet.contentBangla || snippet.content || '');
      setModalBanglish(snippet.contentBanglish || '');
      setModalEnglish(snippet.contentEnglish || '');
      setModalCategory(snippet.categoryName || 'Support & Line Issue (সাপোর্ট)');
      setModalTags(snippet.tags || '');
      setModalPinned(snippet.isPinned);
      setModalActiveTab('banglish');
    } else {
      setEditingSnippet(null);
      setModalTitle('');
      setModalBangla('');
      setModalBanglish('');
      setModalEnglish('');
      setModalCategory(categories[0]?.name || 'Support & Line Issue (সাপোর্ট)');
      setModalTags('');
      setModalPinned(false);
      setModalActiveTab('banglish');
    }
    setShowModal(true);
  };

  // Save Snippet (Create or Update)
  const handleSaveSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasAnyContent = modalBangla.trim() || modalBanglish.trim() || modalEnglish.trim();
    if (!modalTitle.trim() || !hasAnyContent) {
      alert('অনুগ্রহ করে শিরোনাম এবং অন্তত একটি ভাষার টেক্সট পূরণ করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: editingSnippet?.id,
        title: modalTitle,
        content: modalBangla || modalBanglish || modalEnglish,
        contentBangla: modalBangla,
        contentBanglish: modalBanglish,
        contentEnglish: modalEnglish,
        categoryName: modalCategory,
        tags: modalTags,
        isPinned: modalPinned,
      };

      const res = await fetch('/api/snippets', {
        method: editingSnippet ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingSnippet ? 'মেসেজ আপডেট হয়েছে!' : 'নতুন ৩-ভাষার টেমপ্লেট তৈরি হয়েছে!');
        fetchSnippets();
        setShowModal(false);
      } else {
        alert(data.error || 'Failed to save');
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

  // Insert variable tag into active modal textarea
  const insertVariable = (varName: string) => {
    const tag = `{${varName}}`;
    if (modalActiveTab === 'banglish') {
      setModalBanglish((prev) => `${prev}${tag}`);
    } else if (modalActiveTab === 'bangla') {
      setModalBangla((prev) => `${prev}${tag}`);
    } else {
      setModalEnglish((prev) => `${prev}${tag}`);
    }
  };

  // SMART KEYWORD RECOMMENDER ENGINE
  const recommendedSnippets = useMemo(() => {
    if (!typedSms || typedSms.trim().length < 2) return [];

    const inputLower = typedSms.toLowerCase().trim();
    const inputWords = inputLower.split(/[\s,।.?!\-_]+/g).filter((w) => w.length > 1);

    if (inputWords.length === 0) return [];

    const scored: Array<{
      snippet: Snippet;
      score: number;
      matchedKeywords: string[];
    }> = [];

    snippets.forEach((snip) => {
      let score = 0;
      const matched = new Set<string>();

      const fullSnippetText = `${snip.title} ${snip.content} ${snip.contentBanglish || ''} ${snip.contentBangla || ''} ${snip.contentEnglish || ''} ${snip.tags || ''}`.toLowerCase();

      // 1. Direct word matching
      inputWords.forEach((word) => {
        if (fullSnippetText.includes(word)) {
          score += 25;
          matched.add(word);
        }

        // 2. Synonyms matching
        Object.entries(synonymMap).forEach(([key, synonyms]) => {
          const wordMatchesSynonym = synonyms.some((syn) => syn.includes(word) || word.includes(syn));
          if (wordMatchesSynonym) {
            const snippetMatchesSynonym = synonyms.some((syn) => fullSnippetText.includes(syn));
            if (snippetMatchesSynonym) {
              score += 20;
              matched.add(word);
            }
          }
        });
      });

      // 3. Title match bonus
      if (inputWords.some((w) => snip.title.toLowerCase().includes(w))) {
        score += 30;
      }

      // 4. Tags match bonus
      if (snip.tags) {
        inputWords.forEach((w) => {
          if (snip.tags!.toLowerCase().includes(w)) {
            score += 25;
          }
        });
      }

      if (score > 0 && matched.size > 0) {
        scored.push({
          snippet: snip,
          score,
          matchedKeywords: Array.from(matched),
        });
      }
    });

    // Sort by highest score first
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4); // Top 4 recommendations
  }, [typedSms, snippets]);

  // Filtered Snippets for the bottom catalogue
  const filteredSnippets = useMemo(() => {
    return snippets.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.categoryName !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.title} ${item.content} ${item.contentBangla || ''} ${item.contentBanglish || ''} ${item.contentEnglish || ''} ${item.tags || ''} ${item.categoryName || ''}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [snippets, selectedCategory, searchQuery]);

  // Quick suggestion chips to populate composer
  const quickTestChips = [
    '🔍 kon id te issue hocche',
    '🖥️ anydesk share korben',
    '📡 ping enable kore den',
    '🚨 main link and backup link down at same time',
    '🌐 upstream network somadhan',
    '📞 kotha hoyeche kono issue nai',
    '💳 bkash e 800 taka payment peyechi',
    '🛠️ router restart dile thik hoyeche',
    '⏳ please allow some time',
  ];

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 pb-24 selection:bg-indigo-500 selection:text-white">
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
              <Bot className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Smart SMS &amp; Snippet AI Assistant
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono">
                  কীওয়ার্ড রিকমেন্ডার রেডি
                </span>
              </div>
              <p className="text-xs text-slate-400">
                টাইপ করলেই প্রাসঙ্গিক SMS সুপারিশ করবে এবং ১-ক্লিকে কপি হবে
              </p>
            </div>
          </div>

          {/* Navigation Switcher between OLT Report & SMS Manager */}
          <div className="flex items-center gap-2.5">
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
              <span>নতুন ৩-ইন-১ টেমপ্লেট</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {/* ======================================================== */}
        {/* NEW CORE FEATURE: SMART SMS TYPING & KEYWORD RECOMMENDER */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-br from-[#0f172a] via-[#141e3c] to-[#0f172a] border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-indigo-950/40 relative">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Smart SMS Composer &amp; Keyword Matcher</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>সুপারিশের ভাষা:</span>
              <div className="flex items-center gap-1 bg-[#090d16] p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRecommendedLang('banglish')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    recommendedLang === 'banglish' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  🔤 বাংলিশ
                </button>
                <button
                  type="button"
                  onClick={() => setRecommendedLang('bangla')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    recommendedLang === 'bangla' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  🇧🇩 বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setRecommendedLang('english')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    recommendedLang === 'english' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            আপনি এখানে আপনার কথা বা তথ্য বাংলায় বা বাংলিশে টাইপ করুন। নিচের কীওয়ার্ড ম্যাচ করে স্বয়ংক্রিয়ভাবে সেরা SMS রেডি করে দেওয়া হবে:
          </p>

          {/* Typing Textarea */}
          <div className="relative">
            <textarea
              ref={composerInputRef}
              rows={3}
              value={typedSms}
              onChange={(e) => setTypedSms(e.target.value)}
              placeholder="এখানে লিখুন... (যেমন: 'client er sathe kotha hoyeche kono issue nai' অথবা 'bkash e payment peyechi')..."
              className="w-full bg-[#090d16]/90 border border-slate-700 focus:border-indigo-500 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner font-sans"
            />
            {typedSms && (
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTypedSms('')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
                >
                  মুছে ফেলুন
                </button>
                <button
                  type="button"
                  onClick={handleCopyComposer}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>টাইপকৃত টেক্সট কপি</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Test Chips */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>ক্লিক করে টেস্ট করুন:</span>
            </span>
            {quickTestChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTypedSms(chip)}
                className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition"
              >
                "{chip}"
              </button>
            ))}
          </div>

          {/* REAL-TIME KEYWORD RECOMMENDATIONS CONTAINER */}
          {recommendedSnippets.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckCheck className="w-4 h-4" />
                  <span>কীওয়ার্ড ম্যাচ অনুযায়ী সুপারিশকৃত SMS ({recommendedSnippets.length})</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  সরাসরি কপি করুন বা ইনপুট বক্সে ভ্যালু বসান
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {recommendedSnippets.map(({ snippet, score, matchedKeywords }) => {
                  const rendered = getRenderedContent(snippet, recommendedLang);
                  const vars = extractVariables(snippet);
                  const isCopied = copiedSnippetId === snippet.id;
                  const values = variableInputs[snippet.id] || {};

                  return (
                    <div
                      key={snippet.id}
                      className="bg-[#090d16] border-2 border-emerald-500/40 hover:border-emerald-500/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all"
                    >
                      <div>
                        {/* Recommendation Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                              🎯 মিল পাওয়া কীওয়ার্ড: {matchedKeywords.map((k) => `"${k}"`).join(', ')}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-1.5">{snippet.title}</h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {snippet.categoryName || 'General'}
                            </span>
                          </div>
                        </div>

                        {/* Variables inputs if template has variables (Optional / On-Demand) */}
                        {vars.length > 0 && (
                          <div className="my-2">
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <button
                                type="button"
                                onClick={() => toggleVariableExpanded(`rec_${snippet.id}`)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition border ${
                                  Object.values(values).some((v) => v.trim())
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : expandedVariables[`rec_${snippet.id}`]
                                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                                    : 'bg-[#0f172a] text-slate-400 hover:text-slate-200 border-slate-800'
                                }`}
                              >
                                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                                <span>
                                  {Object.values(values).some((v) => v.trim())
                                    ? 'ডাইনামিক ভ্যালু সক্রিয়'
                                    : 'ডাইনামিক ভ্যালু যোগ করুন (ঐচ্ছিক)'}
                                </span>
                                {expandedVariables[`rec_${snippet.id}`] ? (
                                  <ChevronUp className="w-2.5 h-2.5 opacity-70" />
                                ) : (
                                  <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                                )}
                              </button>

                              {Object.values(values).some((v) => v.trim()) && (
                                <button
                                  type="button"
                                  onClick={() => handleResetVariables(snippet.id)}
                                  className="text-[9px] text-slate-400 hover:text-amber-400 flex items-center gap-0.5"
                                  title="রিসেট"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>ডিফল্ট</span>
                                </button>
                              )}
                            </div>

                            {(expandedVariables[`rec_${snippet.id}`] || Object.values(values).some((v) => v.trim())) && (
                              <div className="p-2 bg-[#0f172a] border border-slate-800 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                                <div className="grid grid-cols-2 gap-1.5">
                                  {vars.map((v) => {
                                    const info = variableLabels[v] || { label: v, placeholder: `যেমন: ${v}` };
                                    return (
                                      <div key={v}>
                                        <label className="block text-[9px] font-medium text-slate-400 truncate">
                                          {info.label}
                                        </label>
                                        <input
                                          type="text"
                                          value={values[v] || ''}
                                          onChange={(e) => handleVariableChange(snippet.id, v, e.target.value)}
                                          placeholder={info.placeholder}
                                          className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded px-2 py-0.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Recommended Text Preview */}
                        <div className="p-3 bg-[#0f172a]/90 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-all">
                          {rendered}
                        </div>
                      </div>

                      {/* Recommendation Actions */}
                      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800/60">
                        {/* Language Switch for this recommended item */}
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-slate-500">ভাষা:</span>
                          <span className="font-bold text-indigo-400 uppercase font-mono">
                            {recommendedLang}
                          </span>
                        </div>

                        {/* 1-Click Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(snippet, recommendedLang)}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-lg ${
                            isCopied
                              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>সুপারিশকৃত SMS কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Global Search & Catalogue Filter */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="সকল টেমপ্লেট থেকে খুঁজুন... (Ctrl + K)"
                className="w-full bg-[#090d16] border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                <span>Ctrl</span>
                <span>+</span>
                <span>K</span>
              </div>
            </div>

            {/* Global Language Switcher */}
            <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
              <span className="text-[11px] text-slate-400 font-semibold px-2 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <span>সব কার্ডের ভাষা:</span>
              </span>
              <button
                type="button"
                onClick={() => setGlobalLang('banglish')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  globalLang === 'banglish'
                    ? 'bg-indigo-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔤 বাংলিশ
              </button>
              <button
                type="button"
                onClick={() => setGlobalLang('bangla')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  globalLang === 'bangla'
                    ? 'bg-emerald-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇧🇩 বাংলা
              </button>
              <button
                type="button"
                onClick={() => setGlobalLang('english')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  globalLang === 'english'
                    ? 'bg-sky-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-800/60 pt-3">
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
              মোট সংরক্ষিত টেমপ্লেট: <strong>{filteredSnippets.length}</strong> টি
            </span>
            <span className="flex items-center gap-1 text-[11px] text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>কার্ডের ভাষা অপশনে ক্লিক করে যেকোনো ভার্সন এক ক্লিকে কপি করুন</span>
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
                const currentLang = cardLang[snippet.id] || globalLang;
                const vars = extractVariables(snippet);
                const isCopied = copiedSnippetId === snippet.id;
                const rendered = getRenderedContent(snippet, currentLang);
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
                      <div className="flex items-start justify-between gap-3 mb-2.5">
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

                      {/* 3-LANGUAGE SELECTOR TABS ON THE CARD */}
                      <div className="my-2 flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() =>
                            setCardLang((prev) => ({ ...prev, [snippet.id]: 'banglish' }))
                          }
                          className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-center ${
                            currentLang === 'banglish'
                              ? 'bg-indigo-600 text-white shadow font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🔤 বাংলিশ
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCardLang((prev) => ({ ...prev, [snippet.id]: 'bangla' }))
                          }
                          className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-center ${
                            currentLang === 'bangla'
                              ? 'bg-emerald-600 text-white shadow font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🇧🇩 বাংলা
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCardLang((prev) => ({ ...prev, [snippet.id]: 'english' }))
                          }
                          className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-center ${
                            currentLang === 'english'
                              ? 'bg-sky-600 text-white shadow font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🇬🇧 English
                        </button>
                      </div>

                      {/* Dynamic Variables Section (Optional / On-Demand) */}
                      {vars.length > 0 && (
                        <div className="my-2.5">
                          {/* Toggle Header */}
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => toggleVariableExpanded(snippet.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                                hasFilledVars
                                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                                  : expandedVariables[snippet.id]
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-[#090d16] text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {hasFilledVars ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>
                                    ডাইনামিক ভ্যালু সক্রিয় ({Object.values(values).filter((v) => v.trim()).length}/{vars.length})
                                  </span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-indigo-400" />
                                  <span>ডাইনামিক ভ্যালু যোগ করুন (ঐচ্ছিক)</span>
                                </span>
                              )}
                              {expandedVariables[snippet.id] ? (
                                <ChevronUp className="w-3 h-3 ml-0.5 opacity-70" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
                              )}
                            </button>

                            {hasFilledVars && (
                              <button
                                type="button"
                                onClick={() => handleResetVariables(snippet.id)}
                                className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/60"
                                title="সব ভ্যালু মুছে ডিফল্ট টেক্সটে ফেরত যান"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>ডিফল্টে ফেরত</span>
                              </button>
                            )}
                          </div>

                          {/* Expandable input fields */}
                          {(expandedVariables[snippet.id] || hasFilledVars) && (
                            <div className="mt-2 p-3 bg-[#090d16] border border-indigo-500/20 rounded-xl space-y-2 animate-in fade-in duration-200">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>প্রয়োজনীয় ফিল্ডগুলো পূরণ করুন (ফাঁকা ফিল্ড ডিফল্ট থাকবে):</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {vars.map((v) => {
                                  const info = variableLabels[v] || { label: v, placeholder: `যেমন: ${v}` };
                                  return (
                                    <div key={v}>
                                      <label className="block text-[10px] font-medium text-slate-300 mb-0.5 truncate">
                                        {info.label} <span className="text-[9px] font-mono text-slate-500">({`{${v}}`})</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={values[v] || ''}
                                        onChange={(e) => handleVariableChange(snippet.id, v, e.target.value)}
                                        placeholder={info.placeholder}
                                        className="w-full bg-[#0f172a] border border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none transition"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content Preview Box */}
                      <div className="relative mt-2 p-3 bg-[#090d16] rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-all">
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
                    <div className="flex items-center justify-between gap-3 pt-3.5 mt-3 border-t border-slate-800/80">
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
                        onClick={() => handleCopy(snippet, currentLang)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                            : currentLang === 'bangla'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                            : currentLang === 'english'
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
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
                            <span>
                              {currentLang === 'banglish'
                                ? 'বাংলিশ কপি করুন'
                                : currentLang === 'bangla'
                                ? 'বাংলা কপি করুন'
                                : 'Copy English'}
                            </span>
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

      {/* Add / Edit Snippet Modal with 3 Language Tabs */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>{editingSnippet ? '৩-ইন-১ টেমপ্লেট এডিট করুন' : 'নতুন ৩-ইন-১ SMS টেমপ্লেট'}</span>
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
                  placeholder="যেমন: ক্লায়েন্টের সাথে কথা হয়েছে, সমস্যা নেই"
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
                  <option value="General">General (সাধারণ)</option>
                </select>
              </div>

              {/* 3 Language Sub-Tabs in Modal */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    ৩টি ভাষার টেক্সট পূরণ করুন:
                  </label>
                  <span className="text-[10px] text-indigo-400">
                    {`{name}, {amount} ভেরিয়েবল ব্যবহার করতে পারেন`}
                  </span>
                </div>

                {/* Tab buttons */}
                <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('banglish')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition ${
                      modalActiveTab === 'banglish'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔤 বাংলিশ ভার্সন
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('bangla')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition ${
                      modalActiveTab === 'bangla'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇧🇩 বাংলা ভার্সন
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('english')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition ${
                      modalActiveTab === 'english'
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇬🇧 ইংলিশ ভার্সন
                  </button>
                </div>

                {/* Variable helper chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
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

                {/* Textarea depending on active modal tab */}
                {modalActiveTab === 'banglish' && (
                  <div>
                    <span className="text-[10px] text-indigo-400 block mb-1">
                      🔤 বাংলিশ টেক্সট (যেমন: Client {`{name}`} er sathe kotha hoyeche, issue resolve...)
                    </span>
                    <textarea
                      rows={4}
                      value={modalBanglish}
                      onChange={(e) => setModalBanglish(e.target.value)}
                      placeholder="বাংলিশ ফরম্যাট লিখুন..."
                      className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                )}

                {modalActiveTab === 'bangla' && (
                  <div>
                    <span className="text-[10px] text-emerald-400 block mb-1">
                      🇧🇩 পূর্ণাঙ্গ বাংলা টেক্সট (যেমন: গ্রাহক {`{name}`}-এর সাথে কথা হয়েছে, লাইন স্বাভাবিক...)
                    </span>
                    <textarea
                      rows={4}
                      value={modalBangla}
                      onChange={(e) => setModalBangla(e.target.value)}
                      placeholder="পূর্ণাঙ্গ বাংলা ফরম্যাট লিখুন..."
                      className="w-full bg-[#090d16] border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                )}

                {modalActiveTab === 'english' && (
                  <div>
                    <span className="text-[10px] text-sky-400 block mb-1">
                      🇬🇧 পূর্ণাঙ্গ ইংরেজি টেক্সট (যেমন: Spoke with client {`{name}`}. No issues found...)
                    </span>
                    <textarea
                      rows={4}
                      value={modalEnglish}
                      onChange={(e) => setModalEnglish(e.target.value)}
                      placeholder="Enter full English format..."
                      className="w-full bg-[#090d16] border border-slate-700 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none font-sans"
                    />
                  </div>
                )}
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
                  placeholder="যেমন: client, call, resolved, payment"
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
