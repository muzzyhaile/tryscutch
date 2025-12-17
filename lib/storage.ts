/**
 * Storage abstraction layer using Repository pattern
 * Provides a clean interface for data persistence operations
 */

export interface IStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

/**
 * LocalStorage implementation of IStorage
 */
export class LocalStorageRepository implements IStorage {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Consider implementing data cleanup.');
      }
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

/**
 * In-memory implementation for testing
 */
export class InMemoryStorageRepository implements IStorage {
  private store: Map<string, string> = new Map();

  get<T>(key: string): T | null {
    const item = this.store.get(key);
    return item ? JSON.parse(item) : null;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Storage keys constants
 */
export const STORAGE_KEYS = {
  PROJECTS: 'clarity_voc_projects',
  CONTEXT: 'clarity_context_data',
  FEEDBACK_LIBRARY: 'clarity_feedback_library',
  FORMS: 'clarity_feedback_forms',
  RESPONSES: 'clarity_form_responses',
  LANGUAGE: 'clarity_language',
} as const;

export function scopedStorageKey(baseKey: string, userId?: string) {
  return userId ? `${baseKey}:${userId}` : `${baseKey}:anon`;
}

// Default export: singleton instance
export const storage: IStorage = new LocalStorageRepository();
