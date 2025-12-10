import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { IngestionWizard } from './components/IngestionWizard';
import { AnalysisView } from './components/AnalysisView';
import { LandingPage } from './components/LandingPage';
import { Project, AnalysisStatus, AnalysisResult } from './types';
import { analyzeFeedbackBatch } from './services/geminiService';
import { Loader2, Plus, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'clarity_voc_projects';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [view, setView] = useState<'landing' | 'list' | 'new' | 'analysis'>('landing');
  const [isLoading, setIsLoading] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse projects", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  const handleAnalyze = async (name: string, items: string[]) => {
    setIsLoading(true);
    
    // Create Draft Project
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      status: 'analyzing',
      items: items.map((content, i) => ({ id: i.toString(), content })),
    };

    try {
      const result: AnalysisResult = await analyzeFeedbackBatch(items);
      
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

  // Render Landing Page completely separate from the App Layout
  if (view === 'landing') {
    return <LandingPage onStart={() => setView('list')} />;
  }

  const renderContent = () => {
    if (view === 'new') {
      return <IngestionWizard onAnalyze={handleAnalyze} isLoading={isLoading} />;
    }

    if (view === 'analysis' && currentProject) {
      return <AnalysisView project={currentProject} />;
    }

    // Default: List View
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-3xl font-bold text-zinc-900">Your Projects</h1>
                 <p className="text-zinc-500 mt-1">Manage and review your feedback analysis.</p>
            </div>
            <button 
                onClick={() => setView('new')}
                className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
                <Plus size={16} /> New Project
            </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-zinc-200">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900">No projects yet</h3>
            <p className="text-zinc-500 max-w-sm mx-auto mt-2 mb-6">Start by creating a new project to analyze your customer feedback.</p>
            <button 
                onClick={() => setView('new')}
                className="text-indigo-600 font-medium hover:underline"
            >
                Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
              <div 
                key={p.id}
                onClick={() => {
                    setCurrentProject(p);
                    setView('analysis');
                }}
                className="group bg-white p-6 rounded-xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
                        {p.name.charAt(0).toUpperCase()}
                    </div>
                    {p.status === 'analyzing' && <Loader2 className="animate-spin text-zinc-400" size={18} />}
                    <button 
                        onClick={(e) => deleteProject(p.id, e)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                    >
                        &times;
                    </button>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-1 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">Created {new Date(p.createdAt).toLocaleDateString()}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
                        {p.items.length} items
                    </span>
                    <span className="text-indigo-600 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Report <ArrowRight size={14} />
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
    >
      {renderContent()}
    </Layout>
  );
};

export default App;