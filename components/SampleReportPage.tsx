import React from 'react';

type SampleReportPageProps = {
  onBack?: () => void;
  onStart?: () => void;
};

export const SampleReportPage: React.FC<SampleReportPageProps> = ({ onBack, onStart }) => {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Sample report</h1>
        <p className="text-zinc-600 leading-relaxed">
          This is a lightweight example of what Scutch produces from raw feedback. Your real output depends on your data.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-colors"
          >
            Try it free
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-50 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Executive summary</div>
          <p className="mt-2 text-zinc-700 leading-relaxed">
            Customers like the core product, but frustration is rising around onboarding and reliability. The biggest opportunity is to reduce
            setup confusion and prevent “it didn’t work” moments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Theme: Onboarding confusion',
              meta: 'Volume: High · Sentiment: Negative',
              bullets: ['Unclear first steps', 'Missing examples', 'Too many settings upfront'],
            },
            {
              title: 'Theme: Reliability + edge cases',
              meta: 'Volume: Medium · Sentiment: Mixed',
              bullets: ['Imports fail silently', 'Large files time out', 'Inconsistent results week-to-week'],
            },
            {
              title: 'Theme: Reporting + sharing',
              meta: 'Volume: Medium · Sentiment: Positive',
              bullets: ['Summaries save time', 'Shareable output is useful', 'Export formats requested'],
            },
            {
              title: 'Theme: Pricing clarity',
              meta: 'Volume: Low · Sentiment: Negative',
              bullets: ['Confusing limits', 'Hard to estimate usage', 'Need a simple “what do I get” view'],
            },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <div className="text-sm font-bold text-zinc-950">{card.title}</div>
              <div className="mt-1 text-xs font-semibold text-zinc-500">{card.meta}</div>
              <ul className="mt-3 space-y-1 text-sm text-zinc-700">
                {card.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-[0.35rem] h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Next actions</div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-zinc-700">
            <div className="rounded-xl border border-zinc-100 bg-white p-4">
              <span className="font-bold text-zinc-950">1)</span> Add a guided “first analysis” flow with sample data and clear defaults.
            </div>
            <div className="rounded-xl border border-zinc-100 bg-white p-4">
              <span className="font-bold text-zinc-950">2)</span> Improve import error reporting and surface failures immediately.
            </div>
            <div className="rounded-xl border border-zinc-100 bg-white p-4">
              <span className="font-bold text-zinc-950">3)</span> Provide a one-page “usage & limits” explanation next to pricing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
