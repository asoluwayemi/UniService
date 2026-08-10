import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken } from './tokenStore';

const defaultApiUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:8080';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? defaultApiUrl;

export const httpClient = axios.create({
  baseURL,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<{ accessToken: string }>(
    `${baseURL}/api/auth/token/refresh`,
    {},
    { withCredentials: true },
  );
  setAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const url = originalRequest?.url ?? '';
    const isRefreshCall = url.includes('/api/auth/token/refresh');
    const isLoginCall = url.includes('/api/auth/login');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall &&
      !isLoginCall
    ) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        await refreshPromise;
        refreshPromise = null;
        // The request interceptor re-attaches the just-refreshed token from tokenStore.
        return httpClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
