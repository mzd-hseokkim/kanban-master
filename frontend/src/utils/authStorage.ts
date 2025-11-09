const ACCESS_TOKEN_KEY = 'kanban.accessToken';
const REFRESH_TOKEN_KEY = 'kanban.refreshToken';

export const authStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  setAccessToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  setRefreshToken(token: string) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  // 하위호환성을 위해 getToken도 유지
  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
};

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
