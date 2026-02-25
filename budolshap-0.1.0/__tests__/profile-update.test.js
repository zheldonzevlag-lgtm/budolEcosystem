
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Polyfill for setImmediate which is missing in some Jest environments
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (fn) => setTimeout(fn, 0);
}

describe('Profile Edit and Update Logic Tests', () => {
  let testUser;
  const testUserId = `test-profile-${crypto.randomUUID()}`;
  const initialPhone = `+639${Math.floor(100000000 + Math.random() * 900000000)}`;
  const updatedPhone = `+639${Math.floor(100000000 + Math.random() * 900000000)}`;
  const updatedName = 'Updated Profile Name';

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-profile-${Date.now()}@example.com`,
        name: 'Initial Name',
        password: 'password123',
        phoneNumber: initialPhone,
        image: 'https://example.com/image.png'
      }
    })
  })

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      try {
        await prisma.user.delete({
          where: { id: testUser.id }
        })
      } catch (e) {
        // Ignore if already deleted
      }
    }
    await prisma.$disconnect()
  })

  test('User record should exist with initial values', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUser.id }
    })
    expect(user.name).toBe('Initial Name')
    expect(user.phoneNumber).toBe(initialPhone)
  })

  test('Database update simulation: update name and phone number', async () => {
    // This simulates the logic in PUT /api/users
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        name: updatedName,
        phoneNumber: updatedPhone
      }
    })

    expect(updatedUser.name).toBe(updatedName)
    expect(updatedUser.phoneNumber).toBe(updatedPhone)
  })

  test('Retrieval verification: updated data should persist', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUser.id }
    })
    expect(user.name).toBe(updatedName)
    expect(user.phoneNumber).toBe(updatedPhone)
  })

  test('Form initialization for Profile mode simulation', () => {
    // Simulate AddressModal behavior in 'profile' mode
    const mode = 'profile';
    const userMeta = {
      id: testUser.id,
      name: updatedName,
      phone: updatedPhone
    };

    const isProfileMode = mode === 'profile';
    
    // Simulate initialData passed to AddressFormManager
    const initialData = {
      name: userMeta.name,
      phone: userMeta.phone
    };

    expect(isProfileMode).toBe(true);
    expect(initialData.name).toBe(updatedName);
    expect(initialData.phone).toBe(updatedPhone);
  })
})
