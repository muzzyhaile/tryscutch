import React from 'react';

type LegalLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white">
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="font-bold text-lg tracking-tight">Scutch</span>
          </a>
          <div className="text-sm font-semibold text-zinc-500">{title}</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-8">{children}</div>
      </main>

      <footer className="border-t border-zinc-100 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
          <div className="text-xs font-medium text-zinc-400">© {new Date().getFullYear()} Scutch</div>
          <nav className="flex gap-6 text-sm font-semibold text-zinc-500">
            <a href="/privacy" className="hover:text-zinc-950 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-zinc-950 transition-colors">Terms &amp; Conditions</a>
            <a href="/impressum" className="hover:text-zinc-950 transition-colors">Impressum</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};
