import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Zap, BarChart3, Layers, FileText, Download, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('scutch_invite_code');
      setInviteCode(stored && stored.trim() ? stored.trim() : null);
    } catch {
      setInviteCode(null);
    }
  }, []);

  const clearInvite = () => {
    try {
      localStorage.removeItem('scutch_invite_code');
    } catch {
      // ignore
    }
    setInviteCode(null);
  };

  const maskedInviteCode = (code: string) => {
    const trimmed = code.trim();
    if (trimmed.length <= 8) return trimmed;
    return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
  };

  return (
    <div className="bg-white min-h-screen font-sans text-zinc-950 selection:bg-black selection:text-white flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">S</div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tighter">Scutch</span>
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-zinc-600">
                Beta
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-600">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How it Works</a>
            <a href="#about" className="hover:text-black transition-colors">About</a>
            <button 
              onClick={onStart}
              className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Try it free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {inviteCode && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-zinc-950">Invite detected</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    This link saved an invite code (<span className="font-mono font-bold">{maskedInviteCode(inviteCode)}</span>). Sign in to redeem your bonus credits.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearInvite}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-2 text-sm font-bold text-white hover:bg-zinc-800 transition-all"
                >
                  Continue to sign in
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95] text-zinc-950 flex flex-col items-center">
            <span>AI feedback analysis</span>
            <span>for themes, sentiment, summaries.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-500 max-w-3xl mx-auto font-light leading-snug">
            Upload a CSV/XLSX or paste text. Get clustered themes, sentiment signals, and a summary you can act on.
            <br className="hidden md:block" />
            <span className="text-zinc-950 font-semibold">Built for fast synthesis — not dashboards.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-black text-white text-lg font-bold rounded-full hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group shadow-2xl hover:scale-105"
            >
              Try it free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-950 border-2 border-zinc-100 text-lg font-bold rounded-full hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              View sample report
            </button>
          </div>
          
          <p className="text-xs text-zinc-400 font-bold tracking-widest uppercase pt-4">
            No credit card required • Private & Secure
          </p>
        </div>
      </section>

      {/* Target group + value proposition (no blanket claims) */}
      <section className="pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">Target group</h2>
              <p className="mt-2 text-zinc-600 leading-relaxed">
                Teams that collect lots of qualitative feedback and need a reliable way to summarize it quickly.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Founders', desc: 'Turn “we heard…” into actual patterns.' },
                  { title: 'Product & PM', desc: 'Prioritize with evidence, not anecdotes.' },
                  { title: 'UX / Research', desc: 'Synthesize studies and open-text at scale.' },
                  { title: 'Customer Success', desc: 'Spot recurring pain before churn.' },
                ].map((item, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <div className="text-sm font-bold text-zinc-950">{item.title}</div>
                    <div className="mt-1 text-sm text-zinc-600">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-200 bg-white p-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">Value proposition</h2>
              <p className="mt-2 text-zinc-600 leading-relaxed">
                A faster path from raw text → themes → decisions. You upload feedback, then review clusters and summaries instead of manually tagging every line.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { title: 'Reduce manual coding', desc: 'Spend time reviewing patterns instead of building them from scratch.' },
                  { title: 'Make insights shareable', desc: 'Exportable summaries your team can read in minutes.' },
                  { title: 'Keep it simple', desc: 'Designed to be used weekly, not “set up once.”' },
                ].map((item, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <div className="text-sm font-bold text-zinc-950">{item.title}</div>
                    <div className="mt-1 text-sm text-zinc-600">{item.desc}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-sm font-bold text-zinc-950">Numbers (reference points, not promises)</div>
                <div className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  We don’t publish blanket claims like “save 50%” because it depends on your workflow and dataset size.
                  Here’s a simple way to estimate impact.
                </div>
                <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Example math</div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-zinc-700">
                    <div>
                      <span className="font-bold text-zinc-950">Manual time</span> ≈ (items) × (minutes per item)
                    </div>
                    <div>
                      <span className="font-bold text-zinc-950">With Scutch</span> ≈ (items) × (seconds to review per item) + (minutes to read summary)
                    </div>
                    <div className="mt-2 text-zinc-600">
                      Example scenario: 1,000 items, manual = 60 sec/item → ~16.7 hours.
                      If you can shift to review = 10 sec/item + 30 min summary → ~3.3 hours.
                      That’s ~80% less time <span className="font-semibold">in this example</span>.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-950">About Scutch</h2>
                <p className="mt-3 text-zinc-600 leading-relaxed">
                  Getting feedback is hard and once you have it, it comes from everywhere and quickly turns into noise.
                  Scutch is about “scutching” the messy stuff away so you keep the core signal: the themes and priorities that actually matter.
                </p>
              </div>

              <div className="w-full md:w-[340px]">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="text-xs font-bold tracking-widest uppercase text-zinc-500">Status</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-zinc-600">
                      Beta
                    </span>
                    <span className="text-sm font-bold text-zinc-950">Still being built</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    You may see changes as we improve reliability, exports, and the analysis output. If something feels off, tell us — early adopters shape the product.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-24 px-6 bg-white border-t border-zinc-100">
        <div className="max-w-4xl mx-auto text-center mb-20">
           <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-tight">Finally, a VoC tool that is <br/> simple, calm, and powerful.</h2>
           <p className="text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto leading-relaxed font-light">
             Most feedback tools are bloated, noisy, and require heavy integrations. <br/>
             <strong className="text-zinc-950 font-bold">This one does not.</strong> Upload your data and focus on the patterns.
           </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { title: "Understand Sentiment", desc: "Quickly gauge how customers feel about specific features.", icon: <TrendingUp className="w-8 h-8"/> },
                { title: "Spot Rising Issues", desc: "Identify emerging problems before they explode into churn.", icon: <Zap className="w-8 h-8"/> },
                { title: "Prioritize Confidence", desc: "Data-backed evidence for your next roadmap decision.", icon: <CheckCircle2 className="w-8 h-8"/> }
            ].map((item, i) => (
                <div key={i} className="p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-zinc-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                    <div className="w-16 h-16 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center mb-6 text-black shadow-sm group-hover:scale-110 transition-transform">
                        {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 tracking-tight">{item.title}</h3>
                    <p className="text-zinc-500 text-lg leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Feature Grid - Dark Mode Bento */}
      <section id="features" className="py-24 px-6 bg-zinc-950 text-white rounded-[3rem] mx-4 md:mx-8 shadow-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center md:text-left">
                <h2 className="text-4xl md:text-7xl font-bold mb-6 tracking-tighter">Everything you need.<br/>Nothing you don't.</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Large Item */}
                <div className="md:col-span-2 lg:col-span-2 row-span-2 bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-800 hover:border-zinc-700 transition-colors relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                            <Layers className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4 tracking-tight">Automatic Clustering</h3>
                        <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">Upload your feedback and receive clear, human-readable themes. No manual tagging required. Designed to work out of the box.</p>
                    </div>
                    {/* Visual Decor */}
                    <div className="absolute right-0 bottom-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                         <div className="flex items-end gap-4 translate-y-16 translate-x-16">
                             <div className="w-16 h-48 bg-indigo-500 rounded-t-2xl"></div>
                             <div className="w-16 h-72 bg-rose-500 rounded-t-2xl"></div>
                             <div className="w-16 h-60 bg-amber-500 rounded-t-2xl"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 hover:border-zinc-700 transition-colors hover:-translate-y-1 duration-300">
                    <BarChart3 className="w-8 h-8 text-zinc-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Stable Taxonomy</h3>
                  <p className="text-zinc-400 text-base">Designed to keep clusters consistent over time.</p>
                </div>

                 <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 hover:border-zinc-700 transition-colors hover:-translate-y-1 duration-300">
                    <Zap className="w-8 h-8 text-zinc-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Emerging Issues</h3>
                    <p className="text-zinc-400 text-base">Spot topics growing faster than the rest sooner.</p>
                </div>

                <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 hover:border-zinc-700 transition-colors hover:-translate-y-1 duration-300">
                     <FileText className="w-8 h-8 text-zinc-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Duplication Merging</h3>
                    <p className="text-zinc-400 text-base">Remove noise by merging similar feedback automatically.</p>
                </div>

                <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 hover:border-zinc-700 transition-colors hover:-translate-y-1 duration-300">
                     <Download className="w-8 h-8 text-zinc-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Insight Exports</h3>
                    <p className="text-zinc-400 text-base">Export your findings to CSV, JSON, PDF, or Markdown.</p>
                </div>
            </div>
        </div>
      </section>

      {/* How it works */}
        <section id="how-it-works" className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Three steps to clarity</h2>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-zinc-100 -z-10"></div>

              {[
                  { step: "01", title: "Upload", desc: "Drop in a CSV, XLSX, or paste text. The system handles messy data." },
                  { step: "02", title: "Analyze", desc: "Get automatic clusters, sentiment, theme summaries, and trends." },
                  { step: "03", title: "Act", desc: "Export insights, share with your team, and decide what matters next." }
              ].map((item, i) => (
                  <div key={i} className="bg-white pt-4 md:text-center group">
                      <div className="w-20 h-20 bg-white border-4 border-zinc-100 rounded-full flex items-center justify-center text-3xl font-black text-zinc-300 mb-6 mx-auto shadow-sm group-hover:border-zinc-950 group-hover:text-zinc-950 group-hover:scale-110 transition-all duration-500">
                          {item.step}
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-zinc-950 tracking-tight">{item.title}</h3>
                      <p className="text-zinc-500 text-lg leading-relaxed">{item.desc}</p>
                  </div>
              ))}
          </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 px-6 bg-zinc-50 border-t border-zinc-200">
         <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
                 <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Built for modern product teams</h2>
                 <p className="text-xl text-zinc-500">Stop guessing. Start knowing.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 hover:shadow-xl transition-shadow">
                     <h4 className="text-xl font-bold mb-3 text-zinc-950">Founders</h4>
                     <p className="text-zinc-600 text-base leading-relaxed">Understand what customers truly want without spending hours reading thousands of tickets.</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 hover:shadow-xl transition-shadow">
                     <h4 className="text-xl font-bold mb-3 text-zinc-950">Product Managers</h4>
                     <p className="text-zinc-600 text-base leading-relaxed">Plan roadmap priorities backed by real customer signals, not loud opinions.</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 hover:shadow-xl transition-shadow">
                     <h4 className="text-xl font-bold mb-3 text-zinc-950">UX Researchers</h4>
                   <p className="text-zinc-600 text-base leading-relaxed">Turn qualitative chaos into structured insights faster.</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 hover:shadow-xl transition-shadow">
                     <h4 className="text-xl font-bold mb-3 text-zinc-950">Customer Success</h4>
                     <p className="text-zinc-600 text-base leading-relaxed">Identify recurring pain points and sentiment shifts before they become churn.</p>
                 </div>
             </div>
         </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center space-y-10">
           <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-zinc-950">Ready to listen?</h2>
           <p className="text-2xl text-zinc-500 font-light">Start understanding your customers today.</p>
           <div className="flex justify-center">
             <button 
               onClick={onStart}
               className="px-12 py-6 bg-black text-white text-xl font-bold rounded-full hover:bg-zinc-800 hover:scale-105 transition-all shadow-2xl flex items-center gap-4"
             >
               Start Analysis for Free
               <ArrowRight size={24} />
             </button>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 border-t border-zinc-200 bg-zinc-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-[11px] font-medium text-zinc-400">© {new Date().getFullYear()} Scutch</div>
          <div className="flex gap-4 text-xs font-semibold text-zinc-400">
            <a href="/privacy" className="hover:text-black transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-black transition-colors">Terms</a>
            <a href="/impressum" className="hover:text-black transition-colors">Site Notice</a>
          </div>
        </div>
      </footer>
    </div>
  );
};