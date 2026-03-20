"""
add_smtp_to_task_def.py
Purpose: Register a new ECS Task Definition revision for budol-shap-task
         that includes SMTP environment variables so the app can send emails
         even without DB-stored SMTP config.
         
         The app's settings.js checks process.env.OVERRIDE_EMAIL_PROVIDER,
         and email.js falls back to process.env.SMTP_USER and SMTP_PASS.
         This solution adds those env vars so emails work immediately.
"""
import subprocess
import sys
import json

REGION = "ap-southeast-1"
TASK_FAMILY = "budol-shap-task"

def aws(*args):
    result = subprocess.run(
        ["aws"] + list(args) + ["--region", REGION, "--no-cli-pager"],
        capture_output=True, text=True
    )
    return result

print("[1] Fetching current task definition...")
r = aws("ecs", "describe-task-definition", "--task-definition", TASK_FAMILY,
        "--query", "taskDefinition")
if r.returncode != 0:
    print("ERROR:", r.stderr)
    sys.exit(1)

td = json.loads(r.stdout)
print(f"[1] Current revision: {td['revision']}")

# Get the container definition
container = td['containerDefinitions'][0]

# Current env vars
current_env = {e['name']: e['value'] for e in container.get('environment', [])}
print(f"[1] Current env vars: {list(current_env.keys())}")

# Add SMTP env vars
smtp_env = {
    "SMTP_HOST":            "smtp.gmail.com",
    "SMTP_PORT":            "587",
    "SMTP_USER":            "reynaldomgalvez@gmail.com",
    "SMTP_PASS":            "uljf zbfm ptoz jdhl",
    "SMTP_FROM":            "BudolShap <reynaldomgalvez@gmail.com>",
    "OVERRIDE_EMAIL_PROVIDER": "GOOGLE",   # Forces email.js to use GOOGLE provider
}

current_env.update(smtp_env)
print(f"\n[2] Adding SMTP env vars: {list(smtp_env.keys())}")

# Rebuild env list
new_env = [{"name": k, "value": v} for k, v in current_env.items()]
container['environment'] = new_env

# Build registration payload (only allowed fields)
allowed_keys = [
    'family', 'taskRoleArn', 'executionRoleArn', 'networkMode',
    'containerDefinitions', 'volumes', 'placementConstraints',
    'requiresCompatibilities', 'cpu', 'memory', 'tags',
    'pidMode', 'ipcMode', 'proxyConfiguration', 'inferenceAccelerators',
    'ephemeralStorage', 'runtimePlatform'
]
payload = {k: td[k] for k in allowed_keys if k in td}
payload['containerDefinitions'] = [container]

print("\n[3] Registering new task definition revision...")
r = aws("ecs", "register-task-definition",
        "--cli-input-json", json.dumps(payload))
if r.returncode != 0:
    print("ERROR:", r.stderr)
    sys.exit(1)

new_td = json.loads(r.stdout)
new_revision = new_td['taskDefinition']['revision']
new_arn = new_td['taskDefinition']['taskDefinitionArn']
print(f"[3] New task definition: {TASK_FAMILY}:{new_revision}")
print(f"[3] ARN: {new_arn}")

print("\n[4] Updating ECS service to use new task definition...")
r = aws("ecs", "update-service",
        "--cluster", "budol-ecosystem-cluster",
        "--service", "budol-shap-service",
        "--task-definition", f"{TASK_FAMILY}:{new_revision}",
        "--force-new-deployment")
if r.returncode != 0:
    print("ERROR:", r.stderr[:300])
    sys.exit(1)

print(f"[4] Service updated! Deploying {TASK_FAMILY}:{new_revision}...")
print("\n[DONE] ECS is now deploying the container with SMTP env vars baked in.")
print("       Wait 2-3 minutes then try logging in — OTP will be emailed directly!")
print(f"\n       New task def: {TASK_FAMILY}:{new_revision}")
