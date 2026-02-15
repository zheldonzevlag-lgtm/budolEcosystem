import fs from 'fs';
import path from 'path';

const LOGIN_SCREEN_PATH = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/login_screen.dart';
const API_SERVICE_PATH = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/services/api_service.dart';

async function verifyBudolPayLoginToggle() {
    console.log("🚀 Starting budolPay Mobile Login Toggle Verification...");

    // 1. Verify Login Screen Implementation
    console.log("\n🔍 Verifying Login Screen (lib/screens/login_screen.dart)...");
    const loginScreenContent = fs.readFileSync(LOGIN_SCREEN_PATH, 'utf8');

    const hasLoginMethodEnum = loginScreenContent.includes('enum LoginMethod { mobile, email }');
    const hasToggleWidget = loginScreenContent.includes('Widget _buildMethodToggle()');
    const hasEmailController = loginScreenContent.includes('final _emailController = TextEditingController();');
    const hasPasswordController = loginScreenContent.includes('final _passwordController = TextEditingController();');
    const hasStateClearing = loginScreenContent.includes('_phoneController.clear()') && loginScreenContent.includes('_emailController.clear()');
    const hasPasswordVisibility = loginScreenContent.includes('bool _obscurePassword = true;');
    const hasEmailLoginLogic = loginScreenContent.includes('apiService.identifyEmail(identifier, password)');

    if (hasLoginMethodEnum) console.log("✅ PASS - LoginMethod enum implemented");
    else console.log("❌ FAIL - LoginMethod enum missing");

    if (hasToggleWidget) console.log("✅ PASS - _buildMethodToggle widget implemented");
    else console.log("❌ FAIL - _buildMethodToggle widget missing");

    if (hasEmailController && hasPasswordController) console.log("✅ PASS - Email and Password controllers implemented");
    else console.log("❌ FAIL - Controllers missing");

    if (hasStateClearing) console.log("✅ PASS - State clearing on toggle implemented");
    else console.log("❌ FAIL - State clearing missing");

    if (hasPasswordVisibility) console.log("✅ PASS - Password visibility toggle state implemented");
    else console.log("❌ FAIL - Password visibility state missing");

    if (hasEmailLoginLogic) console.log("✅ PASS - Email login identification logic implemented");
    else console.log("❌ FAIL - Email login logic missing");

    // 2. Verify API Service Implementation
    console.log("\n🔍 Verifying API Service (lib/services/api_service.dart)...");
    const apiServiceContent = fs.readFileSync(API_SERVICE_PATH, 'utf8');

    const hasIdentifyEmail = apiServiceContent.includes('Future<Map<String, dynamic>> identifyEmail(String email, String password)');
    const hasLoginEndpoint = apiServiceContent.includes("final url = '$authUrl/login';");
    const hasSessionSaving = apiServiceContent.includes('await _saveSession();');

    if (hasIdentifyEmail) console.log("✅ PASS - identifyEmail endpoint implemented");
    else console.log("❌ FAIL - identifyEmail endpoint missing");

    if (hasLoginEndpoint) console.log("✅ PASS - Correct login endpoint URL used for email");
    else console.log("❌ FAIL - Login endpoint URL mismatch");

    if (hasSessionSaving) console.log("✅ PASS - Session saving on success implemented");
    else console.log("❌ FAIL - Session saving missing");

    console.log("\n--- Final Verification Summary ---");
    const allPassed = hasLoginMethodEnum && hasToggleWidget && hasEmailController && 
                      hasPasswordController && hasStateClearing && hasPasswordVisibility && 
                      hasEmailLoginLogic && hasIdentifyEmail && hasLoginEndpoint && hasSessionSaving;

    if (allPassed) {
        console.log("✅ ALL BUDOLPAY LOGIN TOGGLE FEATURES VERIFIED SUCCESSFULLY");
    } else {
        console.log("❌ SOME VERIFICATIONS FAILED");
    }
}

verifyBudolPayLoginToggle();
