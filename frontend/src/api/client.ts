import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ErrorResponse } from './types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
});

let onAuthChange: (() => void)[] = [];
export const subscribeAuthChange = (cb: () => void) => {
  onAuthChange.push(cb);
  return () => {
    onAuthChange = onAuthChange.filter((c) => c !== cb);
  };
};

export const notifyAuthChange = () => onAuthChange.forEach((cb) => cb());

const getStoredToken = () => localStorage.getItem('token');
const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  undefined
);

let isRefreshing = false;
let pendingRequests: ((token: string | null) => void)[] = [];

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const { config, response } = error;

    if (response?.status === 401 && !(config as any)?.__isRetry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (newToken && config) {
              resolve(api(config));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      setStoredToken(null);
      notifyAuthChange();
      pendingRequests.forEach((resolve) => resolve(null));
      pendingRequests = [];
      isRefreshing = false;

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export const authStorage = {
  getToken: getStoredToken,
  setToken: setStoredToken,
};

export default api;
