import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn } from 'lucide-react';

export const AuthView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
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

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Authentication failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-white font-bold text-xl">S</div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter">Scutch</h1>
              <p className="text-zinc-500 mt-1">Sign in with Google to access your workspace data.</p>
            </div>
          </div>

          {inviteCode && (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-zinc-950">Invite detected</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    We’ll apply invite code <span className="font-mono font-bold">{maskedInviteCode(inviteCode)}</span> after you sign in.
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
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              onClick={() => void signInWithGoogle()}
              disabled={isLoading}
              className="w-full px-10 py-5 bg-zinc-950 text-white text-xl font-bold rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="text-xs text-zinc-500 leading-relaxed">
              This app uses Supabase Auth with Google OAuth. Your workspace data is private and secured with Row Level Security.
            </div>

            <div className="text-[11px] text-zinc-400 leading-relaxed">
              By continuing, you agree to our <a className="underline underline-offset-4 hover:text-zinc-700 transition-colors" href="/terms">Terms</a> and <a className="underline underline-offset-4 hover:text-zinc-700 transition-colors" href="/privacy">Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
