/**
 * Simulated dual-channel notification service for BudolPay.
 * 
 * RATIONALE:
 * To comply with BSP Circular 808 and NPC Data Privacy regulations, 
 * all security-sensitive codes (OTPs, Temp Passwords) must be delivered 
 * via multiple redundant channels to ensure delivery and identity verification.
 */

export async function sendDualChannelNotification(
    user: { email: string, phoneNumber?: string | null },
    type: 'OTP' | 'PASSWORD_RESET',
    value: string
) {
    const { sendEmail, sendSMS } = require('@budolpay/notifications');

    const results = {
        sms: false,
        email: false,
        timestamp: new Date().toISOString()
    };

    console.log('\n--- SECURITY NOTIFICATION BROADCAST ---');
    console.log(`[CHANNEL-SYNC] Type: ${type}`);
    console.log(`[CHANNEL-SYNC] Payload: \x1b[33m${value}\x1b[0m`);

    const subject = type === 'OTP'
        ? 'Your budolPay Verification Code'
        : 'Your budolPay Temporary Password';
    const message = type === 'OTP'
        ? `Your verification code is ${value}. This code expires in 5 minutes.`
        : `Your temporary password is ${value}. Please log in and change it immediately.`;
    const html = `<p>${message}</p>`;

    if (user.phoneNumber) {
        results.sms = await sendSMS(user.phoneNumber, message);
        console.log(results.sms
            ? `[LIVE] >>> SMS GATEWAY: Delivered to ${user.phoneNumber}`
            : `[LIVE] !!! SMS GATEWAY: Failed delivery to ${user.phoneNumber}`);
    } else {
        console.log(`[LIVE] !!! SMS GATEWAY: Skipping (No phone number registered)`);
    }

    if (user.email) {
        results.email = await sendEmail(user.email, subject, message, html);
        console.log(results.email
            ? `[LIVE] >>> SMTP RELAY: Delivered to ${user.email}`
            : `[LIVE] !!! SMTP RELAY: Failed delivery to ${user.email}`);
    } else {
        console.log(`[LIVE] !!! SMTP RELAY: Skipping (No email registered)`);
    }

    console.log('--- END BROADCAST ---\n');

    return results;
}
