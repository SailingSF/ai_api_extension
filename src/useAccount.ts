import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { Account } from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

/**
 * The live credit balance, from GET /api/me/.
 *
 * Log-in stashes a `credits` value in localStorage, but that number is a snapshot:
 * it goes stale the moment the user generates an image or buys a pack. Anything
 * showing a balance should use this hook instead, and call `refresh()` after any
 * action that moves credits.
 */
export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<Account | null> => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAccount(null);
      setIsLoading(false);
      return null;
    }
    if (!API_BASE_URL) {
      setError('Missing REACT_APP_API_BASE_URL');
      setIsLoading(false);
      return null;
    }

    try {
      const response = await axios.get<Account>(`${API_BASE_URL}/api/me/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setAccount(response.data);
      setError(null);
      // Keep the legacy localStorage copy in step for any older code reading it.
      localStorage.setItem('credits', String(response.data.credits));
      return response.data;
    } catch (err) {
      // A 401 means the stored token is dead; treat it as signed out rather than
      // leaving a stale balance on screen.
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setAccount(null);
      } else {
        setError('Could not load your account.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { account, isLoading, error, refresh, isLoggedIn: !!localStorage.getItem('token') };
}
