import React, { useState } from 'react';
import { FormResponse, FeedbackForm } from '../types-forms';
import { Download, Trash2, FileText, Calendar, Mail, User, Check, X } from 'lucide-react';

interface ResponseViewerProps {
  responses: FormResponse[];
  forms: FeedbackForm[];
  onDelete: (id: string) => void;
  onImport: (responseIds: string[]) => void;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ 
  responses, 
  forms, 
  onDelete,
  onImport 
}) => {
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);

  const filteredResponses = selectedForm === 'all' 
    ? responses 
    : responses.filter(r => r.formId === selectedForm);

  const getFormName = (formId: string) => {
    return forms.find(f => f.id === formId)?.name || 'Unknown Form';
  };

  const getQuestionText = (formId: string, questionId: string) => {
    const form = forms.find(f => f.id === formId);
    return form?.questions.find(q => q.id === questionId)?.question || 'Unknown Question';
  };

  const toggleSelection = (id: string) => {
    setSelectedResponses(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const handleBulkImport = () => {
    if (selectedResponses.length === 0) return;
    onImport(selectedResponses);
    setSelectedResponses([]);
  };

  const exportToCSV = () => {
    if (filteredResponses.length === 0) return;

    // Get all unique questions
    const allQuestions = new Set<string>();
    filteredResponses.forEach(response => {
      const form = forms.find(f => f.id === response.formId);
      form?.questions.forEach(q => allQuestions.add(q.question));
    });

    // Create CSV header
    const headers = ['Response ID', 'Form', 'Submitted At', 'Email', ...Array.from(allQuestions)];
    
    // Create CSV rows
    const rows = filteredResponses.map(response => {
      const form = forms.find(f => f.id === response.formId);
      const row = [
        response.id,
        getFormName(response.formId),
        new Date(response.submittedAt).toLocaleString(),
        response.respondentEmail || 'Anonymous'
      ];

      // Add answers
      allQuestions.forEach(questionText => {
        const question = form?.questions.find(q => q.question === questionText);
        const answer = question ? response.answers.find(a => a.questionId === question.id) : null;
        row.push(answer ? String(answer.value) : '');
      });

      return row;
    });

    // Combine and download
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-zinc-950 mb-2">Form Responses</h1>
        <p className="text-zinc-500 text-lg">View and manage feedback submissions</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center gap-4">
        <select
          value={selectedForm}
          onChange={(e) => setSelectedForm(e.target.value)}
          className="px-4 py-2 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
        >
          <option value="all">All Forms ({responses.length})</option>
          {forms.map(form => (
            <option key={form.id} value={form.id}>
              {form.name} ({responses.filter(r => r.formId === form.id).length})
            </option>
          ))}
        </select>

        <button
          onClick={exportToCSV}
          disabled={filteredResponses.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white rounded-lg font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          Export CSV
        </button>

        {selectedResponses.length > 0 && (
          <button
            onClick={handleBulkImport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all"
          >
            <FileText size={18} />
            Import {selectedResponses.length} to Analysis
          </button>
        )}
      </div>

      {/* Responses List */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-zinc-400" />
          </div>
          <p className="text-zinc-500 font-medium">No responses yet</p>
          <p className="text-sm text-zinc-400 mt-2">Share your forms to start collecting feedback</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResponses.map((response) => {
            const form = forms.find(f => f.id === response.formId);
            const isSelected = selectedResponses.includes(response.id);

            return (
              <div 
                key={response.id} 
                className={`bg-white p-6 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-zinc-950 shadow-md' : 'border-zinc-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(response.id)}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-zinc-950">
                          {getFormName(response.formId)}
                        </h4>
                        {response.imported && (
                          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-bold flex items-center gap-1">
                            <Check size={12} />
                            Imported
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs text-zinc-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(response.submittedAt).toLocaleString()}
                        </span>
                        {response.respondentEmail ? (
                          <span className="flex items-center gap-1">
                            <Mail size={12} />
                            {response.respondentEmail}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            Anonymous
                          </span>
                        )}
                      </div>

                      {/* Answers */}
                      <div className="space-y-2">
                        {response.answers.map((answer) => (
                          <div key={answer.questionId} className="bg-zinc-50 p-3 rounded-lg">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                              {getQuestionText(response.formId, answer.questionId)}
                            </p>
                            <p className="text-zinc-900 font-medium">
                              {Array.isArray(answer.value) 
                                ? answer.value.join(', ') 
                                : String(answer.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this response?')) {
                        onDelete(response.id);
                      }
                    }}
                    className="p-2 hover:bg-rose-100 rounded-lg text-zinc-400 hover:text-rose-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
