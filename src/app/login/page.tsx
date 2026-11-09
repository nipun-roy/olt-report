'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signUp, useSession, signOut } from '@/lib/auth-client';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
  MessageSquare,
  LogOut,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Quick fill test admin credentials
  const handleFillDemo = () => {
    setName('OneSky Admin');
    setEmail('admin@onesky.net');
    setPassword('admin123456');
    setConfirmPassword('admin123456');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('দয়া করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('দয়া করে আপনার নাম প্রদান করুন।');
        return;
      }
      if (password.length < 6) {
        setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
        return;
      }
      if (password !== confirmPassword) {
        setError('পাসওয়ার্ড দুটি মেলেনি (Passwords do not match)।');
        return;
      }
    }

    try {
      setLoading(true);

      if (mode === 'signin') {
        const res = await signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });

        if (res.error) {
          setError(res.error.message || 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
          return;
        }

        setSuccess('লগইন সফল হয়েছে! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...');
        setTimeout(() => {
          router.push('/sms');
          router.refresh();
        }, 800);
      } else {
        const res = await signUp.email({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });

        if (res.error) {
          setError(res.error.message || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি। এই ইমেইলটি আগে থেকে ব্যবহৃত হতে পারে।');
          return;
        }

        setSuccess('একাউন্ট তৈরি সফল হয়েছে এবং লগইন সম্পন্ন হয়েছে!');
        setTimeout(() => {
          router.push('/sms');
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'সার্ভার কানেকশন ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in
  if (!sessionLoading && session?.user) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">আপনি ইতোমধ্যে লগইন আছেন</h2>
            <p className="text-sm text-slate-400 mt-1">
              স্বাগতম, <strong className="text-indigo-400">{session.user.name}</strong> ({session.user.email})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition border border-slate-700"
            >
              <Zap className="w-4 h-4 text-sky-400" />
              <span>OLT Report</span>
            </Link>
            <Link
              href="/sms"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <MessageSquare className="w-4 h-4" />
              <span>SMS Manager</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={async () => {
                await signOut();
                router.refresh();
              }}
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 mx-auto transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট করুন (Sign Out)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Better Auth Secured • OneSky OLT Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {mode === 'signin' ? 'সিস্টেমে সাইন-ইন করুন' : 'নতুন এডমিন একাউন্ট খুলুন'}
          </h1>
          <p className="text-xs text-slate-400">
            OLT অপটিক্যাল ম্যানেজমেন্ট ও SMS টেমপ্লেট ডাটাবেজের নিরাপদ এক্সেস
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Signin / Signup Switcher */}
          <div className="flex items-center p-1 bg-[#090d16] rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition text-center ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔐 সাইন-ইন (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition text-center ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✨ নতুন একাউন্ট (Sign Up)
            </button>
          </div>

          {/* Error / Success Alerts */}
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  আপনার নাম (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: Nipun Roy"
                    className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ইমেইল এড্রেস (Email Address) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@onesky.net"
                  className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  পাসওয়ার্ড (Password) *
                </label>
                {mode === 'signup' && (
                  <span className="text-[10px] text-slate-500 font-mono">কমপক্ষে ৬ অক্ষর</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-xl disabled:opacity-50 ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>অপেক্ষা করুন...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'লগইন করুন' : 'একাউন্ট তৈরি ও লগইন করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill & Skip Links */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>ডেমো অ্যাডমিন বসান</span>
            </button>

            <Link
              href="/sms"
              className="text-slate-400 hover:text-white text-[11px] font-medium transition"
            >
              পরে লগইন করব →
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          OneSky Broadband Network Operations • Secured by Better Auth
        </p>
      </div>
    </div>
  );
}
