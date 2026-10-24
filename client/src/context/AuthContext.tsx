import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile } from '../types/auth';
import {
  authenticateWithGoogle,
  fetchCurrentUser,
  logout as logoutApi,
  setStoredAuthToken,
} from '../api/authApi';
import { disableGoogleAutoSelect } from '../services/googleIdentityService';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize and check current user session on load
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const response = await fetchCurrentUser();
        if (isMounted) {
          if (response.authenticated && response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          console.warn('Initial session check failed:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithGoogleCredential = useCallback(async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await authenticateWithGoogle(credential);

      if (response.authenticated && response.user) {
        // Confirm server-side session persistence via /api/auth/me
        try {
          const profileCheck = await fetchCurrentUser();
          if (profileCheck.authenticated && profileCheck.user) {
            setUser(profileCheck.user);
          } else {
            setUser(response.user);
          }
        } catch {
          setUser(response.user);
        }
        setIsAuthenticated(true);
        setAuthError(null);
        return true;
      } else {
        const errMsg = response.message || 'Google authentication failed. Please check your account and try again.';
        setAuthError(errMsg);
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unable to connect to the authentication service. Please try again.';
      setAuthError(errMsg);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      disableGoogleAutoSelect();
      setUser(null);
      setIsAuthenticated(false);
      setStoredAuthToken(null);
      setAuthError(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      authError,
      loginWithGoogleCredential,
      logout,
      clearError,
    }),
    [user, isAuthenticated, isLoading, authError, loginWithGoogleCredential, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
