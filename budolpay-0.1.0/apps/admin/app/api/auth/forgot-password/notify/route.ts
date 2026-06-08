import { NextResponse } from 'next/server';
import notifications from '@budolpay/notifications';

export async function POST(request: Request) {
    try {
        const { email, phone, otp, name } = await request.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const subject = 'budolID Password Reset OTP';
        const message = `Your One-Time Password (OTP) is ${otp}. This OTP will expire in 5 minutes.`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello ${name || 'User'},</p>
                <p>Your One-Time Password (OTP) is:</p>
                <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 8px;">${otp}</div>
                <p style="color: #666; font-size: 14px;">This OTP will expire in 5 minutes.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
        `;

        const emailDelivered = await notifications.sendEmail(email, subject, message, html);
        const smsDelivered = phone ? await notifications.sendSMS(phone, `budolID: ${message}`) : false;

        if (!emailDelivered && !smsDelivered) {
            return NextResponse.json({
                error: 'OTP delivery is currently unavailable.',
                delivery: { email: false, sms: false }
            }, { status: 503 });
        }

        return NextResponse.json({
            success: true,
            message: emailDelivered && smsDelivered
                ? 'OTP sent via SMS and Email.'
                : emailDelivered
                    ? 'OTP sent to your email.'
                    : 'OTP sent via SMS only. Email delivery is currently unavailable.',
            delivery: { email: emailDelivered, sms: smsDelivered }
        });
    } catch (error) {
        console.error('[Notify] Error:', error);
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}
