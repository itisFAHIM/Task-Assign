"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { Loader2, UserPlus } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [error, setError]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── Client-side validation ───────────────────────────────────────
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPwd) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Register
      await api.post('auth/register/', { email, password });

      // 2. Auto-login after successful registration
      const loginRes = await api.post('auth/login/', { email, password });
      login(loginRes.data.access, loginRes.data.refresh);
      router.push('/tasks');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) {
        // DRF returns errors like { email: ["..."], password: ["..."] }
        const messages = Object.values(data).flat().join(' ');
        setError(messages || 'Registration failed. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10 pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <UserPlus size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-zinc-400 text-sm">Join the platform and start working.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
              placeholder="Min 6 characters"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
