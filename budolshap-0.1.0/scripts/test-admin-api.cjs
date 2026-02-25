const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNzMyMmY1MS1hNjg4LTRiYWYtODM3Ni02NzUyMWM3ODM2NTkiLCJlbWFpbCI6ImdhbHZlempvbjU5QGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2ODA1MDAzMCwiZXhwIjoxNzY4NjU0ODMwfQ.0az8gkyJeZW_b9E-U9SqIjvz2QQ07LgMyAw8oXM3qDs';
const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
const baseUrl = `http://${LOCAL_IP}:3001`;

async function testAdminOrders() {
    try {
        console.log('Testing Admin Orders API...');
        const response = await axios.get(`${baseUrl}/api/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Orders Response Status:', response.status);
        console.log('Orders Count:', response.data.length);
        
        console.log('\nTesting Admin Users API...');
        const usersResponse = await axios.get(`${baseUrl}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Users Response Status:', usersResponse.status);
        console.log('Users Count:', usersResponse.data.length);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testAdminOrders();
