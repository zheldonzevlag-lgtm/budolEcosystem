/**
 * Infrastructure Port Audit Test
 * Verifies that all documented ports in v3.0.7 match the actual code implementation.
 */
const fs = require('fs');
const path = require('path');

const EXPECTED_PORTS = {
    'BudolID (SSO)': { port: 8000, path: 'budolID-0.1.0/index.js' },
    'Auth Service': { port: 8001, path: 'budolpay-0.1.0/services/auth-service/index.js' },
    'Wallet Service': { port: 8002, path: 'budolpay-0.1.0/services/wallet-service/index.js' },
    'Transaction Service': { port: 8003, path: 'budolpay-0.1.0/services/transaction-service/index.js' },
    'Payment Gateway': { port: 8004, path: 'budolpay-0.1.0/services/payment-gateway-service/index.js' },
    'BudolAccounting': { port: 8005, path: 'budolAccounting-0.1.0/index.js' },
    'Verification (KYC)': { port: 8006, path: 'budolpay-0.1.0/services/verification-service/index.js' },
    'Settlement Service': { port: 8007, path: 'budolpay-0.1.0/services/settlement-service/index.js' },
    'API Gateway': { port: 8080, path: 'budolpay-0.1.0/services/api-gateway/index.js' },
    'Socket.io Server': { port: 4000, path: 'websocket-server/server.js' }
};

const rootDir = 'd:/IT Projects/budolEcosystem';

describe('Infrastructure Port Audit', () => {
    Object.entries(EXPECTED_PORTS).forEach(([name, info]) => {
        test(`${name} should be configured on port ${info.port}`, () => {
            const filePath = path.join(rootDir, info.path);
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            const portRegex = new RegExp(`PORT\\s*=\\s*process\\.env\\.PORT\\s*\\|\\|\\s*${info.port}`);
            
            expect(content).toMatch(portRegex);
        });
    });
});
