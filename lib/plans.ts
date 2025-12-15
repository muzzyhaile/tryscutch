import { storage } from './storage';

export type PlanId = 'starter' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxProjects: number;
  maxItemsPerAnalysis: number;
  maxCharsPerAnalysis: number;
  monthlyItems: number;
  importMaxFileBytes: number;
  importMaxTableRows: number;
  seatsIncluded: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  description: string;
  popular?: boolean;
  limits: PlanLimits;
}

export interface SubscriptionState {
  planId: PlanId;
  updatedAt: string;
  // Seats aren’t implemented in-app yet, but we surface this to make enterprise pricing logical.
  seats?: number;
}

export interface UsageState {
  monthKey: string; // YYYY-MM
  importedBytes: number;
  analyzedItems: number;
  analyzedChars: number;
  updatedAt: string;
}

const SUBSCRIPTION_KEY_PREFIX = 'scutch_subscription:';
const USAGE_KEY_PREFIX = 'scutch_usage:';

export const PLAN_CATALOG: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceLabel: '$39 / month',
    description: 'For solo founders and early teams getting started with AI-assisted feedback synthesis.',
    limits: {
      maxProjects: 10,
      maxItemsPerAnalysis: 1000,
      maxCharsPerAnalysis: 400_000,
      monthlyItems: 10_000,
      importMaxFileBytes: 10 * 1024 * 1024,
      importMaxTableRows: 10_000,
      seatsIncluded: 1,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$99 / month',
    description: 'For small teams running continuous feedback analysis across products and channels.',
    popular: true,
    limits: {
      maxProjects: 50,
      maxItemsPerAnalysis: 5000,
      maxCharsPerAnalysis: 2_000_000,
      monthlyItems: 50_000,
      importMaxFileBytes: 25 * 1024 * 1024,
      importMaxTableRows: 50_000,
      seatsIncluded: 5,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: 'Custom',
    description: 'For larger orgs that need SSO, audit logs, higher throughput, and per-seat procurement.',
    limits: {
      maxProjects: Number.POSITIVE_INFINITY,
      maxItemsPerAnalysis: 25_000,
      maxCharsPerAnalysis: 10_000_000,
      monthlyItems: 500_000,
      importMaxFileBytes: 100 * 1024 * 1024,
      importMaxTableRows: 250_000,
      seatsIncluded: 10,
    },
  },
};

function monthKeyForNow(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function subscriptionStorageKey(userId?: string | null): string {
  return `${SUBSCRIPTION_KEY_PREFIX}${userId || 'anon'}`;
}

export function usageStorageKey(userId?: string | null): string {
  return `${USAGE_KEY_PREFIX}${userId || 'anon'}`;
}

export function loadSubscription(userId?: string | null): SubscriptionState {
  const existing = storage.get<SubscriptionState>(subscriptionStorageKey(userId));
  if (existing?.planId && existing.planId in PLAN_CATALOG) return existing;

  const fallback: SubscriptionState = {
    planId: 'starter',
    updatedAt: new Date().toISOString(),
    seats: PLAN_CATALOG.starter.limits.seatsIncluded,
  };
  return fallback;
}

export function saveSubscription(userId: string | null | undefined, state: SubscriptionState): void {
  storage.set(subscriptionStorageKey(userId), state);
}

export function getActivePlan(userId?: string | null): Plan {
  const sub = loadSubscription(userId);
  return PLAN_CATALOG[sub.planId];
}

export function loadUsage(userId?: string | null, now = new Date()): UsageState {
  const existing = storage.get<UsageState>(usageStorageKey(userId));
  const monthKey = monthKeyForNow(now);

  if (existing && existing.monthKey === monthKey) return existing;

  return {
    monthKey,
    importedBytes: 0,
    analyzedItems: 0,
    analyzedChars: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function saveUsage(userId: string | null | undefined, usage: UsageState): void {
  storage.set(usageStorageKey(userId), usage);
}

export function recordImportUsage(params: { userId?: string | null; bytes: number }): UsageState {
  const usage = loadUsage(params.userId);
  const next: UsageState = {
    ...usage,
    importedBytes: usage.importedBytes + Math.max(0, params.bytes),
    updatedAt: new Date().toISOString(),
  };
  saveUsage(params.userId, next);
  return next;
}

export function recordAnalysisUsage(params: { userId?: string | null; items: number; chars: number }): UsageState {
  const usage = loadUsage(params.userId);
  const next: UsageState = {
    ...usage,
    analyzedItems: usage.analyzedItems + Math.max(0, params.items),
    analyzedChars: usage.analyzedChars + Math.max(0, params.chars),
    updatedAt: new Date().toISOString(),
  };
  saveUsage(params.userId, next);
  return next;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[idx]}`;
}

export function estimateChars(items: string[], context?: string): number {
  const itemsChars = items.reduce((sum, it) => sum + (it?.length || 0), 0);
  return itemsChars + (context?.length || 0);
}

export function validateAnalysisWithinPlan(params: {
  userId?: string | null;
  items: string[];
  context?: string;
}): { ok: true } | { ok: false; message: string } {
  const plan = getActivePlan(params.userId);
  const usage = loadUsage(params.userId);

  const itemCount = params.items.length;
  const charCount = estimateChars(params.items, params.context);

  if (itemCount > plan.limits.maxItemsPerAnalysis) {
    return {
      ok: false,
      message: `This plan allows up to ${plan.limits.maxItemsPerAnalysis.toLocaleString()} feedback items per analysis. You tried ${itemCount.toLocaleString()}. Split the file or upgrade your plan.`,
    };
  }

  if (charCount > plan.limits.maxCharsPerAnalysis) {
    return {
      ok: false,
      message: `This analysis is too large for your plan. Reduce the amount of text or upgrade your plan.`,
    };
  }

  if (usage.analyzedItems + itemCount > plan.limits.monthlyItems) {
    const remaining = Math.max(0, plan.limits.monthlyItems - usage.analyzedItems);
    return {
      ok: false,
      message: `You’re out of monthly analysis capacity for ${usage.monthKey}. Remaining: ${remaining.toLocaleString()} items. Upgrade to increase limits.`,
    };
  }

  return { ok: true };
}

export function importOptionsForUser(userId?: string | null): {
  maxBytes: number;
  maxTableRows: number;
} {
  const plan = getActivePlan(userId);
  return {
    maxBytes: plan.limits.importMaxFileBytes,
    maxTableRows: plan.limits.importMaxTableRows,
  };
}
