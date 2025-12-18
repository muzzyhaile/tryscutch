import React, { useCallback, useEffect, useState } from 'react';

type CookieConsent = 'accepted' | 'declined' | null;

// Versioned key so we can re-prompt users when the banner copy/behavior changes.
const STORAGE_KEY = 'scutch_cookie_consent_v2';

export const CookieBanner: React.FC = () => {
  const [consent, setConsent] = useState<CookieConsent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'accepted' || saved === 'declined') {
        setConsent(saved);
      }
    } catch {
      // If storage is unavailable, show the banner for this session.
    } finally {
      setReady(true);
    }
  }, []);

  const save = useCallback((value: Exclude<CookieConsent, null>) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setConsent(value);
  }, []);

  if (!ready || consent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6" role="region" aria-label="Cookie notice">
      <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-bold text-zinc-950">Cookies</div>
              <div className="mt-1 text-sm text-zinc-600 leading-relaxed">
                We use essential storage to run the service. Optional cookies/technologies may be used only with your consent.
                <a
                  href="/privacy"
                  className="ml-1 font-semibold text-zinc-950 underline underline-offset-4 hover:text-zinc-700 transition-colors"
                >
                  Privacy Policy
                </a>
                .
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={() => save('declined')}
                className="text-sm font-bold px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Only essential
              </button>
              <button
                type="button"
                onClick={() => save('accepted')}
                className="text-sm font-bold px-4 py-2 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
