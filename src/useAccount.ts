import { useAuth } from './AuthContext';
import type { Account } from './types';

export interface AccountState {
  account: Account | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<Account | null>;
  isLoggedIn: boolean;
}

/**
 * The live credit balance, from GET /api/me/.
 *
 * Log-in stashes a `credits` value in localStorage, but that number is a snapshot:
 * it goes stale the moment the user generates an image or buys a pack. Anything
 * showing a balance should use this hook instead, and call `refresh()` after any
 * action that moves credits.
 *
 * The fetching itself lives in <AuthProvider> (src/AuthContext.tsx) so that every
 * consumer shares one account and one request; this is the read-only view of it.
 */
export function useAccount(): AccountState {
  const { account, isLoadingAccount, error, refresh, isLoggedIn } = useAuth();
  return { account, isLoading: isLoadingAccount, error, refresh, isLoggedIn };
}
