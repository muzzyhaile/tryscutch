import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type CheckStatus = 'pending' | 'running' | 'pass' | 'fail' | 'warn';

interface Check {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail?: string;
}

const INITIAL_CHECKS: Check[] = [
  {
    id: 'env_supabase_url',
    label: 'Supabase URL configured',
    description: 'VITE_SUPABASE_URL env var is set and non-empty.',
    status: 'pending',
  },
  {
    id: 'env_supabase_key',
    label: 'Supabase anon key configured',
    description: 'VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY is set.',
    status: 'pending',
  },
  {
    id: 'network_supabase',
    label: 'Supabase reachable',
    description: 'The Supabase REST API responds to a lightweight HEAD request.',
    status: 'pending',
  },
  {
    id: 'auth_supabase',
    label: 'Supabase Auth endpoint accessible',
    description: 'The Supabase Auth service returns a valid response.',
    status: 'pending',
  },
  {
    id: 'edge_gemini',
    label: 'Gemini edge function deployed',
    description: 'The "gemini" Supabase Edge Function is reachable (no network error).',
    status: 'pending',
  },
];

function normalizePublicEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('%VITE_') && trimmed.endsWith('%')) return undefined;
  return trimmed;
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'running')
    return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
  if (status === 'pass')
    return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (status === 'fail')
    return <XCircle className="w-5 h-5 text-red-500" />;
  if (status === 'warn')
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  return <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />;
}

function statusLabel(status: CheckStatus): string {
  if (status === 'running') return 'Checking…';
  if (status === 'pass') return 'OK';
  if (status === 'fail') return 'Failed';
  if (status === 'warn') return 'Warning';
  return 'Pending';
}

function overallStatus(checks: Check[]): CheckStatus {
  if (checks.some((c) => c.status === 'running')) return 'running';
  if (checks.some((c) => c.status === 'fail')) return 'fail';
  if (checks.some((c) => c.status === 'warn')) return 'warn';
  if (checks.every((c) => c.status === 'pass')) return 'pass';
  return 'pending';
}

