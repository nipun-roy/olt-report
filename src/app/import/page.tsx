'use client';

import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
  const router = useRouter();
  const [brand, setBrand] = useState('AUTO');
  const [rawText, setRawText] = useState('');
  const [threshold, setThreshold] = useState(24.0);
  const [autoTickets, setAutoTickets] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const loadDemoText = async () => {
    // Standard BDCOM / demo.txt data
    const sample = `ONU ID	MAC Address	Description	Distance(m)	Temperature(°C)	Supply Voltage(V)	TX Bias Current(mA)	TX Power(dBm)	RX Power(dBm)
EPON0/1:1	00:D3:9E:20:2D:4E		1636	48.75	3.28	19.58	1.52	-17.21
EPON0/1:7	D0:5F:AF:A9:A3:77		2900	35.39	3.31	15.25	1.84	-29.21
EPON0/1:10	4C:AE:1C:23:00:30		1403	46.00	3.27	14.00	2.31	-27.45
EPON0/1:13	A0:7E:09:06:B6:80		1339	45.95	3.23	15.20	2.74	-27.96
EPON0/1:27	C4:CD:50:5C:F7:7B		1934	33.69	3.31	11.50	1.97	-30.97
EPON0/2:3	A0:7C:11:13:0D:42		5070	51.64	3.25	16.32	2.16	-24.81
EPON0/2:8	A0:7F:04:17:DF:CE		4755	48.16	3.21	16.95	2.67	-30.00
EPON0/2:10	C8:3A:35:78:EE:70		3321	45.87	3.29	18.71	1.84	-26.20
EPON0/2:15	A2:4F:08:11:82:20		3277	48.00	3.30	17.00	2.32	-25.53
EPON0/2:30	A0:7D:04:06:6B:C8		4346	43.63	3.22	13.00	2.51	-29.59
EPON0/2:45	4C:AE:1C:77:F9:40		3964	36.00	3.24	14.00	2.29	-24.44
EPON0/2:50	4C:AE:1C:77:A1:00		3975	43.00	3.34	15.00	2.11	-26.58
EPON0/2:58	A2:3D:09:04:5D:D0		3244	48.00	3.26	13.00	2.02	-29.21
EPON0/2:61	38:D4:A5:83:0A:EF		2236	37.00	3.30	18.00	2.03	-24.81`;
    setRawText(sample);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawText((ev.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleSync = async () => {
    if (!rawText.trim()) {
      alert('Please paste OLT CLI text or select a file first.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          brandHint: brand,
          threshold,
          autoCreateTickets: autoTickets,
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (json.success) {
        setResult(json);
      } else {
        alert(json.error || 'Sync failed');
      }
    } catch (e: any) {
      setLoading(false);
      alert('Network error during sync: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[#1e293b] pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <span>Multi-Brand OLT Log Importer</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            Turso Sync Engine
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Supports BDCOM, VSOL, Huawei, ZTE &amp; CDATA terminal output or tab-separated text/CSV files.
        </p>
      </div>

      <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6 space-y-5">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">OLT Brand / Vendor</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white outline-none focus:border-sky-500"
            >
              <option value="AUTO">✨ Auto Detect (Mixed Brands)</option>
              <option value="BDCOM">BDCOM (EPON/GPON)</option>
              <option value="VSOL">VSOL (V-Solution)</option>
              <option value="Huawei">Huawei (GPON / SmartAX)</option>
              <option value="ZTE">ZTE (C300/C320/C600)</option>
              <option value="CDATA">CDATA / Syrotech</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Critical Threshold (dB)</label>
            <div className="flex items-center gap-2 bg-[#090d16] border border-[#1e293b] rounded-xl px-3 py-2">
              <input
                type="number"
                step="0.5"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 24.0)}
                className="w-16 bg-transparent text-xs font-mono font-bold text-red-400 outline-none"
              />
              <span className="text-xs text-slate-500">dB (default 24.0)</span>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={loadDemoText}
              className="w-full p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              🔄 Load Sample demo.txt
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Paste CLI Diagnostic Output / Log Content
            </label>
            <label className="text-xs font-semibold text-sky-400 hover:underline cursor-pointer">
              <span>Or Choose File (.txt, .csv)</span>
              <input type="file" accept=".txt,.csv,.log" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your OLT terminal output here... (e.g. show epon optical-transceiver-diagnosis)"
            className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-sky-500 resize-y"
          ></textarea>
        </div>

        {/* Options & Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoTickets}
              onChange={(e) => setAutoTickets(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-sky-500"
            />
            <span>Auto-create Field Tickets for High dB (&gt; 24dB) ONUs</span>
          </label>

          <button
            onClick={handleSync}
            disabled={loading}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 transition flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{loading ? 'Parsing & Syncing...' : 'Parse & Sync to Turso DB'}</span>
          </button>
        </div>

        {/* Results Banner */}
        {result && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{result.message}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              <div className="p-2 bg-black/20 rounded">
                <div className="font-mono text-base font-bold text-white">{result.metrics.total}</div>
                <div className="text-[10px] text-slate-400">Total Parsed</div>
              </div>
              <div className="p-2 bg-black/20 rounded">
                <div className="font-mono text-base font-bold text-red-400">{result.metrics.critical}</div>
                <div className="text-[10px] text-red-300">High dB (&gt;24)</div>
              </div>
              <div className="p-2 bg-black/20 rounded">
                <div className="font-mono text-base font-bold text-amber-400">{result.metrics.warning}</div>
                <div className="text-[10px] text-amber-300">Warning</div>
              </div>
              <div className="p-2 bg-black/20 rounded">
                <div className="font-mono text-base font-bold text-emerald-400">{result.metrics.optimal}</div>
                <div className="text-[10px] text-emerald-300">Optimal</div>
              </div>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => router.push('/onus')}
                className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500"
              >
                Go to ONU Inspector &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
