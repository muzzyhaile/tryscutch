import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, Settings, Plus, LayoutGrid, CreditCard, FileText, Inbox, Library, LogOut, HelpCircle, Menu } from 'lucide-react';

type LayoutUser = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

interface LayoutProps {
  children: React.ReactNode;
  onNewProject: () => void;
  onGoHome: () => void;
  onSettings: () => void;
  onBilling: () => void;
  onHelp: () => void;
  onContextLibrary: () => void;
  onFeedbackLibrary: () => void;
  onForms: () => void;
  onResponses: () => void;
  onLogout: () => void;
  onPrivacy?: () => void;
  onTerms?: () => void;
  onImpressum?: () => void;
  currentProjectName?: string;
  currentPlanName?: string;
  workspaceLabel?: string;
  user?: LayoutUser;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, 
    onNewProject, 
    onGoHome, 
    onSettings,
    onBilling,
    onHelp,
    onContextLibrary,
  onFeedbackLibrary,
    onForms,
    onResponses,
    onLogout,
    onPrivacy,
    onTerms,
    onImpressum,
    currentProjectName,
    currentPlanName,
    workspaceLabel,
    user,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    const raw = user?.name?.trim() || user?.email?.trim() || 'Account';
    return raw;
  }, [user?.email, user?.name]);

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? 'U';
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
    return `${first}${second ?? ''}`.toUpperCase();
  }, [displayName]);

  useEffect(() => {
    if (!isUserMenuOpen && !isMobileNavOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(target)) {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [isUserMenuOpen, isMobileNavOpen]);

  return (
    <div className="flex h-screen bg-white text-zinc-950 font-sans overflow-hidden selection:bg-zinc-900 selection:text-white">
      {/* Sidebar */}
      <aside className="w-72 border-r-2 border-zinc-100 bg-zinc-50/50 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="p-8 cursor-pointer" onClick={onGoHome}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-zinc-200">S</div>
              <span className="text-2xl font-bold tracking-tighter text-zinc-950">Scutch</span>
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
                onClick={onForms}
                className="group flex items-center gap-4 w-full px-4 py-3 text-base font-semibold text-zinc-500 rounded-xl hover:bg-white hover:text-zinc-950 hover:shadow-sm transition-all text-left border border-transparent hover:border-zinc-200"
            >
              <FileText size={20} className="group-hover:scale-110 transition-transform"/>
              Forms
            </button>
            <button 
                onClick={onFeedbackLibrary}
                className="group flex items-center gap-4 w-full px-4 py-3 text-base font-semibold text-zinc-500 rounded-xl hover:bg-white hover:text-zinc-950 hover:shadow-sm transition-all text-left border border-transparent hover:border-zinc-200"
            >
              <Library size={20} className="group-hover:scale-110 transition-transform"/>
              Feedback Library
            </button>
            <button 
                onClick={onResponses}
                className="group flex items-center gap-4 w-full px-4 py-3 text-base font-semibold text-zinc-500 rounded-xl hover:bg-white hover:text-zinc-950 hover:shadow-sm transition-all text-left border border-transparent hover:border-zinc-200"
            >
              <Inbox size={20} className="group-hover:scale-110 transition-transform"/>
              Responses
            </button>
            <button 
                onClick={onSettings}
                className="group flex items-center gap-4 w-full px-4 py-3 text-base font-semibold text-zinc-500 rounded-xl hover:bg-white hover:text-zinc-950 hover:shadow-sm transition-all text-left border border-transparent hover:border-zinc-200"
            >
              <Settings size={20} className="group-hover:scale-110 transition-transform"/>
              Settings
            </button>

            <button 
                onClick={onBilling}
                className="group flex items-center gap-4 w-full px-4 py-3 text-base font-semibold text-zinc-500 rounded-xl hover:bg-white hover:text-zinc-950 hover:shadow-sm transition-all text-left border border-transparent hover:border-zinc-200"
            >
              <CreditCard size={20} className="group-hover:scale-110 transition-transform"/>
              Billing & Plans
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
              <div className="text-sm font-bold text-zinc-900">{currentPlanName ? `${currentPlanName} Plan` : 'Plan'}</div>
              <div className="text-xs text-zinc-400 group-hover:text-indigo-600 transition-colors">{workspaceLabel || 'Personal'}</div>
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
        <header className="h-20 border-b border-zinc-100 flex items-center justify-between px-4 sm:px-6 md:px-12 shrink-0 z-10 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2 md:hidden" ref={mobileNavRef}>
            <button
              type="button"
              onClick={() => {
                setIsMobileNavOpen((v) => !v);
                setIsUserMenuOpen(false);
              }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
              aria-label="Open navigation"
              aria-haspopup="menu"
              aria-expanded={isMobileNavOpen}
            >
              <Menu size={18} className="text-zinc-700" />
            </button>

            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center text-white text-sm font-bold">S</div>
              <span className="font-bold text-lg text-zinc-950 tracking-tight">Scutch</span>
            </div>

            {isMobileNavOpen && (
              <div
                role="menu"
                className="absolute left-4 right-4 top-[5.25rem] rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200 overflow-hidden max-h-[calc(100vh-7rem)] overflow-y-auto"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onGoHome();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <LayoutGrid size={18} className="text-zinc-400" />
                  Projects
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onForms();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <FileText size={18} className="text-zinc-400" />
                  Forms
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onFeedbackLibrary();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Library size={18} className="text-zinc-400" />
                  Feedback Library
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onResponses();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Inbox size={18} className="text-zinc-400" />
                  Responses
                </button>
                <div className="h-px bg-zinc-100" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onSettings();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Settings size={18} className="text-zinc-400" />
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onBilling();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <CreditCard size={18} className="text-zinc-400" />
                  Billing
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onContextLibrary();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Layers size={18} className="text-zinc-400" />
                  Contexts
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onHelp();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <HelpCircle size={18} className="text-zinc-400" />
                  Help
                </button>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-400">
             <span className="text-zinc-900">Workspace</span>
             <span>/</span>
             <span className={currentProjectName ? 'text-zinc-950 font-bold' : ''}>
               {currentProjectName || 'Dashboard'}
             </span>
          </div>
          <div className="flex items-center gap-3" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((v) => !v)}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50 transition-colors"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              title={displayName}
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-extrabold tracking-wide">{initials}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-bold text-zinc-950 max-w-[12rem] truncate">{user?.name || 'Account'}</span>
                <span className="text-xs font-medium text-zinc-400 max-w-[12rem] truncate">{user?.email || ''}</span>
              </div>
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-4 sm:right-6 md:right-12 top-[5.25rem] w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200 overflow-hidden max-h-[calc(100vh-7rem)] overflow-y-auto"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onSettings();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Settings size={18} className="text-zinc-400" />
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onBilling();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <CreditCard size={18} className="text-zinc-400" />
                  Billing
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onHelp();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <HelpCircle size={18} className="text-zinc-400" />
                  Help & Onboarding
                </button>

                <div className="h-px bg-zinc-100" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <LogOut size={18} className="text-zinc-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12 lg:p-16">
            {children}
          </div>
        </div>

        <footer className="border-t border-zinc-100 bg-white shrink-0">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-[11px] font-medium text-zinc-400">© {new Date().getFullYear()} Scutch</div>
            <nav className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-400">
              <button
                type="button"
                onClick={onPrivacy}
                className="hover:text-zinc-950 transition-colors"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={onTerms}
                className="hover:text-zinc-950 transition-colors"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={onImpressum}
                className="hover:text-zinc-950 transition-colors"
              >
                Site Notice
              </button>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
};