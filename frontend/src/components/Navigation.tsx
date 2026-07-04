"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { KanbanSquare, PenTool, LogOut } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 h-full w-20 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-8 z-50">
      <div className="flex-1 flex flex-col gap-6">
        <Link href="/tasks" className={`p-3 rounded-xl transition-all ${pathname === '/tasks' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}>
          <KanbanSquare size={24} />
        </Link>
        <Link href="/annotate" className={`p-3 rounded-xl transition-all ${pathname === '/annotate' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}>
          <PenTool size={24} />
        </Link>
      </div>
      <button onClick={handleLogout} className="p-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
        <LogOut size={24} />
      </button>
    </nav>
  );
}
