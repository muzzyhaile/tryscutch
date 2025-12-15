import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn } from 'lucide-react';

export const AuthView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

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
          </div>
        </div>
      </div>
    </div>
  );
};
