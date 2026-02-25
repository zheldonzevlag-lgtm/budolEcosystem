import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Polyfill for setImmediate which is missing in some Jest environments
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (fn) => setTimeout(fn, 0);
}

describe('Profile Edit and Address Persistence Logic Tests', () => {
  let testUser;
  const testUserId = `test-profile-addr-${crypto.randomUUID()}`;
  const initialPhone = `+639${Math.floor(100000000 + Math.random() * 900000000)}`;
  const updatedPhone = `+639${Math.floor(100000000 + Math.random() * 900000000)}`;
  const updatedName = 'Updated Profile Address Name';
  
  const testAddress = {
    city: 'Manila',
    barangay: 'San Lorenzo',
    street: '123 Test St',
    latitude: 14.5995,
    longitude: 120.9842,
    zip: '1000',
    state: 'Metro Manila',
    notes: 'Near the park'
  };

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-profile-addr-${Date.now()}@example.com`,
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
        // Delete address first due to foreign key constraints if needed
        await prisma.address.deleteMany({
          where: { userId: testUser.id }
        })
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
      where: { id: testUser.id },
      include: { Address: true }
    })
    expect(user.name).toBe('Initial Name')
    expect(user.phoneNumber).toBe(initialPhone)
    expect(user.Address.length).toBe(0)
  })

  test('Database update simulation: update name, phone and CREATE address', async () => {
    // This simulates the logic in PUT /api/users
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        name: updatedName,
        phoneNumber: updatedPhone,
        Address: {
          create: {
            city: testAddress.city,
            barangay: testAddress.barangay,
            street: testAddress.street,
            latitude: testAddress.latitude,
            longitude: testAddress.longitude,
            zip: testAddress.zip,
            state: testAddress.state,
            notes: testAddress.notes,
            name: updatedName,
            email: testUser.email,
            phone: updatedPhone,
            country: 'Philippines'
          }
        }
      },
      include: { Address: true }
    })

    expect(updatedUser.name).toBe(updatedName)
    expect(updatedUser.phoneNumber).toBe(updatedPhone)
    expect(updatedUser.Address.length).toBe(1)
    expect(updatedUser.Address[0].city).toBe(testAddress.city)
    expect(updatedUser.Address[0].street).toBe(testAddress.street)
  })

  test('Retrieval verification: updated address should persist', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { Address: true }
    })
    expect(user.name).toBe(updatedName)
    expect(user.phoneNumber).toBe(updatedPhone)
    expect(user.Address.length).toBe(1)
    expect(user.Address[0].city).toBe(testAddress.city)
  })

  test('Database update simulation: UPDATE existing address', async () => {
    const existingAddress = await prisma.address.findFirst({
      where: { userId: testUser.id }
    })

    const updatedAddressData = {
      ...testAddress,
      city: 'Quezon City',
      street: '456 New St'
    }

    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        Address: {
          update: {
            where: { id: existingAddress.id },
            data: {
              city: updatedAddressData.city,
              street: updatedAddressData.street
            }
          }
        }
      },
      include: { Address: true }
    })

    expect(updatedUser.Address.length).toBe(1)
    expect(updatedUser.Address[0].city).toBe('Quezon City')
    expect(updatedUser.Address[0].street).toBe('456 New St')
  })
})
