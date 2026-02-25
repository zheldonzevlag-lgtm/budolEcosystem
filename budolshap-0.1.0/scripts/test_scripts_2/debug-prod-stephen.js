
const { PrismaClient } = require('@prisma/client-custom-v4');
const fs = require('fs');
const path = require('path');

// Load url from .env.check_prod
const envPath = path.join(__dirname, '../.env.check_prod');
const content = fs.readFileSync(envPath, 'utf8');
const match = content.match(/DATABASE_URL="?([^"]+)"?/);
const dbUrl = match ? match[1] : null;

console.log('Testing URL:', dbUrl ? dbUrl.substring(0, 30) + '...' : 'NULL');

const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
});

async function main() {
    console.log('Searching for Stephen Strange...');
    const user = await prisma.user.findFirst({
        where: { email: { contains: 'strange' } }
    });

    if (user) {
        console.log('✅ FOUND:', user.email, user.name);
    } else {
        console.log('❌ NOT FOUND in this DB connection.');
        // List random users
        const users = await prisma.user.findMany({ take: 3 });
        console.log('Visible users:', users.map(u => u.email));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
