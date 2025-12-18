import React, { useState } from 'react';
import { FeedbackForm, FormQuestion, FormTemplate, FORM_TEMPLATES, FormSettings } from '../types-forms';
import { Plus, Edit2, Trash2, Copy, ExternalLink, X, Save, Eye, Settings as SettingsIcon, GripVertical, Check } from 'lucide-react';
import { slugify } from '../lib/slug';

interface FormBuilderProps {
  forms: FeedbackForm[];
  onUpdate: (forms: FeedbackForm[]) => void;
  publicName?: string;
  publicSlug?: string;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ forms, onUpdate, publicName, publicSlug }) => {
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [settings, setSettings] = useState<FormSettings>({
    allowAnonymous: true,
    requireEmail: false,
    showBranding: true,
    autoImportToAnalysis: true,
    theme: 'light'
  });
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const generateShareableLink = (formId: string) => {
    const cleanedSlug = (publicSlug ?? '').trim();
    if (cleanedSlug) return `${window.location.origin}/${cleanedSlug}/${formId}`;

    const cleanedName = (publicName ?? '').trim();
    if (!cleanedName) return `${window.location.origin}/f/${formId}`;
    const slug = slugify(cleanedName) || 'company';
    return `${window.location.origin}/${slug}/${formId}`;
  };

  const handleCreateFromTemplate = (template: FormTemplate) => {
    setFormName(template.name);
    setFormDescription(template.description);
    setQuestions(template.questions.map((q, i) => ({
      ...q,
      id: `q-${crypto.randomUUID()}-${i}`
    })));
    setShowTemplates(false);
    setIsEditing(true);
  };

  const handleCreateBlank = () => {
    setFormName('');
    setFormDescription('');
    setQuestions([]);
    setIsEditing(true);
    setShowTemplates(false);
  };

  const handleAddQuestion = () => {
    const newQuestion: FormQuestion = {
      id: `q-${crypto.randomUUID()}`,
      type: 'long-text',
      question: '',
      required: false,
      order: questions.length + 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleSaveForm = () => {
    if (!formName || questions.length === 0) return;

    const formId = selectedForm?.id || crypto.randomUUID();
    const newForm: FeedbackForm = {
      id: formId,
      name: formName,
      description: formDescription,
      questions,
      isActive: selectedForm?.isActive ?? true,
      createdAt: selectedForm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shareableLink: generateShareableLink(formId),
      responseCount: selectedForm?.responseCount || 0,
      settings
    };

    if (selectedForm) {
      onUpdate(forms.map(f => f.id === selectedForm.id ? newForm : f));
    } else {
      onUpdate([...forms, newForm]);
    }

    resetForm();
  };

  const resetForm = () => {
    setSelectedForm(null);
    setIsEditing(false);
    setFormName('');
    setFormDescription('');
    setQuestions([]);
    setSettings({
      allowAnonymous: true,
      requireEmail: false,
      showBranding: true,
      autoImportToAnalysis: true,
      theme: 'light'
    });
  };

  const handleEditForm = (form: FeedbackForm) => {
    setSelectedForm(form);
    setFormName(form.name);
    setFormDescription(form.description || '');
    setQuestions(form.questions);
    setSettings(form.settings);
    setIsEditing(true);
  };

  const handleDeleteForm = (id: string) => {
    if (confirm('Delete this form? All responses will be kept but the form will no longer accept submissions.')) {
      onUpdate(forms.filter(f => f.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    onUpdate(forms.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
  };

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getQuestionTypeLabel = (type: FormQuestion['type']) => {
    const labels = {
      'short-text': 'Short Text',
      'long-text': 'Long Text',
      'rating': 'Star Rating',
      'nps': 'NPS (0-10)',
      'scale': 'Scale',
      'multiple-choice': 'Multiple Choice',
      'checkbox': 'Checkboxes',
      'email': 'Email'
    };
    return labels[type];
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-zinc-950 mb-2">Feedback Forms</h1>
        <p className="text-zinc-500 text-lg">Create shareable forms to collect customer feedback</p>
      </div>

      {!isEditing && !showTemplates && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
          >
            <Plus size={20} />
            New Form
          </button>
        </div>
      )}

      {/* Template Selection */}
      {showTemplates && (
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Choose a Template</h3>
            <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-zinc-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <button
            onClick={handleCreateBlank}
            className="w-full p-6 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-950 hover:bg-zinc-50 transition-all text-left"
          >
            <h4 className="font-bold text-lg text-zinc-950 mb-2">Blank Form</h4>
            <p className="text-zinc-500">Start from scratch and build your own custom form</p>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FORM_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleCreateFromTemplate(template)}
                className="p-6 rounded-xl border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 transition-all text-left"
              >
                <h4 className="font-bold text-lg text-zinc-950 mb-2">{template.name}</h4>
                <p className="text-zinc-500 text-sm mb-3">{template.description}</p>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {template.questions.length} questions
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Editor */}
      {isEditing && (
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">{selectedForm ? 'Edit Form' : 'New Form'}</h3>
            <button onClick={resetForm} className="p-2 hover:bg-zinc-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest mb-2 block">Form Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Q4 Customer Feedback"
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest mb-2 block">Description (Optional)</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Tell respondents what this form is about..."
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={2}
              />
            </div>

            {/* Questions */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Questions</label>
              
              {questions.map((question, index) => (
                <div key={question.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 cursor-move text-zinc-400">
                      <GripVertical size={20} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <select
                          value={question.type}
                          onChange={(e) => handleUpdateQuestion(question.id, { type: e.target.value as FormQuestion['type'] })}
                          className="px-3 py-2 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium text-sm"
                        >
                          <option value="short-text">Short Text</option>
                          <option value="long-text">Long Text</option>
                          <option value="rating">Star Rating</option>
                          <option value="nps">NPS (0-10)</option>
                          <option value="scale">Scale</option>
                          <option value="email">Email</option>
                        </select>
                        
                        <label className="flex items-center gap-2 text-sm text-zinc-600">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => handleUpdateQuestion(question.id, { required: e.target.checked })}
                            className="rounded"
                          />
                          Required
                        </label>
                      </div>

                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => handleUpdateQuestion(question.id, { question: e.target.value })}
                        placeholder="Enter your question..."
                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                      />

                      {(question.type === 'short-text' || question.type === 'long-text') && (
                        <input
                          type="text"
                          value={question.placeholder || ''}
                          onChange={(e) => handleUpdateQuestion(question.id, { placeholder: e.target.value })}
                          placeholder="Placeholder text..."
                          className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none text-sm"
                        />
                      )}

                      {(question.type === 'rating' || question.type === 'scale') && (
                        <div className="flex gap-3">
                          <input
                            type="number"
                            value={question.min || 1}
                            onChange={(e) => handleUpdateQuestion(question.id, { min: parseInt(e.target.value) })}
                            placeholder="Min"
                            className="w-20 px-3 py-2 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none text-sm"
                          />
                          <input
                            type="number"
                            value={question.max || 5}
                            onChange={(e) => handleUpdateQuestion(question.id, { max: parseInt(e.target.value) })}
                            placeholder="Max"
                            className="w-20 px-3 py-2 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none text-sm"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 hover:bg-rose-100 rounded-lg text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddQuestion}
                className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl hover:border-zinc-950 hover:bg-zinc-50 transition-all text-zinc-500 hover:text-zinc-950 font-bold"
              >
                + Add Question
              </button>
            </div>

            {/* Settings */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-700 uppercase tracking-widest">
                <SettingsIcon size={16} />
                Form Settings
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={settings.allowAnonymous}
                    onChange={(e) => setSettings({ ...settings, allowAnonymous: e.target.checked })}
                    className="rounded"
                  />
                  Allow anonymous responses
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={settings.requireEmail}
                    onChange={(e) => setSettings({ ...settings, requireEmail: e.target.checked })}
                    className="rounded"
                  />
                  Require email address
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={settings.autoImportToAnalysis}
                    onChange={(e) => setSettings({ ...settings, autoImportToAnalysis: e.target.checked })}
                    className="rounded"
                  />
                  Auto-import responses to analysis
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveForm}
              disabled={!formName || questions.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              Save Form
            </button>
          </div>
        </div>
      )}

      {/* Forms List */}
      {!isEditing && !showTemplates && (
        <div className="space-y-4">
          {forms.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={28} className="text-zinc-400" />
              </div>
              <p className="text-zinc-500 font-medium">No forms yet</p>
              <p className="text-sm text-zinc-400 mt-2">Create your first feedback form to start collecting insights</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {forms.map((form) => {
                const shareLink = generateShareableLink(form.id);
                return (
                  <div key={form.id} className="bg-white p-6 rounded-xl border border-zinc-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-bold text-zinc-950">{form.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded font-bold ${form.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                            {form.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {form.description && <p className="text-zinc-500 text-sm mb-2">{form.description}</p>}
                        <div className="flex gap-4 text-xs text-zinc-400">
                          <span>{form.questions.length} questions</span>
                          <span>•</span>
                          <span>{form.responseCount} responses</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(form.id)}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950"
                          title={form.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditForm(form)}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form.id)}
                          className="p-2 hover:bg-rose-100 rounded-lg text-zinc-500 hover:text-rose-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {form.isActive && (
                      <div className="pt-4 border-t border-zinc-100">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={shareLink}
                            readOnly
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-mono text-zinc-600"
                          />
                          <button
                            onClick={() => copyToClipboard(shareLink)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white rounded-lg font-bold hover:bg-zinc-800 transition-all text-sm"
                          >
                            {copiedLink === shareLink ? <Check size={16} /> : <Copy size={16} />}
                            {copiedLink === shareLink ? 'Copied!' : 'Copy Link'}
                          </button>
                          <a
                            href={shareLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 transition-all"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
