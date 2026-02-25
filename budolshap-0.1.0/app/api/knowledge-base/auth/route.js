import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

// In-memory storage for passwords (expires after 10 minutes)
const passwordStore = new Map();

// In-memory storage for protected document passwords (expires after 10 minutes)
const protectedDocPasswordStore = new Map();

// Get password expiry - prefer environment variable, otherwise decode obfuscated value
function getPasswordExpiry() {
    // Check environment variable first (most secure)
    if (process.env.KB_PASSWORD_EXPIRY) {
        return parseInt(process.env.KB_PASSWORD_EXPIRY, 10);
    }
    
    // Obfuscated expiry value (base64 encoded) - 10 minutes in milliseconds (600000)
    // Decode: parseInt(Buffer.from('NjAwMDAw', 'base64').toString('utf-8'), 10)
    const obfuscatedExpiry = 'NjAwMDAw';
    try {
        const decodedValue = Buffer.from(obfuscatedExpiry, 'base64').toString('utf-8');
        return parseInt(decodedValue, 10);
    } catch (error) {
        console.error('Error decoding password expiry:', error);
        // Fallback to default 10 minutes
        return 10 * 60 * 1000;
    }
}

const PASSWORD_EXPIRY = getPasswordExpiry();

// Get target email - prefer environment variable, otherwise decode obfuscated value
function getTargetEmail() {
    // Check environment variable first (most secure)
    if (process.env.KB_TARGET_EMAIL) {
        return process.env.KB_TARGET_EMAIL;
    }
    
    // Obfuscated email (base64 encoded) - not visible in plain text
    // Decode: Buffer.from('cmV5bmFsZG9tZ2FsdmV6QGdtYWlsLmNvbQ==', 'base64').toString()
    const obfuscatedEmail = 'cmV5bmFsZG9tZ2FsdmV6QGdtYWlsLmNvbQ==';
    try {
        return Buffer.from(obfuscatedEmail, 'base64').toString('utf-8');
    } catch (error) {
        console.error('Error decoding target email:', error);
        return null;
    }
}

const TARGET_EMAIL = getTargetEmail();

// Generate a random 6-digit password
function generatePassword() {
    return crypto.randomInt(100000, 999999).toString();
}

// Clean expired passwords
function cleanExpiredPasswords() {
    const now = Date.now();
    for (const [token, data] of passwordStore.entries()) {
        if (now > data.expiresAt) {
            passwordStore.delete(token);
        }
    }
    // Clean expired protected document passwords
    for (const [token, data] of protectedDocPasswordStore.entries()) {
        if (now > data.expiresAt) {
            protectedDocPasswordStore.delete(token);
        }
    }
}

