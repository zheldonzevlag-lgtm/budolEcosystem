/**
 * Rate limiting logic extracted for unit testing with mocked prisma.
 */
async function checkRateLimit(prisma, key, limit, windowSeconds) {
    const now = new Date();
    
    const record = await prisma.rateLimit.findUnique({
      where: { key }
    });
  
    if (!record || record.expiresAt < now) {
      const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
      
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, hits: 1, expiresAt },
        update: { hits: 1, expiresAt }
      });
  
      return { success: true, remaining: limit - 1, reset: expiresAt };
    }
  
    if (record.hits >= limit) {
      return { success: false, remaining: 0, reset: record.expiresAt };
    }
  
    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { hits: { increment: 1 } }
    });
  
    return { success: true, remaining: limit - updated.hits, reset: record.expiresAt };
  }
  
  module.exports = { checkRateLimit };
