import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  login: (access, refresh) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
    set({ isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    set({ isAuthenticated: false });
  },
  checkAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      set({ isAuthenticated: !!token });
    }
  },
}));
