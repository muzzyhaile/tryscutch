import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorageRepository } from '../lib/storage';

describe('InMemoryStorageRepository', () => {
  let storage: InMemoryStorageRepository;

  beforeEach(() => {
    storage = new InMemoryStorageRepository();
  });

  it('stores and retrieves data', () => {
    const testData = { name: 'Test', value: 123 };
    storage.set('test-key', testData);
    
    const retrieved = storage.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('returns null for non-existent keys', () => {
    const result = storage.get('non-existent');
    expect(result).toBeNull();
  });

  it('removes data', () => {
    storage.set('test-key', { data: 'test' });
    storage.remove('test-key');
    
    const result = storage.get('test-key');
    expect(result).toBeNull();
  });

  it('clears all data', () => {
    storage.set('key1', { data: 'test1' });
    storage.set('key2', { data: 'test2' });
    
    storage.clear();
    
    expect(storage.get('key1')).toBeNull();
    expect(storage.get('key2')).toBeNull();
  });

  it('handles complex objects', () => {
    const complexData = {
      id: '123',
      nested: {
        array: [1, 2, 3],
        object: { key: 'value' }
      },
      date: new Date().toISOString()
    };

    storage.set('complex', complexData);
    const retrieved = storage.get('complex');
    
    expect(retrieved).toEqual(complexData);
  });
});
