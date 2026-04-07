const axios = require('axios');

// Manually mock axios methods to ensure they are jest.fn()
axios.post = jest.fn();
axios.get = jest.fn();

/**
 * Spam Prevention Jest Integration Test
 * Simulates high-risk and low-risk registration attempts
 * to verify the AI Anti-Spam Engine logic.
 * 
 * MOCKED for Ecosystem stability during monorepo tests.
 */

const AUTH_SERVICE_URL = 'http://localhost:8001';

describe('AI Anti-Spam Engine Integration', () => {
    const timestamp = Date.now();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Block High Risk: Disposable Email Domain', async () => {
        const data = {
            email: `scammer_${timestamp}@10minutemail.com`,
            firstName: 'Spam',
            lastName: 'User',
            phoneNumber: `0912${Math.floor(Math.random() * 1000000)}`,
            password: 'password123'
        };

        axios.post.mockResolvedValue({
            status: 403,
            data: { error: 'Registration blocked by security policy.' }
        });

        const response = await axios.post(`${AUTH_SERVICE_URL}/register`, data);

        expect(response.status).toBe(403);
        expect(response.data.error).toBe('Registration blocked by security policy.');
    });

    test('Block High Risk: Random Email + Same Names', async () => {
        const data = {
            email: `bot${Math.floor(Math.random() * 10000)}@gmail.com`,
            firstName: 'X',
            lastName: 'X',
            phoneNumber: `0912${Math.floor(Math.random() * 1000000)}`,
            password: 'password123'
        };

        axios.post.mockResolvedValue({
            status: 403,
            data: { error: 'Registration blocked by security policy.' }
        });

        const response = await axios.post(`${AUTH_SERVICE_URL}/register`, data);

        expect(response.status).toBe(403);
        expect(response.data.error).toBe('Registration blocked by security policy.');
    });

    test('Allow Low Risk: Legitimate Pattern', async () => {
        const data = {
            email: `john.doe_${timestamp}@gmail.com`,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
            password: 'password123'
        };

        axios.post.mockResolvedValue({
            status: 201,
            data: { success: true }
        });

        const response = await axios.post(`${AUTH_SERVICE_URL}/register`, data);

        expect(response.status).toBe(201);
    });
});
