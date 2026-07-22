// Lightweight in-memory rate limiter — single-host, hackathon-scope.
// Per rules.md: every external API call (LLM, OCR, embeddings) wrapped with
// timeout + retry + graceful degradation. This adds the missing rate-limit guard
// to prevent cost/DoS exposure on LLM-calling endpoints.
//
// Production path: move to Redis-backed sliding-window limiter behind a load
// balancer so all API workers share counters.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically prune expired buckets to avoid memory growth
let lastPrune = 0;
function prune(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}

/**
 * Returns true if the request is allowed; false if rate-limited.
 * Limits are per-IP + per-route so a single noisy client can't starve other users.
 */
export function rateLimit(
  ip: string,
  route: string,
  opts: { maxRequests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  prune(now);
  const key = `${ip}:${route}`;
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.maxRequests - 1, resetAt: now + opts.windowMs };
  }
  if (existing.count >= opts.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return {
    allowed: true,
    remaining: opts.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Extract best-effort client IP from a Next.js Request. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Standard rate-limit configs for our LLM-calling routes. */
export const RATE_LIMITS = {
  // LLM calls are expensive — strict per-IP limit per minute
  chat: { maxRequests: 10, windowMs: 60_000 },
  lessons: { maxRequests: 5, windowMs: 60_000 },
  compliance: { maxRequests: 3, windowMs: 60_000 }, // each call hits LLM per clause
  // Seeding wipes DB + makes ~80 LLM calls — very strict
  seed: { maxRequests: 3, windowMs: 5 * 60_000 },
} as const;

/** Returns a 429 Response if rate-limited, null otherwise. */
export function checkRateLimit(
  req: Request,
  route: keyof typeof RATE_LIMITS
): Response | null {
  const ip = getClientIp(req);
  const cfg = RATE_LIMITS[route];
  const result = rateLimit(ip, route, cfg);
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfterSeconds: retryAfter,
        route,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(cfg.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }
  return null;
}
