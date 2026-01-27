const axios = require('axios');
const { updateNetworkConfig } = require('./network-util');

async function verifyServices() {
    const localIP = updateNetworkConfig();
    console.log(`Verifying services on LAN IP: ${localIP}`);

    const services = [
        { name: 'budolID (SSO)', port: 8000, path: '/api/health' },
        { name: 'budolPay (Gateway API)', port: 8080, path: '/health' },
        { name: 'budolAccounting', port: 8005, path: '/health' },
        { name: 'budolShap', port: 3001, path: '/' }
    ];

    for (const service of services) {
        const url = `http://${localIP}:${service.port}${service.path}`;
        try {
            const response = await axios.get(url, { timeout: 3000 });
            console.log(`✅ ${service.name} is REACHABLE at ${url} (Status: ${response.status})`);
        } catch (error) {
            if (error.response) {
                console.log(`✅ ${service.name} is REACHABLE at ${url} (Status: ${error.response.status})`);
            } else {
                console.log(`❌ ${service.name} is UNREACHABLE at ${url} (Error: ${error.code})`);
                console.log(`   Check if the service is running and bound to 0.0.0.0`);
            }
        }
    }
}

verifyServices();
