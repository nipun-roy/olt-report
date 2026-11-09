'use client';

import { UploadCloud, Database } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-14 border-b border-[#1e293b] bg-[#0c1222]/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>Connected:</span>
          <span className="text-emerald-400 font-bold font-mono">Turso Cloud DB</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-mono">OLT Log Optical Analyzer</span>
      </div>
    </header>
  );
}
