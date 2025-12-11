import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { IngestionWizard } from './components/IngestionWizard';
import { AnalysisView } from './components/AnalysisView';
import { LandingPage } from './components/LandingPage';
import { SettingsView } from './components/SettingsView';
import { BillingView } from './components/BillingView';
import { ContextManager } from './components/ContextManager';
import { FormBuilder } from './components/FormBuilder';
import { PublicForm } from './components/PublicForm';
import { ResponseViewer } from './components/ResponseViewer';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Project, AnalysisResult, ContextData } from './types';
import { FeedbackForm, FormResponse } from './types-forms';
import { SupportedLanguage } from './types-languages';
import { analyzeFeedbackBatch } from './services/geminiService';
import { Loader2, Plus, ArrowRight, LayoutGrid } from 'lucide-react';

const STORAGE_KEY = 'clarity_voc_projects';
const CONTEXT_STORAGE_KEY = 'clarity_context_data';
const FORMS_STORAGE_KEY = 'clarity_feedback_forms';
const RESPONSES_STORAGE_KEY = 'clarity_form_responses';
const LANGUAGE_STORAGE_KEY = 'clarity_language';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [view, setView] = useState<'landing' | 'list' | 'new' | 'analysis' | 'settings' | 'billing' | 'context' | 'forms' | 'responses'>('landing');
  const [contextData, setContextData] = useState<ContextData>({
    icps: [],
    productInfos: [],
    marketFeedbacks: [],
    productPrinciples: []
  });
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isFormView, setIsFormView] = useState(false);
  const [formIdParam, setFormIdParam] = useState<string | null>(null);

  // Load from local storage on mount & Check for Print Mode
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let loadedProjects: Project[] = [];
    
    if (stored) {
      try {
        loadedProjects = JSON.parse(stored);
        setProjects(loadedProjects);
      } catch (e) {
        console.error("Failed to parse projects", e);
      }
    }

    // Load context data
    const storedContext = localStorage.getItem(CONTEXT_STORAGE_KEY);
    if (storedContext) {
      try {
        setContextData(JSON.parse(storedContext));
      } catch (e) {
        console.error("Failed to parse context data", e);
      }
    }

    // Load forms data
    const storedForms = localStorage.getItem(FORMS_STORAGE_KEY);
    if (storedForms) {
      try {
        setForms(JSON.parse(storedForms));
      } catch (e) {
        console.error("Failed to parse forms data", e);
      }
    }

    // Load responses data
    const storedResponses = localStorage.getItem(RESPONSES_STORAGE_KEY);
    if (storedResponses) {
      try {
        setResponses(JSON.parse(storedResponses));
      } catch (e) {
        console.error("Failed to parse responses data", e);
      }
    }

    // Load language preference
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
    if (storedLanguage) {
      setSelectedLanguage(storedLanguage);
    }

    // Check URL params for form view
    const path = window.location.pathname;
    const formMatch = path.match(/\/f\/([^/]+)/);
    if (formMatch) {
      setIsFormView(true);
      setFormIdParam(formMatch[1]);
      return;
    }

    // Check URL params for print mode
    const params = new URLSearchParams(window.location.search);
    const print = params.get('print');
    const projectId = params.get('projectId');

    if (print === 'true' && projectId) {
        setIsPrintMode(true);
        const p = loadedProjects.find((p) => p.id === projectId);
        if (p) {
            setCurrentProject(p);
            // We don't need to set view since we return early for print mode
        }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  // Save context data to localStorage
  useEffect(() => {
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(contextData));
  }, [contextData]);

  // Save forms data to localStorage
  useEffect(() => {
    localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
  }, [forms]);

  // Save responses data to localStorage
  useEffect(() => {
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(responses));
  }, [responses]);

  // Update form response counts
  useEffect(() => {
    setForms(prevForms => 
      prevForms.map(form => ({
        ...form,
        responseCount: responses.filter(r => r.formId === form.id).length
      }))
    );
  }, [responses]);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
  }, [selectedLanguage]);

  const handleAnalyze = async (name: string, items: string[], context?: string) => {
    setIsLoading(true);
    
    // Create Draft Project
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      status: 'analyzing',
      items: items.map((content, i) => ({ id: i.toString(), content })),
      context: context
    };

    try {
      const result: AnalysisResult = await analyzeFeedbackBatch(items, context);
      
      const completedProject: Project = {
        ...newProject,
        status: 'completed',
        analysis: result
      };

      setProjects(prev => [completedProject, ...prev]);
      setCurrentProject(completedProject);
      setView('analysis');
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again later or check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setCurrentProject(updatedProject);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this project?")) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if(currentProject?.id === id) {
            setView('list');
            setCurrentProject(null);
        }
    }
  }

  const handleFormSubmit = (response: FormResponse) => {
    setResponses(prev => [response, ...prev]);
    
    // Auto-import to analysis if enabled
    const form = forms.find(f => f.id === response.formId);
    if (form?.settings.autoImportToAnalysis) {
      // Store for later import - could be enhanced to auto-create analysis
      console.log('Auto-import enabled for response:', response.id);
    }
  }

  const handleDeleteResponse = (id: string) => {
    setResponses(prev => prev.filter(r => r.id !== id));
  }

  const handleImportResponses = async (responseIds: string[]) => {
    const responsesToImport = responses.filter(r => responseIds.includes(r.id));
    if (responsesToImport.length === 0) return;

    // Get form name for project
    const firstResponse = responsesToImport[0];
    const form = forms.find(f => f.id === firstResponse.formId);
    const projectName = `${form?.name || 'Form'} - Responses Import ${new Date().toLocaleDateString()}`;

    // Convert responses to feedback items
    const feedbackItems = responsesToImport.map(response => {
      const answerTexts = response.answers.map(a => {
        const question = forms.find(f => f.id === response.formId)?.questions.find(q => q.id === a.questionId);
        const value = Array.isArray(a.value) ? a.value.join(', ') : String(a.value);
        return `${question?.question || 'Question'}: ${value}`;
      });
      return answerTexts.join('\n');
    });

    // Mark as imported
    setResponses(prev => prev.map(r => 
      responseIds.includes(r.id) ? { ...r, imported: true } : r
    ));

    // Start analysis
    await handleAnalyze(projectName, feedbackItems);
  }

  // SPECIAL RENDER FOR FORM VIEW
  if (isFormView && formIdParam) {
    return <PublicForm formId={formIdParam} forms={forms} onSubmit={handleFormSubmit} />;
  }

  // SPECIAL RENDER FOR FORM VIEW
  if (isFormView && formIdParam) {
    return <PublicForm formId={formIdParam} forms={forms} onSubmit={handleFormSubmit} />;
  }

  // SPECIAL RENDER FOR PRINT MODE
  if (isPrintMode && currentProject) {
      return (
        <div className="bg-white min-h-screen p-0 m-0">
             <AnalysisView project={currentProject} onUpdateProject={handleUpdateProject} isPrintView={true} selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
        </div>
      );
  }

  // Render Landing Page completely separate from the App Layout
  if (view === 'landing') {
    return <LandingPage onStart={() => setView('list')} />;
  }

  const renderContent = () => {
    if (view === 'new') {
      return <IngestionWizard onAnalyze={handleAnalyze} isLoading={isLoading} contextData={contextData} />;
    }

    if (view === 'analysis' && currentProject) {
      return <AnalysisView project={currentProject} onUpdateProject={handleUpdateProject} selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />;
    }

    if (view === 'settings') {
      return <SettingsView />;
    }

    if (view === 'billing') {
      return <BillingView />;
    }

    if (view === 'context') {
      return <ContextManager contextData={contextData} onUpdate={setContextData} />;
    }

    if (view === 'forms') {
      return <FormBuilder forms={forms} onUpdate={setForms} />;
    }

    if (view === 'responses') {
      return <ResponseViewer 
        responses={responses} 
        forms={forms} 
        onDelete={handleDeleteResponse}
        onImport={handleImportResponses}
      />;
    }

    // Default: List View
    return (
      <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <div className="flex items-end justify-between border-b border-zinc-100 pb-8">
            <div>
                 <h1 className="text-5xl font-bold tracking-tighter text-zinc-950">Projects</h1>
                 <p className="text-xl text-zinc-500 mt-2 font-light">Manage and review your feedback analysis.</p>
            </div>
            <button 
                onClick={() => setView('new')}
                className="bg-zinc-950 text-white px-6 py-3 rounded-xl text-base font-bold hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-lg hover:scale-105 transform duration-200"
            >
                <Plus size={20} /> New Project
            </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-32 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <LayoutGrid className="text-zinc-300 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-950 mb-2">No projects yet</h3>
            <p className="text-zinc-500 max-w-md mx-auto mb-8 text-lg">Start by creating a new project to analyze your customer feedback.</p>
            <button 
                onClick={() => setView('new')}
                className="text-zinc-950 font-bold hover:underline text-lg"
            >
                Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(p => (
              <div 
                key={p.id}
                onClick={() => {
                    setCurrentProject(p);
                    setView('analysis');
                }}
                className="group bg-white p-8 rounded-[2rem] border-2 border-zinc-100 hover:border-zinc-950 hover:shadow-2xl transition-all duration-300 cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 bg-zinc-950 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
                        {p.name.charAt(0).toUpperCase()}
                    </div>
                    {p.status === 'analyzing' && <Loader2 className="animate-spin text-zinc-400" size={24} />}
                    <button 
                        onClick={(e) => deleteProject(p.id, e)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-2"
                    >
                        &times;
                    </button>
                </div>
                <h3 className="text-2xl font-bold text-zinc-950 mb-2 group-hover:text-indigo-600 transition-colors tracking-tight">{p.name}</h3>
                <p className="text-sm font-medium text-zinc-400 mb-6 uppercase tracking-wider">Created {new Date(p.createdAt).toLocaleDateString()}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                    <span className="text-sm font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                        {p.items.length} items
                    </span>
                    <span className="text-zinc-950 text-sm font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                        View Report <ArrowRight size={16} />
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout 
      onNewProject={() => setView('new')}
      onGoHome={() => {
          setView('list');
          setCurrentProject(null);
      }}
      onSettings={() => {
          setView('settings');
          setCurrentProject(null);
      }}
      onBilling={() => {
          setView('billing');
          setCurrentProject(null);
      }}
      onContextLibrary={() => {
          setView('context');
          setCurrentProject(null);
      }}
      onForms={() => {
          setView('forms');
          setCurrentProject(null);
      }}
      onResponses={() => {
          setView('responses');
          setCurrentProject(null);
      }}
      currentProjectName={
          view === 'settings' ? 'Settings' : 
          view === 'billing' ? 'Billing' : 
          view === 'context' ? 'Context Library' :
          view === 'forms' ? 'Forms' :
          view === 'responses' ? 'Responses' :
          currentProject?.name
      }
    >
      {renderContent()}
    </Layout>
  );
};

export default App;