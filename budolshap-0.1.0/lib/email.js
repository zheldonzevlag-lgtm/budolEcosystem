import nodemailer from 'nodemailer'
import { getSystemSettings } from './settings'
import { maskPII } from './compliance'
import path from 'path'

const logoAttachment = {
    filename: 'budolShap_logo_transparent-1.png',
    path: path.join(process.cwd(), 'public/assets/budolShap/budolShap_logo_transparent-1.png'),
    cid: 'budolshap-logo'
}

// Create transporter based on provider settings
const createTransporter = async () => {
    const settings = await getSystemSettings()
    
    // Check if provider is BREVO
    if (settings.emailProvider === 'BREVO') {
        if (!settings.brevoApiKey) return null
        
        try {
            return nodemailer.createTransport({
                host: 'smtp-relay.brevo.com',
                port: 587,
                secure: false,
                auth: {
                    user: settings.smtpUser || process.env.BREVO_USER,
                    pass: settings.brevoApiKey
                }
            })
        } catch (error) {
            console.error('Failed to create Brevo transporter:', error)
            return null
        }
    }

    // Check if provider is GMASS
    if (settings.emailProvider === 'GMASS') {
        if (!settings.gmassApiKey) return null
        
        try {
            // GMASS often uses SMTP relay or API, here we use their SMTP relay
            return nodemailer.createTransport({
                host: 'smtp.gmass.co',
                port: 587,
                secure: false,
                auth: {
                    user: settings.smtpUser || process.env.GMASS_USER,
                    pass: settings.gmassApiKey
                }
            })
        } catch (error) {
            console.error('Failed to create GMASS transporter:', error)
            return null
        }
    }

    // Default to GOOGLE / SMTP
    let user = settings.smtpUser || process.env.SMTP_USER
    let pass = settings.smtpPass || process.env.SMTP_PASS

    // Sanitize Gmail App Passwords (remove spaces)
    if (pass && (settings.smtpHost === 'smtp.gmail.com' || user?.endsWith('@gmail.com'))) {
        const sanitizedPass = pass.replace(/\s+/g, '');
        if (sanitizedPass !== pass) {
            console.log('🧹 [EmailService] Sanitized Gmail App Password (removed spaces).');
            pass = sanitizedPass;
        }
    }

    if (!user || !pass) {
        return null
    }

    try {
        const transporter = nodemailer.createTransport({
            host: settings.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(settings.smtpPort || process.env.SMTP_PORT || '587'),
            secure: false,
            auth: { user, pass },
        })
        
        // Verify connection configuration
        await transporter.verify().catch(err => {
            if (err.message.includes('535 5.7.8')) {
                console.error('❌ [EmailService] SMTP Authentication Error (Bad Credentials).');
                console.error('👉 If using Gmail, ensure you are using an "App Password", not your regular account password.');
                console.error('👉 Check Admin Settings > System Settings > Email Settings.');
            } else {
                console.error('❌ [EmailService] SMTP Connection Error:', err.message);
            }
            throw err;
        });

        return transporter;
    } catch (error) {
        console.error('Failed to create SMTP transporter:', error)
        return null
    }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Helper to format text with Budol branding in HTML emails
 */
const formatBrandedText = (text) => {
    if (!text) return '';

    // Pattern to match budol followed by optional underscore and suffix (pay, shap, etc.)
    const pattern = /(budol)(_?)([a-zA-Z₱]+)/gi;

    // Check if the text contains any brand patterns
    if (!pattern.test(text)) {
        return text;
    }

    // Reset regex lastIndex because of /g flag
    pattern.lastIndex = 0;

    // Use replace with a function to format the matches with HTML
    return text.replace(pattern, (match, p1, p2, p3) => {
        const budolPart = "budol";
        let suffixPart = p3;
        const suffixLower = suffixPart.toLowerCase();

        // Normalize suffix and determine color
        let suffixColor = "#f43f5e"; // rose-500 equivalent (for Pay)

        if (suffixLower === "pay" || suffixLower === "₱ay") {
            suffixPart = "Pay";
            suffixColor = "#f43f5e"; // rose-500
        } else if (suffixLower === "shap") {
            suffixPart = "Shap";
            suffixColor = "#10b981"; // emerald-500
        } else if (suffixLower === "care") {
            suffixPart = "Care";
            suffixColor = "#f59e0b"; // amber-500
        } else if (suffixLower === "express") {
            suffixPart = "Express";
            suffixColor = "#f59e0b"; // amber-500
        } else if (suffixLower === "loan") {
            suffixPart = "Loan";
            suffixColor = "#3b82f6"; // blue-500
        } else if (suffixLower === "ecosystem") {
            suffixPart = "Ecosystem";
            suffixColor = "#64748b"; // slate-500
        } else if (suffixLower === "akawntng") {
            suffixPart = "Akawntng";
            suffixColor = "#a855f7"; // purple-500
        } else if (suffixLower === "id") {
            suffixPart = "ID";
            suffixColor = "#334155"; // slate-700
        }

        return `<span style="font-weight: 600;">${budolPart}</span><span style="font-weight: 600; color: ${suffixColor};">${suffixPart}</span>`;
    });
};

// Corporate Email Template Helper
const getHtmlTemplate = (title, content, heading, options = {}) => {
    const currentYear = new Date().getFullYear()
    const { backgroundImage, footerColor, contentColor } = options

    // Logo HTML structure matching the website
    const logoHtml = `
        <img src="https://res.cloudinary.com/dasfwpg7x/image/upload/v1771164945/budolshap/assets/budolshap_logo_transparent.png" alt="budolShap" style="height: 70px; vertical-align: middle;">
    `

    const brandLightGreen = '#fbfffcff'; // emerald-200
    const headerMidGreen = '#59ccb3ff'; // 

    const containerStyle = backgroundImage 
        ? `max-width: 600px; margin: 40px auto; background-image: url('${backgroundImage}'); background-size: 100% 100%; background-repeat: no-repeat; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);`
        : `max-width: 600px; margin: 40px auto; background-color: ${brandLightGreen}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);`

    const footerStyle = 'background-color: #383838ff; padding: 24px 40px; text-align: center; color: #e2e8f0; font-size: 12px; border-top: 1px solid #1e293b;'

    const headerStyle = `background-color: ${headerMidGreen}; padding: 40px 40px 20px 40px; text-align: center;`

        
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }
                .container { ${containerStyle} }
                .header { ${headerStyle} }
                .content { background-color: ${brandLightGreen}; padding: 40px 40px 0px 40px; color: ${contentColor || '#334155'}; overflow: hidden; }
                .button { display: inline-block; background-color: #16a34a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; font-size: 16px; }
                .footer { ${footerStyle} }
                .footer p { color: #e8eaecff; }
                .link { color: #16a34a; word-break: break-all; font-weight: 500; }
                h1 { color: #1e293b; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.025em; display: inline-block; vertical-align: middle; margin-right: 8px; }
                p { margin-bottom: 16px; color: inherit; }
                .info-box { background: #ecececff; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .info-label { font-weight: 600; color: #334155; }
                .info-value { color: #64748b; }
                .logo-container { display: inline-block; vertical-align: middle; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    ${heading
            ? `<h1>${heading}</h1> <div class="logo-container">${logoHtml}</div>`
            : `<div class="logo-container">${logoHtml}</div>`
        }
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>This email was sent to you because you signed up for ${formatBrandedText('budolShap')}.</p>                
                    <p>&copy; ${currentYear} ${formatBrandedText('budolShap')}. All rights reserved.</p>
                    <span style="display:none; font-size:0; line-height:0; max-height:0; mso-hide:all; overflow:hidden;">${Date.now()}</span>
                </div>
            </div>
        </body>
        </html>
    `
}

// Send email verification
export async function sendVerificationEmail(email, token, name) {
    try {
        const settings = await getSystemSettings()
        const transporter = await createTransporter()
        const encodedToken = encodeURIComponent(token)
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${encodedToken}`

        // If email is not configured, log to console instead
        if (!transporter) {
            console.log('\n========================================')
            console.log('📧 EMAIL VERIFICATION (Email Not Configured)')
            console.log('========================================')
            console.log(`To: ${maskPII(email)}`)
            console.log(`Name: ${maskPII(name)}`)
            console.log(`Verification Link: ${verifyUrl}`)
            console.log('========================================\n')
            return true // Return true so registration continues
        }

        // Email is configured - send the actual email

        const mailOptions = {
            from: settings.smtpFrom || process.env.SMTP_FROM || settings.smtpUser || process.env.SMTP_USER,
            to: email,
            subject: 'Verify Your Email - budolShap',
            html: getHtmlTemplate(
                'Verify Your Email - budolShap',
                `
                    <p>Hi ${name},</p>
                    <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verifyUrl}" class="button">
                            Verify Email
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p class="link">${verifyUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                        Stay safe with ${formatBrandedText('budolShap')}.
                    </p>
                `,
                'Welcome to'
            ),
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ Verification email sent to: ${maskPII(email)}`)
        return true
    } catch (error) {
        console.error('Error sending verification email:', error)
        // Log the link as fallback
        const encodedToken = encodeURIComponent(token)
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${encodedToken}`
        console.log('\n⚠️ Email sending failed, but here is the verification link for ' + maskPII(email) + ':')
        console.log(verifyUrl)
        console.log('')
        // Still return true so registration doesn't fail
        return true
    }
}

// Send password reset email
export async function sendPasswordResetEmail(email, token, name) {
    try {
        const settings = await getSystemSettings()
        const transporter = await createTransporter()
        const encodedToken = encodeURIComponent(token)
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${encodedToken}`

        // If email is not configured, log to console instead
        if (!transporter) {
            console.log('\n========================================')
            console.log('📧 PASSWORD RESET (Email Not Configured)')
            console.log('========================================')
            console.log(`To: ${maskPII(email)}`)
            console.log(`Name: ${maskPII(name)}`)
            console.log(`Reset Link: ${resetUrl}`)
            console.log('========================================\n')
            return true // Return true so the process continues
        }

        // Email is configured - send the actual email

        const mailOptions = {
            from: settings.smtpFrom || process.env.SMTP_FROM || settings.smtpUser || process.env.SMTP_USER,
            to: email,
            subject: 'Reset Your Password - budolShap',
            html: getHtmlTemplate(
                'Reset Your Password - budolShap',
                `
                    <p>Hi ${name},</p>
                    <p>We received a request to reset your password. Click the button below to reset it:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" class="button">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p class="link">${resetUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px; margin-bottom:30px;">
                        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                    </p>
                `,
                'Password Reset Request'
            ),
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ Password reset email sent to: ${maskPII(email)}`)
        return true
    } catch (error) {
        console.error('Error sending password reset email:', error)
        // Log the link as fallback
        const encodedToken = encodeURIComponent(token)
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${encodedToken}`
        console.log('\n⚠️ Email sending failed, but here is the reset link for ' + maskPII(email) + ':')
        console.log(resetUrl)
        console.log('')
        // Still return true so the process doesn't fail
        return true
    }
}

// Send OTP email
export async function sendOTPEmail(email, otp, name, ttlMinutes = 15) {
    try {
        const settings = await getSystemSettings()
        const transporter = await createTransporter()

        // If email is not configured, log to console instead
        if (!transporter) {
            console.log('\n========================================')
            console.log('📧 OTP VERIFICATION (Email Not Configured)')
            console.log('========================================')
            console.log(`To: ${maskPII(email)}`)
            console.log(`Name: ${maskPII(name)}`)
            // Always display OTP in console for debugging (local/dev)
            console.log(`OTP Code: \x1b[33m${otp}\x1b[0m`)
            console.log(`Validity: ${ttlMinutes} minutes`)
            console.log('========================================\n')
            return true // Changed from false to true to allow fallback login
        }

        // Email is configured - send the actual email

        // Cloudinary URL for the background image
        // NOTE: Ensure 'email_background_1.png' is uploaded to this path in Cloudinary
        const bgImage = 'https://res.cloudinary.com/dasfwpg7x/image/upload/budolshap/assets/email_background_1.png';

        const mailOptions = {
            from: settings.smtpFrom || process.env.SMTP_FROM || settings.smtpUser || process.env.SMTP_USER,
            to: email,
            subject: 'Your Verification Code - budolShap',
            html: getHtmlTemplate(
                'Verification Code - budolShap',
                `
                    <p>Hi ${name},</p>
                    <p>Your verification code is:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; padding: 12px 22px; background-color: #ebf1f7ff; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #eab308;">${otp}</span>
                        </div>
                    </div>
                    <p style="font-size:14px;" >Please enter this code on the login page to continue accessing the App.</p>
                    <p style="font-size: 14px; margin-top: 20px; margin-bottom:25px;">
                        This code will expire in ${ttlMinutes} minutes. If you didn't request this, please ignore this email.
                    </p>
                     <p style="font-size: 14px; margin-top: 10px; margin-bottom:25px;">
                        If you have any questions or need further assistance, please feel free to contact us.
                    </p> 
                    <p style="font-size: 14px; margin-top: 20px; margin-bottom:30px;">
                        Thank you for using budol<span style="color: #16a34a;">Shap</span>. <br>
                        Jon Galvez
                    </p>                                      
                `,
                'Verification Code',
                {
                    backgroundImage: bgImage,
                    contentColor: '#334155', // Adjust based on background brightness
                    footerColor: '#b9b4b4ff'   // Assuming the bottom of the image is dark/green
                }
            ),
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ OTP email sent to: ${maskPII(email)} (Code: \x1b[33m${otp}\x1b[0m)`)
        return true
    } catch (error) {
        console.error('Error sending OTP email:', error)
        console.log(`\n⚠️ OTP email sending failed for ${maskPII(email)}`)
        return false
    }
}

// Send order placed email
export async function sendOrderPlacedEmail(email, order, user, store) {
    try {
        const transporter = await createTransporter()

        if (!transporter) {
            console.log('\n========================================')
            console.log('📧 ORDER PLACED (Email Not Configured)')
            console.log('========================================')
            console.log(`To: ${email}`)
            console.log(`Order ID: ${order.id}`)
            console.log(`Total: ₱${order.total.toFixed(2)}`)
            console.log('========================================\n')
            return true
        }

        const settings = await getSystemSettings()
        const mailOptions = {
            from: settings.smtpFrom || process.env.SMTP_FROM || settings.smtpUser || process.env.SMTP_USER,
            to: email,
            subject: `Order Confirmation - #${order.id}`,
            html: getHtmlTemplate(
                `Order Confirmation - #${order.id}`,
                `
                    <p>Hi ${user.name},</p>
                    <p>Your order from <strong>${store.name}</strong> has been placed successfully.</p>
                    <div class="info-box">
                        <p><strong>Order ID:</strong> ${formatBrandedText(order.id)}</p>
                        <p><strong>Total:</strong> ₱${order.total.toFixed(2)}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                    </div>
                    <p>We'll notify you when your order is shipped.</p>
                    <p>Thank you for shopping with us!</p>
                `,
                'Order Confirmed!'
            ),
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ Order placed email sent to: ${email}`)
        return true
    } catch (error) {
        console.error('Error sending order placed email:', error)
        return false
    }
}

// Send order status update email
export async function sendOrderStatusEmail(email, order, user, store, status) {
    try {
        const settings = await getSystemSettings()
        const transporter = await createTransporter()

        if (!transporter) {
            console.log('\n========================================')
            console.log(`📧 ORDER ${status.toUpperCase()} (Email Not Configured)`)
            console.log('========================================')
            console.log(`To: ${email}`)
            console.log(`Order ID: ${order.id}`)
            console.log(`Status: ${status}`)
            console.log('========================================\n')
            return true
        }

        let subject, heading, message

        if (status === 'SHIPPED') {
            subject = `Order Shipped - #${order.id}`
            heading = 'Your Order is On the Way!'
            message = `Great news! Your order from <strong>${store.name}</strong> has been shipped.`
        } else if (status === 'DELIVERED') {
            subject = `Order Delivered - #${order.id}`
            heading = 'Order Delivered!'
            message = `Your order from <strong>${store.name}</strong> has been delivered.`
        } else {
            subject = `Order Update - #${order.id}`
            heading = 'Order Status Updated'
            message = `Your order status has been updated to <strong>${status}</strong>.`
        }

        const mailOptions = {
            from: settings.smtpFrom || process.env.SMTP_FROM || settings.smtpUser || process.env.SMTP_USER,
            to: email,
            subject,
            html: getHtmlTemplate(
                subject,
                `
                    <p>Hi ${user.name},</p>
                    <p>${message}</p>
                    <div class="info-box">
                        <p><strong>Order ID:</strong> ${formatBrandedText(order.id)}</p>
                        <p><strong>Status:</strong> ${status}</p>
                    </div>
                    <p>Thank you for shopping with us!</p>
                `,
                heading
            ),
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ Order status email sent to: ${email}`)
        return true
    } catch (error) {
        console.error('Error sending order status email:', error)
        return false
    }
}

// Send return request email to seller
export async function sendReturnRequestEmail(email, returnRequest, order, user, store) {
    try {
        const settings = await getSystemSettings()
        const transporter = await createTransporter()

        if (!transporter) {
            console.log('\n========================================')
            console.log('📧 RETURN REQUEST (Email Not Configured)')
            console.log('========================================')
            console.log(`To: ${email}`)
            console.log(`Order ID: ${order.id}`)
            console.log(`Reason: ${returnRequest.reason}`)
            console.log('========================================\n')
            return true
        }

        const mailOptions = {
            from: settings.smtpFrom || process.env.SMTP_FROM || settings.smtpUser || process.env.SMTP_USER,
            to: email,
            subject: `Return Request - Order #${order.id}`,
            html: getHtmlTemplate(
                `Return Request - Order #${order.id}`,
                `
                    <p>Hi ${store.name},</p>
                    <p>A customer has requested a return for order <strong>#${formatBrandedText(order.id)}</strong>.</p>
                    <div class="info-box">
                        <p><strong>Customer:</strong> ${user.name}</p>
                        <p><strong>Reason:</strong> ${returnRequest.reason}</p>
                    </div>
                    <p>Please review and respond to this request in your seller dashboard.</p>
                `,
                'Return Request Received'
            ),
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ Return request email sent to: ${email}`)
        return true
    } catch (error) {
        console.error('Error sending return request email:', error)
        return false
    }
}

// Generic send email function
export async function sendEmail({ to, subject, html }) {
    try {
        const transporter = createTransporter()

        if (!transporter) {
            console.log('\n========================================')
            console.log(`📧 EMAIL (Email Not Configured)`)
            console.log('========================================')
            console.log(`To: ${to}`)
            console.log(`Subject: ${subject}`)
            console.log('========================================\n')
            return true
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ Email sent to: ${to}`)
        return true
    } catch (error) {
        console.error('Error sending email:', error)
        return false
    }
}

// Send buyer notification for failed delivery (Action required: Wait for rebook)
export async function sendDeliveryFailedBuyerEmail(email, order, user, store, reason) {
    try {
        const transporter = createTransporter()
        if (!transporter) return true // Skip if not configured

        const subject = `Delivery Update - Order #${order.id}`
        const heading = 'Delivery Attempt Failed'
        const message = `
            <p>Hi ${user.name},</p>
            <p>We attempted to deliver your order from <strong>${store.name}</strong>, but it was unsuccessful.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Don't worry! The seller has been notified and will arrange a new delivery attempt shortly.</p>
            <p>You will receive a new tracking number once it's rebooked.</p>
        `

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject,
            html: getHtmlTemplate(
                subject,
                `
                    ${message}
                    <div class="info-box">
                        <p><strong>Order ID:</strong> ${formatBrandedText(order.id)}</p>
                        <p><strong>Status:</strong> Processing (Rebooking Pending)</p>
                    </div>
                `,
                heading
            ),
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ Buyer delivery failed email sent to: ${email}`)
        return true
    } catch (error) {
        console.error('Error sending buyer delivery failed email:', error)
        return false
    }
}

// Send seller notification for failed delivery (Action required: Rebook)
export async function sendDeliveryFailedSellerEmail(email, order, store, reason) {
    try {
        const transporter = createTransporter()
        if (!transporter) return true // Skip if not configured

        const subject = `Action Required: Delivery Failed - Order #${order.id}`
        const heading = 'Delivery Failed - Action Required'
        const message = `
            <p>Hi ${store.name},</p>
            <p>The delivery for order <strong>#${formatBrandedText(order.id)}</strong> has failed.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p style="color: #c0392b; font-weight: bold;">Action Required:</p>
            <p>Please log in to your dashboard and click <strong>"Rebook Delivery"</strong> to arrange a new courier.</p>
        `

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject,
            html: getHtmlTemplate(
                subject,
                `
                    ${message}
                    <div class="info-box">
                        <p><strong>Order ID:</strong> ${formatBrandedText(order.id)}</p>
                        <p><strong>Status:</strong> Failed / Processing</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/store/orders" class="button">
                            Go to Store Orders
                        </a>
                    </div>
                `,
                heading
            ),
        }

        await transporter.sendMail(mailOptions)
        console.log(`✓ Seller delivery failed email sent to: ${email}`)
        return true
    } catch (error) {
        console.error('Error sending seller delivery failed email:', error)
        return false
    }
}
