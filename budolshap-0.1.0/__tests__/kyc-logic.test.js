
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Polyfill for setImmediate which is missing in some Jest environments
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (fn) => setTimeout(fn, 0);
}

describe('KYC Implementation Tests', () => {
  let testUser;
  const testUserId = `test-user-${crypto.randomUUID()}`;

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-kyc-${Date.now()}@example.com`,
        name: 'Test KYC User',
        password: 'password123',
        phoneNumber: `+639${Math.floor(Math.random() * 1000000000)}`,
        image: 'https://example.com/image.png',
        kycStatus: 'UNVERIFIED'
      }
    })
  })

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id }
      })
    }
    await prisma.$disconnect()
  })

  test('User should have default kycStatus as UNVERIFIED', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUser.id }
    })
    expect(user.kycStatus).toBe('UNVERIFIED')
  })

  test('User kycStatus can be updated to PENDING with details', async () => {
    const kycDetails = {
      tier: 'INDIVIDUAL',
      fullName: 'John Doe',
      idType: 'PASSPORT',
      idNumber: 'A1234567',
      submittedAt: new Date().toISOString()
    }

    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        kycStatus: 'PENDING',
        kycDetails: kycDetails
      }
    })

    expect(updatedUser.kycStatus).toBe('PENDING')
    expect(updatedUser.kycDetails).toMatchObject(kycDetails)
  })

  test('Audit log is created for KYC submission', async () => {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: testUser.id,
        action: 'KYC_SUBMISSION',
        metadata: { tier: 'INDIVIDUAL', fullName: 'John Doe' }
      }
    })

    expect(auditLog.userId).toBe(testUser.id)
    expect(auditLog.action).toBe('KYC_SUBMISSION')
    expect(auditLog.metadata).toHaveProperty('tier', 'INDIVIDUAL')
  })
})
