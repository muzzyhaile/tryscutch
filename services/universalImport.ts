import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjs from 'pdfjs-dist';
// Vite will turn this into a URL string.
// eslint-disable-next-line import/no-unresolved
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type ImportKind = 'text' | 'table';

export type TableRow = Record<string, string>;

export interface ImportResultBase {
  kind: ImportKind;
  warnings: string[];
}

export interface TextImportResult extends ImportResultBase {
  kind: 'text';
  rawText: string;
}

export interface TableImportResult extends ImportResultBase {
  kind: 'table';
  columns: string[];
  rows: TableRow[];
  detectedTextColumn: string | null;
}

export type ImportResult = TextImportResult | TableImportResult;

const TEXTY_COLUMN_HINTS = [
  'feedback',
  'comment',
  'review',
  'message',
  'issue',
  'complaint',
  'note',
  'description',
  'text',
  'body',
  'content',
  'summary',
] as const;

function normalizeCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function looksLikeHeaderRow(row: unknown[]): boolean {
  const cells = row.map(normalizeCell).filter(Boolean);
  if (cells.length === 0) return false;
  const unique = new Set(cells.map(c => c.toLowerCase()));
  const uniqueRatio = unique.size / cells.length;
  const avgLen = cells.reduce((sum, c) => sum + c.length, 0) / cells.length;
  return uniqueRatio > 0.7 && avgLen <= 40;
}

function scoreColumnName(name: string): number {
  const lower = name.toLowerCase();
  let score = 0;
  for (const hint of TEXTY_COLUMN_HINTS) {
    if (lower.includes(hint)) score += 4;
  }
  if (lower.includes('id')) score -= 2;
  if (lower.includes('date') || lower.includes('time')) score -= 1;
  if (lower.includes('email') || lower.includes('phone')) score -= 1;
  return score;
}

function scoreColumnValues(values: string[]): number {
  const nonEmpty = values.filter(v => v.trim().length > 0);
  if (nonEmpty.length === 0) return -Infinity;

  const avgLen = nonEmpty.reduce((sum, v) => sum + v.length, 0) / nonEmpty.length;
  const longRatio = nonEmpty.filter(v => v.length >= 30).length / nonEmpty.length;
  const hasSpacesRatio = nonEmpty.filter(v => /\s/.test(v)).length / nonEmpty.length;
  const numericLikeRatio = nonEmpty.filter(v => /^\s*[+-]?(\d+([.,]\d+)?)\s*$/.test(v)).length / nonEmpty.length;

  // Prefer columns that look like natural language.
  return avgLen * 0.1 + longRatio * 3 + hasSpacesRatio * 2 - numericLikeRatio * 5;
}

export function detectBestTextColumn(columns: string[], rows: TableRow[]): string | null {
  if (columns.length === 0 || rows.length === 0) return null;

  let best: { col: string; score: number } | null = null;

  for (const col of columns) {
    const values = rows.slice(0, 200).map(r => r[col] ?? '');
    const score = scoreColumnName(col) + scoreColumnValues(values);

    if (!best || score > best.score) {
      best = { col, score };
    }
  }

  if (!best) return null;
  if (!Number.isFinite(best.score)) return null;
  return best.col;
}

export function tableRowsToItems(rows: TableRow[], textColumn: string): string[] {
  return rows
    .map(r => (r[textColumn] ?? '').trim())
    .filter(v => v.length > 0);
}

export function parseCsvTextToTable(text: string, delimiter?: string): TableImportResult {
  const warnings: string[] = [];

  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    delimiter,
    transform: (v) => (typeof v === 'string' ? v.trim() : v),
  });

  if (parsed.errors?.length) {
    warnings.push(...parsed.errors.slice(0, 3).map(e => e.message));
  }

  const rawRows = Array.isArray(parsed.data) ? parsed.data : [];
  const fields = parsed.meta?.fields ?? [];

  // If we didn't get headers, retry as a matrix.
  if (fields.length === 0) {
    const matrix = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
      dynamicTyping: false,
      delimiter,
    });

    const rowsArr = Array.isArray(matrix.data) ? matrix.data : [];
    if (rowsArr.length === 0) {
      return { kind: 'table', columns: [], rows: [], detectedTextColumn: null, warnings };
    }

    const headerRow = looksLikeHeaderRow(rowsArr[0] as unknown[]) ? (rowsArr[0] as unknown[]) : null;
    const dataRows = headerRow ? rowsArr.slice(1) : rowsArr;
    const columns = (headerRow ?? (rowsArr[0] as unknown[])).map((c, idx) => normalizeCell(c) || `Column ${idx + 1}`);

    const rows: TableRow[] = dataRows.map((row) => {
      const r = row as unknown[];
      const out: TableRow = {};
      for (let i = 0; i < columns.length; i++) {
        out[columns[i]] = normalizeCell(r[i]);
      }
      return out;
    });

    const detectedTextColumn = detectBestTextColumn(columns, rows);
    return { kind: 'table', columns, rows, detectedTextColumn, warnings };
  }

  const rows: TableRow[] = rawRows.map((r) => {
    const out: TableRow = {};
    for (const col of fields) {
      out[col] = normalizeCell(r[col]);
    }
    return out;
  });

  const detectedTextColumn = detectBestTextColumn(fields, rows);
  return { kind: 'table', columns: fields, rows, detectedTextColumn, warnings };
}

export function parseXlsxArrayBufferToTable(buffer: ArrayBuffer): TableImportResult {
  const warnings: string[] = [];

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { kind: 'table', columns: [], rows: [], detectedTextColumn: null, warnings: ['No sheets found in workbook.'] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][];

  if (!matrix.length) {
    return { kind: 'table', columns: [], rows: [], detectedTextColumn: null, warnings: ['No rows found in sheet.'] };
  }

  const header = looksLikeHeaderRow(matrix[0]) ? matrix[0] : null;
  const columns = (header ?? matrix[0]).map((c, idx) => normalizeCell(c) || `Column ${idx + 1}`);
  const dataRows = header ? matrix.slice(1) : matrix;

  const rows: TableRow[] = dataRows
    .filter(r => Array.isArray(r) && r.some(cell => normalizeCell(cell).length > 0))
    .map((r) => {
      const out: TableRow = {};
      for (let i = 0; i < columns.length; i++) {
        out[columns[i]] = normalizeCell(r[i]);
      }
      return out;
    });

  const detectedTextColumn = detectBestTextColumn(columns, rows);
  return { kind: 'table', columns, rows, detectedTextColumn, warnings };
}

export async function parsePdfArrayBufferToText(buffer: ArrayBuffer): Promise<TextImportResult> {
  const warnings: string[] = [];

  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const parts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: any) => (typeof it?.str === 'string' ? it.str : ''))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) parts.push(pageText);
  }

  if (parts.length === 0) warnings.push('No extractable text found in PDF.');

  return { kind: 'text', rawText: parts.join('\n\n'), warnings };
}

function extOf(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
}

export async function importFile(file: File): Promise<ImportResult> {
  const ext = extOf(file.name);

  if (ext === 'csv' || ext === 'tsv') {
    const text = await file.text();
    return parseCsvTextToTable(text, ext === 'tsv' ? '\t' : undefined);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    return parseXlsxArrayBufferToTable(buffer);
  }

  if (ext === 'pdf') {
    const buffer = await file.arrayBuffer();
    return await parsePdfArrayBufferToText(buffer);
  }

  // Default to plain text (txt, md, jsonl, etc.)
  const rawText = await file.text();
  return { kind: 'text', rawText, warnings: [] };
}
