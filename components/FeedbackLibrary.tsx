import React, { useMemo, useState } from 'react';
import { FeedbackEntry, FeedbackSourceType } from '../types';
import { Plus, Edit2, Trash2, MessageSquare, Share2, Headphones, StickyNote, X, Save } from 'lucide-react';

interface FeedbackLibraryProps {
  entries: FeedbackEntry[];
  onUpdate: (entries: FeedbackEntry[]) => void;
}

type ActiveTab = FeedbackSourceType;

const TAB_META: Record<ActiveTab, { label: string; icon: React.ReactNode }> = {
  interview: { label: 'Interviews', icon: <MessageSquare size={20} /> },
  social: { label: 'Social', icon: <Share2 size={20} /> },
  support: { label: 'Support', icon: <Headphones size={20} /> },
  note: { label: 'Notes', icon: <StickyNote size={20} /> },
};

export const FeedbackLibrary: React.FC<FeedbackLibraryProps> = ({ entries, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('interview');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FeedbackEntry>>({});

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
      id: Date.now().toString(),
      title: form.title,
      sourceType: activeTab,
      app: form.app || '',
      source: form.source || '',
      url: form.url || '',
      date: form.date || '',
      content: form.content,
      entryContext: form.entryContext || '',
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

  const handleDelete = (id: string) => {
    if (confirm('Delete this entry?')) {
      onUpdate(entries.filter(e => e.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const tabCount = (t: ActiveTab) => entries.filter(e => e.sourceType === t).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-zinc-100 pb-8">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter text-zinc-950">Feedback Library</h1>
          <p className="text-xl text-zinc-500 mt-2 font-light max-w-2xl">
            Keep interviews, social feedback, support notes, and research in one place.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setEditingId(null);
              setForm({ title: '', content: '' });
            }}
            className="bg-zinc-950 text-white px-6 py-3 rounded-xl text-base font-bold hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} /> New Entry
          </button>
        )}
      </div>

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
              type="date"
              placeholder="Date (optional)"
              value={form.date || ''}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
            />
          </div>

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
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
