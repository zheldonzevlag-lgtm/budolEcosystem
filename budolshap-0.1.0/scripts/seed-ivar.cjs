const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists by phone first to avoid unique constraint error
    const phone = '+639484099400';
    const email = 'ivarhanestad@gmail.com';
    
    const existingUserByPhone = await prisma.user.findUnique({
        where: { phoneNumber: phone }
    });

    const userData = {
        email: email,
        phoneNumber: phone,
        password: hashedPassword,
        name: 'Ivar Hanestad',
        image: 'https://ui-avatars.com/api/?name=Ivar+Hanestad',
        accountType: 'BUYER',
        role: 'USER',
        isAdmin: false,
        emailVerified: true
    };

    try {
        if (existingUserByPhone) {
            console.log(`User with phone ${phone} already exists. Updating...`);
            const updated = await prisma.user.update({
                where: { phoneNumber: phone },
                data: userData
            });
            console.log(`User updated: ${updated.email} (${updated.id})`);
        } else {
            // Check by email
             const existingUserByEmail = await prisma.user.findUnique({
                where: { email: email }
            });
            
            if (existingUserByEmail) {
                 console.log(`User with email ${email} already exists. Updating...`);
                 const updated = await prisma.user.update({
                    where: { email: email },
                    data: userData
                });
                console.log(`User updated: ${updated.email} (${updated.id})`);
            } else {
                console.log(`Creating new user...`);
                const created = await prisma.user.create({
                    data: {
                        id: uuidv4(),
                        ...userData
                    }
                });
                console.log(`User created: ${created.email} (${created.id})`);
            }
        }
    } catch (error) {
        console.error('Error seeding user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
