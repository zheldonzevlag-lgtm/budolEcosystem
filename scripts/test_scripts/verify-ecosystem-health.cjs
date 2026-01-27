const axios = require('axios');
require('dotenv').config();

const LOCAL_IP = process.env.LOCAL_IP || 'localhost';

const services = [
    { name: 'budolID (SSO)', url: `http://${LOCAL_IP}:8000/api/health` },
    { name: 'budolShap (App)', url: `http://${LOCAL_IP}:3001` },
    { name: 'budolPay (Admin)', url: `http://${LOCAL_IP}:3000` },
    { name: 'budolPay (TX)', url: `http://${LOCAL_IP}:8003/health` },
    { name: 'budolPay (Gateway)', url: `http://${LOCAL_IP}:8004/health` },
    { name: 'budolPay (Wallet)', url: `http://${LOCAL_IP}:8002/health` },
    { name: 'budolPay (Auth)', url: `http://${LOCAL_IP}:8001/health` },
    { name: 'budolPay (Gateway API)', url: `http://${LOCAL_IP}:8080/health` },
    { name: 'budolAccounting', url: `http://${LOCAL_IP}:8005/health` },
    { name: 'budolPay (KYC)', url: `http://${LOCAL_IP}:8006/health` }
];

async function checkHealth() {
    console.log('🔍 Starting Ecosystem Health Check...\n');
    let allHealthy = true;

    for (const service of services) {
        let retries = service.name.includes('App') || service.name.includes('Admin') ? 3 : 1;
        let success = false;
        
        while (retries > 0 && !success) {
            try {
                const timeout = service.name.includes('App') || service.name.includes('Admin') ? 30000 : 10000;
                const response = await axios.get(service.url, { timeout });
                console.log(`✅ [${service.name}] is UP (Status: ${response.status})`);
                success = true;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    allHealthy = false;
                    if (error.response) {
                        console.log(`❌ [${service.name}] is DOWN (Status: ${error.response.status})`);
                    } else if (error.code === 'ECONNABORTED') {
                        console.log(`❌ [${service.name}] is DOWN (Timeout after 10s)`);
                    } else if (error.code === 'ECONNREFUSED') {
                        console.log(`❌ [${service.name}] is DOWN (Connection Refused)`);
                    } else {
                        console.log(`❌ [${service.name}] is DOWN (Error: ${error.message})`);
                    }
                } else {
                    console.log(`⏳ [${service.name}] still warming up, retrying... (${retries} left)`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }
    }

    console.log('\n--------------------------------------------------');
    if (allHealthy) {
        console.log('🚀 ALL SERVICES ARE HEALTHY!');
    } else {
        console.log('⚠️ SOME SERVICES ARE DOWN. Please check the logs.');
    }
}

checkHealth();