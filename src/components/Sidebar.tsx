'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Radio,
  UploadCloud,
  Trash2,
  Zap,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Optical dB Report', href: '/', icon: FileText, highlight: true },
    { label: 'Quick SMS Assistant', href: '/sms', icon: MessageSquare },
    { label: 'কাজের নোট / Tasks', href: '/notes', icon: ClipboardList },
    { label: 'Import / Paste Log', href: '/import', icon: UploadCloud },
  ];

  return (
    <aside className="w-56 border-r border-[#1e293b] bg-[#0c1222] min-h-screen flex flex-col flex-shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1e293b] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 font-black">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-xs tracking-wide text-white uppercase">OneSky OLT</h1>
          <p className="text-[10px] text-sky-400 font-medium">dB Report Generator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-bold border border-red-500/30 font-mono">
                  &gt;24dB
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Turso Cloud Status */}
      <div className="p-3 border-t border-[#1e293b]">
        <div className="bg-[#131b2e] border border-[#1e293b] rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Turso Cloud</span>
            <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">nipun-roy-nipun.aws</p>
        </div>
      </div>
    </aside>
  );
}
