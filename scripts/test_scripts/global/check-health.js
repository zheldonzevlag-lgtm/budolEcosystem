const axios = require('axios');

const services = [
    { name: 'Auth Service', url: 'http://localhost:8001/health' },
    { name: 'Wallet Service', url: 'http://localhost:8002/health' },
    { name: 'Transaction Service', url: 'http://localhost:8003/health' },
    { name: 'Payment Gateway', url: 'http://localhost:8004/health' },
    { name: 'KYC Service', url: 'http://localhost:8006/health' },
    { name: 'API Gateway', url: 'http://localhost:8080/health' },
    { name: 'Accounting Service', url: 'http://localhost:8005/health' },
    { name: 'SSO Service', url: 'http://localhost:8000/api/health' }
];

async function checkHealth() {
    console.log('🔍 Checking ecosystem health...\n');
    for (const service of services) {
        try {
            const response = await service.url.includes('Accounting') || service.url.includes('SSO') 
                ? await axios.get(service.url).catch(e => e.response) // Accounting/SSO might not have /health
                : await axios.get(service.url);
            
            if (response && (response.status === 200 || response.status === 404)) {
                console.log(`✅ ${service.name}: Online (${response.status})`);
            } else {
                console.log(`❌ ${service.name}: Offline (Status: ${response ? response.status : 'No Response'})`);
            }
        } catch (error) {
            console.log(`❌ ${service.name}: Offline (${error.message})`);
        }
    }
}

checkHealth();
