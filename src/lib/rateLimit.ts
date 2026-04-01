// Simple in-memory rate limiter for API routes
const attempts = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of attempts) {
    if (now > val.resetAt) attempts.delete(key);
  }
}, 300_000);

export function rateLimit(key: string, maxAttempts = 5, windowMs = 900_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: maxAttempts - entry.count };
}
