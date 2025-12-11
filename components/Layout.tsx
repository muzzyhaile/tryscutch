import React from 'react';
import { Layers, Settings, Plus, LayoutGrid, LogOut, Users, Package, TrendingUp } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onNewProject: () => void;
  onGoHome: () => void;
  onSettings: () => void;
  onBilling: () => void;
  onContextLibrary: () => void;
  currentProjectName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, 
    onNewProject, 
    onGoHome, 
    onSettings,
    onBilling,
    onContextLibrary,
    currentProjectName 
}) => {
  return (
    <div className="flex h-screen bg-white text-zinc-950 font-sans overflow-hidden selection:bg-zinc-900 selection:text-white">
      {/* Sidebar */}
      <aside className="w-72 border-r-2 border-zinc-100 bg-zinc-50/50 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="p-8 cursor-pointer" onClick={onGoHome}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-zinc-200">C</div>
              <span className="text-2xl font-bold tracking-tighter text-zinc-950">Clarity</span>
            </div>
          </div>

          <nav className="px-6 space-y-2">
            <div className="px-4 py-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">Workspace</div>
            <button 
                onClick={onGoHome}
                className="group flex items-center gap-4 w-full px-4 py-3 text-base font-semibold text-zinc-500 rounded-xl hover:bg-white hover:text-zinc-950 hover:shadow-sm transition-all text-left border border-transparent hover:border-zinc-200"
            >
              <LayoutGrid size={20} className="group-hover:scale-110 transition-transform"/>
              Projects
            </button>
            <button 
                onClick={onSettings}
                className="group flex items-center gap-4 w-full px-4 py-3 text-base font-semibold text-zinc-500 rounded-xl hover:bg-white hover:text-zinc-950 hover:shadow-sm transition-all text-left border border-transparent hover:border-zinc-200"
            >
              <Settings size={20} className="group-hover:scale-110 transition-transform"/>
              Settings
            </button>
            
            <div className="px-4 py-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mt-8">Context Library</div>
            <button 
                onClick={onContextLibrary}
                className="group flex items-center gap-4 w-full px-4 py-3 text-base font-semibold text-zinc-500 rounded-xl hover:bg-white hover:text-zinc-950 hover:shadow-sm transition-all text-left border border-transparent hover:border-zinc-200"
            >
              <Layers size={20} className="group-hover:scale-110 transition-transform"/>
              Manage Contexts
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-zinc-200/50 bg-white">
            <div 
                onClick={onBilling}
                className="flex items-center gap-3 mb-6 px-2 cursor-pointer hover:bg-zinc-50 p-2 rounded-lg transition-colors group"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md group-hover:scale-110 transition-transform"></div>
                <div>
                    <div className="text-sm font-bold text-zinc-900">Pro Plan</div>
                    <div className="text-xs text-zinc-400 group-hover:text-indigo-600 transition-colors">workspace.team</div>
                </div>
            </div>
           <button 
            onClick={onNewProject}
            className="flex items-center justify-center gap-2 w-full bg-zinc-950 hover:bg-zinc-800 text-white px-6 py-4 rounded-xl text-base font-bold transition-all shadow-xl shadow-zinc-200 hover:shadow-2xl hover:scale-[1.02]"
           >
             <Plus size={20} strokeWidth={3} />
             New Analysis
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
        <header className="h-20 border-b border-zinc-100 flex items-center justify-between px-8 md:px-12 shrink-0 z-10 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2 md:hidden">
             <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center text-white text-sm font-bold">C</div>
             <span className="font-bold text-lg text-zinc-950 tracking-tight">Clarity</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-400">
             <span className="text-zinc-900">Workspace</span>
             <span>/</span>
             <span className={currentProjectName ? 'text-zinc-950 font-bold' : ''}>
               {currentProjectName || 'Dashboard'}
             </span>
          </div>
          <div className="flex items-center gap-4">
              <button className="p-2 text-zinc-400 hover:text-zinc-950 transition-colors">
                  <LogOut size={20} />
              </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-16">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};