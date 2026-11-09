'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Phone, MapPin, Radio, ShieldCheck } from 'lucide-react';

const initialCustomers = [
  { id: 'c1', name: 'Bashir Ahmed', pppoeUsername: 'bashir_01', phone: '01711-223344', address: 'House 12, Road 4, Sector 7', zone: 'Uttara', package: '20 Mbps', status: 'ACTIVE', onuId: 'EPON0/1:1' },
  { id: 'c2', name: 'Kamal Hossain', pppoeUsername: 'kamal_net', phone: '01811-334455', address: 'Plot 45, Block C', zone: 'Mirpur', package: '30 Mbps', status: 'ACTIVE', onuId: 'EPON0/1:2' },
  { id: 'c3', name: 'Sultana Begum', pppoeUsername: 'sultana_20', phone: '01911-556677', address: 'Flat 4B, Green Road', zone: 'Dhanmondi', package: '25 Mbps', status: 'ACTIVE', onuId: 'EPON0/1:7' },
];

export default function CustomersPage() {
  const [customersList, setCustomersList] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch('/api/customers');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setCustomersList(json.data);
        }
      } catch (e) {
        // Fallback
      }
    }
    fetchCustomers();
  }, []);

  const filtered = customersList.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.pppoeUsername && c.pppoeUsername.toLowerCase().includes(q)) ||
      (c.onuId && c.onuId.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <span>Customer &amp; PPPoE Inventory</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
              {customersList.length} Users
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Map broadband subscribers to their corresponding ONU IDs and live optical status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#131b2e] border border-[#1e293b] px-3 py-1.5 rounded-xl">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, PPPoE, ONU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-56"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1e293b]">
            <tr>
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">PPPoE Username</th>
              <th className="p-3.5">ONU ID Mapping</th>
              <th className="p-3.5">Phone Number</th>
              <th className="p-3.5">Package &amp; Zone</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">{c.name}</td>
                <td className="p-3.5 font-mono text-sky-400">{c.pppoeUsername || '-'}</td>
                <td className="p-3.5 font-mono font-bold text-slate-200">
                  {c.onuId ? (
                    <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {c.onuId}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Not Linked</span>
                  )}
                </td>
                <td className="p-3.5 text-slate-300 font-mono">{c.phone || '-'}</td>
                <td className="p-3.5 text-slate-400">
                  <span className="font-semibold text-slate-200">{c.package}</span>
                  {c.zone && <span className="ml-1.5 text-[10px] text-slate-500">({c.zone})</span>}
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add New Customer</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const newC = {
                  id: `c_${Date.now()}`,
                  name: form.name.value,
                  pppoeUsername: form.pppoe.value,
                  phone: form.phone.value,
                  onuId: form.onuId.value,
                  package: form.package.value,
                  zone: form.zone.value,
                  address: form.address.value,
                  status: 'ACTIVE',
                };
                setCustomersList((prev) => [newC, ...prev]);
                setShowAddModal(false);
                await fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newC),
                });
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Customer Name *</label>
                  <input required name="name" className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">PPPoE Username</label>
                  <input name="pppoe" className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">ONU ID (e.g. EPON0/1:7)</label>
                  <input name="onuId" className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Mobile Phone</label>
                  <input name="phone" className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Package</label>
                  <input name="package" defaultValue="20 Mbps" className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Zone / Area</label>
                  <input name="zone" defaultValue="Sector 1" className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Address</label>
                <input name="address" className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-sky-600 text-white font-semibold text-xs">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
