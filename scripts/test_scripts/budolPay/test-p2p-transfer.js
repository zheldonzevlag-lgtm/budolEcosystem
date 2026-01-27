const axios = require('axios');
const { prisma } = require('@budolpay/database');
require('dotenv').config();

async function testP2PTransfer() {
    console.log('--- Starting P2P Transfer Test ---');

    try {
        // 1. Get two users for the test
        // Let's use Jon Galvez (sender) and another user (receiver)
        const sender = await prisma.user.findFirst({
            where: { email: 'reynaldomgalvez@gmail.com' },
            include: { wallet: true }
        });

        const receiver = await prisma.user.findFirst({
            where: { email: 'peter.parker@budolshap.com' },
            include: { wallet: true }
        });

        if (!sender || !receiver) {
            console.error('Test users not found!');
            return;
        }

        console.log(`Sender: ${sender.email} (Balance: ${sender.wallet.balance})`);
        console.log(`Receiver: ${receiver.email} (Balance: ${receiver.wallet.balance})`);

        const transferAmount = 100.00;

        // 2. Perform the transfer via Transaction Service (through Gateway)
        // Note: In a real scenario, we'd need a JWT. For this test, let's call the service directly
        // to bypass gateway auth if needed, or we can mock a token.
        // The transaction service uses verifyToken middleware.
        
        console.log(`\nInitiating transfer of ${transferAmount} PHP...`);
        
        const response = await axios.post('http://127.0.0.1:8003/transfer', {
            senderId: sender.id,
            recipient: receiver.email,
            amount: transferAmount,
            description: 'Test P2P Transfer'
        });

        console.log('Response:', response.data);

        // 3. Verify balances after transfer
        const updatedSender = await prisma.user.findUnique({
            where: { id: sender.id },
            include: { wallet: true }
        });

        const updatedReceiver = await prisma.user.findUnique({
            where: { id: receiver.id },
            include: { wallet: true }
        });

        console.log('\n--- Final Balances ---');
        console.log(`Sender: ${updatedSender.email} (New Balance: ${updatedSender.wallet.balance})`);
        console.log(`Receiver: ${updatedReceiver.email} (New Balance: ${updatedReceiver.wallet.balance})`);

        if (parseFloat(updatedSender.wallet.balance) === parseFloat(sender.wallet.balance) - transferAmount &&
            parseFloat(updatedReceiver.wallet.balance) === parseFloat(receiver.wallet.balance) + transferAmount) {
            console.log('\nSUCCESS: P2P Transfer flow verified!');
        } else {
            console.log('\nFAILURE: Balance mismatch after transfer.');
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testP2PTransfer();
