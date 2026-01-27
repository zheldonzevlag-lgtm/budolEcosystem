const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

/**
 * Shared Notification Package for BudolPay Ecosystem
 * Compliance: BSP Circular 808, PCI DSS 10.2.2
 */

const getTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendEmail = async (to, subject, text, html) => {
    try {
        const transporter = getTransporter();
        const info = await transporter.sendMail({
            from: `"budolPay" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });
        console.log(`[Notification] Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (err) {
        console.error(`[Notification] Email failed: ${err.message}`);
        return false;
    }
};

const sendSMS = async (to, message) => {
    try {
        console.log(`[Notification] SMS Simulation to ${to}: ${message}`);
        // Integration with SMS provider would go here (Zerix, iTextMo, etc.)
        return true;
    } catch (err) {
        console.error(`[Notification] SMS failed: ${err.message}`);
        return false;
    }
};

const sendOTP = async (to, otp, type = 'EMAIL') => {
    const subject = 'Your BudolPay Verification Code';
    const message = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;
    
    if (type === 'EMAIL' || type === 'BOTH') {
        await sendEmail(to, subject, message, `<p>${message}</p>`);
    }
    if (type === 'SMS' || type === 'BOTH') {
        await sendSMS(to, message);
    }
};

const sendAccountCreationSuccess = async (to, firstName) => {
    const subject = 'Welcome to BudolPay!';
    const message = `Hi ${firstName}, your BudolPay account has been successfully created. Welcome to the ecosystem!`;
    await sendEmail(to, subject, message, `<h1>Welcome!</h1><p>${message}</p>`);
};

const sendVerificationSuccess = async (to, firstName) => {
    const subject = 'Account Verified - BudolPay';
    const message = `Hi ${firstName}, your account has been successfully verified. You can now use all BudolPay features.`;
    await sendEmail(to, subject, message, `<p>${message}</p>`);
};

const sendKycSuccess = async (to, firstName, type = 'BOTH') => {
    const subject = 'KYC Verification Approved';
    const message = `Hi ${firstName}, your KYC documents have been reviewed and approved.`;
    
    if (type === 'EMAIL' || type === 'BOTH') {
        await sendEmail(to, subject, message, `<p>${message}</p>`);
    }
    if (type === 'SMS' || type === 'BOTH') {
        await sendSMS(to, message);
    }
};

module.exports = {
    sendOTP,
    sendAccountCreationSuccess,
    sendVerificationSuccess,
    sendKycSuccess
};
