/**
 * Custom hook for managing project state with localStorage persistence
 */

import { useEffect, useRef, useState } from 'react';
import { Project } from '../types';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  status: 'draft' | 'analyzing' | 'completed';
  context: string | null;
  items: any;
  analysis: any | null;
  created_at: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    status: row.status,
    context: row.context ?? undefined,
    items: Array.isArray(row.items) ? row.items : [],
    analysis: row.analysis ?? undefined,
  };
}

function projectToUpsertRow(userId: string, project: Project) {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    status: project.status,
    context: project.context ?? null,
    items: project.items ?? [],
    analysis: project.analysis ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadedFromRemote, setIsLoadedFromRemote] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const skipNextSyncRef = useRef(false);

  // Load from Supabase when authenticated; fall back to localStorage if no userId.
  useEffect(() => {
    if (!userId) {
      const stored = storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
      setProjects(stored ?? []);
      setIsLoadedFromRemote(false);
      prevIdsRef.current = new Set((stored ?? []).map(p => p.id));
      return;
    }

    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error(error);
        const stored = storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
        setProjects(stored ?? []);
        setIsLoadedFromRemote(false);
        prevIdsRef.current = new Set((stored ?? []).map(p => p.id));
        return;
      }

      const remote = (data as ProjectRow[]).map(rowToProject);

      // One-time backfill: if remote is empty but local has data, upload it.
      const local = storage.get<Project[]>(STORAGE_KEYS.PROJECTS) ?? [];
      if (remote.length === 0 && local.length > 0) {
        const migrated = local.map((p) => ({
          ...p,
          id: isUuid(p.id) ? p.id : crypto.randomUUID(),
        }));

        // Persist migrated IDs locally so we don't re-map every session.
        storage.set(STORAGE_KEYS.PROJECTS, migrated);

        const rows = migrated.map(p => projectToUpsertRow(userId, p));
        const { error: upsertError } = await supabase.from('projects').upsert(rows, { onConflict: 'id' });
        if (upsertError) {
          console.error(upsertError);
          setProjects(migrated);
          setIsLoadedFromRemote(true);
          prevIdsRef.current = new Set(migrated.map(p => p.id));
          return;
        }

        const { data: after, error: afterErr } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (afterErr) {
          console.error(afterErr);
          setProjects(migrated);
          setIsLoadedFromRemote(true);
          prevIdsRef.current = new Set(migrated.map(p => p.id));
          return;
        }

        const mapped = (after as ProjectRow[]).map(rowToProject);
        skipNextSyncRef.current = true;
        setProjects(mapped);
        setIsLoadedFromRemote(true);
        prevIdsRef.current = new Set(mapped.map(p => p.id));
        return;
      }

      skipNextSyncRef.current = true;
      setProjects(remote);
      setIsLoadedFromRemote(true);
      prevIdsRef.current = new Set(remote.map(p => p.id));
    })().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Persist to localStorage always (so deletes also persist).
  useEffect(() => {
    storage.set(STORAGE_KEYS.PROJECTS, projects);
  }, [projects]);

  // Sync to Supabase (upserts + deletes).
  useEffect(() => {
    if (!userId) return;
    if (!isLoadedFromRemote) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const nextIds = new Set(projects.map(p => p.id));
    const prevIds = prevIdsRef.current;
    const removedIds: string[] = [];
    for (const id of prevIds) {
      if (!nextIds.has(id)) removedIds.push(id);
    }
    prevIdsRef.current = nextIds;

    (async () => {
      if (removedIds.length > 0) {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('user_id', userId)
          .in('id', removedIds);
        if (error) console.error(error);
      }

      if (projects.length > 0) {
        const rows = projects.map(p => projectToUpsertRow(userId, p));
        const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'id' });
        if (error) console.error(error);
      }
    })().catch(console.error);
  }, [projects, userId, isLoadedFromRemote]);

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const updateProject = (project: Project) => {
    setProjects(prev => prev.map(p => p.id === project.id ? project : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const getProject = (id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  };

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProject,
  };
}
