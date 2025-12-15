/**
 * Custom hook for managing language preference.
 * - Always caches to localStorage for fast boot.
 * - When authenticated, syncs to Supabase `profiles.selected_language`.
 */

import { useEffect, useRef, useState } from 'react';
import { SupportedLanguage } from '../types-languages';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';

export function useLanguage(userId?: string) {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [isLoadedFromRemote, setIsLoadedFromRemote] = useState(false);
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    const stored = storage.get<SupportedLanguage>(STORAGE_KEYS.LANGUAGE);
    if (stored) setSelectedLanguage(stored);
  }, []);

  useEffect(() => {
    storage.set(STORAGE_KEYS.LANGUAGE, selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (!userId) {
      setIsLoadedFromRemote(false);
      return;
    }

    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('selected_language')
        .eq('id', userId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error(error);
        setIsLoadedFromRemote(false);
        return;
      }

      const remoteLang = (data as any)?.selected_language as SupportedLanguage | null | undefined;
      if (remoteLang) {
        skipNextSyncRef.current = true;
        setSelectedLanguage(remoteLang);
        setIsLoadedFromRemote(true);
        return;
      }

      // If no profile row yet, backfill from local/default.
      const stored = storage.get<SupportedLanguage>(STORAGE_KEYS.LANGUAGE) ?? 'en';
      await supabase.from('profiles').upsert(
        {
          id: userId,
          selected_language: stored,
        } as any,
        { onConflict: 'id' }
      );

      skipNextSyncRef.current = true;
      setSelectedLanguage(stored);
      setIsLoadedFromRemote(true);
    })().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (!isLoadedFromRemote) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          selected_language: selectedLanguage,
        } as any,
        { onConflict: 'id' }
      )
      .then(({ error }) => {
        if (error) console.error(error);
      })
      .catch(console.error);
  }, [selectedLanguage, userId, isLoadedFromRemote]);

  return {
    selectedLanguage,
    setSelectedLanguage,
  };
}
