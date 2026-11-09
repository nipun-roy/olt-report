'use client';

import { useSession, signOut } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function AuthStatus() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  if (isPending) {
    return (
      <div className="h-8 w-24 bg-slate-800/60 animate-pulse rounded-xl" />
    );
  }

  if (session?.user) {
    const userInitial = session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U';
    return (
      <div className="flex items-center gap-2 bg-[#090d16] border border-slate-800 p-1 pl-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow">
            {userInitial}
          </div>
          <div className="hidden sm:block text-left truncate max-w-[120px]">
            <p className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1">
              <span>{session.user.name}</span>
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-none">
              {session.user.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={loggingOut}
          className="p-1.5 px-2.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20 flex items-center gap-1"
          title="লগআউট করুন"
        >
          {loggingOut ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span className="hidden md:inline">লগআউট</span>
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/40 transition shadow-sm"
      title="লগইন বা একাউন্ট তৈরি করুন"
    >
      <LogIn className="w-3.5 h-3.5 text-indigo-400" />
      <span>লগইন করুন</span>
    </Link>
  );
}
