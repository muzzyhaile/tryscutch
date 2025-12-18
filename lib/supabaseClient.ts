import { createClient } from '@supabase/supabase-js';

type ClarityPublicConfig = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  supabaseAnonKey?: string;
};

declare global {
  interface Window {
    __SCUTCH_PUBLIC_CONFIG__?: ScutchPublicConfig;
  }
}

type ScutchPublicConfig = ClarityPublicConfig;

const runtimeConfig: ScutchPublicConfig | undefined =
  typeof window !== 'undefined' ? window.__SCUTCH_PUBLIC_CONFIG__ : undefined;

function normalizePublicEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // If `index.html` placeholders weren't replaced, they'll look like: %VITE_SUPABASE_URL%
  if (trimmed.startsWith('%VITE_') && trimmed.endsWith('%')) return undefined;
  if (trimmed.includes('%VITE_SUPABASE_')) return undefined;
  return trimmed;
}

const supabaseUrl =
  normalizePublicEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  normalizePublicEnv(runtimeConfig?.supabaseUrl);
const supabasePublishableKey =
  normalizePublicEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  normalizePublicEnv(runtimeConfig?.supabasePublishableKey);
const supabaseAnonKey =
  normalizePublicEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  normalizePublicEnv(runtimeConfig?.supabaseAnonKey);
const supabaseKey = supabasePublishableKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  // Helpful diagnostics (does not log secrets/values)
  // This is mainly for hosted builds where env var injection might be misconfigured.
  // eslint-disable-next-line no-console
  console.error('[config] Supabase env missing', {
    hasUrl: Boolean(supabaseUrl),
    hasPublishableKey: Boolean(supabasePublishableKey),
    hasAnonKey: Boolean(supabaseAnonKey),
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
  });
  // Keep the thrown error clear; without these the app cannot auth/query.
  throw new Error(
    'Missing Supabase env vars: VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY (preferred) or VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
