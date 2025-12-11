/**
 * Custom hook for managing feedback forms with localStorage persistence
 */

import { useState, useEffect } from 'react';
import { FeedbackForm, FormResponse } from '../types-forms';
import { storage, STORAGE_KEYS } from '../lib/storage';

export function useForms() {
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);

  // Load from storage on mount
  useEffect(() => {
    const storedForms = storage.get<FeedbackForm[]>(STORAGE_KEYS.FORMS);
    const storedResponses = storage.get<FormResponse[]>(STORAGE_KEYS.RESPONSES);
    
    if (storedForms) setForms(storedForms);
    if (storedResponses) setResponses(storedResponses);
  }, []);

  // Persist to storage
  useEffect(() => {
    storage.set(STORAGE_KEYS.FORMS, forms);
  }, [forms]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.RESPONSES, responses);
  }, [responses]);

  const deleteResponse = (id: string) => {
    setResponses(prev => prev.filter(r => r.id !== id));
  };

  return {
    forms,
    setForms,
    responses,
    setResponses,
    deleteResponse,
  };
}
