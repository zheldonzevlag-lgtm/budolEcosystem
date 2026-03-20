"""
get_otp.py
Purpose: Read VerificationCode entries from Production RDS database
         so we can see current OTP codes without needing email.
         Also reads current SystemSettings to diagnose SMTP config.
"""

import subprocess
import json
import sys

# Get DB URL from AWS Secrets Manager
print("[1] Fetching DB URL from Secrets Manager...")
result = subprocess.run(
    ["aws", "secretsmanager", "get-secret-value",
     "--secret-id", "budol/db-url-NxLd8V",
     "--region", "ap-southeast-1",
     "--query", "SecretString",
     "--output", "text"],
    capture_output=True, text=True
)

if result.returncode != 0:
    print("ERROR fetching secret:", result.stderr)
    sys.exit(1)

db_url = result.stdout.strip()
print(f"[1] DB URL retrieved (hidden): {db_url[:30]}...")

# Parse the DATABASE_URL postgresql://user:pass@host:port/dbname
# format: postgresql://user:password@host:port/database?schema=...
import re
match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', db_url)
if not match:
    print("ERROR: Could not parse DB URL:", db_url[:40])
    sys.exit(1)

user, password, host, port, dbname = match.groups()
print(f"[1] Connecting to: {user}@{host}:{port}/{dbname}")

# Connect using psycopg2
try:
    import psycopg2
    print("[2] psycopg2 available")
except ImportError:
    print("[2] psycopg2 not installed. Trying psycopg2-binary install...")
    subprocess.run([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2

print("[2] Connecting to Production RDS...")
try:
    conn = psycopg2.connect(
        host=host,
        port=int(port),
        dbname=dbname,
        user=user,
        password=password,
        connect_timeout=15
    )
    cur = conn.cursor()

    # Get all VerificationCode records
    print("\n=== CURRENT OTP RECORDS ===")
    cur.execute('SELECT identifier, "expiresAt", "createdAt", type FROM "VerificationCode" ORDER BY "createdAt" DESC LIMIT 10;')
    rows = cur.fetchall()
    if rows:
        for row in rows:
            print(f"  identifier: {row[0]}")
            print(f"  expiresAt:  {row[1]}")
            print(f"  createdAt:  {row[2]}")
            print(f"  type:       {row[3]}")
            print("  ---")
    else:
        print("  (no OTP records found)")

    # Get SMTP Settings
    print("\n=== SYSTEM SETTINGS (EMAIL) ===")
    cur.execute('''SELECT "emailProvider", "smtpHost", "smtpPort", "smtpUser", "smtpFrom",
                          "brevoApiKey", "gmassApiKey", "smsProvider"
                   FROM "SystemSettings" WHERE id = \'default\';''')
    row = cur.fetchone()
    if row:
        print(f"  emailProvider: {row[0]}")
        print(f"  smtpHost:      {row[1]}")
        print(f"  smtpPort:      {row[2]}")
        print(f"  smtpUser:      {row[3]}")
        print(f"  smtpFrom:      {row[4]}")
        print(f"  brevoApiKey:   {'SET' if row[5] else 'NOT SET'}")
        print(f"  gmassApiKey:   {'SET' if row[6] else 'NOT SET'}")
        print(f"  smsProvider:   {row[7]}")
    else:
        print("  (no system settings found)")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

print("\n[DONE]")
