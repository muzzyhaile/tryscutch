import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ShieldCheck, UploadCloud, Users, Zap } from 'lucide-react';
import {
  PLAN_CATALOG,
  formatBytes,
  loadSubscription,
  loadUsage,
    Plan,
  PlanId,
  saveSubscription,
  SubscriptionState,
} from '../lib/plans';

type BillingViewProps = {
  userId?: string;
  projectsCount: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pct(n: number, d: number) {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return clamp((n / d) * 100, 0, 100);
}

export const BillingView: React.FC<BillingViewProps> = ({ userId, projectsCount }) => {
  const [subscription, setSubscription] = useState<SubscriptionState>(() => loadSubscription(userId));

  useEffect(() => {
    saveSubscription(userId, {
      ...subscription,
      seats: subscription.seats ?? PLAN_CATALOG[subscription.planId].limits.seatsIncluded,
    });
  }, [subscription, userId]);

    const currentPlan = useMemo(() => PLAN_CATALOG[subscription.planId], [subscription.planId]);
  const usage = useMemo(() => loadUsage(userId), [userId, subscription.planId]);

    const plans = useMemo(() => Object.values(PLAN_CATALOG) as Plan[], []);

  const projectLimit = currentPlan.limits.maxProjects;
  const projectsLabel = Number.isFinite(projectLimit)
    ? `${projectsCount.toLocaleString()} / ${projectLimit.toLocaleString()}`
    : `${projectsCount.toLocaleString()} / Unlimited`;

  const projectPct = Number.isFinite(projectLimit) ? pct(projectsCount, projectLimit) : 0;
  const monthlyItemsPct = pct(usage.analyzedItems, currentPlan.limits.monthlyItems);

  const seatsIncluded = currentPlan.limits.seatsIncluded;
  const seats = subscription.seats ?? seatsIncluded;

  const selectPlan = (planId: PlanId) => {
    if (planId === subscription.planId) return;
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@triscutch.com?subject=Scutch%20Enterprise%20Plan';
      return;
    }
    setSubscription({
      planId,
      updatedAt: new Date().toISOString(),
      seats: PLAN_CATALOG[planId].limits.seatsIncluded,
    });
  };

    return (
        <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4 border-b border-zinc-100 pb-8">
                <h1 className="text-5xl font-bold tracking-tighter text-zinc-950">Billing & Plans</h1>
                <p className="text-xl text-zinc-500 font-light">Choose a plan with clear limits on uploads and AI usage.</p>
            </div>

            {/* Current Plan */}
            <div className="bg-zinc-950 text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                <div className="relative z-10 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Current Plan</div>
                            <h2 className="text-4xl font-bold tracking-tight">{currentPlan.name}</h2>
                            <div className="text-zinc-300 font-medium mt-2">{currentPlan.priceLabel}</div>
                            <div className="text-zinc-400 text-sm mt-3">Renews monthly • Usage resets monthly</div>
                        </div>
                        <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">Active</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold">{projectsLabel}</div>
                                    <div className="text-xs text-zinc-300">Projects</div>
                                </div>
                            </div>
                            {Number.isFinite(projectLimit) && (
                                <div className="mt-4 w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                    <div className="bg-white h-full" style={{ width: `${projectPct}%` }} />
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold">
                                        {usage.analyzedItems.toLocaleString()} / {currentPlan.limits.monthlyItems.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-zinc-300">Items analyzed this month ({usage.monthKey})</div>
                                </div>
                            </div>
                            <div className="mt-4 w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full" style={{ width: `${monthlyItemsPct}%` }} />
                            </div>
                            <div className="mt-3 text-xs text-zinc-300">
                                Max per analysis: {currentPlan.limits.maxItemsPerAnalysis.toLocaleString()} items • {currentPlan.limits.maxCharsPerAnalysis.toLocaleString()} chars
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <UploadCloud className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold">{formatBytes(currentPlan.limits.importMaxFileBytes)}</div>
                                    <div className="text-xs text-zinc-300">Max upload size per file</div>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-zinc-300">Max table rows per import: {currentPlan.limits.importMaxTableRows.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white/5 border border-white/10 p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-lg font-bold">{seats.toLocaleString()} seats</div>
                                <div className="text-xs text-zinc-300">Included seats (Enterprise is per-seat)</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (currentPlan.id !== 'enterprise') {
                                    alert('Seat management is available on Enterprise.');
                                    return;
                                }
                                window.location.href = 'mailto:sales@triscutch.com?subject=Scutch%20Enterprise%20Seat%20Management';
                            }}
                            className="px-6 py-3 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                        >
                            Manage Seats
                        </button>
                    </div>
                </div>
            </div>

            {/* Plans */}
            <div className="pt-2">
                <h2 className="text-3xl font-bold text-zinc-950 tracking-tight mb-8">Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {plans.map((plan) => {
                        const isCurrent = plan.id === subscription.planId;
                        const isPopular = Boolean(plan.popular);
                        const containerClassName = isCurrent
                            ? 'p-8 border-2 border-zinc-950 rounded-3xl bg-white relative overflow-hidden'
                            : 'p-8 border border-zinc-100 rounded-3xl bg-zinc-50';

                        const icon = plan.id === 'pro' ? <Zap size={18} className="text-zinc-950" /> : plan.id === 'enterprise' ? <ShieldCheck size={18} className="text-zinc-950" /> : <CheckCircle2 size={18} className="text-zinc-400" />;

                        return (
                            <div key={plan.id} className={containerClassName}>
                                {isPopular && !isCurrent && (
                                    <div className="absolute top-0 right-0 bg-zinc-950 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                                )}
                                {isCurrent && (
                                    <div className="absolute top-0 right-0 bg-zinc-950 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">CURRENT</div>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                    {icon}
                                    <h3 className="text-xl font-bold text-zinc-950">{plan.name}</h3>
                                </div>
                                <div className="text-3xl font-bold text-zinc-950 mb-2">{plan.priceLabel}</div>
                                <div className="text-sm text-zinc-500 mb-6">{plan.description}</div>

                                <div className="space-y-3 mb-8 text-sm">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Seats included</span><span className="font-bold text-zinc-950">{plan.limits.seatsIncluded.toLocaleString()}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Projects</span><span className="font-bold text-zinc-950">{Number.isFinite(plan.limits.maxProjects) ? plan.limits.maxProjects.toLocaleString() : 'Unlimited'}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Monthly analyzed items</span><span className="font-bold text-zinc-950">{plan.limits.monthlyItems.toLocaleString()}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Max items per analysis</span><span className="font-bold text-zinc-950">{plan.limits.maxItemsPerAnalysis.toLocaleString()}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Max upload size</span><span className="font-bold text-zinc-950">{formatBytes(plan.limits.importMaxFileBytes)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Max table rows</span><span className="font-bold text-zinc-950">{plan.limits.importMaxTableRows.toLocaleString()}</span></div>
                                </div>

                                {isCurrent ? (
                                    <button className="w-full py-3 border-2 border-zinc-200 rounded-xl font-bold text-zinc-400 cursor-not-allowed">Current Plan</button>
                                ) : plan.id === 'enterprise' ? (
                                    <button
                                        type="button"
                                        onClick={() => selectPlan('enterprise')}
                                        className="w-full py-3 border-2 border-zinc-200 rounded-xl font-bold text-zinc-900 hover:bg-zinc-100 transition-colors"
                                    >
                                        Contact Sales
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => selectPlan(plan.id)}
                                        className={
                                            plan.id === 'pro'
                                                ? 'w-full py-3 bg-zinc-950 text-white rounded-xl font-bold shadow-lg'
                                                : 'w-full py-3 bg-white text-zinc-950 border-2 border-zinc-200 rounded-xl font-bold hover:bg-zinc-50 transition-colors'
                                        }
                                    >
                                        Upgrade to {plan.name}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white border-2 border-zinc-100 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-zinc-950 mb-2">Why these limits exist</h3>
                <p className="text-zinc-600">
                    Scutch enforces upload and analysis caps to prevent accidental runaway usage and to keep costs predictable.
                    Enterprise plans are typically priced per seat because procurement, SSO, audit needs, and access control scale with headcount.
                </p>
            </div>
        </div>
    );
};