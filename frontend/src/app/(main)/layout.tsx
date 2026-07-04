"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navigation from '@/components/Navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
    if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      router.push('/login');
    }
  }, [isAuthenticated, checkAuth, router]);

  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('access_token')) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex pl-20">
      <Navigation />
      <main className="flex-1 w-full max-w-[100vw-5rem] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
