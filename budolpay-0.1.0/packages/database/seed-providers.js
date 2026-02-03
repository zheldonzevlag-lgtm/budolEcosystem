
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = [
    {
      key: 'NOTIFICATION_SMS_PROVIDER',
      value: 'twilio',
      group: 'NOTIFICATION',
      description: 'Active SMS gateway provider (twilio, infobip, vonage)',
      isSecret: false,
      isActive: true
    },
    {
      key: 'TWILIO_FROM_NUMBER',
      value: '',
      group: 'NOTIFICATION',
      description: 'Twilio registered phone number or Alphanumeric Sender ID',
      isSecret: false,
      isActive: true
    },
    {
      key: 'NOTIFICATION_EMAIL_USER',
      value: '',
      group: 'NOTIFICATION',
      description: 'Username for Email service (e.g. Gmail address)',
      isSecret: false,
      isActive: true
    },
    {
      key: 'NOTIFICATION_EMAIL_PASSWORD',
      value: '',
      group: 'NOTIFICATION',
      description: 'Password or App Password for Email service',
      isSecret: true,
      isActive: true
    },
    {
      key: 'NOTIFICATION_EMAIL_HOST',
      value: 'smtp.gmail.com',
      group: 'NOTIFICATION',
      description: 'SMTP Host address',
      isSecret: false,
      isActive: true
    },
    {
      key: 'NOTIFICATION_EMAIL_PORT',
      value: '587',
      group: 'NOTIFICATION',
      description: 'SMTP Port (587 for TLS, 465 for SSL)',
      isSecret: false,
      isActive: true
    },
    {
      key: 'PAYMONGO_PUBLIC_KEY',
      value: '',
      group: 'PAYMENT',
      description: 'PayMongo Public Key for frontend integrations',
      isSecret: false,
      isActive: true
    },
    {
      key: 'PAYMONGO_SECRET_KEY',
      value: '',
      group: 'PAYMENT',
      description: 'PayMongo Secret Key for backend transactions',
      isSecret: true,
      isActive: true
    },
    {
      key: 'XENDIT_SECRET_KEY',
      value: '',
      group: 'PAYMENT',
      description: 'Xendit Secret API Key',
      isSecret: true,
      isActive: true
    }
  ];

  console.log('Seeding provider settings...');

  for (const setting of settings) {
    try {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {
            group: setting.group,
            description: setting.description,
            isSecret: setting.isSecret
        },
        create: setting,
      });
      console.log(`- ${setting.key} seeded.`);
    } catch (err) {
      console.error(`Error seeding ${setting.key}:`, err.message);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
