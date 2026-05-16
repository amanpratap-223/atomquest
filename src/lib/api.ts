/// <reference types="vite/client" />

/**
 * Central Axios API Client
 * All API calls go through this. JWT is attached automatically.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 2000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT token to every request ───────────────────────────────────────
api.interceptors.request.use((config) => {
  // Read token from the persisted Zustand store in localStorage
  try {
    const raw = localStorage.getItem('atomquest-auth-v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) { /* ignore parse errors */ }
  return config;
});

// ── Global error handler ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired — clear auth and redirect to login
      localStorage.removeItem('atomquest-auth-v2');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
