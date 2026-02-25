import fs from 'fs'
import path from 'path'

console.log('--- BudolShap Login Toggle & OTP Verification ---')

const projectRoot = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0'

// 1. Verify Prisma Schema
const schemaPath = path.join(projectRoot, 'prisma/schema.prisma')
const schemaContent = fs.readFileSync(schemaPath, 'utf8')
if (schemaContent.includes('model VerificationCode')) {
    console.log('✅ VerificationCode model exists in schema.prisma')
} else {
    console.log('❌ VerificationCode model MISSING in schema.prisma')
}

// 2. Verify OTP API Route
const otpApiPath = path.join(projectRoot, 'app/api/auth/otp/route.js')
if (fs.existsSync(otpApiPath)) {
    const content = fs.readFileSync(otpApiPath, 'utf8')
    if (content.includes('prisma.verificationCode.upsert')) {
        console.log('✅ OTP API Route exists and uses VerificationCode model')
    } else {
        console.log('❌ OTP API Route found but missing model usage')
    }
} else {
    console.log('❌ OTP API Route MISSING')
}

// 3. Verify AuthForm Toggle UI & OTP Logic
const authFormPath = path.join(projectRoot, 'components/auth/AuthForm.jsx')
const authFormContent = fs.readFileSync(authFormPath, 'utf8')
if (authFormContent.includes("loginMethod === 'phone'")) {
    console.log('✅ AuthForm has loginMethod state for toggling')
}
if (authFormContent.includes('handleSendOtp')) {
    console.log('✅ AuthForm has handleSendOtp function')
}
if (authFormContent.includes('isOtp: true')) {
    console.log('✅ AuthForm sends isOtp flag on login')
}

// 4. Verify Login API OTP Support
const loginApiPath = path.join(projectRoot, 'app/api/auth/login/route.js')
const loginApiContent = fs.readFileSync(loginApiPath, 'utf8')
if (loginApiContent.includes('body.isOtp') && loginApiContent.includes('prisma.verificationCode.findFirst')) {
    console.log('✅ Login API supports OTP verification')
} else {
    console.log('❌ Login API missing OTP verification logic')
}

console.log('--- Verification Complete ---')
