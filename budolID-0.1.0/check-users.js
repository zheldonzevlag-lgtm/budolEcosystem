require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function check() {
    const urls = [
        { name: 'budolid DB (public schema)', url: 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolid?sslmode=require' },
        { name: 'budolpay DB (budolid schema)', url: 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolid' },
        { name: 'budolpay DB (public schema)', url: 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require' },
    ];

    for (const { name, url } of urls) {
        try {
            const p = new PrismaClient({ datasources: { db: { url } } });
            const count = await p.user.count();
            console.log(`${name}: ${count} users`);
            if (count > 0) {
                const users = await p.user.findMany({ take: 5, select: { id: true, email: true, role: true } });
                users.forEach(u => console.log(`  - ${u.email} (${u.role}) [${u.id}]`));
            }
            await p.$disconnect();
        } catch (e) {
            console.log(`${name}: ERROR - ${e.message.substring(0, 100)}`);
        }
    }
}
check();
