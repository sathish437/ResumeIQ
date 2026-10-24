import type { AuthResponse } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const AUTH_TOKEN_KEY = 'resumeiq_auth_token';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore local storage errors
  }
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authenticates with the backend by sending a verified Google ID token.
 */
export async function authenticateWithGoogle(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ credential }),
  });

  const data: AuthResponse = await res.json();
  if (res.ok && data.authenticated && data.token) {
    setStoredAuthToken(data.token);
  }

  return data;
}

let currentSessionPromise: Promise<AuthResponse> | null = null;

/**
 * Validates current session and retrieves the authenticated user's profile.
 * Deduplicates concurrent in-flight calls to prevent React StrictMode from firing duplicate requests.
 */
export function fetchCurrentUser(): Promise<AuthResponse> {
  if (currentSessionPromise) {
    return currentSessionPromise;
  }

  currentSessionPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 401) {
        setStoredAuthToken(null);
        return {
          authenticated: false,
          message: 'No active session',
        };
      }

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const msg =
          errorBody?.message || `Authentication service error (${res.status} ${res.statusText})`;
        throw new Error(msg);
      }

      const data: AuthResponse = await res.json();
      if (data.token) {
        setStoredAuthToken(data.token);
      }
      return data;
    } finally {
      setTimeout(() => {
        currentSessionPromise = null;
      }, 300);
    }
  })();

  return currentSessionPromise;
}

/**
 * Signs the user out from backend session and clears local storage.
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch {
    // ignore network errors on logout
  } finally {
    setStoredAuthToken(null);
  }
}
