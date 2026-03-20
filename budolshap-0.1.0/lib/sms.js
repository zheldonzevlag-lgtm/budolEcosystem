import { getSystemSettings } from './settings'
import { maskPII } from './compliance'

/**
 * SMS Utility for budolShap
 * Supports dual-channel OTP and notification delivery
 */

/**
 * Sends an OTP via SMS using the configured provider.
 * Supports Zerix, iTextMo, and Viber.
 * Falls back to console logging if no provider is configured.
 * 
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} otp - The 6-digit verification code
 * @param {number} [ttlMinutes=15] - How long the code is valid for
 */
export async function sendOTPSMS(phoneNumber, otp, ttlMinutes = 15) {
    try {
        const settings = await getSystemSettings()
        const provider = settings.smsProvider || 'CONSOLE'
        const message = `Your budolShap verification code is ${otp}. Valid for ${ttlMinutes} minutes.`

        if (provider === 'ZERIX') {
            if (!settings.zerixApiKey) throw new Error('Zerix API Key not configured')
            console.log(`📡 [SMS Provider: ZERIX] Sending OTP to ${maskPII(phoneNumber)}`)
            
            // Normalize phone number for Zerix (63XXXXXXXXX)
            const phone = phoneNumber.startsWith('0') ? '63' + phoneNumber.substring(1) : phoneNumber.replace('+', '');
            
            // Implementation for Zerix API (v1/send)
            const response = await fetch(`https://api.zerixtext.com/api/v1/send?apiKey=${settings.zerixApiKey}&number=${phone}&message=${encodeURIComponent(message)}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Zerix API error: ${error.message || response.statusText}`);
            }
            return true
        }

        if (provider === 'ITEXTMO') {
            if (!settings.itextmoApiKey || !settings.itextmoClientCode) {
                throw new Error('iTextMo API Key or Client Code not configured')
            }
            console.log(`📡 [SMS Provider: ITEXTMO] Sending OTP to ${maskPII(phoneNumber)}`)
            
            // Implementation for iTextMo API
            const response = await fetch('https://www.itexmo.com/php_api/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    '1': phoneNumber,
                    '2': message,
                    '3': settings.itextmoApiKey,
                    'passwd': settings.itextmoClientCode
                })
            });

            const result = await response.text();
            if (result !== '0') {
                throw new Error(`iTextMo API error code: ${result}`);
            }
            return true
        }

        if (provider === 'BREVO') {
            if (!settings.brevoSmsApiKey) throw new Error('Brevo SMS API Key not configured')
            console.log(`📡 [SMS Provider: BREVO] Sending OTP to ${maskPII(phoneNumber)}`)
            
            const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'api-key': settings.brevoSmsApiKey
                },
                body: JSON.stringify({
                    type: 'transactional',
                    unicodeEnabled: false,
                    sender: 'budol',
                    recipient: phoneNumber.replace('+', ''),
                    content: message
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Brevo SMS API error: ${error.message || response.statusText}`);
            }
            return true
        }

        if (provider === 'VIBER') {
            if (!settings.viberApiKey) throw new Error('Viber API Key not configured')
            console.log(`📡 [SMS Provider: VIBER] Sending OTP to ${maskPII(phoneNumber)}`)
            
            // Viber REST API for Business Messages
            const response = await fetch('https://chatapi.viber.com/pa/send_message', {
                method: 'POST',
                headers: {
                    'X-Viber-Auth-Token': settings.viberApiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiver: phoneNumber.replace('+', ''),
                    min_api_version: 1,
                    sender: { name: "budol" },
                    type: "text",
                    text: `Your budol verification code is ${otp}. Valid for 10 minutes.`
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Viber API error: ${error.message || response.statusText}`);
            }
            return true
        }

        // Default: Console Logging (Development)
        console.log('\n' + '='.repeat(40))
        console.log('📱 [SMS Provider: CONSOLE]')
        console.log('='.repeat(40))
        console.log(`To: ${maskPII(phoneNumber)}`)
        console.log(`OTP SMS prepared. Valid for ${ttlMinutes} minutes.`)
        console.log('='.repeat(40) + '\n')
        return true

    } catch (error) {
        console.error('SMS OTP Delivery Error:', error.message)
        console.log(`📱 [FALLBACK] OTP delivery failed for ${maskPII(phoneNumber)}`)
        return false
    }
}

/**
 * Sends a general SMS notification.
 */
export async function sendSMSNotification(phoneNumber, message) {
    try {
        const settings = await getSystemSettings()
        const provider = settings.smsProvider || 'CONSOLE'

        if (provider === 'ZERIX' && settings.zerixApiKey) {
            console.log(`📡 [SMS Provider: ZERIX] Sending Notification to ${maskPII(phoneNumber)}`)
            const phone = phoneNumber.startsWith('0') ? '63' + phoneNumber.substring(1) : phoneNumber.replace('+', '');
            await fetch(`https://api.zerixtext.com/api/v1/send?apiKey=${settings.zerixApiKey}&number=${phone}&message=${encodeURIComponent(message)}`, {
                method: 'GET'
            });
            return true
        }

        if (provider === 'ITEXTMO' && settings.itextmoApiKey) {
            console.log(`📡 [SMS Provider: ITEXTMO] Sending Notification to ${maskPII(phoneNumber)}`)
            await fetch('https://www.itexmo.com/php_api/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ '1': phoneNumber, '2': message, '3': settings.itextmoApiKey, 'passwd': settings.itextmoClientCode })
            });
            return true
        }

        if (provider === 'BREVO' && settings.brevoSmsApiKey) {
            console.log(`📡 [SMS Provider: BREVO] Sending Notification to ${maskPII(phoneNumber)}`)
            await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
                method: 'POST',
                headers: { 'accept': 'application/json', 'content-type': 'application/json', 'api-key': settings.brevoSmsApiKey },
                body: JSON.stringify({ type: 'transactional', sender: 'budol', recipient: phoneNumber.replace('+', ''), content: message })
            });
            return true
        }

        if (provider === 'VIBER' && settings.viberApiKey) {
            console.log(`📡 [SMS Provider: VIBER] Sending Notification to ${maskPII(phoneNumber)}`)
            await fetch('https://chatapi.viber.com/pa/send_message', {
                method: 'POST',
                headers: { 'X-Viber-Auth-Token': settings.viberApiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiver: phoneNumber.replace('+', ''), min_api_version: 1, sender: { name: "budol" }, type: "text", text: message })
            });
            return true
        }

        console.log(`📱 [SMS Provider: CONSOLE]`)
        console.log(`To: ${maskPII(phoneNumber)}`)
        console.log(`Message: ${message}`)
        return true
    } catch (error) {
        console.error('SMS Notification Delivery Error:', error.message)
        return false
    }
}
