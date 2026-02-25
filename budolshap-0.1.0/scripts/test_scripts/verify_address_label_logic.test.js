
/** @jest-environment node */
const { PrismaClient } = require('@prisma/client-custom-v4');
const prisma = new PrismaClient();

describe('Address Label and Default Logic', () => {
    let userId;

    beforeAll(async () => {
        // Create a test user
        const user = await prisma.user.create({
            data: {
                id: `user_label_test_${Date.now()}`,
                name: 'Label Test User',
                email: `label_test_${Date.now()}@example.com`,
                password: 'password123',
                phoneNumber: `09${Date.now().toString().slice(-9)}`,
                image: 'default.jpg'
            },
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

    test('should save label and handle isDefault logic', async () => {
        // Step 1: Simulate creating the first address (Logic from API)
        const address1Data = {
            userId,
            name: 'Home Address',
            email: 'test@example.com',
            phone: '09123456789',
            street: '123 Home St',
            city: 'Manila',
            state: 'Metro Manila',
            zip: '1000',
            country: 'Philippines',
            label: 'Home',
            isDefault: true,
            barangay: 'Test Barangay',
            subdivision: 'Test Subdivision',
            landmark: 'Test Landmark'
        };

        // Logic: First address is always default
        const count1 = await prisma.address.count({ where: { userId } });
        if (count1 === 0) {
            address1Data.isDefault = true;
        }

        const address1 = await prisma.address.create({
            data: address1Data
        });

        expect(address1.label).toBe('Home');
        expect(address1.isDefault).toBe(true);

        // Step 2: Simulate adding a second address as default (Logic from API)
        const address2Data = {
            userId,
            name: 'Work Address',
            email: 'test@example.com',
            phone: '09123456789',
            street: '456 Work Ave',
            city: 'Makati',
            state: 'Metro Manila',
            zip: '1200',
            country: 'Philippines',
            label: 'Work',
            isDefault: true,
            barangay: 'Test Barangay',
            subdivision: 'Test Subdivision',
            landmark: 'Test Landmark'
        };

        // Logic: If setting as default, unset others
        if (address2Data.isDefault) {
            await prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const address2 = await prisma.address.create({
            data: address2Data
        });

        expect(address2.label).toBe('Work');
        expect(address2.isDefault).toBe(true);

        // Verify address1 is no longer default
        const updatedAddress1 = await prisma.address.findUnique({
            where: { id: address1.id }
        });
        expect(updatedAddress1.isDefault).toBe(false);

        // Step 3: Simulate updating address2 label (Logic from API PUT)
        const updateData = {
            label: 'Office'
        };

        const updatedAddress2 = await prisma.address.update({
            where: { id: address2.id },
            data: updateData
        });

        expect(updatedAddress2.label).toBe('Office');
        expect(updatedAddress2.isDefault).toBe(true); // Should remain default
    });
});
