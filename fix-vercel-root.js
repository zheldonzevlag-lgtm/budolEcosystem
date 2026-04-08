/**
 * fix-vercel-root.js
 * Why: Vercel dashboard has an incorrect rootDirectory set for payment-gateway-service,
 *      causing double-path errors when deploying from a subdirectory.
 * What: Uses the Vercel REST API to clear (set to null) the rootDirectory for the project.
 * TODO: Delete this file after the fix is confirmed.
 */
const https = require('https');

// Project ID from .vercel/project.json
const PROJECT_ID = 'prj_fFclnZHzP7vGKicrFWPkPATylE4Z';
const TEAM_ID = 'team_rAWrfp4CY4DFjkuHyM2KMCh9';

// Reads token from the vercel CLI global auth file
const path = require('path');
const fs = require('fs');

function getVercelToken() {
  const possiblePaths = [
    path.join(process.env.HOME || process.env.USERPROFILE, '.local', 'share', 'com.vercel.cli', 'auth.json'),
    path.join(process.env.HOME || process.env.USERPROFILE, 'AppData', 'Local', 'com.vercel.cli', 'auth.json'),
    path.join(process.env.HOME || process.env.USERPROFILE, 'AppData', 'Roaming', 'com.vercel.cli', 'auth.json'),
  ];
  for (const p of possiblePaths) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      return data.token;
    } catch (e) { /* continue */ }
  }
  // Fallback: try VERCEL_TOKEN env var
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  console.error('Could not find Vercel token. Set VERCEL_TOKEN env var.');
  process.exit(1);
}

const token = getVercelToken();
console.log('Token found. Patching project rootDirectory to correct path...');

const body = JSON.stringify({ rootDirectory: "budolpay-0.1.0/services/payment-gateway-service" });

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (res.statusCode === 200) {
      console.log('✅ Success! rootDirectory updated for payment-gateway-service.');
      console.log('   rootDirectory is now:', parsed.rootDirectory);
    } else {
      console.error('❌ Error:', res.statusCode, data);
    }
  });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(body);
req.end();
