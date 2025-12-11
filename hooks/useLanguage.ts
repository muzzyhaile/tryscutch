/**
 * Custom hook for managing language preference with localStorage persistence
 */

import { useState, useEffect } from 'react';
import { SupportedLanguage } from '../types-languages';
import { storage, STORAGE_KEYS } from '../lib/storage';

export function useLanguage() {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

  // Load from storage on mount
  useEffect(() => {
    const stored = storage.get<SupportedLanguage>(STORAGE_KEYS.LANGUAGE);
    if (stored) {
      setSelectedLanguage(stored);
    }
  }, []);

  // Persist to storage whenever language changes
  useEffect(() => {
    storage.set(STORAGE_KEYS.LANGUAGE, selectedLanguage);
  }, [selectedLanguage]);

  return {
    selectedLanguage,
    setSelectedLanguage,
  };
}
