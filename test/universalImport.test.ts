import { describe, it, expect } from 'vitest';
import {
  detectBestTextColumn,
  parseCsvTextToTable,
  tableRowsToItems,
  parseXlsxArrayBufferToTable,
} from '../services/universalImport';
import * as XLSX from 'xlsx';

describe('universalImport', () => {
  it('parses CSV into a table and detects a text column', () => {
    const csv = `id,comment,rating\n1,"The app is slow and crashes",2\n2,"Love the UI, but billing is confusing",4`;
    const result = parseCsvTextToTable(csv);

    expect(result.kind).toBe('table');
    expect(result.columns).toContain('comment');
    expect(result.rows.length).toBe(2);

    const detected = detectBestTextColumn(result.columns, result.rows);
    expect(detected).toBe('comment');

    const items = tableRowsToItems(result.rows, 'comment');
    expect(items).toEqual([
      'The app is slow and crashes',
      'Love the UI, but billing is confusing',
    ]);
  });

  it('parses XLSX into a table and detects a text column', () => {
    const data = [
      ['id', 'feedback', 'score'],
      [1, 'Search is hard to use', 2],
      [2, 'Export to CSV is great', 5],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const array = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const result = parseXlsxArrayBufferToTable(array);

    expect(result.kind).toBe('table');
    expect(result.columns).toContain('feedback');
    expect(result.rows.length).toBe(2);
    expect(result.detectedTextColumn).toBe('feedback');
  });
});
