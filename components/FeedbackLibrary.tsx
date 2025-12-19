import React, { useMemo, useRef, useState } from 'react';
import { FeedbackEntry, FeedbackSourceType } from '../types';
import { Plus, Edit2, Trash2, MessageSquare, Share2, Headphones, StickyNote, X, Save, Upload, Trash } from 'lucide-react';
import { importFile, ImportOptions, tableRowsToItems } from '../services/universalImport';
import { useNotification } from '../lib/notification';

interface FeedbackLibraryProps {
  entries: FeedbackEntry[];
  onUpdate: (entries: FeedbackEntry[]) => void;
  importOptions?: ImportOptions;
}

type ActiveTab = FeedbackSourceType;

const TAB_META: Record<ActiveTab, { label: string; icon: React.ReactNode }> = {
  interview: { label: 'Interviews', icon: <MessageSquare size={20} /> },
  social: { label: 'Social', icon: <Share2 size={20} /> },
  support: { label: 'Support', icon: <Headphones size={20} /> },
  note: { label: 'Notes', icon: <StickyNote size={20} /> },
};

export const FeedbackLibrary: React.FC<FeedbackLibraryProps> = ({ entries, onUpdate, importOptions }) => {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState<ActiveTab>('interview');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FeedbackEntry>>({});
  const [editingBulkImportId, setEditingBulkImportId] = useState<string | null>(null);
  const [bulkImportDraftText, setBulkImportDraftText] = useState('');
  const [isSectionDragOver, setIsSectionDragOver] = useState(false);
  const sectionUploadRef = useRef<HTMLInputElement | null>(null);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => e.sourceType === activeTab)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [entries, activeTab]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({});
  };

  const resetBulkImportEditor = () => {
    setEditingBulkImportId(null);
    setBulkImportDraftText('');
  };

  const handleSave = () => {
    if (!form.title || !form.content) return;

    if (editingId) {
      const updated: FeedbackEntry = {
        ...(entries.find(e => e.id === editingId) as FeedbackEntry),
        ...form,
        id: editingId,
        sourceType: activeTab,
      };
      onUpdate(entries.map(e => (e.id === editingId ? updated : e)));
      resetForm();
      return;
    }

    const newEntry: FeedbackEntry = {
      id: crypto.randomUUID(),
      title: form.title,
      sourceType: activeTab,
      app: form.app || '',
      source: form.source || '',
      url: form.url || '',
      date: form.date || '',
      content: form.content,
      entryContext: form.entryContext || '',
      topic: form.topic || '',
      tags: Array.isArray(form.tags) ? form.tags : [],
      createdAt: new Date().toISOString(),
    };

    onUpdate([newEntry, ...entries]);
    resetForm();
  };

  const handleEdit = (entry: FeedbackEntry) => {
    setIsEditing(true);
    setEditingId(entry.id);
    setForm(entry);
  };

  const textToItems = (rawText: string): string[] => {
    return rawText
      .split(/\r?\n+/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
  };

  const normalizeColumnName = (name: string): string => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  };

  const pickColumn = (columns: string[], aliases: string[]): string | null => {
    const normalized = columns.map(c => ({ raw: c, norm: normalizeColumnName(c) }));
    for (const alias of aliases) {
      const a = alias.toLowerCase();
      const exact = normalized.find(c => c.norm === a);
      if (exact) return exact.raw;
    }
    for (const alias of aliases) {
      const a = alias.toLowerCase();
      const includes = normalized.find(c => c.norm.includes(a));
      if (includes) return includes.raw;
    }
    return null;
  };

  const parseTagsCell = (raw: string): string[] => {
    return raw
      .split(/[,;]+/)
      .map(t => t.trim())
      .filter(Boolean);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this entry?')) {
      onUpdate(entries.filter(e => e.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const parseTags = (raw: string): string[] => {
    return raw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  };

  const handleBulkUpload = async (entry: FeedbackEntry, file: File) => {
    try {
      const result = await importFile(file, importOptions);

      const items = (() => {
        if (result.kind === 'text') {
          return textToItems(result.rawText);
        }

        const selectedTextColumn = result.detectedTextColumn ?? result.columns[0] ?? '';
        if (!selectedTextColumn) return [];
        return tableRowsToItems(result.rows, selectedTextColumn);
      })();

      if (items.length === 0) {
        notify({
          type: 'warning',
          title: 'No feedback found',
          message: 'No rows could be imported. If this is a CSV/XLSX table, make sure it has a column with the feedback text.',
        });
        return;
      }

      const updated: FeedbackEntry = {
        ...entry,
        bulkImport: {
          sourceFileName: file.name,
          importedAt: new Date().toISOString(),
          kind: result.kind,
          rowCount: items.length,
          items,
          selectedTextColumn: result.kind === 'table' ? (result.detectedTextColumn ?? result.columns[0] ?? undefined) : undefined,
          detectedTextColumn: result.kind === 'table' ? result.detectedTextColumn : undefined,
        },
      };

      onUpdate(entries.map(e => (e.id === entry.id ? updated : e)));
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Import failed',
        message: err instanceof Error ? err.message : 'Failed to import file.',
      });
    }
  };

  const handleSectionUpload = async (file: File) => {
    try {
      const result = await importFile(file, importOptions);

      const now = new Date();
      const createdAt = now.toISOString();
      const base = now.getTime();

      const newEntries: FeedbackEntry[] = (() => {
        if (result.kind === 'text') {
          const items = textToItems(result.rawText);
          return items.map((content, idx) => {
            const compact = content.replace(/\s+/g, ' ').trim();
            const title = compact.length > 72 ? `${compact.slice(0, 72)}…` : compact || `Imported feedback ${idx + 1}`;
            return {
              id: crypto.randomUUID(),
              title,
              sourceType: activeTab,
              app: '',
              source: '',
              url: '',
              date: '',
              content,
              entryContext: '',
              topic: '',
              tags: [],
              createdAt,
            };
          });
        }

        const contentCol = result.detectedTextColumn ?? pickColumn(result.columns, ['content', 'feedback', 'comment', 'message', 'text', 'body', 'note', 'description']) ?? result.columns[0] ?? '';
        if (!contentCol) return [];

        const titleCol = pickColumn(result.columns, ['title', 'subject', 'headline']);
        const sourceCol = pickColumn(result.columns, ['source', 'channel', 'platform']);
        const appCol = pickColumn(result.columns, ['app', 'product', 'application']);
        const urlCol = pickColumn(result.columns, ['url', 'link']);
        const dateCol = pickColumn(result.columns, ['date', 'time', 'timestamp', 'created at', 'created']);
        const topicCol = pickColumn(result.columns, ['topic', 'category', 'area']);
        const tagsCol = pickColumn(result.columns, ['tags', 'tag', 'labels', 'label']);

        const items = tableRowsToItems(result.rows, contentCol);

        return result.rows
          .map((row, idx) => {
            const content = (row[contentCol] ?? '').trim();
            if (!content) return null;

            const titleRaw = titleCol ? (row[titleCol] ?? '').trim() : '';
            const compact = content.replace(/\s+/g, ' ').trim();
            const title = titleRaw || (compact.length > 72 ? `${compact.slice(0, 72)}…` : compact || `Imported feedback ${idx + 1}`);

            const source = sourceCol ? (row[sourceCol] ?? '').trim() : '';
            const app = appCol ? (row[appCol] ?? '').trim() : '';
            const url = urlCol ? (row[urlCol] ?? '').trim() : '';
            const date = dateCol ? (row[dateCol] ?? '').trim() : '';
            const topic = topicCol ? (row[topicCol] ?? '').trim() : '';
            const tags = tagsCol ? parseTagsCell(row[tagsCol] ?? '') : [];

            return {
              id: crypto.randomUUID(),
              title,
              sourceType: activeTab,
              app,
              source,
              url,
              date,
              content,
              entryContext: '',
              topic,
              tags,
              createdAt,
            };
          })
          .filter(Boolean) as FeedbackEntry[];
      })();

      if (newEntries.length === 0) {
        notify({
          type: 'warning',
          title: 'No feedback found',
          message: 'No rows could be imported. If this is a CSV/XLSX table, make sure it has a column with the feedback text.',
        });
        return;
      }

      onUpdate([...newEntries, ...entries]);
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Import failed',
        message: err instanceof Error ? err.message : 'Failed to import file.',
      });
    }
  };

  const clearBulkImport = (entry: FeedbackEntry) => {
    if (!confirm('Remove the imported dataset from this entry?')) return;
    if (editingBulkImportId === entry.id) resetBulkImportEditor();
    const updated: FeedbackEntry = { ...entry, bulkImport: undefined };
    onUpdate(entries.map(e => (e.id === entry.id ? updated : e)));
  };

  const startEditingBulkImport = (entry: FeedbackEntry) => {
    if (!entry.bulkImport) return;
    setEditingBulkImportId(entry.id);
    setBulkImportDraftText(entry.bulkImport.items.join('\n'));
  };

  const saveEditedBulkImport = (entry: FeedbackEntry) => {
    if (!entry.bulkImport) return;
    const items = textToItems(bulkImportDraftText);
    const updated: FeedbackEntry = {
      ...entry,
      bulkImport: {
        ...entry.bulkImport,
        items,
        rowCount: items.length,
        importedAt: new Date().toISOString(),
      },
    };
    onUpdate(entries.map(e => (e.id === entry.id ? updated : e)));
    resetBulkImportEditor();
  };

  const tabCount = (t: ActiveTab) => entries.filter(e => e.sourceType === t).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-100 pb-6 sm:pb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-zinc-950">Feedback Library</h1>
          <p className="text-base sm:text-xl text-zinc-500 mt-2 font-light max-w-2xl">
            Keep interviews, social feedback, support notes, and research in one place.
          </p>
        </div>
        {!isEditing && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => sectionUploadRef.current?.click()}
              className="w-full sm:w-auto justify-center bg-white text-zinc-950 px-6 py-3 rounded-xl text-base font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2 border border-zinc-200"
              title={`Upload multiple rows into ${TAB_META[activeTab].label}`}
            >
              <Upload size={20} /> Upload
            </button>
            <button
              onClick={() => {
                setIsEditing(true);
                setEditingId(null);
                setForm({ title: '', content: '' });
              }}
              className="w-full sm:w-auto justify-center bg-zinc-950 text-white px-6 py-3 rounded-xl text-base font-bold hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} /> New Entry
            </button>
          </div>
        )}
      </div>

      {!isEditing && (
        <div
          className={`rounded-3xl border-2 border-dashed p-8 transition-colors ${
            isSectionDragOver ? 'border-zinc-950 bg-zinc-50' : 'border-zinc-200 bg-white'
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSectionDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSectionDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSectionDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSectionDragOver(false);
            const files = e.dataTransfer.files;
            if (!files || files.length === 0) return;
            if (files.length > 1) {
              notify({
                type: 'warning',
                title: 'One file at a time',
                message: 'Please upload one file at a time.',
              });
              return;
            }
            const file = files[0];
            if (!file) return;
            void handleSectionUpload(file);
          }}
          onClick={() => sectionUploadRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sectionUploadRef.current?.click();
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
              <Upload size={22} className="text-zinc-700" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-zinc-950">
                Drag & drop a CSV/XLSX/PDF/TXT to import into {TAB_META[activeTab].label}
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                One file at a time. CSV/XLSX creates 1 entry per row; TXT/PDF creates 1 entry per non-empty line.
              </p>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Supported files</p>
                  <p className="text-sm text-zinc-700 mt-2">.csv, .tsv, .xlsx/.xls, .txt, .pdf</p>
                  <p className="text-xs text-zinc-500 mt-2">
                    If a file is huge, import may be slow because it runs in your browser.
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CSV/XLSX columns</p>
                  <p className="text-sm text-zinc-700 mt-2">
                    Required: a feedback text column (e.g. “feedback”, “comment”, “content”). Optional: title, source, app/product, url, date,
                    topic/category, tags/labels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={sectionUploadRef}
        type="file"
        className="hidden"
        accept=".csv,.tsv,.xlsx,.xls,.txt,.pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          void handleSectionUpload(file);
          e.currentTarget.value = '';
        }}
      />

      <div className="flex flex-wrap gap-2 border-b border-zinc-100">
        {(Object.keys(TAB_META) as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              resetForm();
            }}
            className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
              activeTab === tab ? 'border-b-2 border-zinc-950 text-zinc-950' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {TAB_META[tab].icon}
            {TAB_META[tab].label} ({tabCount(tab)})
          </button>
        ))}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-3xl border-2 border-zinc-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{editingId ? 'Edit Entry' : 'New Entry'}</h3>
            <button onClick={resetForm} className="p-2 hover:bg-zinc-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
            />
            <input
              type="text"
              placeholder="App / Product (optional)"
              value={form.app || ''}
              onChange={(e) => setForm({ ...form, app: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
            />
            <input
              type="text"
              placeholder="Source (optional)"
              value={form.source || ''}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
            />
            <input
              type="text"
              placeholder="Topic (optional, e.g. Billing)"
              value={form.topic || ''}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
            />
            <input
              type="date"
              placeholder="Date (optional)"
              value={form.date || ''}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
            />
          </div>

          <input
            type="text"
            placeholder="Tags (optional, comma-separated)"
            value={Array.isArray(form.tags) ? form.tags.join(', ') : ''}
            onChange={(e) => setForm({ ...form, tags: parseTags(e.target.value) })}
            className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
          />

          <input
            type="url"
            placeholder="URL (optional)"
            value={form.url || ''}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
          />

          <textarea
            placeholder="Content"
            value={form.content || ''}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
            rows={8}
          />

          <textarea
            placeholder="Entry context (optional)"
            value={form.entryContext || ''}
            onChange={(e) => setForm({ ...form, entryContext: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
            rows={3}
          />

          <button
            onClick={handleSave}
            disabled={!form.title || !form.content}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            Save Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEntries.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-200">
              <h3 className="text-2xl font-bold text-zinc-950 mb-2">No entries yet</h3>
              <p className="text-zinc-500 max-w-xl mx-auto text-lg">
                Add interviews, social feedback, support notes, or internal notes here.
              </p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.id}
                className="bg-white rounded-3xl border-2 border-zinc-100 shadow-sm p-8 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-zinc-950 truncate">{entry.title}</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      {[entry.app, entry.source, entry.date].filter(Boolean).join(' • ')}
                    </p>
                    {(entry.topic || (entry.tags && entry.tags.length > 0)) && (
                      <p className="text-xs text-zinc-400 mt-1">
                        {[entry.topic ? `Topic: ${entry.topic}` : null, entry.tags?.length ? `Tags: ${entry.tags.join(', ')}` : null]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => document.getElementById(`bulk-upload-${entry.id}`)?.click()}
                      className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950"
                      title="Upload CSV/XLSX/TXT/PDF"
                    >
                      <Upload size={18} />
                    </button>
                    <input
                      id={`bulk-upload-${entry.id}`}
                      type="file"
                      className="hidden"
                      accept=".csv,.tsv,.xlsx,.xls,.txt,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void handleBulkUpload(entry, file);
                        e.currentTarget.value = '';
                      }}
                    />
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg text-zinc-500 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 line-clamp-4 whitespace-pre-wrap">{entry.content}</p>

                {entry.entryContext && (
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Entry Context</p>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">{entry.entryContext}</p>
                  </div>
                )}

                {entry.bulkImport && (
                  <div className="bg-zinc-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Imported Dataset</p>
                        <p className="text-sm text-zinc-700 mt-1">
                          {entry.bulkImport.sourceFileName} • {entry.bulkImport.rowCount.toLocaleString()} lines
                          {entry.bulkImport.selectedTextColumn ? ` • Column: ${entry.bulkImport.selectedTextColumn}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => (editingBulkImportId === entry.id ? resetBulkImportEditor() : startEditingBulkImport(entry))}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950"
                          title={editingBulkImportId === entry.id ? 'Cancel editing dataset' : 'Edit imported dataset'}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => clearBulkImport(entry)}
                          className="p-2 hover:bg-rose-50 rounded-lg text-zinc-500 hover:text-rose-600"
                          title="Remove imported dataset"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>

                    <textarea
                      readOnly={editingBulkImportId !== entry.id}
                      value={editingBulkImportId === entry.id ? bulkImportDraftText : entry.bulkImport.items.join('\n')}
                      onChange={(e) => setBulkImportDraftText(e.target.value)}
                      className="w-full h-56 px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 font-mono text-xs leading-relaxed"
                    />

                    {editingBulkImportId === entry.id && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => resetBulkImportEditor()}
                          className="px-4 py-2 rounded-lg font-bold border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEditedBulkImport(entry)}
                          className="px-4 py-2 rounded-lg font-bold bg-zinc-950 text-white hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <Save size={16} /> Save Dataset
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
