const axios = require('axios');

async function checkHealth() {
    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    const services = [
        { name: 'budolID', url: `http://${LOCAL_IP}:8000/api/health` },
        { name: 'budolShap', url: `http://${LOCAL_IP}:3001/api/health` },
        { name: 'budolPay Admin', url: `http://${LOCAL_IP}:3000/api/health` }
    ];

    for (const service of services) {
        try {
            const response = await axios.get(service.url);
            console.log(`✅ ${service.name} is UP:`, response.data);
        } catch (error) {
            console.log(`❌ ${service.name} is DOWN: ${error.message} (Status: ${error.response?.status})`);
        }
    }
}

checkHealth();
