const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = [
    // MAPS
    { key: 'MAPS_ACTIVE_PROVIDER', value: 'openstreetmap', group: 'MAPS', description: 'Active map provider for the platform' },
    { key: 'MAPS_GEOAPIFY_KEY', value: '', group: 'MAPS', description: 'API Key for Geoapify', isSecret: true },
    { key: 'MAPS_GOOGLE_MAPS_KEY', value: '', group: 'MAPS', description: 'API Key for Google Maps', isSecret: true },
    { key: 'MAPS_RADAR_KEY', value: '', group: 'MAPS', description: 'API Key for Radar', isSecret: true },

    // RATELIMIT
    { key: 'SECURITY_LOGIN_ATTEMPTS_LIMIT', value: '10', group: 'SECURITY', description: 'Max login attempts allowed within the window' },
    { key: 'SECURITY_LOGIN_WINDOW_MINUTES', value: '15', group: 'SECURITY', description: 'Window in minutes for login attempt tracking' },
    { key: 'SECURITY_REGISTRATION_ATTEMPTS_LIMIT', value: '5', group: 'SECURITY', description: 'Max registration attempts allowed within the window' },
    { key: 'SECURITY_REGISTRATION_WINDOW_MINUTES', value: '60', group: 'SECURITY', description: 'Window in minutes for registration attempt tracking' },

    // NEW SECURITY HARDENING SETTINGS
    { key: 'SECURITY_AUTH_MAX_ATTEMPTS', value: '5', group: 'SECURITY', description: 'Max login attempts allowed before lockout' },
    { key: 'SECURITY_AUTH_LOCKOUT_DURATION', value: '30', group: 'SECURITY', description: 'Lockout duration in minutes' },
    { key: 'SECURITY_SESSION_IDLE_TIMEOUT', value: '15', group: 'SECURITY', description: 'Session idle timeout in minutes' },
    { key: 'SECURITY_SESSION_ABSOLUTE_TIMEOUT', value: '24', group: 'SECURITY', description: 'Absolute session timeout in hours' },
    { key: 'SECURITY_PASSWORD_MIN_LENGTH', value: '12', group: 'SECURITY', description: 'Minimum password length' },
    { key: 'SECURITY_PASSWORD_REQUIRE_SPECIAL', value: 'true', group: 'SECURITY', description: 'Require special characters in password' },
    { key: 'SECURITY_PASSWORD_EXPIRY_DAYS', value: '90', group: 'SECURITY', description: 'Password expiry in days' },
    { key: 'SECURITY_MFA_ENFORCED', value: 'true', group: 'SECURITY', description: 'Enforce MFA for all admin users' },
    { key: 'SECURITY_RATE_LIMIT_GLOBAL', value: '1000', group: 'SECURITY', description: 'Global rate limit (requests per minute)' },
    { key: 'SECURITY_RATE_LIMIT_AUTH', value: '10', group: 'SECURITY', description: 'Authentication rate limit (requests per minute)' },

    // PUSHER
    { key: 'REALTIME_PUSHER_APP_ID', value: '', group: 'REALTIME', description: 'Pusher App ID' },
    { key: 'REALTIME_PUSHER_KEY', value: '', group: 'REALTIME', description: 'Pusher Key' },
    { key: 'REALTIME_PUSHER_SECRET', value: '', group: 'REALTIME', description: 'Pusher Secret', isSecret: true },
    { key: 'REALTIME_PUSHER_CLUSTER', value: 'ap1', group: 'REALTIME', description: 'Pusher Cluster' },
    
    // NOTIFICATION - Providers
    { key: 'NOTIFICATION_EMAIL_SMTP_HOST', value: 'smtp.gmail.com', group: 'NOTIFICATION', description: 'SMTP Host' },
    { key: 'NOTIFICATION_EMAIL_SMTP_PORT', value: '587', group: 'NOTIFICATION', description: 'SMTP Port' },
    { key: 'NOTIFICATION_EMAIL_SMTP_USER', value: '', group: 'NOTIFICATION', description: 'SMTP Username' },
    { key: 'NOTIFICATION_EMAIL_SMTP_PASS', value: '', group: 'NOTIFICATION', description: 'SMTP Password', isSecret: true },
    { key: 'NOTIFICATION_EMAIL_SENDER', value: 'noreply@budolpay.com', group: 'NOTIFICATION', description: 'Default sender email' },
    
    { key: 'NOTIFICATION_BREVO_API_KEY', value: '', group: 'NOTIFICATION', description: 'Brevo API Key', isSecret: true },
    { key: 'NOTIFICATION_GMASS_API_KEY', value: '', group: 'NOTIFICATION', description: 'GMass API Key', isSecret: true },
    
    { key: 'NOTIFICATION_VIBER_API_KEY', value: '', group: 'NOTIFICATION', description: 'Viber API Key', isSecret: true },
    { key: 'NOTIFICATION_ITEXTMO_API_KEY', value: '', group: 'NOTIFICATION', description: 'iTextMo API Key', isSecret: true },
    { key: 'NOTIFICATION_ITEXTMO_CLIENT_CODE', value: '', group: 'NOTIFICATION', description: 'iTextMo Client Code' },
    { key: 'NOTIFICATION_BREVO_SMS_API_KEY', value: '', group: 'NOTIFICATION', description: 'Brevo SMS API Key', isSecret: true },
    { key: 'NOTIFICATION_ZERIX_API_KEY', value: '', group: 'NOTIFICATION', description: 'Zerix API Key', isSecret: true },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { group: s.group },
      create: s,
    });
  }

  console.log('Seeded advanced settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
