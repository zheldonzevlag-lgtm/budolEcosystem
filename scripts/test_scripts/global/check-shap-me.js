const axios = require('axios');

const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
const SHAP_URL = `http://${LOCAL_IP}:3001`;

async function checkMe() {
    console.log(`Checking budolShap /api/auth/me at ${SHAP_URL}...`);
    try {
        const response = await axios.get(`${SHAP_URL}/api/auth/me`, {
            // No credentials/cookies sent here, so it should be 401 if not logged in
        });
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('Response Status:', error.response?.status);
        console.log('Response Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

checkMe();
