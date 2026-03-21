
import subprocess
import sys
import re
import psycopg2

def main():
    print("[1] Fetching DB URL...")
    result = subprocess.run(
        ["aws", "secretsmanager", "get-secret-value", "--secret-id", "budol/db-url", "--region", "ap-southeast-1", "--query", "SecretString", "--output", "text"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print("ERROR:", result.stderr)
        return

    db_url = result.stdout.strip()
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', db_url)
    if not match:
        print("ERROR parsing URL")
        return

    user, password, host, port, dbname = match.groups()
    print(f"[2] Connecting to {host}...")

    try:
        conn = psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password)
        cur = conn.cursor()

        # Update SystemSettings
        # We use raw SQL to ensure we hit the custom columns that prisma is missing.
        print("[3] Updating SystemSettings...")
        cur.execute('''
            UPDATE "SystemSettings"
            SET "emailProvider" = %s,
                "smtpHost" = %s,
                "smtpPort" = %s,
                "smtpUser" = %s,
                "smtpPass" = %s,
                "smtpFrom" = %s,
                "smsProvider" = %s
            WHERE id = 'default';
        ''', ("GOOGLE", "smtp.gmail.com", 587, "reynaldomgalvez@gmail.com", "uljf zbfm ptoz jdhl", "reynaldomgalvez@gmail.com", "CONSOLE"))
        
        conn.commit()
        print("[4] Settings UPDATED successfully!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    main()
