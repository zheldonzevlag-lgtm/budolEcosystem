require('dotenv').config();
const { execSync } = require('child_process');

const envs = {
    "DATABASE_URL": process.env.DATABASE_URL + '&schema=budolpay',
    "DIRECT_URL": process.env.DATABASE_URL + '&schema=budolpay',
    "NEXT_PUBLIC_SSO_URL": "https://budol-id-sso.onrender.com",
    "SSO_URL": "https://budol-id-sso.onrender.com",
    "BUDOLACCOUNTING_URL": "https://budolaccounting.onrender.com", 
    "NEXT_PUBLIC_SOCKET_URL": "https://budol-websocket-server.onrender.com",
    "JWT_SECRET": process.env.JWT_SECRET,
    "CLOUDINARY_API_KEY": process.env.CLOUDINARY_API_KEY,
    "CLOUDINARY_API_SECRET": process.env.CLOUDINARY_API_SECRET,
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME": "dasfwpg7x",
    "NEXT_PUBLIC_CURRENCY_SYMBOL": "₱",
    "NEXT_PUBLIC_GATEWAY_URL": "https://payment-gateway-service-two.vercel.app"
};

for (const [key, value] of Object.entries(envs)) {
    try {
        console.log(`Setting ${key}...`);
        execSync(`vercel env rm ${key} production -y`, { stdio: 'ignore' });
    } catch (e) {
        // Ignore if not exists
    }
    
    try {
        execSync(`vercel env add ${key} production`, {
            input: value,
            stdio: ['pipe', 'inherit', 'inherit']
        });
        console.log(`✅ Set ${key}`);
    } catch (e) {
        console.error(`❌ Failed to set ${key}`);
    }
}
