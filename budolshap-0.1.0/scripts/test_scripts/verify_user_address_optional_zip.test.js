
const { PrismaClient } = require('@prisma/client-custom-v4');

const prisma = new PrismaClient();

describe('User Address Optional Zip Verification', () => {
    let userId;
    let email;

    beforeAll(async () => {
        email = `testuser_${Date.now()}@example.com`;
        const user = await prisma.user.create({
            data: {
                id: `user_${Date.now()}`,
                name: 'Test User for Zip',
                email: email,
                password: 'password123',
                phoneNumber: `+639${Date.now().toString().slice(-9)}`,
                image: ''
            }
        });
        userId = user.id;
    });

    afterAll(async () => {
        if (userId) {
            await prisma.address.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        }
        await prisma.$disconnect();
    });

    test('should accept null and empty zip values', async () => {
        const addressNull = await prisma.address.create({
            data: {
                userId: userId,
                name: 'Test Address',
                email: email,
                phone: '+639123456789',
                street: 'Test Street',
                city: 'Test City',
                state: 'Test Province',
                country: 'Philippines',
                zip: null,
                label: 'Home',
                isDefault: true
            }
        });

        const addressEmpty = await prisma.address.create({
            data: {
                userId: userId,
                name: 'Test Address Empty Zip',
                email: email,
                phone: '+639123456789',
                street: 'Test Street',
                city: 'Test City',
                state: 'Test Province',
                country: 'Philippines',
                zip: '',
                label: 'Work',
                isDefault: false
            }
        });

        expect(addressNull.id).toBeDefined();
        expect(addressNull.zip).toBeNull();
        expect(addressEmpty.id).toBeDefined();
        expect(addressEmpty.zip).toBe('');
    });
});
