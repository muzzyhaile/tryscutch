import React from 'react';
import { ArrowRight, CheckCircle2, Zap, BarChart3, Layers, FileText, Download, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="bg-white min-h-screen font-sans text-zinc-900 selection:bg-black selection:text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl">C</div>
            <span className="font-bold text-2xl tracking-tighter">Clarity</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How it Works</a>
            <button 
              onClick={onStart}
              className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl"
            >
              Try it free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-10">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1] text-zinc-950">
            Turn raw feedback into <br className="hidden md:block"/> clarity, in minutes.
          </h1>
          <p className="text-2xl md:text-3xl text-zinc-500 max-w-4xl mx-auto font-light leading-snug">
            Upload a file, get automatic themes, sentiment, and insights. <br className="hidden md:block"/>
            <span className="text-zinc-900 font-medium">No integrations. No setup. No noise.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-5 bg-black text-white text-xl font-semibold rounded-full hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group shadow-xl"
            >
              Try it free
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
                onClick={onStart}
                className="w-full sm:w-auto px-10 py-5 bg-white text-zinc-900 border-2 border-zinc-100 text-xl font-semibold rounded-full hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              View sample report
            </button>
          </div>
          
          <p className="text-sm text-zinc-400 font-medium tracking-wide pt-4">
            NO CREDIT CARD REQUIRED • PRIVATE & SECURE
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-zinc-100 bg-zinc-50/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-10">Trusted by early-stage teams & researchers</p>
            <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
               <span className="text-2xl font-black tracking-tight text-zinc-800">ACME<span className="font-light">CORP</span></span>
               <span className="text-2xl font-bold font-serif text-zinc-800">GlobalSoft</span>
               <span className="text-2xl font-bold italic text-zinc-800">Linear</span>
               <span className="text-2xl font-bold tracking-widest text-zinc-800">STRIPE</span>
            </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-24">
           <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 leading-tight">Finally, a VoC tool that is <br/> simple, calm, and powerful.</h2>
           <p className="text-xl text-zinc-500 max-w-3xl mx-auto leading-relaxed">
             Most feedback tools are bloated, noisy, and require heavy integrations. <br/>
             <strong className="text-zinc-900">This one does not.</strong> Upload your data and see what matters immediately.
           </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { title: "Understand Sentiment", desc: "Instantly gauge how customers feel about specific features.", icon: <TrendingUp className="w-8 h-8"/> },
                { title: "Spot Rising Issues", desc: "Identify emerging problems before they explode into churn.", icon: <Zap className="w-8 h-8"/> },
                { title: "Prioritize Confidence", desc: "Data-backed evidence for your next roadmap decision.", icon: <CheckCircle2 className="w-8 h-8"/> }
            ].map((item, i) => (
                <div key={i} className="p-10 bg-zinc-50 rounded-3xl border border-zinc-100 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-16 h-16 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center mb-8 text-black shadow-sm group-hover:scale-110 transition-transform">
                        {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 tracking-tight">{item.title}</h3>
                    <p className="text-zinc-500 text-lg leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Feature Grid - Dark Mode Bento */}
      <section id="features" className="py-32 px-6 bg-zinc-950 text-white rounded-[3rem] mx-4 md:mx-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
            <div className="mb-20 text-center md:text-left">
                <h2 className="text-4xl md:text-7xl font-bold mb-8 tracking-tighter">Everything you need.<br/>Nothing you don't.</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Large Item */}
                <div className="md:col-span-2 lg:col-span-2 row-span-2 bg-zinc-900 p-10 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-colors relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-8">
                            <Layers className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Automatic Clustering</h3>
                        <p className="text-zinc-400 text-lg max-w-md">Upload your feedback and receive clear, human-readable themes. No manual tagging required. It just works.</p>
                    </div>
                    {/* Visual Decor */}
                    <div className="absolute right-0 bottom-0 opacity-20 group-hover:opacity-30 transition-opacity">
                         <div className="flex items-end gap-4 translate-y-12 translate-x-12">
                             <div className="w-12 h-40 bg-indigo-500 rounded-t-xl"></div>
                             <div className="w-12 h-64 bg-rose-500 rounded-t-xl"></div>
                             <div className="w-12 h-52 bg-amber-500 rounded-t-xl"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <BarChart3 className="w-10 h-10 text-zinc-500 mb-6" />
                    <h3 className="text-xl font-bold mb-3">Stable Taxonomy</h3>
                    <p className="text-zinc-400">Clusters remain consistent over time, not random like typical AI.</p>
                </div>

                 <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <Zap className="w-10 h-10 text-zinc-500 mb-6" />
                    <h3 className="text-xl font-bold mb-3">Emerging Issues</h3>
                    <p className="text-zinc-400">Spot topics growing faster than the rest immediately.</p>
                </div>

                <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                     <FileText className="w-10 h-10 text-zinc-500 mb-6" />
                    <h3 className="text-xl font-bold mb-3">Duplication Merging</h3>
                    <p className="text-zinc-400">Remove noise by merging similar feedback automatically.</p>
                </div>

                <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                     <Download className="w-10 h-10 text-zinc-500 mb-6" />
                    <h3 className="text-xl font-bold mb-3">Insight Exports</h3>
                    <p className="text-zinc-400">Export your findings to CSV, JSON, PDF, or Markdown.</p>
                </div>
            </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-32 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center mb-24">
              <h2 className="text-5xl font-bold tracking-tighter">Three steps to clarity</h2>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-zinc-100 -z-10"></div>

              {[
                  { step: "01", title: "Upload", desc: "Drop in a CSV, XLSX, or paste text. The system handles messy data." },
                  { step: "02", title: "Analyze", desc: "Get automatic clusters, sentiment, theme summaries, and trends." },
                  { step: "03", title: "Act", desc: "Export insights, share with your team, and decide what matters next." }
              ].map((item, i) => (
                  <div key={i} className="bg-white pt-4 md:text-center group">
                      <div className="w-24 h-24 bg-white border-2 border-zinc-100 rounded-full flex items-center justify-center text-4xl font-black text-zinc-300 mb-8 mx-auto shadow-sm group-hover:border-zinc-900 group-hover:text-zinc-900 group-hover:scale-110 transition-all duration-500">
                          {item.step}
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-zinc-900">{item.title}</h3>
                      <p className="text-zinc-500 text-lg">{item.desc}</p>
                  </div>
              ))}
          </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 px-6 bg-zinc-50 border-t border-zinc-200">
         <div className="max-w-5xl mx-auto">
             <div className="text-center mb-16">
                 <h2 className="text-4xl font-bold tracking-tighter mb-4">Built for modern product teams</h2>
                 <p className="text-xl text-zinc-500">Stop guessing. Start knowing.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white p-8 rounded-2xl border border-zinc-200">
                     <h4 className="text-xl font-bold mb-2">Founders</h4>
                     <p className="text-zinc-600">Understand what customers truly want without spending hours reading thousands of tickets.</p>
                 </div>
                 <div className="bg-white p-8 rounded-2xl border border-zinc-200">
                     <h4 className="text-xl font-bold mb-2">Product Managers</h4>
                     <p className="text-zinc-600">Plan roadmap priorities backed by real customer signals, not loud opinions.</p>
                 </div>
                 <div className="bg-white p-8 rounded-2xl border border-zinc-200">
                     <h4 className="text-xl font-bold mb-2">UX Researchers</h4>
                     <p className="text-zinc-600">Turn qualitative chaos into structured insights in seconds.</p>
                 </div>
                 <div className="bg-white p-8 rounded-2xl border border-zinc-200">
                     <h4 className="text-xl font-bold mb-2">Customer Success</h4>
                     <p className="text-zinc-600">Identify recurring pain points and sentiment shifts before they become churn.</p>
                 </div>
             </div>
         </div>
      </section>

      {/* CTA Footer */}
      <section className="py-40 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center space-y-10">
           <h2 className="text-6xl md:text-8xl font-bold tracking-tighter">Ready to listen?</h2>
           <p className="text-2xl text-zinc-500 font-light">Start understanding your customers today.</p>
           <div className="flex justify-center">
             <button 
               onClick={onStart}
               className="px-12 py-6 bg-black text-white text-xl font-bold rounded-full hover:bg-zinc-800 hover:scale-105 transition-all shadow-2xl flex items-center gap-3"
             >
               Start Analysis for Free
               <ArrowRight />
             </button>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-200 bg-zinc-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">C</div>
                 <span className="font-bold text-lg tracking-tight">Clarity</span>
              </div>
              <div className="flex gap-8 text-sm font-medium text-zinc-500">
                  <a href="#" className="hover:text-black">Privacy</a>
                  <a href="#" className="hover:text-black">Terms</a>
                  <a href="#" className="hover:text-black">Twitter</a>
              </div>
              <div className="text-sm text-zinc-400">
                  © 2024 Clarity VoC.
              </div>
          </div>
      </footer>
    </div>
  );
};