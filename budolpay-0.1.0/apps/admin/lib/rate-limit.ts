const rateLimiter = new Map<string, { count: number; reset: Date }>();

export async function checkRateLimit(key: string, limit: number, windowSec: number) {
  const now = new Date();
  const entry = rateLimiter.get(key);

  if (entry && entry.reset > now) {
    if (entry.count >= limit) {
      return { success: false, limit, remaining: 0, reset: entry.reset };
    }
    entry.count += 1;
    return { success: true, limit, remaining: limit - entry.count, reset: entry.reset };
  }

  const reset = new Date(now.getTime() + windowSec * 1000);
  rateLimiter.set(key, { count: 1, reset });
  return { success: true, limit, remaining: limit - 1, reset };
}
