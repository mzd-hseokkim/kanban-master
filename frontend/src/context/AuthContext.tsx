import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import type { LoginRequest, UserProfile } from '@/types/auth';
import { authStorage } from '@/utils/authStorage';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => void;
  removeAvatar: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 페이지 로드 시 localStorage에서 토큰이 있는지 즉시 확인
  const initialToken = authStorage.getToken();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!!initialToken); // 토큰이 있으면 로딩 상태로 시작
  const [bootstrapped, setBootstrapped] = useState(!initialToken); // 토큰이 없으면 이미 bootstrapped

  // Storage 변화 감지하여 자동으로 bootstrap
  useEffect(() => {
    const handleStorageChange = () => {
      const token = authStorage.getToken();
      console.debug('[AuthContext] Storage changed. Token exists:', !!token);
      if (token && !user) {
        // 토큰이 새로 저장되었는데 user가 없으면 profile fetch
        setBootstrapped(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Bootstrap: 초기 로드 또는 토큰이 복구되었을 때
  useEffect(() => {
    const bootstrap = async () => {
      if (bootstrapped) {
        console.debug('[AuthContext] Already bootstrapped, skipping');
        return;
      }

      const token = authStorage.getToken();
      console.debug('[AuthContext] Bootstrap started. Token exists:', !!token);

      if (!token) {
        console.debug('[AuthContext] No token found, skipping profile fetch');
        setLoading(false);
        setBootstrapped(true);
        return;
      }

      try {
        console.debug('[AuthContext] Fetching user profile with token:', token.substring(0, 20) + '...');
        const profile = await authService.fetchProfile();
        console.debug('[AuthContext] Profile fetched successfully:', profile.email);
        setUser(profile);
        setBootstrapped(true);
      } catch (error) {
        // axios interceptor will handle 401 errors via /auth/refresh
        // If refresh fails, interceptor will clear token and redirect to login
        console.error('[AuthContext] Failed to fetch profile:', error);
        setBootstrapped(true);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [bootstrapped]);

  const login = useCallback(async (payload: LoginRequest) => {
    console.log('🔑 [AuthContext.login] Starting login...');
    const result = await authService.login(payload);
    console.log('💾 [AuthContext.login] Saving token to localStorage');
    authStorage.setToken(result.accessToken);
    console.log('✔️ [AuthContext.login] Token saved. Token in storage:', authStorage.getToken()?.substring(0, 20) + '...');
    setUser(result.user);
    console.log('✔️ [AuthContext.login] User set:', result.user.email);
  }, []);

  const logout = useCallback(async () => {
    console.log('🚪 [AuthContext.logout] Starting logout...');
    try {
      await authService.logout();
      console.log('✔️ [AuthContext.logout] Server logout successful');
    } catch (err) {
      console.error('⚠️ [AuthContext.logout] Server logout failed (continuing with local logout):', err);
    } finally {
      authStorage.clearToken();
      console.log('✔️ [AuthContext.logout] Token cleared. Token in storage:', authStorage.getToken());
      setUser(null);
      setBootstrapped(false);
      console.log('✔️ [AuthContext.logout] User cleared and bootstrap reset');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await authService.fetchProfile();
    setUser(profile);
  }, []);

  const updateAvatar = useCallback((avatarUrl: string) => {
    setUser(prev => prev ? { ...prev, avatarUrl } : null);
  }, []);

  const removeAvatar = useCallback(() => {
    setUser(prev => prev ? { ...prev, avatarUrl: null } : null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    logout,
    refreshProfile,
    updateAvatar,
    removeAvatar,
  }), [user, loading, login, logout, refreshProfile, updateAvatar, removeAvatar]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
