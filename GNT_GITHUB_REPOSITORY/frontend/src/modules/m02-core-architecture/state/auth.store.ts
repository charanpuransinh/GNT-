import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '../services/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  isSessionLocked: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  activeRoleId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  error: string | null;

  setUser: (user: UserProfile) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setActiveRole: (roleId: string) => void;
  lockSession: () => void;
  unlockSession: () => void;
  logout: () => void;
  setError: (error: string) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isSessionLocked: false,
      isLoading: false,
      user: null,
      activeRoleId: null,
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }),

      setTokens: (accessToken, refreshToken) => {
        // Decode JWT to get expiry (simplified)
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        set({
          accessToken,
          refreshToken,
          accessTokenExpiresAt: new Date(payload.exp * 1000).toISOString(),
        });
      },

      setActiveRole: (roleId) => set({ activeRoleId: roleId }),

      lockSession: () => set({ isSessionLocked: true }),

      unlockSession: () => set({ isSessionLocked: false }),

      logout: () =>
        set({
          isAuthenticated: false,
          isSessionLocked: false,
          user: null,
          activeRoleId: null,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          error: null,
        }),

      setError: (error) => set({ error, isLoading: false }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'gnt-auth-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        activeRoleId: state.activeRoleId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
      }),
    }
  )
);
