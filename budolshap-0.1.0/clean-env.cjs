// WHY: Sanitize environment variables in Vercel that contain literal \r\n characters
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Fetching budolshap Vercel env vars...');
const envVarsJson = execSync('npx vercel env ls --json', { encoding: 'utf8' });
const envVars = JSON.parse(envVarsJson);

const targetVars = ['SMTP_PASS', 'SMTP_USER', 'DATABASE_URL', 'DIRECT_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_SSO_URL'];
const tmpFile = path.join(os.tmpdir(), 'vercel-env-val-shap.txt');

for (const envVar of envVars) {
    if (targetVars.includes(envVar.key)) {
        let value = envVar.value;
        let needsFix = false;

        if (value.includes('\\r\\n') || value.includes('\r\n')) {
            console.log(`Found \\r\\n in ${envVar.key}`);
            value = value.replace(/\\r\\n/g, '').replace(/\r\n/g, '');
            needsFix = true;
        }

        if (value.startsWith('"') && value.endsWith('"')) {
            console.log(`Found extra quotes in ${envVar.key}`);
            value = value.replace(/^"/, '').replace(/"$/, '');
            needsFix = true;
        }

        if (needsFix) {
            console.log(`Fixing ${envVar.key} for ${envVar.target.join(', ')}...`);
            
            // Write clean value to temp file
            fs.writeFileSync(tmpFile, value, { encoding: 'utf8' });

            for (const target of envVar.target) {
                try {
                    execSync(`npx vercel env rm ${envVar.key} ${target} -y`, { stdio: 'ignore' });
                } catch (e) {}

                execSync(`npx vercel env add ${envVar.key} ${target} < "${tmpFile}"`, {
                    shell: true,
                    stdio: ['inherit', 'ignore', 'ignore']
                });
            }
            console.log(`✅ Fixed ${envVar.key}`);
        } else {
            console.log(`✅ ${envVar.key} is clean`);
        }
    }
}

try { fs.unlinkSync(tmpFile); } catch (e) {}
console.log('Done!');
