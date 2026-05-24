import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ApiKeyContextValue } from '../types';

const APIKeyContext = createContext<ApiKeyContextValue | undefined>(undefined);

export const useAPIKey = (): ApiKeyContextValue => {
  const ctx = useContext(APIKeyContext);
  if (!ctx) {
    throw new Error('useAPIKey must be used within an APIKeyProvider');
  }
  return ctx;
};

export const APIKeyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const storedApiKey = localStorage.getItem('huggingfaceApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const saveApiKey = (key: string): void => {
    setApiKey(key);
    localStorage.setItem('huggingfaceApiKey', key);
  };

  const value: ApiKeyContextValue = { apiKey, saveApiKey };

  return <APIKeyContext.Provider value={value}>{children}</APIKeyContext.Provider>;
};
