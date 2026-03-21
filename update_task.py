import json

with open('budol-shap-task-11-utf8.json', encoding='utf-8-sig') as f:
    task_def = json.load(f)['taskDefinition']

for k in ['taskDefinitionArn', 'revision', 'status', 'requiresAttributes', 'compatibilities', 'registeredAt', 'registeredBy']:
    if k in task_def: del task_def[k]

container = task_def['containerDefinitions'][0]
container['image'] = '194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v29'

container['secrets'] = [
    {
        "name": "DATABASE_URL",
        "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:194442925745:secret:budol/db-url-NxLd8V"
    },
    {
        "name": "JWT_SECRET",
        "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:194442925745:secret:budol/jwt-secret-RlaVaW"
    }
]

vars_to_add = {
    "BUDOLID_DATABASE_URL": "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolid",
    "BUDOLACCOUNTING_DATABASE_URL": "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolaccounting",
    "NEXT_PUBLIC_SSO_URL": "https://budolid.duckdns.org",
    "BUDOLACCOUNTING_URL": "https://budolaccounting.duckdns.org",
    "NEXT_PUBLIC_SOCKET_URL": "https://budolws.duckdns.org:4000",
    "NEXT_PUBLIC_CURRENCY_SYMBOL": "₱",
    "SMTP_PASS": "xvcqalwdopvouegf",
    "SMTP_FROM": "BudolShap <reynaldomgalvez@gmail.com>",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "reynaldomgalvez@gmail.com",
    "OVERRIDE_EMAIL_PROVIDER": "CONSOLE",
    "OVERRIDE_SMS_PROVIDER": "CONSOLE",
    "HOSTNAME": "0.0.0.0",
    "PORT": "3000",
    "LALAMOVE_CLIENT_ID": "pk_test_194aaadd2c47bb2aba81116193f223a8",
    "LALAMOVE_CLIENT_SECRET": "sk_test_v5EzWm+k5YscrCQbdqRrS9i2PBpmMwrv5sAMK5Ah4ieJ69Ytd2nCK4zABD/cp7O6",
    "LALAMOVE_ENV": "sandbox",
    "LALAMOVE_WEBHOOK_SECRET": "lalamove_webhook_secret_budolshap_2025",
    "ENABLE_LALAMOVE": "true"
}

env_dict = { v['name']: v['value'] for v in container['environment'] }
env_dict.pop("HOSTNAME", None)
env_dict.update(vars_to_add)
container['environment'] = [{"name": k, "value": v} for k, v in env_dict.items()]

with open('budol-shap-task-22.json', 'w', encoding='utf-8') as f:
    json.dump(task_def, f, indent=4, ensure_ascii=False)

print("Revision 22 (v26 + Guaranteed Console) generated.")
