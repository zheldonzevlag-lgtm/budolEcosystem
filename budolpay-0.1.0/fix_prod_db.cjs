const { execSync } = require('child_process');

const dbUrl = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require&schema=budolpay";
const ssoUrl = "https://budol-id-sso.onrender.com";

const envs = {
    "DATABASE_URL": dbUrl,
    "DIRECT_URL": dbUrl,
    "POSTGRES_URL": dbUrl,
    "NEXT_PUBLIC_SSO_URL": ssoUrl,
    "SSO_URL": ssoUrl
};

console.log("Pushing correct production database credentials to Vercel...");

for (const [key, value] of Object.entries(envs)) {
    try {
        console.log(`Setting ${key}...`);
        // Remove existing first to avoid prompt (ignoring errors if not exists)
        try {
            execSync(`vercel env rm ${key} production -y`, { stdio: 'ignore' });
        } catch (e) {}

        // Add new value using STDIN directly to avoid cmd.exe & escaping issues
        execSync(`vercel env add ${key} production`, { 
            input: value,
            stdio: ['pipe', 'inherit', 'inherit'] 
        });
    } catch (e) {
        console.error(`Failed to set ${key}: ${e.message}`);
    }
}
console.log("Done syncing variables!");
