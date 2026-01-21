import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Zap, BarChart3, Layers, FileText, Download, TrendingUp, Clock, Users, Shield, AlertCircle, Target, TrendingDown, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onViewSampleReport?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onViewSampleReport }) => {
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
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
            <button 
              onClick={onStart}
              className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO - Eyebrow → Headline → Subheadline → CTA → Trust Signals */}
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
          
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold tracking-wide uppercase text-emerald-700">
              <Sparkles size={14} className="mr-1.5" />
              For Product Teams
            </span>
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-zinc-950">
            Turn 1,000 feedback items into action in under an hour
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-zinc-600 max-w-3xl mx-auto leading-relaxed">
            Upload your CSV, XLSX, or paste text. Get AI-powered themes, sentiment, and a summary you can share with your team—without spending days manually coding responses.
          </p>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-black text-white text-lg font-bold rounded-full hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group shadow-2xl hover:scale-105"
            >
              Start Free Analysis
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
                onClick={onViewSampleReport ?? onStart}
                className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-950 border-2 border-zinc-200 text-lg font-bold rounded-full hover:border-zinc-400 hover:bg-zinc-50 transition-all"
            >
              View Sample Report
            </button>
          </div>
          
          {/* Trust Signals */}
          <div className="pt-6 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="font-semibold">No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={16} className="text-emerald-600" />
                <span className="font-semibold">Private & secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-emerald-600" />
                <span className="font-semibold">Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: PROBLEM + AGITATE */}
      <section className="py-24 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-950 mb-4">
              Your feedback is drowning you
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              You collect customer input from surveys, support tickets, interviews, and reviews. But making sense of it? That's where everything breaks down.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Problem 1 */}
            <div className="bg-white rounded-2xl border-2 border-zinc-200 p-8 hover:border-zinc-400 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-950 mb-2">
                    Manual tagging takes forever
                  </h3>
                  <p className="text-zinc-600 leading-relaxed text-lg mb-3">
                    You spend hours reading through hundreds of responses, trying to identify patterns and tag themes manually. By the time you're done, the insights are stale and your team has moved on.
                  </p>
                  <p className="text-red-700 font-semibold text-base">
                    → Every week you delay means more frustrated customers and missed opportunities.
                  </p>
                </div>
              </div>
            </div>

            {/* Problem 2 */}
            <div className="bg-white rounded-2xl border-2 border-zinc-200 p-8 hover:border-zinc-400 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-950 mb-2">
                    Critical issues hide in the noise
                  </h3>
                  <p className="text-zinc-600 leading-relaxed text-lg mb-3">
                    Without proper clustering and sentiment analysis, you miss the signals that matter. That one feature everyone hates? Buried in your backlog. The bug causing churn? Lost in a sea of "everything's fine" responses.
                  </p>
                  <p className="text-orange-700 font-semibold text-base">
                    → You're making decisions blind, using gut feelings instead of data.
                  </p>
                </div>
              </div>
            </div>

            {/* Problem 3 */}
            <div className="bg-white rounded-2xl border-2 border-zinc-200 p-8 hover:border-zinc-400 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-950 mb-2">
                    Your team doesn't trust the insights
                  </h3>
                  <p className="text-zinc-600 leading-relaxed text-lg mb-3">
                    When feedback synthesis depends on one person's interpretation, other teams question the conclusions. Sales wants different data than Product. Leadership wants executive summaries you don't have time to create.
                  </p>
                  <p className="text-amber-700 font-semibold text-base">
                    → So feedback sits unused, and you keep building what's loudest, not what's most important.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Transition */}
          <div className="mt-16 text-center max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-zinc-300 p-8 shadow-lg">
              <p className="text-xl text-zinc-700 leading-relaxed mb-4">
                <strong className="text-zinc-950 font-bold">You didn't sign up to be a human data processor.</strong> You wanted to build great products and make customers happy.
              </p>
              <p className="text-lg text-zinc-600">
                What if you could turn weeks of manual work into hours of strategic review?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: VALUE STACK - Pricing with 4 tiers */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-950 mb-4">
              Everything you need to analyze feedback at scale
            </h2>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              Simple, transparent pricing. Start free. Scale as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Free */}
            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-8 hover:shadow-lg transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-950 mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold text-zinc-950">$0</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <p className="text-sm text-zinc-600">Try Scutch risk-free</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '10 items/month',
                  '3 projects',
                  'Basic clustering',
                  'Sentiment analysis',
                  'CSV/XLSX import',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={onStart}
                className="w-full py-3 bg-zinc-100 text-zinc-950 font-bold rounded-full hover:bg-zinc-200 transition-all"
              >
                Start Free
              </button>
            </div>

            {/* Starter */}
            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-8 hover:shadow-lg transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-950 mb-2">Starter</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold text-zinc-950">$39</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <p className="text-sm text-zinc-600">For solo founders & small teams</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '1,000 items/month',
                  '10 projects',
                  'Advanced clustering',
                  'Theme summaries',
                  'Export to PDF/CSV',
                  '10MB file uploads',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={onStart}
                className="w-full py-3 bg-zinc-950 text-white font-bold rounded-full hover:bg-zinc-800 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Pro - Most Popular */}
            <div className="rounded-2xl border-2 border-zinc-950 bg-zinc-50 p-8 relative shadow-xl hover:shadow-2xl transition-all">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-zinc-950 text-white px-4 py-1 rounded-full text-xs font-bold">MOST POPULAR</span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-950 mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold text-zinc-950">$99</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <p className="text-sm text-zinc-600">For growing product teams</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '50,000 items/month',
                  '50 projects',
                  'Priority AI processing',
                  'Custom taxonomies',
                  'Trend detection',
                  'Team collaboration (5 seats)',
                  '25MB file uploads',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={onStart}
                className="w-full py-3 bg-zinc-950 text-white font-bold rounded-full hover:bg-zinc-800 transition-all shadow-lg"
              >
                Get Started
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-8 hover:shadow-lg transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-950 mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-zinc-950">Custom</span>
                </div>
                <p className="text-sm text-zinc-600">For large organizations</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '500,000+ items/month',
                  'Unlimited projects',
                  'Dedicated support',
                  'SSO & audit logs',
                  'Custom integrations',
                  'SLA guarantees',
                  'Unlimited seats',
                  'White-label options',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={onStart}
                className="w-full py-3 bg-zinc-100 text-zinc-950 font-bold rounded-full hover:bg-zinc-200 transition-all"
              >
                Contact Sales
              </button>
            </div>
          </div>

          {/* Value Calculation */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-zinc-950 mb-2">The math that makes saying no feel stupid</h3>
                <p className="text-zinc-700">Calculate your potential time savings</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-emerald-100">
                  <div className="text-sm font-bold text-zinc-500 uppercase mb-2">Without Scutch</div>
                  <div className="text-3xl font-bold text-zinc-950 mb-2">~16.7 hours</div>
                  <p className="text-sm text-zinc-600">1,000 items × 1 min/item = Manual tagging nightmare</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-emerald-100">
                  <div className="text-sm font-bold text-emerald-700 uppercase mb-2">With Scutch</div>
                  <div className="text-3xl font-bold text-emerald-700 mb-2">~3 hours</div>
                  <p className="text-sm text-zinc-600">Quick review + AI summary = 80% time saved</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-zinc-700"><strong className="text-zinc-950">Save 13+ hours per analysis.</strong> What's that worth to your team?</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SOCIAL PROOF - Honest version without fake testimonials */}
      <section className="py-24 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 mb-6">
            Building in beta with real users
          </h2>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto mb-12">
            Scutch is actively being refined based on feedback from early adopters. We're not hiding behind fake testimonials—we're building this with you.
          </p>
          
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 border-2 border-white"></div>
                ))}
              </div>
              <span className="text-sm font-bold text-zinc-600">Early adopters shaping the product</span>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We're working with product teams, founders, and researchers to build the feedback analysis tool they actually need. Real feedback. Real improvements. No bullshit.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: TRANSFORMATION - 4 stages */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-950 mb-4">
              Your transformation journey
            </h2>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              From drowning in feedback to making confident, data-backed decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stage 1: Quick Win */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 p-8 relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">WEEK 1</span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-zinc-950 mb-3">Quick Win</h3>
                <p className="text-zinc-700 leading-relaxed mb-4">
                  Upload your first dataset and get immediate insights. See patterns you missed in minutes, not days.
                </p>
                <div className="text-3xl font-bold text-emerald-700">2 hours saved</div>
                <p className="text-sm text-zinc-600">on your first analysis</p>
              </div>
            </div>

            {/* Stage 2: Compound */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-8 relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">MONTH 1</span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-zinc-950 mb-3">Compound</h3>
                <p className="text-zinc-700 leading-relaxed mb-4">
                  Build a library of analyzed feedback. Start seeing trends across multiple sources and time periods.
                </p>
                <div className="text-3xl font-bold text-blue-700">10x faster</div>
                <p className="text-sm text-zinc-600">synthesis than manual coding</p>
              </div>
            </div>

            {/* Stage 3: Advantage */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8 relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">QUARTER 1</span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-zinc-950 mb-3">Advantage</h3>
                <p className="text-zinc-700 leading-relaxed mb-4">
                  Your team trusts the insights. Product decisions are backed by real data. You spot issues before they explode.
                </p>
                <div className="text-3xl font-bold text-purple-700">Strategic edge</div>
                <p className="text-sm text-zinc-600">over gut-feel competitors</p>
              </div>
            </div>

            {/* Stage 4: 10x */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-8 relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold">YEAR 1</span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-zinc-950 mb-3">10x Outcome</h3>
                <p className="text-zinc-700 leading-relaxed mb-4">
                  Voice of customer is embedded in your workflow. You're shipping what matters. Churn drops. NPS climbs.
                </p>
                <div className="text-3xl font-bold text-amber-700">Product-market fit</div>
                <p className="text-sm text-zinc-600">driven by real customer voices</p>
              </div>
            </div>
          </div>
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

      {/* SECTION 7: SECONDARY CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-zinc-50 to-zinc-100">
        <div className="max-w-5xl mx-auto text-center space-y-10">
           {/* Avatar Stack */}
           <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 border-4 border-white shadow-lg"></div>
                ))}
              </div>
              <span className="text-sm font-bold text-zinc-600">Join teams already using Scutch</span>
            </div>
           
           {/* Question Headline */}
           <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-950">
             Ready to stop drowning in feedback?
           </h2>
           <p className="text-2xl text-zinc-600">
             Turn chaos into clarity. Start understanding your customers today.
           </p>
           
           {/* "Yes" Button */}
           <div className="flex justify-center">
             <button 
               onClick={onStart}
               className="px-12 py-6 bg-black text-white text-xl font-bold rounded-full hover:bg-zinc-800 hover:scale-105 transition-all shadow-2xl flex items-center gap-4"
             >
               Yes, Start Free Analysis
               <ArrowRight size={24} />
             </button>
           </div>
           
           <p className="text-sm text-zinc-500">
             No credit card required • Setup in 2 minutes • Cancel anytime
           </p>
        </div>
      </section>

      {/* About - Beta Notice */}
      <section id="about" className="py-16 px-6 bg-white border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold tracking-widest uppercase text-zinc-600">
                    Beta
                  </span>
                  <h3 className="text-xl font-bold text-zinc-950">Still being built</h3>
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  Scutch is actively evolving. You may see changes as we improve reliability, exports, and analysis output. Early adopters shape the product—if something feels off, tell us.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 border-t border-zinc-200 bg-zinc-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-[11px] font-medium text-zinc-400">{new Date().getFullYear()} Tryscutch</div>
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
