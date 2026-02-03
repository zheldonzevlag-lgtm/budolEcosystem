import { prisma } from "./prisma";

/**
 * Database-backed rate limiter for Next.js API routes.
 * Follows Budol Ecosystem Security Standard Phase 3.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number; reset: Date }> {
  const now = new Date();
  
  // Clean up expired entries occasionally (could be moved to a cron job)
  // For now, we'll just clean up the specific key if it's expired
  
  const record = await prisma.rateLimit.findUnique({
    where: { key }
  });

  if (!record || record.expiresAt < now) {
    // First hit or expired
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
    
    await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        hits: 1,
        expiresAt
      },
      update: {
        hits: 1,
        expiresAt
      }
    });

    return {
      success: true,
      remaining: limit - 1,
      reset: expiresAt
    };
  }

  if (record.hits >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: record.expiresAt
    };
  }

  // Increment hits
  const updated = await prisma.rateLimit.update({
    where: { key },
    data: {
      hits: { increment: 1 }
    }
  });

  return {
    success: true,
    remaining: limit - updated.hits,
    reset: record.expiresAt
  };
}
