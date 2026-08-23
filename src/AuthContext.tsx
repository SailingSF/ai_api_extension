import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import type { Account } from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

export interface AuthContextValue {
  /** Live account from GET /api/me/, or null when signed out. */
  account: Account | null;
  isLoggedIn: boolean;
  isLoadingAccount: boolean;
  error: string | null;
  /** Re-read the balance. Call after anything that moves credits. */
  refresh: () => Promise<Account | null>;
  /** Record a successful login and pull the account down. */
  login: (token: string) => Promise<void>;
  logout: () => void;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMessage: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * One source of truth for "is this person signed in, and what is their balance".
 *
 * Before this existed, every component read `localStorage.getItem('token')` during
 * render. That is not reactive: logging in through the modal left the rest of the
 * page believing the user was still signed out until the next navigation. Anything
 * that shows auth state or a balance goes through this provider so a single login
 * updates all of it at once.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMessage, setAuthModalMessage] = useState<string>('');

  const clearSession = useCallback((): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('credits');
    setToken(null);
    setAccount(null);
    setError(null);
    setIsLoadingAccount(false);
  }, []);

  const fetchAccount = useCallback(async (): Promise<Account | null> => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setAccount(null);
      setIsLoadingAccount(false);
      return null;
    }
    if (!API_BASE_URL) {
      setError('Missing REACT_APP_API_BASE_URL');
      setIsLoadingAccount(false);
      return null;
    }

    try {
      const response = await axios.get<Account>(`${API_BASE_URL}/api/me/`, {
        headers: { Authorization: `Token ${currentToken}` },
      });
      setAccount(response.data);
      setError(null);
      // Keep the legacy localStorage copy in step for any older code reading it.
      localStorage.setItem('credits', String(response.data.credits));
      return response.data;
    } catch (err) {
      // A 401 means the stored token is dead. Drop it outright rather than leaving a
      // stale balance -- and a stale "logged in" navbar -- on screen.
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        clearSession();
      } else {
        setError('Could not load your account.');
      }
      return null;
    } finally {
      setIsLoadingAccount(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void fetchAccount();
  }, [fetchAccount, token]);

  const login = useCallback(
    async (newToken: string): Promise<void> => {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setIsLoadingAccount(true);
      await fetchAccount();
    },
    [fetchAccount]
  );

  const openAuthModal = useCallback((message: string = ''): void => {
    setAuthModalMessage(message);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback((): void => {
    setIsAuthModalOpen(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      isLoggedIn: !!token,
      isLoadingAccount,
      error,
      refresh: fetchAccount,
      login,
      logout: clearSession,
      openAuthModal,
      closeAuthModal,
      isAuthModalOpen,
      authModalMessage,
    }),
    [
      account,
      token,
      isLoadingAccount,
      error,
      fetchAccount,
      login,
      clearSession,
      openAuthModal,
      closeAuthModal,
      isAuthModalOpen,
      authModalMessage,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
};