export async function POST(request) {
    try {
        const { action, token, password } = await request.json();

        // Validate target email is configured
        if (!TARGET_EMAIL) {
            return NextResponse.json(
                { error: 'Email configuration error. Please contact administrator.' },
                { status: 500 }
            );
        }

        // Generate and send password
        if (action === 'request') {
            cleanExpiredPasswords();
            
            const generatedPassword = generatePassword();
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + PASSWORD_EXPIRY;

            // Store password with token
            passwordStore.set(token, {
                password: generatedPassword,
                expiresAt,
                attempts: 0,
                maxAttempts: 5
            });

            // Send email with password
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                        .password-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .password { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
                        .warning { color: #d97706; font-size: 14px; margin-top: 15px; }
                        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📚 Knowledge Base Access Code</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>You have requested access to the BudolShap Knowledge Base.</p>
                            <div class="password-box">
                                <p style="margin: 0 0 10px 0; color: #666;">Your access code is:</p>
                                <div class="password">${generatedPassword}</div>
                            </div>
                            <p class="warning">⚠️ This code will expire in 10 minutes.</p>
                            <p>Enter this code in the prompt to access the knowledge base.</p>
                            <div class="footer">
                                <p>If you did not request this code, please ignore this email.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const emailSent = await sendEmail({
                to: TARGET_EMAIL,
                subject: 'BudolShap Knowledge Base Access Code',
                html: emailHtml
            });

            if (!emailSent) {
                return NextResponse.json(
                    { error: 'Failed to send email. Please check email configuration.' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                token,
                message: `Password has been sent to ${TARGET_EMAIL}`
            });

        // Validate password
        } else if (action === 'validate') {
            cleanExpiredPasswords();

            if (!token || !password) {
                return NextResponse.json(
                    { error: 'Token and password are required' },
                    { status: 400 }
                );
            }

            const storedData = passwordStore.get(token);

            if (!storedData) {
                return NextResponse.json(
                    { error: 'Invalid or expired token', valid: false },
                    { status: 400 }
                );
            }

            // Check if expired
            if (Date.now() > storedData.expiresAt) {
                passwordStore.delete(token);
                return NextResponse.json(
                    { error: 'Password has expired', valid: false },
                    { status: 400 }
                );
            }

            // Check attempts
            if (storedData.attempts >= storedData.maxAttempts) {
                passwordStore.delete(token);
                return NextResponse.json(
                    { error: 'Maximum attempts exceeded', valid: false },
                    { status: 429 }
                );
            }

            // Validate password
            storedData.attempts++;
            if (password === storedData.password) {
                // Password is correct - store expiration time before removing
                const expiresAt = storedData.expiresAt;
                // Remove from store (one-time use)
                passwordStore.delete(token);
                return NextResponse.json({
                    valid: true,
                    message: 'Access granted',
                    expiresAt // Return expiration timestamp
                });
            } else {
                // Password incorrect - update attempts
                passwordStore.set(token, storedData);
                const remainingAttempts = storedData.maxAttempts - storedData.attempts;
                return NextResponse.json({
                    valid: false,
                    error: `Invalid password. ${remainingAttempts} attempt(s) remaining.`,
                    remainingAttempts
                }, { status: 401 });
            }
        // Send protected document password
        } else if (action === 'request-doc-password') {
            cleanExpiredPasswords();
            
            // Get target email
            if (!TARGET_EMAIL) {
                return NextResponse.json(
                    { error: 'Email configuration error. Please contact administrator.' },
                    { status: 500 }
                );
            }

            // Generate random 8-character alphanumeric password
            const docPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + PASSWORD_EXPIRY;

            // Store password with token
            protectedDocPasswordStore.set(token, {
                password: docPassword,
                expiresAt,
                attempts: 0,
                maxAttempts: 5
            });

            // Send email with password
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                        .password-box { background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .password { font-size: 28px; font-weight: bold; color: #dc2626; letter-spacing: 4px; font-family: 'Courier New', monospace; }
                        .warning { color: #d97706; font-size: 14px; margin-top: 15px; }
                        .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
                        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔒 Protected Document Password</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>You have requested the password for the <strong>Knowledge Base Security Implementation</strong> document.</p>
                            <div class="password-box">
                                <p style="margin: 0 0 10px 0; color: #666;">The password is:</p>
                                <div class="password">${docPassword}</div>
                            </div>
                            <div class="info">
                                <p><strong>📄 Document:</strong> Knowledge Base Security Implementation</p>
                                <p><strong>📁 Location:</strong> Setup & Configuration category</p>
                                <p><strong>🔐 Access:</strong> Enter this password when prompted to view the protected document.</p>
                            </div>
                            <p class="warning">⚠️ This password will expire in 10 minutes. Use it promptly to access the document.</p>
                            <div class="footer">
                                <p>If you did not request this password, please ignore this email.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const emailSent = await sendEmail({
                to: TARGET_EMAIL,
                subject: 'Knowledge Base - Protected Document Password',
                html: emailHtml
            });

            if (!emailSent) {
                return NextResponse.json(
                    { error: 'Failed to send email. Please check email configuration.' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                token,
                message: `Password has been sent to ${TARGET_EMAIL}`,
                expiresAt
            });

        // Validate protected document password
        } else if (action === 'validate-doc-password') {
            cleanExpiredPasswords();

            if (!token || !password) {
                return NextResponse.json(
                    { error: 'Token and password are required' },
                    { status: 400 }
                );
            }

            const storedData = protectedDocPasswordStore.get(token);

            if (!storedData) {
                return NextResponse.json(
                    { error: 'Invalid or expired token', valid: false },
                    { status: 400 }
                );
            }

            // Check if expired
            if (Date.now() > storedData.expiresAt) {
                protectedDocPasswordStore.delete(token);
                return NextResponse.json(
                    { error: 'Password has expired', valid: false },
                    { status: 400 }
                );
            }

            // Check attempts
            if (storedData.attempts >= storedData.maxAttempts) {
                protectedDocPasswordStore.delete(token);
                return NextResponse.json(
                    { error: 'Maximum attempts exceeded', valid: false },
                    { status: 429 }
                );
            }

            // Validate password
            storedData.attempts++;
            if (password.toUpperCase() === storedData.password) {
                // Password is correct - remove from store (one-time use)
                protectedDocPasswordStore.delete(token);
                return NextResponse.json({
                    valid: true,
                    message: 'Access granted'
                });
            } else {
                // Password incorrect - update attempts
                protectedDocPasswordStore.set(token, storedData);
                const remainingAttempts = storedData.maxAttempts - storedData.attempts;
                return NextResponse.json({
                    valid: false,
                    error: `Invalid password. ${remainingAttempts} attempt(s) remaining.`,
                    remainingAttempts
                }, { status: 401 });
            }

        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Knowledge base auth error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

