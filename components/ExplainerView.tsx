import React from 'react';
import { ArrowRight, ClipboardList, FileText, Inbox, CreditCard, Sparkles, ShieldCheck } from 'lucide-react';

type ExplainerViewProps = {
  onStartNewAnalysis: () => void;
  onOpenForms: () => void;
  onOpenResponses: () => void;
  onOpenBilling: () => void;
};

export const ExplainerView: React.FC<ExplainerViewProps> = ({
  onStartNewAnalysis,
  onOpenForms,
  onOpenResponses,
  onOpenBilling,
}) => {
  return (
    <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4 border-b border-zinc-100 pb-8">
        <h1 className="text-5xl font-bold tracking-tighter text-zinc-950">Help & Onboarding</h1>
        <p className="text-xl text-zinc-500 font-light">
          Scutch helps you turn raw customer feedback into themes, sentiment, and actionable insights.
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-100 rounded-xl">
            <Sparkles className="w-6 h-6 text-zinc-950" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">5-minute quickstart</h2>
        </div>

        <ol className="space-y-4">
          {[
            {
              title: 'Create an analysis',
              desc: 'Click “New Analysis”, name it, then upload a CSV/XLSX/PDF/text or paste feedback lines.',
            },
            {
              title: 'Add context (optional)',
              desc: 'Select saved context blocks or paste extra notes to steer analysis (product, ICP, constraints).',
            },
            {
              title: 'Run analysis',
              desc: 'Scutch clusters feedback into themes and produces summaries and sentiment signals.',
            },
            {
              title: 'Review and iterate',
              desc: 'Rename themes, refine context, export results, and share the report with your team.',
            },
            {
              title: 'Make it repeatable',
              desc: 'Use Forms + Responses to collect fresh feedback continuously and import it into a new analysis.',
            },
          ].map((s, idx) => (
            <li key={s.title} className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center font-black text-zinc-400">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-zinc-950">{s.title}</div>
                  <div className="text-zinc-500 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onStartNewAnalysis}
            className="px-6 py-4 bg-zinc-950 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            Start a new analysis
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            onClick={onOpenForms}
            className="px-6 py-4 border-2 border-zinc-200 rounded-2xl text-zinc-950 font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            Open Forms
          </button>
          <button
            type="button"
            onClick={onOpenResponses}
            className="px-6 py-4 border-2 border-zinc-200 rounded-2xl text-zinc-950 font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
          >
            <Inbox size={18} />
            Open Responses
          </button>
        </div>
      </section>

      <section className="space-y-6 pt-8 border-t border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-100 rounded-xl">
            <ClipboardList className="w-6 h-6 text-zinc-950" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Common workflows</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl border border-zinc-100 bg-white">
            <div className="font-bold text-zinc-950 text-lg mb-2">Analyze a spreadsheet export</div>
            <p className="text-zinc-500 leading-relaxed">
              Export tickets/reviews to CSV/XLSX, upload, choose the text column, and analyze.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-zinc-100 bg-white">
            <div className="font-bold text-zinc-950 text-lg mb-2">Collect feedback continuously</div>
            <p className="text-zinc-500 leading-relaxed">
              Create a Form, share the public link, then import Responses into an analysis whenever you want.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6 pt-8 border-t border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-100 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-zinc-950" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Privacy & limits</h2>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/50">
            <div className="font-bold text-zinc-950 text-lg mb-2">What data is stored?</div>
            <p className="text-zinc-500 leading-relaxed">
              Your projects, forms, and responses are stored in Supabase for persistence. Analysis runs via the Gemini Edge Function.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/50">
            <div className="font-bold text-zinc-950 text-lg mb-2">How do limits work?</div>
            <p className="text-zinc-500 leading-relaxed">
              Plans limit projects, feedback items per analysis, and imported file size. Upgrade if you regularly analyze larger datasets.
            </p>
            <button
              type="button"
              onClick={onOpenBilling}
              className="mt-4 px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-zinc-950 font-bold hover:bg-zinc-50 transition-colors inline-flex items-center gap-2"
            >
              <CreditCard size={18} />
              Open Billing
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
