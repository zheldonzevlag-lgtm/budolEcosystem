import nodemailer from 'nodemailer';

async function testSMTP() {
  const user = 'reynaldomgalvez@gmail.com';
  const pass = 'ajwpodmhoqbhahkd'; // Sanitized password

  console.log(`Testing SMTP with user: ${user}`);
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
  } catch (error) {
    console.error('❌ SMTP connection failed:');
    console.error(error.message);
    if (error.message.includes('535 5.7.8')) {
      console.log('Suggestion: The App Password might be revoked or incorrect. Please generate a new one at https://myaccount.google.com/apppasswords');
    }
  }
}

testSMTP();
