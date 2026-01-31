// Simple test to debug API key issue
const request = require('supertest');
const app = require('./testApp');
const { PrismaClient } = require('../generated/client');

const prisma = new PrismaClient();

describe('Debug API Key Issue', () => {
  beforeAll(async () => {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should register app and get apiKey', async () => {
    const testApp = {
      name: 'DebugApp',
      redirectUri: 'http://localhost:3000/callback'
    };

    const response = await request(app)
      .post('/apps/register')
      .send(testApp);

    console.log('App registration response:', response.status, response.body);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('apiKey');
    expect(response.body.apiKey).toBeTruthy();
    
    const apiKey = response.body.apiKey;
    console.log('Retrieved API Key:', apiKey);
    
    // Test SSO login with the API key
    const loginResponse = await request(app)
      .post('/auth/sso/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        apiKey: apiKey
      });

    console.log('Login response:', loginResponse.status, loginResponse.body);
  });
});