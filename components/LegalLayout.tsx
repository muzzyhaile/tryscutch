import React from 'react';

type LegalLayoutProps = {
  title: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
};

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, children, maxWidthClassName = 'max-w-3xl' }) => {
  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white flex flex-col">
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className={`${maxWidthClassName} mx-auto px-6 h-16 flex items-center justify-between min-w-0`}>
          <a href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              T
            </div>
            <span className="font-bold text-lg tracking-tight">Tryscutch</span>
          </a>
          <div className="text-sm font-semibold text-zinc-500 min-w-0 max-w-[55%] text-right truncate">{title}</div>
        </div>
      </header>

      <main className={`${maxWidthClassName} mx-auto px-6 py-12 flex-1 w-full`}>
        <div className="space-y-8">{children}</div>
      </main>

      <footer className="border-t border-zinc-100 bg-zinc-50">
        <div className={`${maxWidthClassName} mx-auto px-6 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between`}>
          <div className="text-[11px] font-medium text-zinc-400">{new Date().getFullYear()} Tryscutch</div>
          <nav className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-400">
            <a href="/privacy" className="hover:text-zinc-950 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-zinc-950 transition-colors">Terms</a>
            <a href="/impressum" className="hover:text-zinc-950 transition-colors">Site Notice</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};
