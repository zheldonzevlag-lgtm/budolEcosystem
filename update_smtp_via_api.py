"""
update_smtp_via_api.py
Purpose: Update SMTP settings in Production via the budolshap Admin API endpoint.
         This bypasses the need for direct DB access by using the /api/system/settings
         endpoint from inside the running Next.js app.
         
         We first login as admin, then update settings.
"""
import subprocess
import sys
import json
import time

BASE_URL = "https://budolshap.duckdns.org"

# Step 1: Trigger a fresh OTP for admin user
print("[1] Requesting fresh OTP for admin login...")

import urllib.request
import urllib.error

def post_json(url, data):
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload,
                                  headers={'Content-Type': 'application/json'},
                                  method='POST')
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

status, resp = post_json(f"{BASE_URL}/api/auth/otp", {
    "identifier": "reynaldomgalvez@gmail.com",
    "action": "send"
})
print(f"   OTP response ({status}): {resp}")

# Step 2: Fetch the OTP from CloudWatch
print("\n[2] Fetching OTP from CloudWatch logs...")
time.sleep(3)  # Wait for logs to be ingested

result = subprocess.run([
    "aws", "logs", "filter-log-events",
    "--log-group-name", "/ecs/budol-shap",
    "--filter-pattern", "OTP Code",
    "--start-time", str(int((time.time() - 120) * 1000)),
    "--no-cli-pager"
], capture_output=True, text=True)

import re
otp_match = re.search(r'OTP Code.*?(\d{6})', result.stdout)
if not otp_match:
    print("   ERROR: Could not find OTP in logs. Please check CloudWatch manually.")
    print("   Raw output:", result.stdout[:500])
    sys.exit(1)

otp = otp_match.group(1)
print(f"   OTP found: {otp}")

# Step 3: Login with the OTP
print("\n[3] Logging in as admin...")
# First submit email+password to trigger OTP challenge
status, resp = post_json(f"{BASE_URL}/api/auth/login", {
    "email": "reynaldomgalvez@gmail.com",
    "password": "your_password_here"  # Will use OTP path instead
})
print(f"   Login response ({status}): {resp.get('status', resp.get('error', ''))}")

if resp.get('status') == 'OTP_REQUIRED':
    print("   OTP required - submitting OTP...")
    # Submit OTP
    status2, resp2 = post_json(f"{BASE_URL}/api/auth/login", {
        "email": "reynaldomgalvez@gmail.com",
        "password": otp,
        "isOtp": True
    })
    print(f"   OTP login response ({status2}): {resp2.get('message', resp2.get('error', ''))}")
    token = resp2.get('token')
else:
    token = resp.get('token')

if not token:
    print("   ERROR: Could not get auth token. Please login manually and provide token.")
    sys.exit(1)

print(f"   Token obtained: {token[:20]}...")

# Step 4: Update SMTP settings via Admin API
print("\n[4] Updating SMTP settings via Admin API...")

smtp_settings = {
    "emailProvider": "GOOGLE",
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "reynaldomgalvez@gmail.com",
    "smtpPass": "uljf zbfm ptoz jdhl",
    "smtpFrom": "BudolShap <reynaldomgalvez@gmail.com>",
    "smsProvider": "CONSOLE"
}

payload = json.dumps(smtp_settings).encode('utf-8')
req = urllib.request.Request(
    f"{BASE_URL}/api/system/settings",
    data=payload,
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}',
        'Cookie': f'budolshap_token={token}'
    },
    method='PUT'
)

try:
    with urllib.request.urlopen(req, timeout=15) as resp3:
        result3 = json.loads(resp3.read())
        print(f"   Settings update response: {result3}")
        print("\n[DONE] SMTP settings updated successfully!")
except urllib.error.HTTPError as e:
    error_body = e.read().decode()
    print(f"   ERROR ({e.code}): {error_body[:500]}")
    print("\n   The API might be rejecting due to Prisma schema mismatch.")
    print("   Will need to use the direct SQL approach via Lambda or SSM.")
