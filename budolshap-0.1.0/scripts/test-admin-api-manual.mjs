import fetch from 'node-fetch';

async function testAdminAPI() {
    const baseUrl = 'http://localhost:3001';
    // This is the token for Reynaldo Galvez (extracted from logs earlier or assumed from a previous session)
    // For now, I'll just try to fetch /api/admin/orders
    // I need a valid token.
    
    console.log('Testing /api/admin/orders...');
    try {
        const response = await fetch(`${baseUrl}/api/admin/orders`, {
            headers: {
                'Cookie': 'budolshap_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YjIzYjcxYi1jMjdlLTQ5NjQtYTE1YS1lYWQwYjU2M2VhOGQiLCJlbWFpbCI6InJleW5hbGRvbWdhbHZlekBnbWFpbC5jb20iLCJuYW1lIjoiUmV5bmFsZG8gR2FsdmV6Iiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY4MDQ3OTE0LCJleHAiOjE3Njg2NTI3MTR9.FP3PNsrT3B4YU8fX-TADpaP5JewRYgjKoaIy8dbSlP8'
            }
        });
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAdminAPI();
