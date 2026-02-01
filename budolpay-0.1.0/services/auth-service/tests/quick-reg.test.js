const request = require('supertest');
const app = require('../index');

describe('Quick Registration & SSO Linking API', () => {
  jest.setTimeout(30000); // Increase timeout for slow audit/notification calls
  let testPhone = `09${Math.floor(100000000 + Math.random() * 900000000)}`;

  it('should initiate quick registration with phone number', async () => {
    const res = await request(app)
      .post('/register/quick')
      .send({
        phoneNumber: testPhone,
        firstName: 'JestTest',
        deviceId: 'jest-device-123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.requireOtp).toBe(true);
  });

  it('should fail if phone number is missing', async () => {
    const res = await request(app)
      .post('/register/quick')
      .send({
        firstName: 'NoPhone'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should verify OTP for the quick-reg user', async () => {
    // We need to get the userId from a fresh registration
    const regRes = await request(app)
      .post('/register/quick')
      .send({
        phoneNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
        firstName: 'OtpTest'
      });

    const userId = regRes.body.userId;

    const verifyRes = await request(app)
      .post('/verify-otp')
      .send({
        userId: userId,
        otp: '123456', // Assuming local environment uses 123456
        type: 'SMS',
        deviceId: 'jest-device-123'
      });

    expect(verifyRes.statusCode).toEqual(200);
    expect(verifyRes.body.status).toEqual('PIN_SETUP_REQUIRED');
  });

  it('should link SSO account for new user (Google)', async () => {
    const ssoEmail = `sso_test_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/sso/link')
      .send({
        email: ssoEmail,
        provider: 'Google',
        providerId: `google_${Date.now()}`,
        firstName: 'SSO',
        lastName: 'User'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('CREATED');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(ssoEmail);
  });

  it('should link SSO to existing user if email matches', async () => {
    // First create a quick reg user with email
    const existingEmail = `existing_${Date.now()}@example.com`;
    
    // Manual creation via register/quick doesn't support email yet, but let's assume a user exists
    // For this test, we'll just link to the one we created in the previous test or a new one
    const res1 = await request(app)
      .post('/sso/link')
      .send({
        email: existingEmail,
        provider: 'Google',
        providerId: `google_first_${Date.now()}`,
        firstName: 'Original',
        lastName: 'User'
      });

    const res2 = await request(app)
      .post('/sso/link')
      .send({
        email: existingEmail,
        provider: 'Facebook',
        providerId: `fb_second_${Date.now()}`,
        firstName: 'Original',
        lastName: 'User'
      });

    expect(res2.statusCode).toEqual(200);
    expect(res2.body.status).toEqual('LINKED');
    expect(res2.body).toHaveProperty('token');
  });
});
