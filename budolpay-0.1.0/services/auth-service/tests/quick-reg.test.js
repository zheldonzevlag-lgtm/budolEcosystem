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
});
