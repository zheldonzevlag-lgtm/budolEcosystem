const notifications = require('./index.js');
async function test() {
    console.log('Testing sendOTP...');
    try {
        const result = await notifications.sendOTP('ivarhanestad@gmail.com', '123456', 'EMAIL');
        console.log('Result:', result);
    } catch (e) {
        console.log('Error:', e);
    }
    process.exit(0);
}
test();
