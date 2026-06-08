const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
(async () => {
    await p.$connect();
    const d = await p.rateLimit.deleteMany({});
    console.log('Deleted ' + d.count + ' rate limit entries');
    const remaining = await p.rateLimit.findMany();
    console.log('Remaining: ' + remaining.length);
    await p.$disconnect();
})();
