
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Polyfill for setImmediate which is missing in some Jest environments
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (fn) => setTimeout(fn, 0);
}

describe('Phone Number Pre-fill Logic Tests', () => {
  let testUser;
  const testUserId = `test-user-${crypto.randomUUID()}`;
  const testPhone = `+639${Math.floor(100000000 + Math.random() * 900000000)}`;

  beforeAll(async () => {
    // Create a test user with a phone number
    testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-phone-${Date.now()}@example.com`,
        name: 'Test Phone User',
        password: 'password123',
        phoneNumber: testPhone,
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

  test('Database should store and retrieve phone number correctly', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUser.id }
    })
    expect(user.phoneNumber).toBe(testPhone)
  })

  test('API Response simulation: phone number should be present in user data', async () => {
    // This simulates the logic in AddressModal.jsx where it fetches user data
    const dbUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true
      }
    })

    expect(dbUser).toHaveProperty('phoneNumber')
    expect(dbUser.phoneNumber).toBe(testPhone)
  })

  test('Form initialization simulation: data should be passed to AddressFormManager', () => {
    // Simulate the state transformation in AddressModal.jsx
    const userMeta = {
      id: testUser.id,
      name: testUser.name,
      email: testUser.email,
      phone: testUser.phoneNumber
    }

    const initialData = {
      name: userMeta.name,
      email: userMeta.email,
      phone: userMeta.phone
    }

    expect(initialData.phone).toBe(testPhone)
    expect(initialData.name).toBe('Test Phone User')
  })
})
