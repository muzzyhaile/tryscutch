import React from 'react';

type SampleReportPageProps = {
  onBack?: () => void;
  onStart?: () => void;
};

export const SampleReportPage: React.FC<SampleReportPageProps> = ({ onBack, onStart }) => {
  const report = {
    title: 'Q4 2025 Product Feedback',
    subtitle: 'Example output (static sample)',
    dateLabel: 'Dec 2025',
    sources: ['Support tickets', 'NPS comments', 'Interview notes'],
    totalItems: 318,
    themes: [
      {
        name: 'Onboarding confusion',
        mentions: 92,
        share: 29,
        sentiment: 'negative' as const,
        priority: 8,
        summary:
          'Users struggle to get started. They ask for clearer first steps, sensible defaults, and a shorter setup path.',
        quotes: [
          'I love the idea, but I got stuck right away. I did not know what to upload first.',
          'The setup has too many options before I even see a result.',
        ],
      },
      {
        name: 'Reliability and edge cases',
        mentions: 74,
        share: 23,
        sentiment: 'mixed' as const,
        priority: 7,
        summary:
          'Imports and larger datasets can fail or feel inconsistent. People want clearer errors and more predictable output.',
        quotes: [
          'It worked once, then the next file gave me a blank result with no explanation.',
          'Large CSVs time out and I am not sure what to fix.',
        ],
      },
      {
        name: 'Reporting and sharing',
        mentions: 61,
        share: 19,
        sentiment: 'positive' as const,
        priority: 6,
        summary:
          'Teams like the summaries but want stronger exports and a cleaner way to share a report with stakeholders.',
        quotes: [
          'The summary is the first thing my boss actually reads.',
          'Export to Markdown is great, but I need a share link.',
        ],
      },
      {
        name: 'Pricing and limits clarity',
        mentions: 28,
        share: 9,
        sentiment: 'negative' as const,
        priority: 5,
        summary:
          'Users are unsure how usage is counted. They want a simple explanation of what they get and how to estimate cost.',
        quotes: [
          'I am not sure what counts as an item. A row, a sentence, a comment?',
          'I need a quick way to predict my monthly usage.',
        ],
      },
    ],
    execSummary:
      'Customers like the core idea, but friction is concentrated in onboarding and reliability. The fastest win is a guided first analysis with strong defaults and clearer import errors. Sharing is the main expansion lever once the first-run experience is smooth.',
    actions: [
      {
        title: 'Guided first analysis',
        detail: 'Add a short, opinionated “first report” flow with sample data and defaults.',
      },
      {
        title: 'Import errors that teach',
        detail: 'Surface row counts, detected text column, and actionable error messages immediately.',
      },
      {
        title: 'Shareable report outputs',
        detail: 'Improve exports and add a simple report link or stakeholder view.',
      },
    ],
  };

  const sentimentBadge = (sentiment: 'negative' | 'mixed' | 'positive') => {
    if (sentiment === 'positive') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (sentiment === 'mixed') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-rose-200 bg-rose-50 text-rose-700';
  };

  const priorityBadge = (score: number) => {
    if (score >= 8) return 'border-rose-200 bg-rose-50 text-rose-700';
    if (score >= 6) return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-zinc-200 bg-zinc-50 text-zinc-700';
  };

  return (
    <div className="space-y-10">
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-7 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">{report.subtitle}</div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-950">{report.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700">
                {report.dateLabel}
              </span>
              <span className="text-zinc-300">•</span>
              <span>{report.totalItems.toLocaleString()} items</span>
              <span className="text-zinc-300">•</span>
              <span>{report.sources.join(', ')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
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

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Executive summary</div>
            <p className="mt-2 text-zinc-700 leading-relaxed">{report.execSummary}</p>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Snapshot</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-zinc-950">Themes found</div>
                <div className="text-sm font-bold text-zinc-700">{report.themes.length}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-zinc-950">Top theme share</div>
                <div className="text-sm font-bold text-zinc-700">{report.themes[0]?.share ?? 0}%</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Sentiment mix (approx)</div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full bg-rose-500" style={{ width: '46%' }} />
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full bg-amber-500" style={{ width: '34%' }} />
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full bg-emerald-500" style={{ width: '20%' }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold text-zinc-600">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-500" />Negative</div>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />Mixed</div>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Positive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-zinc-200 bg-white p-7 md:p-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Theme overview</div>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">What customers are talking about</h2>
          </div>
          <div className="hidden md:block text-xs font-semibold text-zinc-500">Sorted by volume</div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
          <div className="grid grid-cols-12 gap-0 bg-zinc-50 px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-zinc-500">
            <div className="col-span-5">Theme</div>
            <div className="col-span-3">Share</div>
            <div className="col-span-2">Sentiment</div>
            <div className="col-span-2 text-right">Priority</div>
          </div>
          <div className="divide-y divide-zinc-200">
            {report.themes.map((t) => (
              <div key={t.name} className="grid grid-cols-12 gap-0 px-4 py-4">
                <div className="col-span-12 md:col-span-5">
                  <div className="text-sm font-bold text-zinc-950">{t.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">{t.mentions.toLocaleString()} mentions</div>
                  <div className="mt-2 text-sm text-zinc-700 leading-relaxed">{t.summary}</div>
                </div>

                <div className="col-span-12 md:col-span-3 mt-4 md:mt-0 md:pl-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                    <span>{t.share}%</span>
                    <span className="text-zinc-400">of mentions</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-zinc-950" style={{ width: `${t.share}%` }} />
                  </div>
                </div>

                <div className="col-span-6 md:col-span-2 mt-4 md:mt-0 md:pl-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${sentimentBadge(t.sentiment)}`}
                  >
                    {t.sentiment}
                  </span>
                </div>

                <div className="col-span-6 md:col-span-2 mt-4 md:mt-0 flex justify-end items-start">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${priorityBadge(t.priority)}`}
                    title="Sample priority score"
                  >
                    P{t.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-[2rem] border border-zinc-200 bg-white p-7 md:p-10">
          <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Verbatims</div>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">Representative quotes</h2>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
            These are example quotes to show how a report can include supporting evidence for each theme.
          </p>

          <div className="mt-6 space-y-6">
            {report.themes.slice(0, 3).map((t) => (
              <div key={t.name} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-zinc-950">{t.name}</div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${sentimentBadge(t.sentiment)}`}>
                    {t.sentiment}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {t.quotes.map((q) => (
                    <div key={q} className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="text-xs font-bold tracking-widest uppercase text-zinc-400">Quote</div>
                      <div className="mt-2 text-sm text-zinc-800 leading-relaxed">“{q}”</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-[2rem] border border-zinc-200 bg-white p-7 md:p-10">
          <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Recommended actions</div>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">What to do next</h2>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
            Example actions derived from the themes, phrased for quick roadmap discussion.
          </p>

          <div className="mt-6 space-y-3">
            {report.actions.map((a, idx) => (
              <div key={a.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-white text-xs font-extrabold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-950">{a.title}</div>
                    <div className="mt-1 text-sm text-zinc-700 leading-relaxed">{a.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
