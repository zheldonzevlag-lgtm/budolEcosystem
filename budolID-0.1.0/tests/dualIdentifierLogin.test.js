// Test suite for dual-identifier login functionality
const request = require('supertest');
const app = require('./testApp');
const { PrismaClient } = require('../generated/client');

const prisma = new PrismaClient();

describe('Dual-Identifier Login API', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.ecosystemApp.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/sso/login', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+639123456789'
    };

    const testApp = {
      name: 'TestApp',
      redirectUri: 'http://localhost:3000/callback'
    };

    let apiKey;

    beforeAll(async () => {
      // Create test app
      const appResponse = await request(app)
        .post('/apps/register')
        .send(testApp);
      apiKey = appResponse.body.apiKey;

      // Create test user
      await request(app)
        .post('/auth/register')
        .send(testUser);
    });

    test('should login with email', async () => {
      const response = await request(app)
        .post('/auth/sso/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          apiKey: apiKey
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('redirectUri');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('phoneNumber', testUser.phoneNumber);
    });

    test('should login with phone number', async () => {
      const response = await request(app)
        .post('/auth/sso/login')
        .send({
          email: testUser.phoneNumber, // Using phone as identifier
          password: testUser.password,
          apiKey: apiKey
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('redirectUri');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('phoneNumber', testUser.phoneNumber);
    });

    test('should fail with invalid identifier', async () => {
      const response = await request(app)
        .post('/auth/sso/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
          apiKey: apiKey
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/auth/sso/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
          apiKey: apiKey
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('GET /auth/check-phone', () => {
    test('should normalize and check phone number', async () => {
      const response = await request(app)
        .get('/auth/check-phone')
        .query({ phone: '09123456789' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('exists');
      expect(response.body).toHaveProperty('normalizedPhone', '+639123456789');
    });

    test('should return error for invalid phone format', async () => {
      const response = await request(app)
        .get('/auth/check-phone')
        .query({ phone: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid phone number format');
    });
  });
});