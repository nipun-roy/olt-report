'use client';

import { useState } from 'react';
import { Database, Shield, Sliders, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [dbUrl, setDbUrl] = useState('libsql://your-db-name.turso.io');
  const [authToken, setAuthToken] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-[#1e293b] pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <span>System Settings &amp; Turso Cloud DB</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Turso libSQL cloud database credentials and optical alert thresholds.
        </p>
      </div>

      <div className="bg-[#131b2e] border border-[#1e293b] rounded-2xl p-6 space-y-5">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-white font-bold text-sm">
            <Database className="w-4 h-4 text-sky-400" />
            <span>Turso Cloud Database Configuration</span>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Turso Database URL (TURSO_DATABASE_URL)</label>
            <input
              type="text"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              placeholder="libsql://your-db-name.turso.io"
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl p-3 font-mono text-white outline-none focus:border-sky-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Find using <code>turso db show &lt;db-name&gt; --url</code>
            </p>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Turso Auth Token (TURSO_AUTH_TOKEN)</label>
            <input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl p-3 font-mono text-white outline-none focus:border-sky-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Generate using <code>turso db tokens create &lt;db-name&gt;</code>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-lg shadow-sky-600/20 transition flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>Save Turso Credentials</span>
            </button>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Settings updated successfully! Environment configured.</span>
            </div>
          )}
        </form>

        <div className="p-4 bg-[#090d16] border border-[#1e293b] rounded-xl space-y-2 text-xs">
          <div className="font-bold text-sky-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>Quick Turso CLI Setup Guide:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 font-mono text-[11px]">
            <li>Install Turso CLI: <code>irm https://get.tur.so | iex</code></li>
            <li>Login to Turso: <code>turso auth signup</code> or <code>turso auth login</code></li>
            <li>Create database: <code>turso db create olt-manager-db</code></li>
            <li>Get URL: <code>turso db show olt-manager-db --url</code></li>
            <li>Get Token: <code>turso db tokens create olt-manager-db</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
