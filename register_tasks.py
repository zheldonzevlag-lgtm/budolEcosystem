import json
import subprocess
import sys

def update_task_def(file_path, family):
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Extract the task definition part
    task_def = data['taskDefinition']
    
    # Remove keys that shouldn't be in register-task-definition
    for key in ['taskDefinitionArn', 'revision', 'status', 'requiresAttributes', 'compatibilities', 'registeredAt', 'registeredBy']:
        task_def.pop(key, None)
    
    # Add environment variables to disable Redis and telemetry
    container_def = task_def['containerDefinitions'][0]
    env = container_def.get('environment', [])
    
    # Helper to update or add env var
    def set_env(name, value):
        for item in env:
            if item['name'] == name:
                item['value'] = value
                return
        env.append({'name': name, 'value': value})

    set_env('REDIS_URL', 'redis://127.0.0.1:6379')
    set_env('NEXT_TELEMETRY_DISABLED', '1')
    
    # Update HOSTNAME for Next.js standalone if it's budolshap
    if family == 'budol-shap-task':
        set_env('HOSTNAME', '0.0.0.0')

    container_def['environment'] = env
    
    # Update secrets to use full ARNs
    secrets = container_def.get('secrets', [])
    for secret in secrets:
        if secret['name'] == 'DATABASE_URL':
            secret['valueFrom'] = 'arn:aws:secretsmanager:ap-southeast-1:194442925745:secret:budol/db-url-NxLd8V'
        elif secret['name'] == 'JWT_SECRET':
            secret['valueFrom'] = 'arn:aws:secretsmanager:ap-southeast-1:194442925745:secret:budol/jwt-secret-RlaVaW'
    container_def['secrets'] = secrets

    # Save the cleaned task definition
    new_file = f"new_{file_path}"
    with open(new_file, 'w') as f:
        json.dump(task_def, f, indent=4)
    
    print(f"Created {new_file}")
    
    # Register the new version
    cmd = f"aws ecs register-task-definition --cli-input-json file://{new_file}"
    print(f"Executing: {cmd}")
    subprocess.run(f"cmd.exe /c \"set AWS_PAGER= & {cmd}\"", shell=True)

    # Update Service
    service_name = family.replace('-task', '-service')
    if family == 'budolpay-gateway-task':
        service_name = 'budolpay-gateway-service'
    
    update_cmd = f"aws ecs update-service --cluster budol-ecosystem-cluster --service {service_name} --task-definition {family}"
    print(f"Executing: {update_cmd}")
    subprocess.run(f"cmd.exe /c \"set AWS_PAGER= & {update_cmd}\"", shell=True)

if __name__ == "__main__":
    update_task_def('shap_task_def.json', 'budol-shap-task')
    update_task_def('id_task_def.json', 'budol-id-task')
    update_task_def('pay_task_def.json', 'budolpay-gateway-task')
