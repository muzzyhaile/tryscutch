import React from 'react';
import { Layers, Settings, Plus } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onNewProject: () => void;
  onGoHome: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNewProject, onGoHome }) => {
  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 cursor-pointer" onClick={onGoHome}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="text-xl font-semibold tracking-tight text-zinc-900">Clarity</span>
            </div>
          </div>

          <nav className="px-4 space-y-1">
            <button 
                onClick={onGoHome}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-zinc-600 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-left"
            >
              <Layers size={18} />
              Projects
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-zinc-600 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-left">
              <Settings size={18} />
              Settings
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-100">
           <button 
            onClick={onNewProject}
            className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
           >
             <Plus size={16} />
             New Analysis
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-zinc-200 bg-white/50 backdrop-blur-sm flex items-center justify-between px-6 md:px-12 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-2 md:hidden">
             <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
             <span className="font-semibold text-zinc-900">Clarity</span>
          </div>
          <div className="hidden md:block text-sm text-zinc-500">
             Voice of Customer Intelligence
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};