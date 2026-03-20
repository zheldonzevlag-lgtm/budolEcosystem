"""
update_smtp_via_lambda.py
Purpose: Create a temporary AWS Lambda function inside the VPC to run raw SQL
         against the Production RDS, updating SMTP settings in SystemSettings.
         Cleans up the Lambda after execution.
"""
import subprocess
import sys
import json
import time
import re

REGION = "ap-southeast-1"
FUNCTION_NAME = "budol-temp-smtp-updater"

def run(cmd, **kwargs):
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    return result

def aws(*args):
    return run(["aws"] + list(args) + ["--region", REGION, "--no-cli-pager"])

print("[1] Getting DB URL from Secrets Manager...")
r = aws("secretsmanager", "get-secret-value",
        "--secret-id", "budol/db-url",
        "--query", "SecretString", "--output", "text")
db_url = r.stdout.strip()
match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', db_url)
if not match:
    print("ERROR: Cannot parse DB URL")
    sys.exit(1)
db_user, db_pass, db_host, db_port, db_name = match.groups()
print(f"[1] DB: {db_user}@{db_host}:{db_port}/{db_name}")

print("\n[2] Getting VPC/Subnet/SG info from ECS task...")
r = aws("ecs", "describe-tasks",
        "--cluster", "budol-ecosystem-cluster",
        "--tasks", "f0e6550c1e2f4d34938bdf3b565ceaeb")
task_data = json.loads(r.stdout)
attachments = task_data['tasks'][0].get('attachments', [])
subnet_id = None
sg_id = None
for att in attachments:
    for detail in att.get('details', []):
        if detail['name'] == 'subnetId':
            subnet_id = detail['value']
        if detail['name'] == 'networkInterfaceId':
            # Get security group from ENI
            r2 = run(["aws", "ec2", "describe-network-interfaces",
                       "--network-interface-ids", detail['value'],
                       "--region", REGION, "--no-cli-pager"])
            eni_data = json.loads(r2.stdout)
            groups = eni_data['NetworkInterfaces'][0].get('Groups', [])
            if groups:
                sg_id = groups[0]['GroupId']

print(f"[2] subnet: {subnet_id}, sg: {sg_id}")

print("\n[3] Getting Lambda execution role...")
exec_role = "arn:aws:iam::194442925745:role/BudolLambdaVpcRole"
print(f"[3] Using role: {exec_role}")

# Lambda code as inline zip
LAMBDA_CODE = f"""
import psycopg2
import json

def handler(event, context):
    try:
        conn = psycopg2.connect(
            host='{db_host}',
            port={db_port},
            dbname='{db_name}',
            user='{db_user}',
            password='{db_pass}',
            connect_timeout=15
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Add columns if missing
        cols = [
            ('emailProvider', 'TEXT'),
            ('smtpHost', 'TEXT'),
            ('smtpPort', 'INTEGER'),
            ('smtpUser', 'TEXT'),
            ('smtpPass', 'TEXT'),
            ('smtpFrom', 'TEXT'),
            ('smsProvider', 'TEXT'),
        ]
        for col, dtype in cols:
            cur.execute(f'ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "{{col}}" {{dtype}};')
        
        # Update settings
        cur.execute('''
            UPDATE "SystemSettings" SET
                "emailProvider" = 'GOOGLE',
                "smtpHost"      = 'smtp.gmail.com',
                "smtpPort"      = 587,
                "smtpUser"      = 'reynaldomgalvez@gmail.com',
                "smtpPass"      = 'uljf zbfm ptoz jdhl',
                "smtpFrom"      = 'BudolShap <reynaldomgalvez@gmail.com>',
                "smsProvider"   = 'CONSOLE'
            WHERE id = 'default';
        ''')
        
        cur.execute('SELECT "emailProvider", "smtpUser", "smtpFrom" FROM "SystemSettings" WHERE id = \\'default\\';')
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        return {{'statusCode': 200, 'body': json.dumps({{'emailProvider': row[0], 'smtpUser': row[1], 'smtpFrom': row[2]}})}}
    except Exception as e:
        return {{'statusCode': 500, 'body': str(e)}}
"""

# Write to temp file and zip
import zipfile
import os
import tempfile

tmp_dir = tempfile.mkdtemp()
lambda_file = os.path.join(tmp_dir, 'lambda_function.py')
zip_file = os.path.join(tmp_dir, 'function.zip')

with open(lambda_file, 'w') as f:
    f.write(LAMBDA_CODE)

# Download psycopg2 layer or use existing
print("\n[4] Creating deployment package...")
with zipfile.ZipFile(zip_file, 'w') as zf:
    zf.write(lambda_file, 'lambda_function.py')

print(f"[4] Zip created: {zip_file}")

print("\n[5] Checking for existing Lambda psycopg2 layer...")
r = aws("lambda", "list-layers", "--query", "Layers[?contains(LayerName,'psycopg2')].{Name:LayerName,Arn:LatestMatchingVersion.LayerVersionArn}")
layers = json.loads(r.stdout)
layer_arn = layers[0]['Arn'] if layers else None
print(f"[5] psycopg2 layer: {layer_arn}")

# Create Lambda
print("\n[6] Creating Lambda function...")
create_args = [
    "lambda", "create-function",
    "--function-name", FUNCTION_NAME,
    "--runtime", "python3.12",
    "--handler", "lambda_function.handler",
    "--role", exec_role,
    "--zip-file", f"fileb://{zip_file}",
    "--timeout", "60",
    "--memory-size", "256",
]

if subnet_id and sg_id:
    create_args += ["--vpc-config", f"SubnetIds={subnet_id},SecurityGroupIds={sg_id}"]
if layer_arn:
    create_args += ["--layers", layer_arn]

r = aws(*create_args)
print(r.stdout[:500] if r.returncode == 0 else f"[ERROR] {r.stderr[:300]}")

if r.returncode != 0:
    # Maybe already exists, try update
    print("[6] Trying to update existing Lambda...")
    r = aws("lambda", "update-function-code",
            "--function-name", FUNCTION_NAME,
            "--zip-file", f"fileb://{zip_file}")
    print(r.stdout[:200] if r.returncode == 0 else r.stderr[:200])

print("\n[7] Waiting for Lambda to be Active (polling)...")
for i in range(12):
    time.sleep(5)
    r = aws("lambda", "get-function", "--function-name", FUNCTION_NAME,
            "--query", "Configuration.State", "--output", "text")
    state = r.stdout.strip()
    print(f"   [{i+1}/12] State: {state}")
    if state == "Active":
        print("   Lambda is Active!")
        break
else:
    print("   WARNING: Lambda did not become Active in time")

print("\n[8] Invoking Lambda...")
r = run(["aws", "lambda", "invoke",
         "--function-name", FUNCTION_NAME,
         "--region", REGION,
         "--no-cli-pager",
         "--log-type", "Tail",
         "lambda_result.json"])
print("Invoke output:", r.stdout[:300] if r.returncode == 0 else r.stderr[:300])

try:
    with open("lambda_result.json") as f:
        result = json.load(f)
    print(f"\n[8] Lambda result: {result}")
except:
    print("[8] Could not read result file")

print("\n[9] Cleaning up Lambda...")
aws("lambda", "delete-function", "--function-name", FUNCTION_NAME)
print("[9] Lambda deleted.")

import shutil
shutil.rmtree(tmp_dir)
print("\n[DONE]")