export const ReadinessCheck: React.FC = () => {
  const [checks, setChecks] = useState<Check[]>(INITIAL_CHECKS);

  const updateCheck = useCallback(
    (id: string, patch: Partial<Check>) =>
      setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    []
  );

  const runChecks = useCallback(async () => {
    // Reset
    setChecks(INITIAL_CHECKS.map((c) => ({ ...c, status: 'running' as CheckStatus })));

    // --- 1. Env: Supabase URL ---
    const rawUrl =
      normalizePublicEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
      normalizePublicEnv((window as any).__SCUTCH_PUBLIC_CONFIG__?.supabaseUrl);
    if (rawUrl) {
      updateCheck('env_supabase_url', { status: 'pass', detail: rawUrl });
    } else {
      updateCheck('env_supabase_url', {
        status: 'fail',
        detail: 'VITE_SUPABASE_URL is missing or still contains a placeholder value.',
      });
    }

    // --- 2. Env: Supabase key ---
    const rawPubKey = normalizePublicEnv(
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
    );
    const rawAnonKey = normalizePublicEnv(
      import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
    );
    const hasKey = !!(rawPubKey || rawAnonKey);
    if (hasKey) {
      const which = rawPubKey ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : 'VITE_SUPABASE_ANON_KEY';
      updateCheck('env_supabase_key', { status: 'pass', detail: `Using ${which}` });
    } else {
      updateCheck('env_supabase_key', {
        status: 'fail',
        detail: 'Neither VITE_SUPABASE_PUBLISHABLE_KEY nor VITE_SUPABASE_ANON_KEY is set.',
      });
    }

    // --- 3. Network: Supabase REST ---
    if (rawUrl) {
      try {
        const res = await fetch(`${rawUrl}/rest/v1/`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
        });
        // Any HTTP response (even 4xx) means the server is reachable.
        if (res.ok || res.status < 500) {
          updateCheck('network_supabase', {
            status: 'pass',
            detail: `HTTP ${res.status} from REST endpoint.`,
          });
        } else {
          updateCheck('network_supabase', {
            status: 'warn',
            detail: `HTTP ${res.status} — server reachable but returned an error.`,
          });
        }
      } catch (err) {
        updateCheck('network_supabase', {
          status: 'fail',
          detail: `Network error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    } else {
      updateCheck('network_supabase', {
        status: 'fail',
        detail: 'Skipped — Supabase URL is not configured.',
      });
    }

    // --- 4. Supabase Auth endpoint ---
    try {
      // getSession() makes a lightweight request to the auth server.
      const { error } = await supabase.auth.getSession();
      if (!error) {
        updateCheck('auth_supabase', { status: 'pass', detail: 'Auth service responded successfully.' });
      } else {
        updateCheck('auth_supabase', {
          status: 'warn',
          detail: `Auth responded with error: ${error.message}`,
        });
      }
    } catch (err) {
      updateCheck('auth_supabase', {
        status: 'fail',
        detail: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // --- 5. Gemini edge function ---
    try {
      const { error } = await supabase.functions.invoke('gemini', {
        body: { type: 'ping' },
      });
      // A non-network error (e.g. "unauthorized", "bad request") means the function IS deployed.
      if (!error) {
        updateCheck('edge_gemini', { status: 'pass', detail: 'Edge function responded.' });
      } else {
        const msg = error.message ?? '';
        // FunctionsHttpError / 4xx = deployed but rejected the request (expected without auth)
        if (/FunctionsHttpError|non-2xx|400|401|403|404/.test(msg) || (error as any).status < 500) {
          updateCheck('edge_gemini', {
            status: 'pass',
            detail: `Function deployed (responded with: ${msg}).`,
          });
        } else {
          updateCheck('edge_gemini', {
            status: 'warn',
            detail: `Function error: ${msg}`,
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Network-level failure = function not reachable
      updateCheck('edge_gemini', {
        status: 'fail',
        detail: `Could not reach edge function: ${msg}`,
      });
    }
  }, [updateCheck]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const overall = overallStatus(checks);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Readiness Check</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Verifies that all critical services are configured and reachable.
            </p>
          </div>
          <button
            onClick={() => void runChecks()}
            disabled={overall === 'running'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${overall === 'running' ? 'animate-spin' : ''}`} />
            Re-run
          </button>
        </div>

        {/* Overall banner */}
        <div
          className={`mb-5 rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium border ${
            overall === 'pass'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : overall === 'fail'
              ? 'bg-red-50 border-red-200 text-red-800'
              : overall === 'warn'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : overall === 'running'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-zinc-100 border-zinc-200 text-zinc-700'
          }`}
        >
          <StatusIcon status={overall} />
          <span>
            {overall === 'pass' && 'All checks passed — ready for use.'}
            {overall === 'fail' && 'One or more checks failed — review the details below.'}
            {overall === 'warn' && 'Some checks returned warnings.'}
            {overall === 'running' && 'Running checks…'}
            {overall === 'pending' && 'Awaiting checks.'}
          </span>
        </div>

        {/* Individual checks */}
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 shadow-sm overflow-hidden">
          {checks.map((check) => (
            <div key={check.id} className="px-4 py-3.5 flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <StatusIcon status={check.status} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-900">{check.label}</span>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      check.status === 'pass'
                        ? 'text-emerald-600'
                        : check.status === 'fail'
                        ? 'text-red-600'
                        : check.status === 'warn'
                        ? 'text-amber-600'
                        : check.status === 'running'
                        ? 'text-blue-500'
                        : 'text-zinc-400'
                    }`}
                  >
                    {statusLabel(check.status)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{check.description}</p>
                {check.detail && (
                  <p
                    className={`text-xs mt-1 font-mono break-all ${
                      check.status === 'fail'
                        ? 'text-red-600'
                        : check.status === 'warn'
                        ? 'text-amber-600'
                        : 'text-zinc-500'
                    }`}
                  >
                    {check.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Visit <span className="font-mono">/ready</span> any time to re-run this check.
        </p>
      </div>
    </div>
  );
};
