import boto3
import time
import base64

ssm = boto3.client('ssm', region_name='ap-southeast-1')
db_url = "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolshap_1db"

sql = """
ALTER TABLE "SystemSettings" ALTER COLUMN "selectedMarketingAds" TYPE text[] USING ARRAY[]::text[];
ALTER TABLE "SystemSettings" ALTER COLUMN "selectedMarketingAds" SET DEFAULT '{}';
ALTER TABLE "SystemSettings" ALTER COLUMN "marketingAdConfigs" TYPE jsonb USING '{}'::jsonb;
DELETE FROM "SystemSettings";
"""

b64_sql = base64.b64encode(sql.encode('utf-8')).decode('utf-8')

commands = [
    f"echo '{b64_sql}' | base64 -d > /tmp/fix.sql",
    f"psql -d '{db_url}' -f /tmp/fix.sql"
]

print("Sending SSM Command via budol-mgmt-host...", commands)
response = ssm.send_command(
    InstanceIds=['i-0335b8c303baaaee0'],
    DocumentName='AWS-RunShellScript',
    Parameters={'commands': commands}
)

command_id = response['Command']['CommandId']
print(f"Command ID: {command_id}")

while True:
    try:
        time.sleep(5)
        out = ssm.get_command_invocation(CommandId=command_id, InstanceId='i-0335b8c303baaaee0')
        status = out.get('Status')
        if not status or status in ['Pending', 'InProgress']:
            continue
            
        print(f"Final DB Update Status: {status}")
        print("Output:\n", out.get('StandardOutputContent'))
        print("Error:\n", out.get('StandardErrorContent'))
        break
    except Exception as e:
        print("Waiting for response...", e)
