import fs from 'fs';
import path from 'path';

const LOGIN_ROUTE_PATH = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/app/api/auth/login/route.js';
const AUTH_FORM_PATH = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/components/auth/AuthForm.jsx';

async function verifyLoginToggle() {
    console.log("🚀 Starting Login Toggle Verification...");

    // 1. Verify Backend Login Route
    console.log("\n🔍 Verifying Backend Login Route...");
    const loginRouteContent = fs.readFileSync(LOGIN_ROUTE_PATH, 'utf8');
    const hasORSearch = loginRouteContent.includes('OR:') && loginRouteContent.includes('phoneNumber: email');
    
    if (hasORSearch) {
        console.log("✅ PASS - Backend supports email OR phone login");
    } else {
        console.log("❌ FAIL - Backend missing OR search logic for phone number");
    }

    // 2. Verify Frontend AuthForm
    console.log("\n🔍 Verifying Frontend AuthForm...");
    const authFormContent = fs.readFileSync(AUTH_FORM_PATH, 'utf8');
    
    const hasLoginMethodState = authFormContent.includes("useState('email') // 'email' or 'phone'");
    const hasToggleButtons = authFormContent.includes("onClick={() => setLoginMethod('email')}") && 
                            authFormContent.includes("onClick={() => setLoginMethod('phone')}");
    const hasAnimations = authFormContent.includes("transition-all duration-300 transform") && 
                          authFormContent.includes("translate-x-0 opacity-100 relative");
    const hasFormattedIdentifier = authFormContent.includes("`+63${formData.phoneNumber.replace(/^0+/, '')}`");

    if (hasLoginMethodState) console.log("✅ PASS - loginMethod state implemented");
    else console.log("❌ FAIL - loginMethod state missing");

    if (hasToggleButtons) console.log("✅ PASS - Toggle buttons implemented");
    else console.log("❌ FAIL - Toggle buttons missing");

    if (hasAnimations) console.log("✅ PASS - CSS Animations implemented");
    else console.log("❌ FAIL - CSS Animations missing");

    if (hasFormattedIdentifier) console.log("✅ PASS - Phone number formatting in handleSubmit");
    else console.log("❌ FAIL - Phone number formatting missing in handleSubmit");

    console.log("\n--- Final Verification Summary ---");
    if (hasORSearch && hasLoginMethodState && hasToggleButtons && hasAnimations && hasFormattedIdentifier) {
        console.log("✅ ALL LOGIN TOGGLE FEATURES VERIFIED SUCCESSFULLY");
    } else {
        console.log("❌ SOME VERIFICATIONS FAILED");
    }
}

verifyLoginToggle();
