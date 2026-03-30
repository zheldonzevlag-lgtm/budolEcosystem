const { execSync } = require('child_process');

const envs = {
    "DATABASE_URL": "postgresql://neondb_owner:npg_1XunT0SskIwa@ep-bitter-wildflower-a1y0z1id-pooler.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolpay",
    "DIRECT_URL": "postgresql://neondb_owner:npg_1XunT0SskIwa@ep-bitter-wildflower-a1y0z1id-pooler.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolpay",
    "NEXT_PUBLIC_SSO_URL": "https://budol-id-sso.onrender.com",
    "SSO_URL": "https://budol-id-sso.onrender.com",
    "BUDOLACCOUNTING_URL": "https://budolaccounting.onrender.com", 
    "NEXT_PUBLIC_SOCKET_URL": "https://budol-websocket-server.onrender.com",
    "JWT_SECRET": "GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=",
    "CLOUDINARY_API_KEY": "537684148625265",
    "CLOUDINARY_API_SECRET": "USb6SDEDehMLyw9_HlFC1wDqlDE",
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
