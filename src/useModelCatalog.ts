import { useEffect, useState } from 'react';
import axios from 'axios';
import type { ModelCatalog } from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

/**
 * The catalog changes only when the backend redeploys, so fetch it once per page load
 * and share it between the generators rather than refetching per mount.
 */
let cached: ModelCatalog | null = null;
let inFlight: Promise<ModelCatalog> | null = null;

export const fetchModelCatalog = async (): Promise<ModelCatalog> => {
  if (cached) return cached;
  if (!inFlight) {
    if (!API_BASE_URL) throw new Error('Missing REACT_APP_API_BASE_URL');
    inFlight = axios
      .get<ModelCatalog>(`${API_BASE_URL}/api/models/`)
      .then((response) => {
        cached = response.data;
        return cached;
      })
      .finally(() => {
        // Clear the latch so a failed request can be retried on the next mount.
        inFlight = null;
      });
  }
  return inFlight;
};

export interface ModelCatalogState {
  catalog: ModelCatalog | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Load the backend model catalog. Model lists are never hardcoded in this app --
 * see the note on ModelCatalog in types.ts.
 */
export const useModelCatalog = (): ModelCatalogState => {
  const [catalog, setCatalog] = useState<ModelCatalog | null>(cached);
  const [isLoading, setIsLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) return;

    let active = true;
    setIsLoading(true);
    fetchModelCatalog()
      .then((data) => {
        if (active) {
          setCatalog(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        // eslint-disable-next-line no-console
        console.error('Error loading model catalog:', err);
        setError('Could not load the model list. Please refresh and try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { catalog, isLoading, error };
};
