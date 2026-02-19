
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

async function main() {
    try {
        // 1. Get User ID
        const user = await prisma.user.findUnique({
            where: { email: 'marijoy@omsmpc.com' }
        });

        if (!user) {
            console.log('User marijoy not found in DB');
            return;
        }

        console.log('User found in DB:', user.email, user.id);

        // 2. Generate Token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                role: user.role 
            }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        console.log('Generated Token');

        // 3. Call /verify
        try {
            const response = await axios.get('http://localhost:8001/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('API Response Status:', response.status);
            console.log('API Response User Data:', JSON.stringify(response.data.user, null, 2));

            if (response.data.user.firstName.includes('*')) {
                console.log('RESULT: Data IS MASKED by Backend');
            } else {
                console.log('RESULT: Data is UNMASKED');
            }

        } catch (err) {
            console.error('API Call Failed:', err.message);
            if (err.response) {
                console.error('Response:', err.response.data);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
