import fs from 'fs';
import path from 'path';

const AUTH_FORM_PATH = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/components/auth/AuthForm.jsx';
const LOGIN_ROUTE_PATH = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/app/api/auth/login/route.js';
const OTP_ROUTE_PATH = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/app/api/auth/otp/route.js';
const SCHEMA_PATH = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/prisma/schema.prisma';

async function verifyOtpLogin() {
    console.log("🚀 Starting OTP Login Verification...");

    // 1. Verify Schema
    console.log("\n🔍 Verifying Prisma Schema...");
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
    if (schemaContent.includes('model VerificationCode')) {
        console.log("✅ PASS - VerificationCode model exists");
    } else {
        console.log("❌ FAIL - VerificationCode model missing");
    }

    // 2. Verify OTP API
    console.log("\n🔍 Verifying OTP API Route...");
    if (fs.existsSync(OTP_ROUTE_PATH)) {
        console.log("✅ PASS - OTP route exists");
        const otpContent = fs.readFileSync(OTP_ROUTE_PATH, 'utf8');
        if (otpContent.includes("action === 'send'") && otpContent.includes("sendOTPSMS")) {
            console.log("✅ PASS - OTP route handles sending codes");
        } else {
            console.log("❌ FAIL - OTP route logic incomplete");
        }
    } else {
        console.log("❌ FAIL - OTP route missing");
    }

    // 3. Verify Login API
    console.log("\n🔍 Verifying Login API Updates...");
    const loginContent = fs.readFileSync(LOGIN_ROUTE_PATH, 'utf8');
    if (loginContent.includes('const isOtp = /^[0-9]{6}$/.test(password)') && loginContent.includes('prisma.verificationCode.findFirst')) {
        console.log("✅ PASS - Login API supports OTP verification");
    } else {
        console.log("❌ FAIL - Login API missing OTP verification logic");
    }

    // 4. Verify Frontend
    console.log("\n🔍 Verifying Frontend AuthForm...");
    const authFormContent = fs.readFileSync(AUTH_FORM_PATH, 'utf8');
    if (authFormContent.includes('handleSendOtp') && authFormContent.includes('Send Code via Email/SMS')) {
        console.log("✅ PASS - AuthForm has OTP sending logic and button");
    } else {
        console.log("❌ FAIL - AuthForm missing OTP UI elements");
    }

    if (authFormContent.includes('loginMethod === \'phone\' ? (') && authFormContent.includes('Verification Code')) {
        console.log("✅ PASS - AuthForm replaces password with OTP UI for mobile login");
    } else {
        console.log("❌ FAIL - AuthForm missing conditional OTP/Password replacement");
    }

    console.log("\n✨ Verification Complete!");
}

verifyOtpLogin().catch(console.error);
