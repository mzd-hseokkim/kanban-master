import axios, { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig } from 'axios';
import { authStorage } from '@/utils/authStorage';
import type { TokenRefreshResponse } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

interface RetriableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

const notifySubscribers = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string> => {
  try {
    console.debug('[Axios] Attempting to refresh access token...');
    const response = await refreshClient.post<TokenRefreshResponse>('/auth/refresh');
    const newToken = response.data.accessToken;
    console.debug('[Axios] Access token refreshed successfully, new token length:', newToken.length);
    authStorage.setToken(newToken);
    return newToken;
  } catch (error) {
    console.error('[Axios] Token refresh failed:', error);
    throw error;
  }
};

const applyAuthHeader = (
  headers: RetriableRequestConfig['headers'],
  token: string
): AxiosHeaders => {
  const normalizedHeaders = headers instanceof AxiosHeaders
    ? headers
    : AxiosHeaders.from((headers ?? {}) as Record<string, string>);
  normalizedHeaders.set('Authorization', `Bearer ${token}`);
  return normalizedHeaders;
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers = applyAuthHeader(config.headers, token);
      console.debug(`[Axios Request] ${config.method?.toUpperCase()} ${config.url} - Token attached`);
    } else {
      console.debug(`[Axios Request] ${config.method?.toUpperCase()} ${config.url} - No token`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh');

    console.debug(`[Axios Response Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - Status: ${status}, isAuthEndpoint: ${isAuthEndpoint}, isRefreshEndpoint: ${isRefreshEndpoint}`);

    // 401 Unauthorized - Try to refresh token (except for login/logout/signup endpoints)
    const isLoginEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/signup') || originalRequest?.url?.includes('/auth/logout');
    if (status === 401 && originalRequest && !originalRequest._retry && !isLoginEndpoint) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          notifySubscribers(newToken);
          originalRequest.headers = applyAuthHeader(originalRequest.headers, newToken);
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('[Axios] Token refresh failed, clearing token and redirecting to login');
          notifySubscribers(null);
          authStorage.clearToken();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) {
            console.error('[Axios] No token after refresh, redirecting to login');
            authStorage.clearToken();
            window.location.href = '/login';
            reject(error);
            return;
          }
          originalRequest.headers = applyAuthHeader(originalRequest.headers, token);
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    // 401 on login/logout/signup endpoints - Force logout
    if (status === 401 && isLoginEndpoint) {
      console.warn('[Axios] 401 on login/logout endpoint, clearing token and redirecting to login');
      authStorage.clearToken();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 401 on refresh endpoint after retry - Token is invalid, force logout
    if (status === 401 && isRefreshEndpoint && originalRequest && originalRequest._retry) {
      console.warn('[Axios] 401 on refresh endpoint after retry, clearing token and redirecting to login');
      authStorage.clearToken();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 403 Forbidden - Access denied
    if (status === 403) {
      console.warn('Access forbidden');
      return Promise.reject(error);
    }

    // 404 Not Found - Pass to caller
    if (status === 404) {
      console.warn('Resource not found');
      return Promise.reject(error);
    }

    // 4xx Client Errors (except 401, 403, 404) - Pass to caller for proper error handling
    if (status && status >= 400 && status < 500) {
      console.warn(`Client error: ${status}`, error.message);
      return Promise.reject(error);
    }

    // 5xx Server Errors - Pass to caller for proper error handling
    // Do NOT force logout on server errors
    if (status && status >= 500) {
      console.error('Server error:', status, error.message);
      return Promise.reject(error);
    }

    // Network errors - Pass to caller
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(error);
    }

    // All other errors - Pass to caller
    return Promise.reject(error);
  }
);

export default axiosInstance;
