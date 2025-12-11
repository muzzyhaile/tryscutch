/**
 * Custom hook for managing project state with localStorage persistence
 */

import { useState, useEffect } from 'react';
import { Project } from '../types';
import { storage, STORAGE_KEYS } from '../lib/storage';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);

  // Load projects from storage on mount
  useEffect(() => {
    const stored = storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
    if (stored) {
      setProjects(stored);
    }
  }, []);

  // Persist projects to storage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      storage.set(STORAGE_KEYS.PROJECTS, projects);
    }
  }, [projects]);

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
