/**
 * Rate Limiting Utilities for Supabase Edge Functions
 *
 * Implements a simple in-memory rate limiter to prevent API abuse.
 * For production, consider using Upstash Redis or Supabase Edge Function KV store.
 */

interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on Edge Function cold start)
// For production: use Upstash Redis, Cloudflare KV, or Supabase KV
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
    lastCleanup = now;
  }
}

/**
 * Check if a request is within rate limits
 *
 * @param identifier - Unique identifier for the client (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining quota
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  cleanup(); // Periodic cleanup

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No existing entry or expired window - create new entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(identifier, entry);

  // Check if over limit
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000); // seconds

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Standard rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict: 5 requests per minute (for expensive operations like AI analysis)
  STRICT: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  // Standard: 20 requests per minute (for normal API operations)
  STANDARD: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  // Generous: 100 requests per minute (for lightweight operations)
  GENEROUS: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Per-hour limit for expensive operations
  HOURLY: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: {
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}
