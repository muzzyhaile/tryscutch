/**
 * Custom hook for managing project state with localStorage and Supabase persistence
 * Refactored to use useSyncedState for DRY principle compliance
 */

import { Project } from '../types';
import { STORAGE_KEYS } from '../lib/storage';
import { useSyncedState } from '../lib/useSyncedState';

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
  const {
    data: projects,
    add: addProject,
    update: updateProject,
    remove: deleteProject,
    get: getProject,
  } = useSyncedState<Project, ProjectRow>(userId, {
    storageKey: STORAGE_KEYS.PROJECTS,
    tableName: 'projects',
    rowToEntity: rowToProject,
    entityToRow: projectToUpsertRow,
    getEntityId: (project) => project.id,
    orderBy: { column: 'created_at', ascending: false },
  });

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProject,
  };
}
