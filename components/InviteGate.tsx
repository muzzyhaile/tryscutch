import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { KeyRound, ArrowRight, X } from 'lucide-react';

type InviteGateProps = {
  userId: string;
  onRedeemed?: (bonusGranted: boolean, bonusAmount: number) => void;
};

export const InviteGate: React.FC<InviteGateProps> = ({ userId, onRedeemed }) => {
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismiss = () => {
    try {
      localStorage.setItem(`scutch_invite_skip_v1:${userId}`, '1');
    } catch {
      // ignore
    }
    onRedeemed?.(false, 0);
  };

  const isMissingInviteSchemaError = (e: any) => {
    const msg = String(e?.message ?? '');
    const code = String(e?.code ?? '');
    if (code === '42P01' || code === '42883') return true;
    if (/invite_redemptions|invites|scutch_redeem_invite|scutch_create_invite/i.test(msg)) {
      if (/does not exist|not found|could not find|unknown function|schema cache/i.test(msg)) return true;
    }
    return false;
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsChecking(true);
      setError(null);
      try {
        const { data, error: selErr } = await supabase
          .from('invite_redemptions')
          .select('id')
          .eq('invited_user_id', userId)
          .maybeSingle();
        if (selErr) throw selErr;
        if (cancelled) return;
        if (data?.id) {
          onRedeemed?.(false, 0);
        }
      } catch (e: any) {
        if (cancelled) return;
        if (isMissingInviteSchemaError(e)) {
          // Invites not deployed yet; fail open.
          onRedeemed?.(false, 0);
          return;
        }
        setError(e?.message ?? 'Failed to check invite status.');
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [userId, onRedeemed]);

  const redeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter an invite code.');
      return;
    }

    setIsRedeeming(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('scutch_redeem_invite', { p_code: trimmed });
      if (rpcErr) {
        if (isMissingInviteSchemaError(rpcErr)) {
          // Invites not deployed yet; fail open.
          onRedeemed?.(false, 0);
          return;
        }
        throw rpcErr;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const bonusGranted = !!row?.bonus_granted;
      const bonusAmount = Number(row?.bonus_amount_items ?? 0);

      onRedeemed?.(bonusGranted, Number.isFinite(bonusAmount) ? bonusAmount : 0);
    } catch (e: any) {
      const msg = (e?.message ?? '').toString();
      if (/invalid_invite/i.test(msg)) {
        setError('That invite code is not valid.');
      } else if (/already_redeemed/i.test(msg)) {
        setError('This account is already activated.');
      } else {
        setError(msg || 'Failed to redeem invite.');
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-950 mb-2">Checking access…</h2>
          <p className="text-zinc-500">Please wait.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 relative">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-50 transition-colors"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-950">Invite Required</h2>
            <p className="text-sm text-zinc-500">Enter an invite code to activate your account.</p>
          </div>
        </div>

        <div className="space-y-3">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Invite code"
            disabled={isRedeeming}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 font-semibold uppercase tracking-wider"
          />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-semibold text-rose-700">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={redeem}
            disabled={isRedeeming}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {isRedeeming ? 'Redeeming…' : 'Activate'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
