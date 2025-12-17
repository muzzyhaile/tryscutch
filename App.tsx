import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { IngestionWizard } from './components/IngestionWizard';
import { AnalysisView } from './components/AnalysisView';
import { LandingPage } from './components/LandingPage';
import { SettingsView } from './components/SettingsView';
import { BillingView } from './components/BillingView';
import { ContextManager } from './components/ContextManager';
import { FormBuilder } from './components/FormBuilder';
import { FeedbackLibrary } from './components/FeedbackLibrary';
import { PublicForm } from './components/PublicForm';
import { ResponseViewer } from './components/ResponseViewer';
import { AuthView } from './components/AuthView';
import { Project, AnalysisResult } from './types';
import { FormResponse } from './types-forms';
import { analyzeFeedbackBatch } from './services/geminiService';
import { PLAN_CATALOG, PlanId } from './lib/plans';
import { useProjects } from './hooks/useProjects';
import { useContextData } from './hooks/useContextData';
import { useForms } from './hooks/useForms';
import { useFeedbackLibrary } from './hooks/useFeedbackLibrary';
import { useLanguage } from './hooks/useLanguage';
import { useAuth } from './hooks/useAuth';
import { Loader2, Plus, ArrowRight, LayoutGrid } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { QuotaExceededError } from './services/geminiService';
import { useNotification } from './lib/notification';
import { logger } from './lib/logger';
import { VIEW_STATES, ERROR_MESSAGES, CONFIRM_MESSAGES, ViewState } from './lib/constants';

