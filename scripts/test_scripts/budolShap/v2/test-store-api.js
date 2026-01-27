// Test store creation API directly
const testData = {
    userId: 'admin_1764944089852_neekri9rb', // Your admin user ID
    name: 'Test Store',
    username: 'teststore',
    email: 'admin@budolshap.com',
    contact: '+639123456789',
    description: 'This is a test store',
    address: '123 Test Street, Manila, Philippines',
    logo: ''
};

console.log('🧪 Testing store creation API...\n');
console.log('Sending data:', JSON.stringify(testData, null, 2));

fetch('https://budolshap-91zeblsmg-jons-projects-9722fe4a.vercel.app/api/stores', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData)
})
    .then(response => {
        console.log('\n📡 Response Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('\n📦 Response Data:', JSON.stringify(data, null, 2));
    })
    .catch(error => {
        console.error('\n❌ Error:', error);
    });
