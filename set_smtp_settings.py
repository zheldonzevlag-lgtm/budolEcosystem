"""
set_smtp_settings.py
Purpose: Directly update SystemSettings in Production RDS via raw SQL,
         bypassing the Prisma client schema mismatch.
         Sets Gmail SMTP so OTPs are emailed to users.
"""
import subprocess
import sys
import re

print("[1] Fetching DB URL from Secrets Manager...")
result = subprocess.run(
    ["aws", "secretsmanager", "get-secret-value",
     "--secret-id", "budol/db-url",
     "--region", "ap-southeast-1",
     "--query", "SecretString",
     "--output", "text"],
    capture_output=True, text=True
)
if result.returncode != 0:
    print("ERROR:", result.stderr)
    sys.exit(1)

db_url = result.stdout.strip()
match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', db_url)
if not match:
    print("ERROR: Could not parse DB URL")
    sys.exit(1)

user, password, host, port, dbname = match.groups()
print(f"[1] Connecting to: {user}@{host}:{port}/{dbname}")

try:
    import psycopg2
except ImportError:
    print("[1] Installing psycopg2-binary...")
    subprocess.run([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2

print("[2] Connecting to RDS...")
conn = psycopg2.connect(host=host, port=int(port), dbname=dbname,
                        user=user, password=password, connect_timeout=15)
conn.autocommit = True
cur = conn.cursor()

# --- First check what columns actually exist ---
print("\n[3] Checking existing SystemSettings columns...")
cur.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'SystemSettings'
    ORDER BY column_name;
""")
columns = [row[0] for row in cur.fetchall()]
print(f"    Columns found: {columns}")

# --- Check which email columns exist ---
email_cols = ['emailProvider', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom', 'smsProvider']
existing = [c for c in email_cols if c in columns]
missing  = [c for c in email_cols if c not in columns]
print(f"    Email cols present: {existing}")
print(f"    Email cols MISSING: {missing}")

# --- Add missing columns ---
for col in missing:
    print(f"\n[4] Adding missing column: {col}")
    if col == 'smtpPort':
        cur.execute(f'ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "{col}" INTEGER DEFAULT 587;')
    else:
        cur.execute(f'ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "{col}" TEXT;')
    print(f"    Added: {col}")

# --- Now update with SMTP credentials ---
print("\n[5] Updating SMTP settings...")
cur.execute("""
    UPDATE "SystemSettings" SET
        "emailProvider" = 'GOOGLE',
        "smtpHost"      = 'smtp.gmail.com',
        "smtpPort"      = 587,
        "smtpUser"      = 'reynaldomgalvez@gmail.com',
        "smtpPass"      = 'uljf zbfm ptoz jdhl',
        "smtpFrom"      = 'BudolShap <reynaldomgalvez@gmail.com>',
        "smsProvider"   = 'CONSOLE'
    WHERE id = 'default';
""")
print(f"    Rows updated: {cur.rowcount}")

# --- Verify ---
print("\n[6] Verifying update...")
cur.execute("""
    SELECT "emailProvider", "smtpHost", "smtpPort", "smtpUser", "smtpFrom", "smsProvider"
    FROM "SystemSettings" WHERE id = 'default';
""")
row = cur.fetchone()
print(f"    emailProvider : {row[0]}")
print(f"    smtpHost      : {row[1]}")
print(f"    smtpPort      : {row[2]}")
print(f"    smtpUser      : {row[3]}")
print(f"    smtpFrom      : {row[4]}")
print(f"    smsProvider   : {row[5]}")

cur.close()
conn.close()
print("\n[DONE] SMTP settings successfully updated in Production DB!")
print("Restart or redeploy budol-shap-service to clear the settings cache.")
