
const { PrismaClient } = require('@prisma/client-custom-v4')
const { readFileSync, existsSync } = require('fs')
const { resolve } = require('path')

// Load .env file manually if it exists
try {
    const envPath = resolve(process.cwd(), '.env')
    if (existsSync(envPath)) {
        const envFile = readFileSync(envPath, 'utf8')
        envFile.split('\n').forEach(line => {
            const trimmed = line.trim()
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=')
                if (key && valueParts.length) {
                    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
                    if (!process.env[key.trim()]) {
                        process.env[key.trim()] = value
                    }
                }
            }
        })
    }
} catch (error) {
    // .env file not found or couldn't be read, that's okay
}

const prisma = new PrismaClient()

async function checkStore() {
    try {
        const stores = await prisma.store.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                address: true
            }
        });
        console.log(JSON.stringify(stores, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkStore();
