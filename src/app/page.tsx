'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AuthStatus from '@/components/AuthStatus';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  Share2,
  Printer,
  Search,
  Check,
  X,
  Zap,
  Layers,
  ArrowRight,
  Database,
  Clock,
  Radio,
  PlusCircle,
  HelpCircle,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';

interface ReportItem {
  onuId: string;
  port: string;
  mac: string;
  description?: string;
  distance?: string;
  rxPower: number;
  txPower?: string;
  temp?: string;
  voltage?: string;
  txBias?: string;
  status: 'CRITICAL' | 'WARNING' | 'OPTIMAL';
  brandDetected?: string;
}

interface Report {
  id: string;
  title: string;
  sourceBrand?: string;
  threshold: number;
  totalOnus: number;
  criticalCount: number;
  warningCount: number;
  optimalCount: number;
  worstRxPower: number;
  createdAt: string | Date;
  items?: ReportItem[];
}

export default function SingleReportManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Input Form State
  const [showInputSection, setShowInputSection] = useState<boolean>(true);
  const [rawText, setRawText] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(24.0);
  const [brandHint, setBrandHint] = useState<string>('AUTO');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Active Report Filters
  const [activeTab, setActiveTab] = useState<'critical' | 'warning' | 'optimal' | 'all'>('critical');
  const [selectedPort, setSelectedPort] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Feedback & Modals
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all saved reports on mount
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReports(json.data);
        if (json.data.length > 0) {
          // Select newest report if none selected
          if (!selectedReportId || !json.data.some((r: Report) => r.id === selectedReportId)) {
            setSelectedReportId(json.data[0].id);
          }
          setShowInputSection(false); // minimize input form if reports already exist
        } else {
          setShowInputSection(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Currently active report
  const activeReport = reports.find((r) => r.id === selectedReportId) || (reports.length > 0 ? reports[0] : null);

  // Handle Generate Report
  const handleGenerateReport = async () => {
    if (!rawText.trim()) {
      setErrorMessage('অনুগ্রহ করে OLT ডাটা পেস্ট করুন অথবা একটি ফাইল নির্বাচন করুন।');
      return;
    }

    setErrorMessage('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          title: reportTitle.trim() || undefined,
          threshold,
          brandHint,
        }),
      });

      const json = await res.json();
      setIsGenerating(false);

      if (json.success && json.data) {
        setRawText('');
        setReportTitle('');
        // Add new report to list & select it
        setReports((prev) => [json.data, ...prev]);
        setSelectedReportId(json.data.id);
        setActiveTab('critical'); // High loss by default
        setSelectedPort('ALL');
        setSearchQuery('');
        setShowInputSection(false); // Collapsed so user sees generated report immediately
      } else {
        setErrorMessage(json.error || 'রিপোর্ট তৈরি করতে সমস্যা হয়েছে। ডাটা ফরম্যাট চেক করুন।');
      }
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage('সার্ভার এরর: ' + err.message);
    }
  };

  // Load Sample Demo Data
  const loadDemoData = () => {
    const sample = `ONU ID\tMAC Address\tDescription\tDistance(m)\tTemperature(°C)\tSupply Voltage(V)\tTX Bias Current(mA)\tTX Power(dBm)\tRX Power(dBm)
EPON0/1:1\t00:D3:9E:20:2D:4E\tCustomer-1\t1636\t48.75\t3.28\t19.58\t1.52\t-17.21
EPON0/1:7\tD0:5F:AF:A9:A3:77\tCustomer-7\t2900\t35.39\t3.31\t15.25\t1.84\t-29.21
EPON0/1:10\t4C:AE:1C:23:00:30\tCustomer-10\t1403\t46.00\t3.27\t14.00\t2.31\t-27.45
EPON0/1:13\tA0:7E:09:06:B6:80\tCustomer-13\t1339\t45.95\t3.23\t15.20\t2.74\t-27.96
EPON0/1:27\tC4:CD:50:5C:F7:7B\tCustomer-27\t1934\t33.69\t3.31\t11.50\t1.97\t-30.97
EPON0/2:3\tA0:7C:11:13:0D:42\tCustomer-3\t5070\t51.64\t3.25\t16.32\t2.16\t-24.81
EPON0/2:8\tA0:7F:04:17:DF:CE\tCustomer-8\t4755\t48.16\t3.21\t16.95\t2.67\t-30.00
EPON0/2:10\tC8:3A:35:78:EE:70\tCustomer-10\t3321\t45.87\t3.29\t18.71\t1.84\t-26.20
EPON0/2:15\tA2:4F:08:11:82:20\tCustomer-15\t3277\t48.00\t3.30\t17.00\t2.32\t-25.53
EPON0/2:30\tA0:7D:04:06:6B:C8\tCustomer-30\t4346\t43.63\t3.22\t13.00\t2.51\t-29.59
EPON0/2:45\t4C:AE:1C:77:F9:40\tCustomer-45\t3964\t36.00\t3.24\t14.00\t2.29\t-24.44
EPON0/2:50\t4C:AE:1C:77:A1:00\tCustomer-50\t3975\t43.00\t3.34\t15.00\t2.11\t-26.58
EPON0/2:58\tA2:3D:09:04:5D:D0\tCustomer-58\t3244\t48.00\t3.26\t13.00\t2.02\t-29.21
EPON0/2:61\t38:D4:A5:83:0A:EF\tCustomer-61\t2236\t37.00\t3.30\t18.00\t2.03\t-24.81
EPON0/3:2\t00:1E:67:88:99:AA\tCustomer-Opt\t1200\t42.00\t3.30\t14.00\t2.10\t-18.45`;
    setRawText(sample);
    setReportTitle('BDCOM Core OLT - Sample Test');
    setErrorMessage('');
  };

  // Handle File Upload (.txt, .log, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setRawText(text);
      if (!reportTitle) {
        setReportTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  // Delete All Data (Purge)
  const handleDeleteAll = async () => {
    try {
      const res = await fetch('/api/reports?all=true', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setReports([]);
        setSelectedReportId(null);
        setShowDeleteAllModal(false);
        setShowInputSection(true);
      } else {
        alert(json.error || 'ডাটা ডিলিট করতে ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Delete Individual Report
  const handleDeleteSingleReport = async () => {
    if (!reportToDelete) return;
    try {
      const res = await fetch(`/api/reports?id=${reportToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        const remaining = reports.filter((r) => r.id !== reportToDelete.id);
        setReports(remaining);
        if (selectedReportId === reportToDelete.id) {
          setSelectedReportId(remaining.length > 0 ? remaining[0].id : null);
        }
      } else {
        alert(json.error || 'Failed to delete');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setReportToDelete(null);
    }
  };

  // Active Report Item Filtering
  const activeItems = activeReport?.items || [];
  const reportThreshold = activeReport?.threshold || 24.0;

  // Collect unique ports for filter dropdown
  const portOptions = Array.from(new Set(activeItems.map((item) => item.port).filter(Boolean))).sort();

  const filteredItems = activeItems.filter((item) => {
    const absRx = Math.abs(item.rxPower);

    if (activeTab === 'critical' && absRx < reportThreshold) return false;
    if (activeTab === 'warning' && (absRx < 21.0 || absRx >= reportThreshold)) return false;
    if (activeTab === 'optimal' && absRx >= 21.0) return false;

    if (selectedPort !== 'ALL' && item.port !== selectedPort) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const textToSearch = `${item.onuId} ${item.mac} ${item.port} ${item.description || ''} ${item.distance || ''}`.toLowerCase();
      if (!textToSearch.includes(q)) return false;
    }

    return true;
  });

  // Sort worst optical loss (highest absolute dBm) first
  filteredItems.sort((a, b) => Math.abs(b.rxPower) - Math.abs(a.rxPower));

  // Copy WhatsApp / Telegram format
  const copyWhatsAppReport = () => {
    if (!activeReport) return;
    const highLossList = activeItems.filter((o) => Math.abs(o.rxPower) >= reportThreshold);

    const ports: Record<string, ReportItem[]> = {};
    highLossList.forEach((item) => {
      const p = item.port || 'Unknown Port';
      if (!ports[p]) ports[p] = [];
      ports[p].push(item);
    });

    let msg = `🚨 *OLT HIGH dB REPORT (≥ ${reportThreshold.toFixed(1)} dBm)*\n`;
    msg += `📋 রিপোর্ট: ${activeReport.title}\n`;
    msg += `📅 তারিখ: ${new Date(activeReport.createdAt).toLocaleString('bn-BD')}\n`;
    msg += `📊 মোট হাই লস ONU: ${highLossList.length} টি / ${activeItems.length} টি\n`;
    msg += `────────────────────────────\n`;

    Object.keys(ports).sort().forEach((portName) => {
      msg += `\n📍 *পোর্ট ${portName}* (${ports[portName].length} টি ONU):\n`;
      ports[portName].forEach((item) => {
        msg += `• *${item.onuId}* | RX: \`${item.rxPower} dBm\` | MAC: ${item.mac || '-'} | Dist: ${item.distance || '-'}m\n`;
      });
    });

    msg += `\n────────────────────────────\n`;
    msg += `⚡ দ্রুত ফাইবার ড্রপ, স্প্লাইস ট্রে ও স্প্লিটার কানেকশন চেক করুন।`;

    navigator.clipboard.writeText(msg);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!activeReport) return;
    let csv = 'ONU ID,Port,MAC Address,RX Power (dBm),TX Power (dBm),Distance (m),Status,Description\n';
    filteredItems.forEach((item) => {
      csv += `"${item.onuId}","${item.port}","${item.mac}","${item.rxPower}","${item.txPower || ''}","${item.distance || ''}","${item.status}","${item.description || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeReport.title.replace(/\s+/g, '_')}_${activeTab}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0c1322]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  OneSky OLT Report
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  ইনস্ট্যান্ট রিপোর্ট
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ডাটা পেস্ট করুন — এক ক্লিকে হাই dB সহ সম্পূর্ণ রিপোর্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Work Notes / Tasks Navigation Link */}
            <Link
              href="/notes"
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition shadow"
              title="কাজের নোট ও টাস্ক ট্র্যাকার — কোন কাজ কত সময় ধরে পেন্ডিং"
            >
              <ClipboardList className="w-4 h-4 text-amber-400" />
              <span>কাজের নোট (Notes)</span>
            </Link>

            {/* Quick SMS Assistant Navigation Link */}
            <Link
              href="/sms"
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition shadow"
              title="Quick SMS ও Snippet Assistant ড্যাশবোর্ড"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Quick SMS</span>
            </Link>

            <AuthStatus />

            {/* Toggle Input Section */}
            <button
              onClick={() => setShowInputSection(!showInputSection)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                showInputSection
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showInputSection ? 'ইনপুট বক্স বন্ধ করুন' : 'নতুন ডাটা পেস্ট করুন'}</span>
            </button>

            {/* Clear All Data Button */}
            {reports.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold transition"
                title="সকল সংরক্ষিত রিপোর্ট ও ডাটা একবারে ডিলিট করুন"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">একবারে সব ডিলিট</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {/* Section 1: Data Input / Share OLT Data */}
        {showInputSection && (
          <div className="bg-[#0f172a] border border-sky-500/30 rounded-2xl p-5 sm:p-6 shadow-xl shadow-sky-950/20 relative transition-all animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-sky-400" />
                  <span>OLT ডাটা দিন ও রিপোর্ট তৈরি করুন</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  BDCOM, VSOL, Huawei, ZTE, CDATA বা যেকোনো OLT টার্মিনাল লগ পেস্ট করুন
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadDemoData}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500/50 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>ডেমো ডাটা দেখুন</span>
                </button>

                <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>ফাইল আপলোড (.txt/.csv)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".txt,.log,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Input Textarea */}
            <div className="space-y-4">
              <div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="এখানে OLT-র টার্মিনাল আউটপুট পেস্ট করুন... (যেমন: show epon optical-transceiver-diagnosis বা display ont optical-info)..."
                  rows={6}
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-sky-500 rounded-xl p-3.5 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none transition resize-y"
                />
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Report Title */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    রিপোর্টের নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="যেমন: Uttara Core OLT 1"
                    className="w-full bg-[#090d16] border border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>

                {/* Threshold Setting */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      হাই লস থ্রেশহোল্ড: <span className="text-red-400 font-mono font-bold">≥ {threshold} dBm</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[22.0, 24.0, 25.0, 26.0].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setThreshold(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                          threshold === t
                            ? 'bg-red-500/20 text-red-400 border-red-500/50'
                            : 'bg-[#090d16] text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {t} dB
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Hint */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    OLT ব্র্যান্ড (অপশনাল)
                  </label>
                  <select
                    value={brandHint}
                    onChange={(e) => setBrandHint(e.target.value)}
                    className="w-full bg-[#090d16] border border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                  >
                    <option value="AUTO">অটো ডিটেক্ট (Auto Detect)</option>
                    <option value="BDCOM">BDCOM OLT</option>
                    <option value="VSOL">VSOL OLT</option>
                    <option value="Huawei">Huawei GPON</option>
                    <option value="ZTE">ZTE GPON</option>
                    <option value="CDATA">CDATA OLT</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {reports.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowInputSection(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                  >
                    বাতিল করুন
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>রিপোর্ট তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>রিপোর্ট তৈরি করুন (Generate Report)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: All Reports Hub ("jesob report korbo gula jeno 1 gay thake") */}
        {reports.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  সকল তৈরি করা রিপোর্ট ({reports.length})
                </h2>
                <span className="text-xs text-slate-500">— যেকোনো রিপোর্টে ক্লিক করে দেখুন</span>
              </div>
            </div>

            {/* Reports Tabs / Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reports.map((rep) => {
                const isSelected = rep.id === activeReport?.id;
                const dateStr = new Date(rep.createdAt).toLocaleString('bn-BD', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      setActiveTab('critical');
                    }}
                    className={`group cursor-pointer rounded-xl p-3.5 border transition-all text-left relative ${
                      isSelected
                        ? 'bg-sky-950/30 border-sky-500/80 ring-1 ring-sky-500/50 shadow-lg shadow-sky-950/40'
                        : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-[#131d33]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 animate-pulse" />
                          )}
                          <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                            {rep.title}
                          </h3>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{dateStr}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 font-mono">{rep.sourceBrand}</span>
                        </p>
                      </div>

                      {/* Single Report Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportToDelete(rep);
                        }}
                        className="opacity-60 hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                        title="এই রিপোর্ট ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stats Pill Row */}
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                        মোট: {rep.totalOnus}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold">
                        হাই dB: {rep.criticalCount}
                      </span>
                      {rep.worstRxPower ? (
                        <span className="ml-auto text-[10px] text-slate-400">
                          Worst: <span className="text-red-400 font-bold">{rep.worstRxPower} dBm</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: Active Selected Report Details */}
        {activeReport ? (
          <div className="space-y-4">
            {/* Report Header Card */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      সক্রিয় রিপোর্ট
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      {activeReport.title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>তৈরির সময়: {new Date(activeReport.createdAt).toLocaleString('bn-BD')}</span>
                    <span>•</span>
                    <span>থ্রেশহোল্ড: <strong className="text-red-400">≥ {reportThreshold} dBm</strong></span>
                    <span>•</span>
                    <span>ডিটেক্টেড: <strong>{activeReport.sourceBrand || 'Auto'}</strong></span>
                  </p>
                </div>

                {/* Technician Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* WhatsApp Copy */}
                  <button
                    onClick={copyWhatsAppReport}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
                    title="হোয়াটসঅ্যাপে টেকনিশিয়ানদের জন্য রেডি টেক্সট কপি করুন"
                  >
                    {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span>{copiedWhatsApp ? 'কপি হয়েছে!' : 'WhatsApp রিপোর্ট কপি'}</span>
                  </button>

                  {/* CSV Export */}
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                    title="এক্সেল বা সিএসভি ফরম্যাটে ডাউনলোড করুন"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Excel (.CSV)</span>
                  </button>

                  {/* Print */}
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs transition"
                    title="প্রিন্ট করুন"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {/* Total */}
                <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] font-semibold text-slate-400 block">মোট স্ক্যানকৃত ONU</span>
                  <p className="text-xl font-black text-white font-mono mt-0.5">
                    {activeReport.totalOnus}
                  </p>
                  <span className="text-[10px] text-slate-500">অনলাইন ডাটা রেকর্ড</span>
                </div>

                {/* Critical */}
                <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3">
                  <span className="text-[11px] font-semibold text-red-300 block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>হাই dB (লসের ঝুঁকি)</span>
                  </span>
                  <p className="text-xl font-black text-red-400 font-mono mt-0.5">
                    {activeReport.criticalCount}
                  </p>
                  <span className="text-[10px] text-red-400/80">≥ {reportThreshold} dBm এর বেশি লস</span>
                </div>

                {/* Warning */}
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3">
                  <span className="text-[11px] font-semibold text-amber-300 block">ওয়ার্নিং জোন</span>
                  <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
                    {activeReport.warningCount}
                  </p>
                  <span className="text-[10px] text-amber-400/80">21.0 - {reportThreshold} dBm</span>
                </div>

                {/* Optimal */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3">
                  <span className="text-[11px] font-semibold text-emerald-300 block">স্বাভাবিক সিগন্যাল</span>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                    {activeReport.optimalCount}
                  </p>
                  <span className="text-[10px] text-emerald-400/80">&lt; 21.0 dBm (চমৎকার)</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Controls */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('critical')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>হাই dB ({activeReport.criticalCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('warning')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>ওয়ার্নিং ({activeReport.warningCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('optimal')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'optimal'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>স্বাভাবিক ({activeReport.optimalCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'all'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>সকল ONU ({activeReport.totalOnus})</span>
                  </button>
                </div>

                {/* Search & Port Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Port Dropdown */}
                  {portOptions.length > 1 && (
                    <select
                      value={selectedPort}
                      onChange={(e) => setSelectedPort(e.target.value)}
                      className="bg-[#090d16] border border-slate-800 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">সকল পোর্ট (All)</option>
                      {portOptions.map((p) => (
                        <option key={p} value={p}>
                          পোর্ট {p}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Search Input */}
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="খুঁজুন (ONU ID / MAC)..."
                      className="w-full bg-[#090d16] border border-slate-800 focus:border-sky-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="mt-4 overflow-x-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#090d16] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">স্ট্যাটাস</th>
                      <th className="py-3 px-4">ONU ID</th>
                      <th className="py-3 px-4">পোর্ট</th>
                      <th className="py-3 px-4">MAC Address</th>
                      <th className="py-3 px-4">RX Power (dBm)</th>
                      <th className="py-3 px-4">TX Power</th>
                      <th className="py-3 px-4">দূরত্ব (Distance)</th>
                      <th className="py-3 px-4">বিবরণ / গ্রাহক</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          এই ফিল্টারে কোনো ONU পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item, idx) => {
                        const absRx = Math.abs(item.rxPower);
                        const isHighLoss = absRx >= reportThreshold;
                        const isWarn = absRx >= 21.0 && absRx < reportThreshold;

                        return (
                          <tr
                            key={idx}
                            className={`transition hover:bg-slate-800/30 ${
                              isHighLoss ? 'bg-red-950/15' : isWarn ? 'bg-amber-950/10' : ''
                            }`}
                          >
                            {/* Status */}
                            <td className="py-3 px-4">
                              {isHighLoss ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 font-mono">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>HIGH dB</span>
                                </span>
                              ) : isWarn ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                                  WARNING
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                                  OPTIMAL
                                </span>
                              )}
                            </td>

                            {/* ONU ID */}
                            <td className="py-3 px-4 font-mono font-bold text-white">
                              {item.onuId}
                            </td>

                            {/* Port */}
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {item.port}
                            </td>

                            {/* MAC */}
                            <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                              {item.mac || '-'}
                            </td>

                            {/* RX Power */}
                            <td className="py-3 px-4 font-mono">
                              <span
                                className={`font-bold px-2 py-0.5 rounded ${
                                  isHighLoss
                                    ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                                    : isWarn
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {item.rxPower.toFixed(2)} dBm
                              </span>
                            </td>

                            {/* TX Power */}
                            <td className="py-3 px-4 font-mono text-slate-400">
                              {item.txPower ? `${item.txPower} dBm` : '-'}
                            </td>

                            {/* Distance */}
                            <td className="py-3 px-4 font-mono text-slate-400">
                              {item.distance ? `${item.distance} m` : '-'}
                            </td>

                            {/* Description */}
                            <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                              {item.description || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Summary Footer */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>মোট দেখানো হচ্ছে: {filteredItems.length} টি ONU</span>
                <span>থ্রেশহোল্ড: ≥ {reportThreshold} dBm খারাপ সিগন্যাল</span>
              </div>
            </div>
          </div>
        ) : !loading && reports.length === 0 ? (
          /* Empty State when no reports yet */
          <div className="bg-[#0f172a] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">এখনও কোনো রিপোর্ট তৈরি করা হয়নি</h3>
              <p className="text-xs text-slate-400 mt-1">
                উপরে আপনার OLT টার্মিনাল ডাটা পেস্ট করুন অথবা <strong>"ডেমো ডাটা দেখুন"</strong> বাটনে ক্লিক করে এক ক্লিকে টেস্ট রিপোর্ট তৈরি করুন।
              </p>
            </div>
            <button
              onClick={loadDemoData}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/25"
            >
              ডেমো ডাটা দিয়ে টেস্ট করুন
            </button>
          </div>
        ) : null}
      </main>

      {/* Delete All Data Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">সব ডাটা একবারে ডিলিট করবেন?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                আপনার ডাটাবেসে সংরক্ষিত <strong>সকল তৈরি করা রিপোর্ট এবং ONU ডাটা</strong> একবারে স্থায়ীভাবে মুছে যাবে। এটি আর ফিরিয়ে আনা সম্ভব নয়।
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition"
              >
                হ্যাঁ, একবারে সব ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Report Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">এই রিপোর্টটি ডিলিট করবেন?</h3>
              <p className="text-xs text-slate-400 mt-1 truncate">
                "{reportToDelete.title}"
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteSingleReport}
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
