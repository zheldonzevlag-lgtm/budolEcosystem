/**
 * Add DATABASE_URL to Vercel project via API
 */
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_OIDC_TOKEN;
const PROJECT_ID = 'prj_56GqHlFLq98EpY6CJcki9Me4hdmO'; // from .vercel/project.json

const DB_URL = process.env.DATABASE_URL;

async function addEnvVar() {
  console.log('Adding DATABASE_URL to Vercel...');
  
  const response = await fetch(`https://api.vercel.com/v6/projects/${PROJECT_ID}/env`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key: 'DATABASE_URL',
      value: DB_URL,
      target: 'production',
      type: 'encrypted'
    })
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

addEnvVar();