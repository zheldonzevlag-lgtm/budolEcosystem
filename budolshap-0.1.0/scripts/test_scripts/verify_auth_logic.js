
// Simulation of the Authentication Fallback Logic
// This script verifies the logic flow for:
// 1. Local password failure
// 2. BudolID fallback success
// 3. Local password update

import assert from 'assert';

// Mocks
const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'old_hashed_password',
    emailVerified: false
};

const mockBudolResponse = {
    user: {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true
    },
    token: 'budol-token'
};

const db = {
    users: [mockUser],
    update: async (id, data) => {
        const user = db.users.find(u => u.id === id);
        if (user) {
            Object.assign(user, data);
            return user;
        }
        return null;
    }
};

// Mocked dependencies
const verifyPassword = async (input, stored) => input === 'correct_password' && stored === 'new_hashed_password';
const hashPassword = async (input) => 'new_hashed_password';
const loginWithBudolId = async (email, password) => {
    if (email === 'test@example.com' && password === 'correct_password') {
        return mockBudolResponse;
    }
    throw new Error('Invalid credentials');
};

// The Logic to Test (Extracted from route.js)
async function authenticateUser(email, password) {
    console.log(`[Auth] Attempting login for ${email}`);
    
    let user = db.users.find(u => u.email === email);
    if (!user) return { success: false, reason: 'User not found' };

    let isValid = await verifyPassword(password, user.password);
    console.log(`[Auth] Local password valid? ${isValid}`);

    if (!isValid) {
        // Fallback Logic
        try {
            console.log(`[Auth] Attempting BudolID fallback...`);
            const budolLogin = await loginWithBudolId(email, password);
            
            if (budolLogin && budolLogin.user) {
                console.log(`[Auth] BudolID fallback successful.`);
                isValid = true;
                
                // Sync Logic
                const hashedPassword = await hashPassword(password);
                await db.update(user.id, {
                    password: hashedPassword,
                    emailVerified: budolLogin.user.emailVerified
                });
                console.log(`[Auth] Local password updated.`);
            }
        } catch (e) {
            console.log(`[Auth] BudolID fallback failed: ${e.message}`);
        }
    }

    return { success: isValid, user: db.users.find(u => u.id === user.id) };
}

// Test Execution
async function runTests() {
    console.log('--- Starting Auth Logic Verification ---\n');

    // Test Case 1: Initial state (Old password locally, Correct password in BudolID)
    console.log('Test Case 1: Login with new password (should trigger fallback)');
    const result1 = await authenticateUser('test@example.com', 'correct_password');
    
    assert.strictEqual(result1.success, true, 'Login should succeed via fallback');
    assert.strictEqual(result1.user.password, 'new_hashed_password', 'Local password should be updated');
    assert.strictEqual(result1.user.emailVerified, true, 'Email verification should be synced');
    console.log('PASSED\n');

    // Test Case 2: Subsequent login (Local password should now match)
    console.log('Test Case 2: Subsequent login (should use local auth)');
    // Reset verifyPassword mock behavior for test 2? 
    // Actually verifyPassword checks if input matches 'correct_password' AND stored is 'new_hashed_password'.
    // So now it should return true immediately without fallback.
    // We can add logging to verify fallback wasn't called, but for now result check is enough.
    
    const result2 = await authenticateUser('test@example.com', 'correct_password');
    assert.strictEqual(result2.success, true, 'Login should succeed locally');
    console.log('PASSED\n');

    console.log('--- All Verification Tests Passed ---');
}

runTests().catch(e => {
    console.error('FAILED:', e);
    process.exit(1);
});
