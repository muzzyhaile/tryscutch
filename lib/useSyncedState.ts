/**
 * Generic Synced State Hook - DRY implementation for Supabase + LocalStorage sync
 * Implements Repository pattern and eliminates code duplication
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { storage } from './storage';
import { logger } from './logger';

interface SyncConfig<T, TRow> {
  storageKey: string;
  tableName: string;
  rowToEntity: (row: TRow) => T;
  entityToRow: (userId: string, entity: T) => Partial<TRow>;
  getEntityId: (entity: T) => string;
  orderBy?: { column: string; ascending?: boolean };
}

interface SyncedStateResult<T> {
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  add: (item: T) => void;
  update: (item: T) => void;
  remove: (id: string) => void;
  get: (id: string) => T | undefined;
  isLoadedFromRemote: boolean;
}

/**
 * Validates if a string is a valid UUID
 */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Generic hook for syncing state between localStorage and Supabase
 * Eliminates duplicate code across useProjects, useForms, etc.
 */
export function useSyncedState<T, TRow = any>(
  userId: string | undefined,
  config: SyncConfig<T, TRow>
): SyncedStateResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoadedFromRemote, setIsLoadedFromRemote] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const skipNextSyncRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = storage.get<T[]>(config.storageKey);
    if (stored) {
      setData(stored);
      prevIdsRef.current = new Set(stored.map(config.getEntityId));
    }
  }, []);

  // Persist to localStorage whenever data changes
  useEffect(() => {
    storage.set(config.storageKey, data);
  }, [data, config.storageKey]);

  // Load from Supabase when authenticated
  useEffect(() => {
    if (!userId) {
      setIsLoadedFromRemote(false);
      const stored = storage.get<T[]>(config.storageKey) ?? [];
      prevIdsRef.current = new Set(stored.map(config.getEntityId));
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        let query = supabase
          .from(config.tableName)
          .select('*')
          .eq('user_id', userId);

        if (config.orderBy) {
          query = query.order(config.orderBy.column, { 
            ascending: config.orderBy.ascending ?? false 
          });
        }

        const { data: rows, error } = await query;

        if (!isMounted) return;

        if (error) {
          logger.error(`Failed to load ${config.tableName} from Supabase`, error, 'useSyncedState');
          const stored = storage.get<T[]>(config.storageKey) ?? [];
          setData(stored);
          setIsLoadedFromRemote(false);
          prevIdsRef.current = new Set(stored.map(config.getEntityId));
          return;
        }

        const remote = (rows as TRow[]).map(config.rowToEntity);

        // One-time backfill: if remote is empty but local has data, upload it
        const local = storage.get<T[]>(config.storageKey) ?? [];
        if (remote.length === 0 && local.length > 0) {
          logger.info(`Backfilling ${local.length} items to ${config.tableName}`, undefined, 'useSyncedState');
          
          // Ensure all items have valid UUIDs
          const migrated = local.map((item) => {
            const id = config.getEntityId(item);
            if (!isUuid(id)) {
              // Create new item with UUID
              const newId = crypto.randomUUID();
              return { ...item, id: newId } as T;
            }
            return item;
          });

          storage.set(config.storageKey, migrated);

          const rows = migrated.map(item => config.entityToRow(userId, item));
          const { error: upsertError } = await supabase
            .from(config.tableName)
            .upsert(rows, { onConflict: 'id' });

          if (upsertError) {
            logger.error(`Failed to backfill ${config.tableName}`, upsertError, 'useSyncedState');
            setData(migrated);
            setIsLoadedFromRemote(true);
            prevIdsRef.current = new Set(migrated.map(config.getEntityId));
            return;
          }

          // Reload from server to get any server-generated fields
          const { data: afterRows } = await supabase
            .from(config.tableName)
            .select('*')
            .eq('user_id', userId);

          if (afterRows) {
            const mapped = (afterRows as TRow[]).map(config.rowToEntity);
            skipNextSyncRef.current = true;
            setData(mapped);
            setIsLoadedFromRemote(true);
            prevIdsRef.current = new Set(mapped.map(config.getEntityId));
            return;
          }
        }

        skipNextSyncRef.current = true;
        setData(remote);
        setIsLoadedFromRemote(true);
        prevIdsRef.current = new Set(remote.map(config.getEntityId));
      } catch (err) {
        logger.error(`Unexpected error loading ${config.tableName}`, err, 'useSyncedState');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId, config.tableName, config.storageKey]);

  // Sync changes to Supabase (upserts + deletes)
  useEffect(() => {
    if (!userId) return;
    if (!isLoadedFromRemote) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const nextIds = new Set(data.map(config.getEntityId));
    const prevIds = prevIdsRef.current;
    const removedIds: string[] = [];
    
    for (const id of prevIds) {
      if (!nextIds.has(id)) {
        removedIds.push(id);
      }
    }
    
    prevIdsRef.current = nextIds;

    (async () => {
      try {
        // Delete removed items
        if (removedIds.length > 0) {
          const { error } = await supabase
            .from(config.tableName)
            .delete()
            .eq('user_id', userId)
            .in('id', removedIds);
          
          if (error) {
            logger.error(`Failed to delete from ${config.tableName}`, error, 'useSyncedState');
          } else {
            logger.debug(`Deleted ${removedIds.length} items from ${config.tableName}`, undefined, 'useSyncedState');
          }
        }

        // Upsert current data
        if (data.length > 0) {
          const rows = data.map(item => config.entityToRow(userId, item));
          const { error } = await supabase
            .from(config.tableName)
            .upsert(rows, { onConflict: 'id' });
          
          if (error) {
            logger.error(`Failed to upsert to ${config.tableName}`, error, 'useSyncedState');
          } else {
            logger.debug(`Synced ${data.length} items to ${config.tableName}`, undefined, 'useSyncedState');
          }
        }
      } catch (err) {
        logger.error(`Unexpected error syncing ${config.tableName}`, err, 'useSyncedState');
      }
    })();
  }, [data, userId, isLoadedFromRemote, config.tableName]);

  // Helper methods
  const add = (item: T) => {
    setData(prev => [...prev, item]);
  };

  const update = (item: T) => {
    const id = config.getEntityId(item);
    setData(prev => prev.map(p => config.getEntityId(p) === id ? item : p));
  };

  const remove = (id: string) => {
    setData(prev => prev.filter(p => config.getEntityId(p) !== id));
  };

  const get = (id: string): T | undefined => {
    return data.find(p => config.getEntityId(p) === id);
  };

  return {
    data,
    setData,
    add,
    update,
    remove,
    get,
    isLoadedFromRemote,
  };
}
