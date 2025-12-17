/**
 * Custom hook for managing Feedback Library entries with localStorage persistence
 */

import { useEffect, useRef, useState } from 'react';
import { FeedbackEntry, FeedbackSourceType } from '../types';
import { scopedStorageKey, storage, STORAGE_KEYS } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';

type FeedbackEntryRow = {
  id: string;
  user_id: string;
  source_type: FeedbackSourceType;
  title: string;
  content: string;
  app: string | null;
  source: string | null;
  url: string | null;
  date: string | null;
  entry_context: string | null;
  topic: string | null;
  tags: string[] | null;
  bulk_import: any | null;
  created_at: string;
};

function rowToEntry(row: FeedbackEntryRow): FeedbackEntry {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.source_type,
    app: row.app ?? '',
    source: row.source ?? '',
    url: row.url ?? '',
    date: row.date ?? '',
    content: row.content,
    entryContext: row.entry_context ?? '',
    topic: row.topic ?? '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    bulkImport: row.bulk_import ?? undefined,
    createdAt: row.created_at,
  };
}

function entryToUpsertRow(userId: string, entry: FeedbackEntry) {
  return {
    id: entry.id,
    user_id: userId,
    source_type: entry.sourceType,
    title: entry.title,
    content: entry.content,
    app: entry.app || null,
    source: entry.source || null,
    url: entry.url || null,
    date: entry.date || null,
    entry_context: entry.entryContext || null,
    topic: entry.topic || null,
    tags: entry.tags ?? [],
    bulk_import: entry.bulkImport ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function useFeedbackLibrary(userId?: string) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [isLoadedFromRemote, setIsLoadedFromRemote] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const skipNextSyncRef = useRef(false);

  const entriesKey = scopedStorageKey(STORAGE_KEYS.FEEDBACK_LIBRARY, userId);

  // Load from Supabase when authenticated; fall back to localStorage if no userId.
  useEffect(() => {
    if (!userId) {
      const stored = storage.get<FeedbackEntry[]>(entriesKey);
      setEntries(stored ?? []);
      setIsLoadedFromRemote(false);
      prevIdsRef.current = new Set((stored ?? []).map(e => e.id));
      return;
    }

    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('feedback_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error(error);
        // If remote fails, show local data rather than a blank screen.
        const stored = storage.get<FeedbackEntry[]>(entriesKey);
        setEntries(stored ?? []);
        setIsLoadedFromRemote(false);
        prevIdsRef.current = new Set((stored ?? []).map(e => e.id));
        return;
      }

      const mapped = (data as FeedbackEntryRow[]).map(rowToEntry);
      skipNextSyncRef.current = true;
      setEntries(mapped);
      setIsLoadedFromRemote(true);
      prevIdsRef.current = new Set(mapped.map(e => e.id));
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Persist to localStorage (so the UI remains fast and resilient).
  useEffect(() => {
    storage.set(entriesKey, entries);
  }, [entries, entriesKey]);

  // Sync changes to Supabase (upserts + deletes). This keeps the existing UI contract (setEntries) intact.
  useEffect(() => {
    if (!userId) return;
    if (!isLoadedFromRemote) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const nextIds = new Set(entries.map(e => e.id));
    const prevIds = prevIdsRef.current;
    const removedIds: string[] = [];
    for (const id of prevIds) {
      if (!nextIds.has(id)) removedIds.push(id);
    }
    prevIdsRef.current = nextIds;

    (async () => {
      if (removedIds.length > 0) {
        const { error } = await supabase
          .from('feedback_entries')
          .delete()
          .eq('user_id', userId)
          .in('id', removedIds);
        if (error) console.error(error);
      }

      if (entries.length > 0) {
        const rows = entries.map(e => entryToUpsertRow(userId, e));
        const { error } = await supabase
          .from('feedback_entries')
          .upsert(rows, { onConflict: 'id' });
        if (error) console.error(error);
      }
    })().catch(console.error);
  }, [entries, userId, isLoadedFromRemote]);

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
