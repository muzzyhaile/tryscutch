import React, { useCallback, useEffect, useState } from 'react';

type CookieConsent = 'accepted' | 'declined' | null;

const STORAGE_KEY = 'scutch_cookie_consent';

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
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-md"
      role="region"
      aria-label="Cookie notice"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-[11px] leading-relaxed text-zinc-600">
          We use essential storage to run the Service. Optional cookies/technologies may be used only
          with your consent. See our{' '}
          <a href="/privacy" className="underline underline-offset-4 hover:text-zinc-950 transition-colors">
            Privacy Policy
          </a>
          .
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => save('declined')}
            className="text-[11px] font-semibold px-3 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => save('accepted')}
            className="text-[11px] font-semibold px-3 py-2 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
