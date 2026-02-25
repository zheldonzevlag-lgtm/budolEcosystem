# Real-time Lalamove Updates Setup

## Problem
Lalamove webhooks cannot reach localhost, so you need a public URL.

## Solution: Use ngrok

### Step 1: Install ngrok
1. Download from: https://ngrok.com/download
2. Extract and place `ngrok.exe` somewhere accessible
3. Sign up for a free account at https://ngrok.com

### Step 2: Start ngrok tunnel
```bash
ngrok http 3000
```

This will give you a public URL like: `https://abc123.ngrok.io`

### Step 3: Update Lalamove Webhook URL
1. Go to Lalamove Partner Portal
2. Navigate to Webhooks settings
3. Set webhook URL to: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/lalamove`
4. Save the configuration

### Step 4: Test
1. Place a new order
2. When driver is assigned, Lalamove will send webhook to your ngrok URL
3. ngrok forwards it to your localhost:3000
4. Your app receives real-time updates automatically!

## Alternative: Deploy to Production

If you want permanent real-time updates:
1. Deploy to Vercel (use `/deploy-vercel` workflow)
2. Update Lalamove webhook URL to your production URL
3. All webhooks will work automatically

## Temporary Solution: Auto-Polling

We can add automatic background polling every 30 seconds to check for updates:
- No manual clicking needed
- Works on localhost
- Not true "real-time" but close enough
- Updates automatically when driver is assigned

Which option would you prefer?
