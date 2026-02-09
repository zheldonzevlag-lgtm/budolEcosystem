const axios = require('axios');

/**
 * Spam Prevention Integration Test
 * Simulates high-risk and low-risk registration attempts
 * to verify the AI Anti-Spam Engine logic.
 */

const AUTH_SERVICE_URL = 'http://localhost:8001';

const timestamp = Date.now();

const testCases = [
    {
        name: 'High Risk: Disposable Email Domain',
        data: {
            email: `scammer_${timestamp}@10minutemail.com`,
            firstName: 'Spam',
            lastName: 'User',
            phoneNumber: `0912${Math.floor(Math.random() * 1000000)}`,
            password: 'password123'
        },
        expectedStatus: 403,
        expectedError: 'Registration blocked by security policy.'
    },
    {
        name: 'High Risk: Random Email + Same Names',
        data: {
            email: `bot${Math.floor(Math.random() * 10000)}@gmail.com`,
            firstName: 'X',
            lastName: 'X',
            phoneNumber: `0912${Math.floor(Math.random() * 1000000)}`,
            password: 'password123'
        },
        expectedStatus: 403,
        expectedError: 'Registration blocked by security policy.'
    },
    {
        name: 'Low Risk: Legitimate Pattern',
        data: {
            email: `john.doe_${timestamp}@gmail.com`,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: `0912${Math.floor(Math.random() * 1000000)}`,
            password: 'password123'
        },
        expectedStatus: 201
    }
];

async function runTests() {
    console.log('--- Starting Spam Prevention Integration Tests ---');
    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
        try {
            console.log(`\nTesting: ${test.name}`);
            const response = await axios.post(`${AUTH_SERVICE_URL}/register`, test.data, {
                validateStatus: (status) => true // Don't throw on error status
            });

            if (response.status === test.expectedStatus) {
                if (test.expectedError) {
                    if (response.data.error === test.expectedError) {
                        console.log('✅ PASSED: Correctly blocked spam.');
                        passed++;
                    } else {
                        console.log(`❌ FAILED: Expected error "${test.expectedError}", got "${response.data.error}"`);
                        failed++;
                    }
                } else {
                    console.log('✅ PASSED: Legitimate registration allowed.');
                    passed++;
                }
            } else {
                console.log(`❌ FAILED: Expected status ${test.expectedStatus}, got ${response.status}`);
                console.log('Response:', response.data);
                failed++;
            }
        } catch (error) {
            console.error(`❌ FAILED: Connection error - ${error.message}`);
            failed++;
        }
    }

    console.log('\n--- Test Summary ---');
    console.log(`Total: ${testCases.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) process.exit(1);
}

runTests();
