const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'reynaldomgalvez@gmail.com',
        pass: 'ppmmobwlpnwrzptu'
    }
});

async function testEmail() {
    console.log('Attempting to authenticate with Gmail...');
    try {
        await transporter.verify();
        console.log('✅ SMTP Authentication successful!');
        
        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: 'reynaldomgalvez@gmail.com',
            to: 'reynaldomgalvez@gmail.com',
            subject: 'BudolEcosystem SMTP Test',
            text: 'If you see this, the App Password works and the \\r\\n corruption was the culprit all along!',
        });
        console.log('✅ Email sent: ' + info.messageId);
    } catch (e) {
        console.error('❌ Failed:', e.message);
    }
}

testEmail();
