/**
 * Custom hook for managing Feedback Library entries with localStorage persistence
 */

import { useEffect, useState } from 'react';
import { FeedbackEntry } from '../types';
import { storage, STORAGE_KEYS } from '../lib/storage';

export function useFeedbackLibrary() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);

  // Load from storage on mount
  useEffect(() => {
    const stored = storage.get<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACK_LIBRARY);
    if (stored) {
      setEntries(stored);
    }
  }, []);

  // Persist to storage whenever entries change
  useEffect(() => {
    storage.set(STORAGE_KEYS.FEEDBACK_LIBRARY, entries);
  }, [entries]);

  const addEntry = (entry: FeedbackEntry) => {
    setEntries(prev => [entry, ...prev]);
  };

  const updateEntry = (entry: FeedbackEntry) => {
    setEntries(prev => prev.map(e => (e.id === entry.id ? entry : e)));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return {
    entries,
    setEntries,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
