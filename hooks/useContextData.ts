/**
 * Custom hook for managing context data with localStorage persistence
 */

import { useState, useEffect } from 'react';
import { ContextData } from '../types';
import { storage, STORAGE_KEYS } from '../lib/storage';

const DEFAULT_CONTEXT: ContextData = {
  icps: [],
  productInfos: [],
  marketFeedbacks: [],
  productPrinciples: [],
};

export function useContextData() {
  const [contextData, setContextData] = useState<ContextData>(DEFAULT_CONTEXT);

  // Load from storage on mount
  useEffect(() => {
    const stored = storage.get<ContextData>(STORAGE_KEYS.CONTEXT);
    if (stored) {
      setContextData(stored);
    }
  }, []);

  // Persist to storage whenever data changes
  useEffect(() => {
    storage.set(STORAGE_KEYS.CONTEXT, contextData);
  }, [contextData]);

  return {
    contextData,
    setContextData,
  };
}
