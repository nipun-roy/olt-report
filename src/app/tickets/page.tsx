'use client';

import { useState, useEffect } from 'react';
import { Ticket, CheckCircle2, Clock, Wrench, AlertTriangle } from 'lucide-react';

const initialTickets = [
  { id: 't1', ticketNumber: 'TKT-1042', onuId: 'EPON0/1:27', port: 'EPON0/1', rxPower: -30.97, status: 'OPEN', priority: 'CRITICAL', assignedTo: 'Team Alpha', issueNote: 'Critical attenuation -30.97 dBm. Splicing inspection needed.', createdAt: '2026-11-08' },
  { id: 't2', ticketNumber: 'TKT-1043', onuId: 'EPON0/2:8', port: 'EPON0/2', rxPower: -30.00, status: 'IN_PROGRESS', priority: 'CRITICAL', assignedTo: 'Technician Shakil', issueNote: 'Fiber loss -30.00 dBm at 4755 meters distance.', createdAt: '2026-11-08' },
  { id: 't3', ticketNumber: 'TKT-1044', onuId: 'EPON0/1:7', port: 'EPON0/1', rxPower: -29.21, status: 'OPEN', priority: 'HIGH', assignedTo: 'Unassigned', issueNote: 'Rx power dropped to -29.21 dBm.', createdAt: '2026-11-08' },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState(initialTickets);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch('/api/tickets');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setTickets(json.data);
        }
      } catch (e) {
        // Fallback
      }
    }
    fetchTickets();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    try {
      await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1e293b] pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <span>Field Maintenance Tickets</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
              {tickets.filter((t) => t.status === 'OPEN').length} Open Tickets
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch field technicians to inspect high loss splitters, patch cords, and fiber splices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Open Tickets Column */}
        <div className="bg-[#131b2e] border border-red-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Pending Inspection</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-red-950 text-red-300">
              {tickets.filter((t) => t.status === 'OPEN').length}
            </span>
          </div>

          <div className="space-y-3">
            {tickets.filter((t) => t.status === 'OPEN').map((t) => (
              <div key={t.id} className="bg-[#090d16] border border-[#1e293b] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-400">{t.ticketNumber}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                    {t.rxPower} dBm
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-white">{t.onuId}</div>
                <p className="text-xs text-slate-400">{t.issueNote}</p>
                <div className="text-[10px] text-slate-500">Assigned: {t.assignedTo}</div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => updateStatus(t.id, 'IN_PROGRESS')}
                    className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded text-xs font-medium"
                  >
                    Mark In Progress &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-[#131b2e] border border-amber-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Field Tech Dispatched</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-950 text-amber-300">
              {tickets.filter((t) => t.status === 'IN_PROGRESS').length}
            </span>
          </div>

          <div className="space-y-3">
            {tickets.filter((t) => t.status === 'IN_PROGRESS').map((t) => (
              <div key={t.id} className="bg-[#090d16] border border-[#1e293b] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-400">{t.ticketNumber}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                    {t.rxPower} dBm
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-white">{t.onuId}</div>
                <p className="text-xs text-slate-400">{t.issueNote}</p>
                <div className="text-[10px] text-slate-400">Assigned: {t.assignedTo}</div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => updateStatus(t.id, 'RESOLVED')}
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs font-medium"
                  >
                    Mark Resolved ✅
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resolved Column */}
        <div className="bg-[#131b2e] border border-emerald-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Resolved Issues</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-950 text-emerald-300">
              {tickets.filter((t) => t.status === 'RESOLVED').length}
            </span>
          </div>

          <div className="space-y-3">
            {tickets.filter((t) => t.status === 'RESOLVED').length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No resolved tickets yet.</div>
            ) : (
              tickets.filter((t) => t.status === 'RESOLVED').map((t) => (
                <div key={t.id} className="bg-[#090d16] border border-[#1e293b] rounded-xl p-3.5 space-y-1.5 opacity-80">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400">{t.ticketNumber}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">RESOLVED</span>
                  </div>
                  <div className="font-mono text-xs text-white">{t.onuId}</div>
                  <p className="text-xs text-slate-400">{t.issueNote}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
