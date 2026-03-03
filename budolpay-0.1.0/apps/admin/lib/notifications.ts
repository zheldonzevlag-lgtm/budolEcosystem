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
    const results = {
        sms: false,
        email: false,
        timestamp: new Date().toISOString()
    };

    console.log('\n--- SECURITY NOTIFICATION BROADCAST ---');
    console.log(`[CHANNEL-SYNC] Type: ${type}`);
    console.log(`[CHANNEL-SYNC] Payload: ${value}`);

    // SMS Delivery Simulation
    if (user.phoneNumber) {
        console.log(`[SIMULATION] >>> SMS GATEWAY: Routing to ${user.phoneNumber} ... [DELIVERED]`);
        results.sms = true;
    } else {
        console.log(`[SIMULATION] !!! SMS GATEWAY: Skipping (No phone number registered)`);
    }

    // Email Delivery Simulation
    if (user.email) {
        console.log(`[SIMULATION] >>> SMTP RELAY: Routing to ${user.email} ... [DELIVERED]`);
        results.email = true;
    } else {
        console.log(`[SIMULATION] !!! SMTP RELAY: Skipping (No email registered)`);
    }

    console.log('--- END BROADCAST ---\n');

    return results;
}