const App: React.FC = () => {
  const initialPath = window.location.pathname;
  const initialFormMatch = initialPath.match(/\/f\/([^/]+)/);
  const initialFormIdParam = initialFormMatch ? initialFormMatch[1] : null;

  const { user, isLoading: authLoading, signOut } = useAuth();
  const { notify, confirm } = useNotification();

  // Custom hooks for state management with persistence
  const { projects, addProject, updateProject, deleteProject: removeProject } = useProjects(user?.id);
  const { contextData, setContextData } = useContextData(user?.id);
  const { forms, setForms, responses, setResponses, deleteResponse } = useForms(user?.id);
  const { entries: feedbackEntries, setEntries: setFeedbackEntries } = useFeedbackLibrary(user?.id);
  const { selectedLanguage, setSelectedLanguage } = useLanguage(user?.id);
  
  // Local component state
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [view, setView] = useState<ViewState>(VIEW_STATES.LANDING);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isFormView, setIsFormView] = useState(Boolean(initialFormIdParam));
  const [formIdParam, setFormIdParam] = useState<string | null>(initialFormIdParam);
  const [serverPlanId, setServerPlanId] = useState<PlanId>('starter');

  // If a user arrives already authenticated, skip the marketing landing page.
  useEffect(() => {
    if (!user) return;
    if (view === VIEW_STATES.LANDING) {
      setView(VIEW_STATES.LIST);
    }
  }, [user, view]);

  // Check URL params on mount
  useEffect(() => {
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
      const p = projects.find((proj) => proj.id === projectId);
      if (p) {
        setCurrentProject(p);
      }
    }
  }, [projects]);

  // Update form response counts
  useEffect(() => {
    setForms(prevForms => 
      prevForms.map(form => ({
        ...form,
        responseCount: responses.filter(r => r.formId === form.id).length
      }))
    );
  }, [responses, setForms]);

  // Keep a lightweight server-backed plan id for client-side UX checks.
  // Real enforcement happens in the Edge Function + DB.
  // NOTE: This hook must run unconditionally to satisfy the Rules of Hooks.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let cancelled = false;

    const run = async () => {
      try {
        // Bootstrap personal org + membership + starter subscription (RLS allows this).
        await supabase
          .from('organizations')
          .upsert({ id: userId, name: 'Personal' }, { onConflict: 'id', ignoreDuplicates: true });
        await supabase
          .from('organization_members')
          .upsert(
            { org_id: userId, user_id: userId, role: 'owner' },
            { onConflict: 'org_id,user_id', ignoreDuplicates: true }
          );
        await supabase
          .from('subscriptions')
          .upsert(
            { org_id: userId, plan_id: 'starter', status: 'active' },
            { onConflict: 'org_id', ignoreDuplicates: true }
          );

        const { data: sub, error } = await supabase
          .from('subscriptions')
          .select('plan_id')
          .eq('org_id', userId)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled && sub?.plan_id && (sub.plan_id === 'starter' || sub.plan_id === 'pro')) {
          setServerPlanId(sub.plan_id);
        }
      } catch {
        // If billing tables aren't deployed yet, keep starter.
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleFormSubmit = (response: FormResponse) => {
    setResponses(prev => [response, ...prev]);
    
    // Auto-import to analysis if enabled
    const form = forms.find(f => f.id === response.formId);
    if (form?.settings.autoImportToAnalysis) {
      // Store for later import - could be enhanced to auto-create analysis
      logger.info('Auto-import enabled for response', { responseId: response.id }, 'App');
    }
  }

  // SPECIAL RENDER FOR FORM VIEW (public)
  if (isFormView && formIdParam) {
    return <PublicForm formId={formIdParam} forms={forms} onSubmit={handleFormSubmit} />;
  }

  // Render Landing Page completely separate from the App Layout (show before auth)
  if (view === VIEW_STATES.LANDING) {
    return <LandingPage onStart={() => setView(VIEW_STATES.LIST)} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white text-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-600 font-semibold">
          <Loader2 className="animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleAnalyze = async (name: string, items: string[], context?: string) => {
    const plan = PLAN_CATALOG[serverPlanId];
    if (Number.isFinite(plan.limits.maxProjects) && projects.length >= plan.limits.maxProjects) {
      notify({
        type: 'warning',
        title: 'Project Limit Reached',
        message: ERROR_MESSAGES.PROJECT_LIMIT_REACHED(plan.name, plan.limits.maxProjects),
      });
      setView(VIEW_STATES.BILLING);
      return;
    }

    if (items.length > plan.limits.maxItemsPerAnalysis) {
      notify({
        type: 'warning',
        title: 'Items Limit Exceeded',
        message: ERROR_MESSAGES.ITEMS_LIMIT_EXCEEDED(plan.limits.maxItemsPerAnalysis, items.length),
      });
      setView(VIEW_STATES.BILLING);
      return;
    }

    const totalChars = items.reduce((sum, it) => sum + (it?.length || 0), 0) + (context?.length || 0);
    if (totalChars > plan.limits.maxCharsPerAnalysis) {
      notify({
        type: 'warning',
        title: 'Analysis Too Large',
        message: ERROR_MESSAGES.ANALYSIS_TOO_LARGE,
      });
      setView(VIEW_STATES.BILLING);
      return;
    }

    setIsLoading(true);
    
    // Create Draft Project
    const newProject: Project = {
      id: crypto.randomUUID(),
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

      addProject(completedProject);
      setCurrentProject(completedProject);
      setView(VIEW_STATES.ANALYSIS);
    } catch (error) {
      logger.error('Analysis failed', error, 'App');
      if (error instanceof QuotaExceededError) {
        notify({ type: 'error', title: 'Quota Exceeded', message: error.message });
        setView(VIEW_STATES.BILLING);
      } else {
        notify({ type: 'error', title: 'Analysis Failed', message: ERROR_MESSAGES.ANALYSIS_FAILED });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = (updatedProject: Project) => {
    updateProject(updatedProject);
    setCurrentProject(updatedProject);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      message: CONFIRM_MESSAGES.DELETE_PROJECT,
      type: 'danger',
      confirmText: 'Delete',
    });
    if (confirmed) {
      removeProject(id);
      if (currentProject?.id === id) {
        setView(VIEW_STATES.LIST);
        setCurrentProject(null);
      }
      notify({ type: 'success', message: 'Project deleted successfully' });
    }
  }

  const handleDeleteResponse = (id: string) => {
    deleteResponse(id);
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

  // SPECIAL RENDER FOR PRINT MODE
  if (isPrintMode && currentProject) {
      return (
        <div className="bg-white min-h-screen p-0 m-0">
             <AnalysisView project={currentProject} onUpdateProject={handleUpdateProject} isPrintView={true} selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
        </div>
      );
  }

  const renderContent = () => {
    if (view === VIEW_STATES.NEW) {
      return (
        <IngestionWizard
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          contextData={contextData}
          feedbackEntries={feedbackEntries}
          importOptions={{
            maxBytes: PLAN_CATALOG[serverPlanId].limits.importMaxFileBytes,
            maxTableRows: PLAN_CATALOG[serverPlanId].limits.importMaxTableRows,
          }}
        />
      );
    }

    if (view === VIEW_STATES.ANALYSIS && currentProject) {
      return <AnalysisView project={currentProject} onUpdateProject={handleUpdateProject} selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />;
    }

    if (view === VIEW_STATES.SETTINGS) {
      return (
        <SettingsView
          onBilling={() => {
            setView(VIEW_STATES.BILLING);
            setCurrentProject(null);
          }}
        />
      );
    }

    if (view === VIEW_STATES.BILLING) {
      return <BillingView userId={user?.id} projectsCount={projects.length} />;
    }

    if (view === VIEW_STATES.CONTEXT) {
      return <ContextManager contextData={contextData} onUpdate={setContextData} />;
    }

    if (view === VIEW_STATES.FORMS) {
      return <FormBuilder forms={forms} onUpdate={setForms} />;
    }

    if (view === VIEW_STATES.FEEDBACK) {
      return (
        <FeedbackLibrary
          entries={feedbackEntries}
          onUpdate={setFeedbackEntries}
          importOptions={{
            maxBytes: PLAN_CATALOG[serverPlanId].limits.importMaxFileBytes,
            maxTableRows: PLAN_CATALOG[serverPlanId].limits.importMaxTableRows,
          }}
        />
      );
    }

    if (view === VIEW_STATES.RESPONSES) {
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
                onClick={() => setView(VIEW_STATES.NEW)}
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
                onClick={() => setView(VIEW_STATES.NEW)}
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
                    setView(VIEW_STATES.ANALYSIS);
                }}
                className="group bg-white p-8 rounded-[2rem] border-2 border-zinc-100 hover:border-zinc-950 hover:shadow-2xl transition-all duration-300 cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 bg-zinc-950 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
                        {p.name.charAt(0).toUpperCase()}
                    </div>
                    {p.status === 'analyzing' && <Loader2 className="animate-spin text-zinc-400" size={24} />}
                    <button 
                        onClick={(e) => handleDeleteProject(p.id, e)}
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
      user={{
        name: (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? 'Account') as string,
        email: user?.email ?? undefined,
        avatarUrl: (user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture) as string | undefined,
      }}
      onNewProject={() => setView(VIEW_STATES.NEW)}
      onGoHome={() => {
          setView(VIEW_STATES.LIST);
          setCurrentProject(null);
      }}
      onSettings={() => {
          setView(VIEW_STATES.SETTINGS);
          setCurrentProject(null);
      }}
      onBilling={() => {
          setView(VIEW_STATES.BILLING);
          setCurrentProject(null);
      }}
      onContextLibrary={() => {
          setView(VIEW_STATES.CONTEXT);
          setCurrentProject(null);
      }}
      onFeedbackLibrary={() => {
        setView(VIEW_STATES.FEEDBACK);
        setCurrentProject(null);
      }}
      onForms={() => {
          setView(VIEW_STATES.FORMS);
          setCurrentProject(null);
      }}
      onResponses={() => {
          setView(VIEW_STATES.RESPONSES);
          setCurrentProject(null);
      }}
      currentProjectName={
          view === VIEW_STATES.SETTINGS ? 'Settings' : 
          view === VIEW_STATES.BILLING ? 'Billing' : 
          view === VIEW_STATES.CONTEXT ? 'Context Library' :
          view === VIEW_STATES.FORMS ? 'Forms' :
        view === VIEW_STATES.FEEDBACK ? 'Feedback Library' :
          view === VIEW_STATES.RESPONSES ? 'Responses' :
          currentProject?.name
      }
      onLogout={() => {
        // Navigate back to the marketing page immediately.
        setCurrentProject(null);
        setView(VIEW_STATES.LANDING);
        void signOut().catch((err) => {
          logger.error('Sign out failed', err, 'App');
          notify({ type: 'error', message: err instanceof Error ? err.message : ERROR_MESSAGES.SIGN_OUT_FAILED });
        });
      }}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;