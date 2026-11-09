'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Download,
  Share2,
  Search,
  Filter,
  CheckCircle2,
  Radio,
  UserPlus,
  Copy,
  Check,
} from 'lucide-react';

// Fallback initial dataset from demo.txt so page is populated instantly
const initialDemoData = [
  { onuId: 'EPON0/1:27', port: 'EPON0/1', mac: 'C4:CD:50:5C:F7:7B', rxPower: -30.97, txPower: '1.97', distance: '1934', temp: '33.69', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:8', port: 'EPON0/2', mac: 'A0:7F:04:17:DF:CE', rxPower: -30.00, txPower: '2.67', distance: '4755', temp: '48.16', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:30', port: 'EPON0/2', mac: 'A0:7D:04:06:6B:C8', rxPower: -29.59, txPower: '2.51', distance: '4346', temp: '43.63', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/1:7', port: 'EPON0/1', mac: 'D0:5F:AF:A9:A3:77', rxPower: -29.21, txPower: '1.84', distance: '2900', temp: '35.39', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:58', port: 'EPON0/2', mac: 'A2:3D:09:04:5D:D0', rxPower: -29.21, txPower: '2.02', distance: '3244', temp: '48.00', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/1:13', port: 'EPON0/1', mac: 'A0:7E:09:06:B6:80', rxPower: -27.96, txPower: '2.74', distance: '1339', temp: '45.95', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/1:10', port: 'EPON0/1', mac: '4C:AE:1C:23:00:30', rxPower: -27.45, txPower: '2.31', distance: '1403', temp: '46.00', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:50', port: 'EPON0/2', mac: '4C:AE:1C:77:A1:00', rxPower: -26.58, txPower: '2.11', distance: '3975', temp: '43.00', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:10', port: 'EPON0/2', mac: 'C8:3A:35:78:EE:70', rxPower: -26.20, txPower: '1.84', distance: '3321', temp: '45.87', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:15', port: 'EPON0/2', mac: 'A2:4F:08:11:82:20', rxPower: -25.53, txPower: '2.32', distance: '3277', temp: '48.00', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/1:34', port: 'EPON0/1', mac: '00:D3:9E:6A:8F:9C', rxPower: -25.23, txPower: '2.25', distance: '3157', temp: '44.00', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:61', port: 'EPON0/2', mac: '38:D4:A5:83:0A:EF', rxPower: -24.81, txPower: '2.03', distance: '2236', temp: '37.00', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:3', port: 'EPON0/2', mac: 'A0:7C:11:13:0D:42', rxPower: -24.81, txPower: '2.16', distance: '5070', temp: '51.64', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/2:45', port: 'EPON0/2', mac: '4C:AE:1C:77:F9:40', rxPower: -24.44, txPower: '2.29', distance: '3964', temp: '36.00', customerName: '', pppoeUsername: '', customerPhone: '' },
  // Normal/Warning samples
  { onuId: 'EPON0/1:1', port: 'EPON0/1', mac: '00:D3:9E:20:2D:4E', rxPower: -17.21, txPower: '1.52', distance: '1636', temp: '48.75', customerName: 'Bashir Ahmed', pppoeUsername: 'bashir_01', customerPhone: '01711000000' },
  { onuId: 'EPON0/1:2', port: 'EPON0/1', mac: 'A0:7E:09:26:5F:D0', rxPower: -9.41, txPower: '2.19', distance: '1423', temp: '41.00', customerName: 'Kamal Hossain', pppoeUsername: 'kamal_net', customerPhone: '01811000000' },
  { onuId: 'EPON0/1:9', port: 'EPON0/1', mac: 'F4:B8:C3:07:E6:85', rxPower: -22.08, txPower: '1.98', distance: '2577', temp: '48.55', customerName: '', pppoeUsername: '', customerPhone: '' },
  { onuId: 'EPON0/3:5', port: 'EPON0/3', mac: '10:AF:78:F1:90:99', rxPower: -18.66, txPower: '2.43', distance: '2060', temp: '50.77', customerName: '', pppoeUsername: '', customerPhone: '' },
];

export default function OnuInspectorPage() {
  const [onusList, setOnusList] = useState<any[]>(initialDemoData);
  const [threshold, setThreshold] = useState<number>(24.0);
  const [activeTab, setActiveTab] = useState<'critical' | 'warning' | 'optimal' | 'all'>('critical');
  const [selectedPort, setSelectedPort] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [modalCustomer, setModalCustomer] = useState<any>(null);

  useEffect(() => {
    async function fetchOnus() {
      try {
        const res = await fetch('/api/onus');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setOnusList(json.data);
        }
      } catch (err) {
        // Keeps fallback demo data
      }
    }
    fetchOnus();
  }, []);

  // Filtered List
  const filtered = onusList.filter((item) => {
    const abs = Math.abs(parseFloat(item.rxPower) || 0);

    // Tab check
    if (activeTab === 'critical' && abs < threshold) return false;
    if (activeTab === 'warning' && (abs < 21.0 || abs >= threshold)) return false;
    if (activeTab === 'optimal' && abs >= 21.0) return false;

    // Port check
    if (selectedPort !== 'ALL' && item.port !== selectedPort) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = `${item.onuId} ${item.mac} ${item.port} ${item.customerName || ''} ${item.pppoeUsername || ''}`.toLowerCase();
      if (!match.includes(q)) return false;
    }

    return true;
  });

  // Sort: Worst loss first
  filtered.sort((a, b) => Math.abs(parseFloat(b.rxPower) || 0) - Math.abs(parseFloat(a.rxPower) || 0));

  // Counts
  let critCount = 0, warnCount = 0, optCount = 0;
  const portSet = new Set<string>();
  onusList.forEach((o) => {
    const abs = Math.abs(parseFloat(o.rxPower) || 0);
    if (abs >= threshold) critCount++;
    else if (abs >= 21.0) warnCount++;
    else optCount++;
    if (o.port) portSet.add(o.port);
  });

  // WhatsApp copy function
  const copyWhatsApp = () => {
    const highLossList = onusList.filter((o) => Math.abs(parseFloat(o.rxPower) || 0) >= threshold);
    const ports: Record<string, any[]> = {};
    highLossList.forEach((item) => {
      if (!ports[item.port]) ports[item.port] = [];
      ports[item.port].push(item);
    });

    let text = `🚨 *OLT HIGH dB ALERT REPORT (≥ ${threshold.toFixed(1)} dBm)*\n`;
    text += `📅 Date: ${new Date().toLocaleString()}\n`;
    text += `📊 Total High Loss ONUs: ${highLossList.length} / ${onusList.length}\n`;
    text += `──────────────────────\n`;

    Object.keys(ports).sort().forEach((p) => {
      text += `\n📍 *Port ${p}* (${ports[p].length} ONUs):\n`;
      ports[p].forEach((item) => {
        const user = item.customerName ? ` [${item.customerName}]` : '';
        text += `• ${item.onuId}${user} | RX: ${item.rxPower} dBm | MAC: ${item.mac} | Dist: ${item.distance}m\n`;
      });
    });

    text += `\n──────────────────────\n`;
    text += `⚡ Action: Check fiber patch cord, splice tray & optical splitter.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // CSV Export
  const exportCSV = () => {
    let csv = 'ONU ID,Port,MAC Address,RX Power (dBm),TX Power (dBm),Distance (m),Customer Name,PPPoE,Phone\n';
    filtered.forEach((item) => {
      csv += `"${item.onuId}","${item.port}","${item.mac}","${item.rxPower}","${item.txPower || ''}","${item.distance || ''}","${item.customerName || ''}","${item.pppoeUsername || ''}","${item.customerPhone || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OLT_ONU_Report_${activeTab}_${threshold}dB.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <span>ONU Optical Power &amp; High Loss Inspector</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
              {critCount} High dB ONUs
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolate and track users whose optical dB attenuation is above threshold (&gt; 24 dB)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied WhatsApp Text!' : 'Copy WhatsApp List'}</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Control & Filter Panel */}
      <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex bg-[#090d16] p-1 rounded-xl border border-[#1e293b] gap-1">
            <button
              onClick={() => setActiveTab('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'critical' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>High dB (&ge; {threshold} dB)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">{critCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('warning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'warning' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Warning (21-24)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">{warnCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('optimal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'optimal' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Healthy (&lt; 21)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">{optCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'all' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All ONUs</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">{onusList.length}</span>
            </button>
          </div>

          {/* Threshold & Search Inputs */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#090d16] border border-[#1e293b] px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-400 font-semibold">Threshold:</span>
              <input
                type="number"
                step="0.5"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 24.0)}
                className="w-14 bg-transparent border-none text-xs font-mono font-bold text-red-400 outline-none"
              />
              <span className="text-xs text-slate-400">dB</span>
            </div>

            <div className="flex items-center gap-2 bg-[#090d16] border border-[#1e293b] px-3 py-1.5 rounded-lg">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ONU, Port, MAC, User..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-48"
              />
            </div>
          </div>
        </div>

        {/* Port Chips Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-shrink-0">Port:</span>
          <button
            onClick={() => setSelectedPort('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex-shrink-0 transition ${
              selectedPort === 'ALL' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All Ports
          </button>
          {Array.from(portSet).sort().map((port) => (
            <button
              key={port}
              onClick={() => setSelectedPort(port)}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex-shrink-0 transition ${
                selectedPort === port ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {port}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1e293b]">
              <tr>
                <th className="p-3.5 font-bold">ONU ID</th>
                <th className="p-3.5 font-bold">Port</th>
                <th className="p-3.5 font-bold">MAC Address</th>
                <th className="p-3.5 font-bold">RX Power (dBm)</th>
                <th className="p-3.5 font-bold">TX Power</th>
                <th className="p-3.5 font-bold">Distance</th>
                <th className="p-3.5 font-bold">Customer / PPPoE</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No ONUs match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const abs = Math.abs(parseFloat(item.rxPower) || 0);
                  const isCrit = abs >= threshold;
                  const isWarn = abs >= 21.0 && abs < threshold;

                  return (
                    <tr key={item.onuId} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-sky-400">{item.onuId}</td>
                      <td className="p-3.5 text-slate-300 font-medium">{item.port}</td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">{item.mac}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold inline-block border ${
                            isCrit
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : isWarn
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          {item.rxPower} dBm
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">{item.txPower ? `${item.txPower} dBm` : '-'}</td>
                      <td className="p-3.5 font-mono text-slate-400">{item.distance ? `${item.distance} m` : '-'}</td>
                      <td className="p-3.5">
                        {item.customerName ? (
                          <div>
                            <div className="font-semibold text-white">{item.customerName}</div>
                            <div className="text-[10px] text-sky-400 font-mono">{item.pppoeUsername || item.customerPhone}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setModalCustomer(item)}
                            className="text-[11px] text-slate-500 hover:text-sky-400 flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>+ Map User</span>
                          </button>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isCrit ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                            🚨 CRITICAL LOSS
                          </span>
                        ) : isWarn ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            ⚠️ WARNING
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            ✅ OPTIMAL
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setModalCustomer(item)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                        >
                          Edit / Link
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Mapping Modal */}
      {modalCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Map Customer to {modalCustomer.onuId}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  id="modal-name"
                  defaultValue={modalCustomer.customerName || ''}
                  placeholder="e.g. Rahim Chowdhury"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">PPPoE Username</label>
                <input
                  type="text"
                  id="modal-pppoe"
                  defaultValue={modalCustomer.pppoeUsername || ''}
                  placeholder="e.g. rahim_net"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  id="modal-phone"
                  defaultValue={modalCustomer.customerPhone || ''}
                  placeholder="e.g. 01711XXXXXX"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModalCustomer(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById('modal-name') as HTMLInputElement)?.value;
                  const pppoe = (document.getElementById('modal-pppoe') as HTMLInputElement)?.value;
                  const phone = (document.getElementById('modal-phone') as HTMLInputElement)?.value;
                  
                  // Save to state
                  setOnusList((prev) =>
                    prev.map((o) =>
                      o.onuId === modalCustomer.onuId
                        ? { ...o, customerName: name, pppoeUsername: pppoe, customerPhone: phone }
                        : o
                    )
                  );
                  // Call API in background
                  fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name,
                      pppoeUsername: pppoe,
                      phone,
                      onuId: modalCustomer.onuId,
                      mac: modalCustomer.mac,
                    }),
                  });
                  setModalCustomer(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                Save Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
