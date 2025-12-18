import React, { useEffect, useMemo, useState } from 'react';
import { User, Lock, Trash2, Bell, Save, CreditCard, Building2, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { slugify } from '../lib/slug';

type SettingsViewProps = {
    onBilling?: () => void;
        userId?: string;
};

export const SettingsView: React.FC<SettingsViewProps> = ({ onBilling, userId }) => {
    const [publicOrgName, setPublicOrgName] = useState('');
    const [isOrgLoading, setIsOrgLoading] = useState(false);
    const [isSavingOrg, setIsSavingOrg] = useState(false);
    const [orgError, setOrgError] = useState<string | null>(null);
    const [orgSaved, setOrgSaved] = useState(false);
    const [inviteLink, setInviteLink] = useState<string>('');
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [isInviteLoading, setIsInviteLoading] = useState(false);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [bonusRemaining, setBonusRemaining] = useState<number | null>(null);
    const [bonusGrantAmount, setBonusGrantAmount] = useState<number | null>(null);
    const [isBonusLoading, setIsBonusLoading] = useState(false);
    const [bonusError, setBonusError] = useState<string | null>(null);

    const nextSlug = useMemo(() => slugify(publicOrgName), [publicOrgName]);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        const run = async () => {
            setIsOrgLoading(true);
            setOrgError(null);
            setOrgSaved(false);
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('name,public_name')
                    .eq('id', userId)
                    .maybeSingle();
                if (error) throw error;
                if (cancelled) return;
                setPublicOrgName((data as any)?.public_name ?? (data as any)?.name ?? '');
            } catch (e: any) {
                if (!cancelled) setOrgError(e?.message ?? 'Failed to load organization');
            } finally {
                if (!cancelled) setIsOrgLoading(false);
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        const isMissingBonusSchemaError = (e: any) => {
            const msg = String(e?.message ?? '');
            const code = String(e?.code ?? '');
            if (code === '42P01') return true;
            if (/bonus_credits_balance|bonus_credits_grants/i.test(msg) && /does not exist|not found|schema cache/i.test(msg)) return true;
            return false;
        };

        const run = async () => {
            setIsBonusLoading(true);
            setBonusError(null);
            try {
                const { data: balance, error: balErr } = await supabase
                    .from('bonus_credits_balance')
                    .select('remaining_items')
                    .eq('org_id', userId)
                    .maybeSingle();
                if (balErr) throw balErr;

                const { data: grant, error: grantErr } = await supabase
                    .from('bonus_credits_grants')
                    .select('amount_items')
                    .eq('org_id', userId)
                    .eq('grant_type', 'invite_welcome_1000')
                    .maybeSingle();
                if (grantErr) throw grantErr;

                if (cancelled) return;
                const remaining = Number((balance as any)?.remaining_items ?? 0);
                setBonusRemaining(Number.isFinite(remaining) ? remaining : 0);

                const grantAmount = grant ? Number((grant as any)?.amount_items ?? 0) : null;
                setBonusGrantAmount(grantAmount && Number.isFinite(grantAmount) ? grantAmount : null);
            } catch (e: any) {
                if (cancelled) return;
                if (isMissingBonusSchemaError(e)) {
                    // If migrations are not deployed yet, don't show an error.
                    setBonusRemaining(null);
                    setBonusGrantAmount(null);
                    return;
                }
                setBonusError(e?.message ?? 'Failed to load bonus credits.');
            } finally {
                if (!cancelled) setIsBonusLoading(false);
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const saveOrg = async () => {
        if (!userId) return;
        setOrgSaved(false);
        setOrgError(null);

        const trimmed = publicOrgName.trim();
        if (!trimmed) {
            setOrgError('Please enter a public organization name.');
            return;
        }
        const slug = slugify(trimmed);
        if (!slug) {
            setOrgError('That name cannot be used. Please choose a different one.');
            return;
        }

        setIsSavingOrg(true);
        try {
            // Friendly pre-check for duplicates (DB constraint is the real guard).
            const { data: existing, error: existingErr } = await supabase
                .from('organizations')
                .select('id')
                .neq('id', userId)
                .ilike('public_slug', slug)
                .limit(1);
            if (existingErr) throw existingErr;
            if ((existing as any[])?.length) {
                setOrgError('That public organization name is already taken.');
                return;
            }

            const { error: updateErr } = await supabase
                .from('organizations')
                .update({
                    // Keep internal name aligned unless you later add a separate internal label.
                    name: trimmed,
                    public_name: trimmed,
                    public_slug: slug,
                })
                .eq('id', userId);
            if (updateErr) throw updateErr;

            setOrgSaved(true);
            setTimeout(() => setOrgSaved(false), 2000);
        } catch (e: any) {
            // If uniqueness is violated despite pre-check, surface a friendly message.
            const msg = (e?.message ?? '').toString();
            if (/organizations_public_slug_unique/i.test(msg) || /duplicate key value/i.test(msg)) {
                setOrgError('That public organization name is already taken.');
            } else {
                setOrgError(msg || 'Failed to save organization');
            }
        } finally {
            setIsSavingOrg(false);
        }
    };

    const generateInvite = async () => {
        if (!userId) return;
        setInviteError(null);
        setIsInviteLoading(true);
        setInviteCopied(false);
        try {
            const { data, error } = await supabase.rpc('scutch_create_invite');
            if (error) throw error;
            const row = Array.isArray(data) ? data[0] : data;
            const code = (row as any)?.code as string | undefined;
            if (!code) throw new Error('Failed to generate invite code');
            setInviteLink(`${window.location.origin}/invite/${code}`);
        } catch (e: any) {
            setInviteError(e?.message ?? 'Failed to generate invite link');
        } finally {
            setIsInviteLoading(false);
        }
    };

    const copyInvite = async () => {
        if (!inviteLink) return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 2000);
        } catch {
            // ignore
        }
    };

  return (
    <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4 border-b border-zinc-100 pb-8">
        <h1 className="text-5xl font-bold tracking-tighter text-zinc-950">Settings</h1>
        <p className="text-xl text-zinc-500 font-light">Manage your account preferences and workspace configuration.</p>
      </div>

      <div className="space-y-12">
                {/* Organization */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-zinc-100 rounded-xl">
                            <Building2 className="w-6 h-6 text-zinc-950" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Workspace</h2>
                    </div>

                    <div className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/50 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Public Organization Name</label>
                            <input
                                type="text"
                                value={publicOrgName}
                                onChange={(e) => {
                                    setPublicOrgName(e.target.value);
                                    setOrgSaved(false);
                                    if (orgError) setOrgError(null);
                                }}
                                placeholder="e.g., TechCrunch"
                                disabled={!userId || isOrgLoading || isSavingOrg}
                                className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 transition-all font-medium placeholder-zinc-400 disabled:opacity-50"
                            />
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-zinc-500">This appears in your public form URLs.</p>
                                <p className="text-xs text-zinc-400">Preview: {window.location.origin}/{nextSlug || 'your-name'}/&lt;formId&gt;</p>
                            </div>
                        </div>

                        {orgError && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                                <p className="text-sm font-semibold text-rose-700">{orgError}</p>
                            </div>
                        )}
                        {orgSaved && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <p className="text-sm font-semibold text-emerald-700">Saved.</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={saveOrg}
                                disabled={!userId || isOrgLoading || isSavingOrg}
                                className="px-6 py-4 bg-zinc-950 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingOrg ? 'Saving…' : 'Save Public Name'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Invites */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-zinc-100 rounded-xl">
                            <LinkIcon className="w-6 h-6 text-zinc-950" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Invites</h2>
                    </div>

                    <div className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/50 space-y-4">
                        <p className="text-sm text-zinc-600">
                            Invite someone with a link. When they join using your invite, they get 1,000 bonus credits.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={generateInvite}
                                disabled={!userId || isInviteLoading}
                                className="px-6 py-4 bg-zinc-950 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isInviteLoading ? 'Generating…' : 'Generate Invite Link'}
                            </button>

                            {inviteLink && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inviteLink}
                                        readOnly
                                        className="flex-1 px-4 py-3 rounded-2xl border-2 border-zinc-100 bg-white text-zinc-700 font-mono text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={copyInvite}
                                        className="px-4 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold"
                                        title="Copy"
                                    >
                                        {inviteCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            )}

                            {inviteError && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-rose-700">{inviteError}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Bonus Credits */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-zinc-100 rounded-xl">
                            <CreditCard className="w-6 h-6 text-zinc-950" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Bonus Credits</h2>
                    </div>

                    <div className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/50 space-y-4">
                        <p className="text-sm text-zinc-600">
                            Bonus credits are a one-time buffer that can cover usage beyond your monthly plan limit.
                        </p>

                        {bonusError && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                                <p className="text-sm font-semibold text-rose-700">{bonusError}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Remaining</p>
                                <p className="text-2xl font-extrabold text-zinc-950 mt-1">
                                    {isBonusLoading ? 'Loading…' : bonusRemaining ?? '—'}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">credits (items)</p>
                            </div>

                            <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Welcome Grant</p>
                                <p className="text-2xl font-extrabold text-zinc-950 mt-1">
                                    {isBonusLoading ? 'Loading…' : bonusGrantAmount ?? '—'}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">(one-time)</p>
                            </div>
                        </div>
                    </div>
                </section>

        {/* Profile Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-zinc-100 rounded-xl">
                    <User className="w-6 h-6 text-zinc-950" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Profile</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                   <label className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Full Name</label>
                   <input 
                      type="text" 
                      defaultValue="Jane Doe"
                      className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 transition-all font-medium placeholder-zinc-400"
                   />
               </div>
               <div className="space-y-2">
                   <label className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Email Address</label>
                   <input 
                      type="email" 
                      defaultValue="jane@workspace.team"
                      className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 transition-all font-medium placeholder-zinc-400"
                   />
               </div>
           </div>
        </section>

        {/* Notifications */}
        <section className="space-y-6 pt-8 border-t border-zinc-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-zinc-100 rounded-xl">
                    <Bell className="w-6 h-6 text-zinc-950" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Notifications</h2>
           </div>

           <div className="space-y-4">
               <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                   <div>
                       <h3 className="font-bold text-zinc-900 text-lg">Analysis Complete</h3>
                       <p className="text-zinc-500">Receive an email when your large datasets finish processing.</p>
                   </div>
                   <div className="relative inline-block w-14 h-8 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-7 bg-zinc-950" defaultChecked/>
                        <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-8 rounded-full bg-zinc-300 cursor-pointer"></label>
                   </div>
               </div>
               <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                   <div>
                       <h3 className="font-bold text-zinc-900 text-lg">Weekly Digest</h3>
                       <p className="text-zinc-500">A summary of new insights across all your projects.</p>
                   </div>
                   <div className="relative inline-block w-14 h-8 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1" />
                        <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-8 rounded-full bg-zinc-300 cursor-pointer"></label>
                   </div>
               </div>
           </div>
        </section>

        {/* Security */}
        <section className="space-y-6 pt-8 border-t border-zinc-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-zinc-100 rounded-xl">
                    <Lock className="w-6 h-6 text-zinc-950" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Security</h2>
           </div>
           <button className="px-6 py-4 border-2 border-zinc-200 rounded-2xl text-zinc-950 font-bold hover:bg-zinc-50 transition-colors">
               Change Password
           </button>
        </section>

                {/* Billing */}
                <section className="space-y-6 pt-8 border-t border-zinc-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-zinc-100 rounded-xl">
                            <CreditCard className="w-6 h-6 text-zinc-950" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Billing & Plans</h2>
                    </div>

                    <div className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-zinc-900 text-lg">Manage subscription</h3>
                            <p className="text-zinc-500">View plans, invoices, and payment method.</p>
                        </div>
                        <button
                            type="button"
                            onClick={onBilling}
                            className="px-6 py-4 bg-zinc-950 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors"
                        >
                            Open Billing
                        </button>
                    </div>
                </section>

        {/* Danger Zone */}
        <section className="space-y-6 pt-8 border-t border-zinc-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-50 rounded-xl">
                    <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold text-rose-600 tracking-tight">Danger Zone</h2>
           </div>
           <div className="p-6 border-2 border-rose-100 rounded-3xl bg-rose-50/30 flex items-center justify-between">
               <div>
                   <h3 className="font-bold text-rose-900 text-lg">Delete Workspace</h3>
                   <p className="text-rose-700/80">Permanently remove all projects, data, and account information.</p>
               </div>
               <button className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors">
                   Delete Account
               </button>
           </div>
        </section>

        <div className="pt-12 pb-24">
            <button className="w-full md:w-auto px-10 py-5 bg-zinc-950 text-white text-xl font-bold rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-xl">
                <Save className="w-5 h-5" />
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};