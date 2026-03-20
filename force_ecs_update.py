import subprocess
import json
import os

services = [
    {"family": "budol-auth-task", "service_name": "budol-auth-service", "container": "budol-auth-service", "img": "194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-auth-service:v18"},
    {"family": "budol-id-task", "service_name": "budol-id-service", "container": "budol-id-service", "img": "194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-id:v18"},
    {"family": "budol-shap-task", "service_name": "budol-shap-service", "container": "budol-shap-service", "img": "194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v18"},
    {"family": "budolpay-gateway-task", "service_name": "budolpay-gateway-service", "container": "budolpay-gateway-service", "img": "194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budolpay-gateway:v18"}
]

cluster = "budol-ecosystem-cluster"
region = "ap-southeast-1"

try:
    for s in services:
        print(f"Processing {s['service_name']}...")
        
        # 1. Get current active task definition from the service
        cmd_get_service = f'aws ecs describe-services --cluster {cluster} --services {s["service_name"]} --region {region} --no-cli-pager --output json'
        res = subprocess.check_output(cmd_get_service, shell=True)
        current_task_arn = json.loads(res.decode('utf-8'))['services'][0]['taskDefinition']
        print(f"Current task def: {current_task_arn}")

        # 2. Get task definition JSON
        cmd_get_task = f'aws ecs describe-task-definition --task-definition {current_task_arn} --region {region} --no-cli-pager --output json'
        task_res = subprocess.check_output(cmd_get_task, shell=True)
        task_def_full = json.loads(task_res.decode('utf-8'))['taskDefinition']
        
        # 3. Clean task definition
        allowed_fields = [
            'family', 'taskRoleArn', 'executionRoleArn', 'networkMode', 
            'containerDefinitions', 'volumes', 'placementConstraints', 
            'requiresCompatibilities', 'cpu', 'memory', 'runtimePlatform',
            'ipcMode', 'pidMode', 'proxyConfiguration', 'inferenceAccelerators',
            'ephemeralStorage'
        ]
        new_task_def = {k: v for k, v in task_def_full.items() if k in allowed_fields}
        new_task_def['containerDefinitions'][0]['image'] = s['img']
        
        with open('tmp_task_v18.json', 'w') as f:
            json.dump(new_task_def, f)
        
        # 4. Register new task definition
        cmd_register = f'aws ecs register-task-definition --cli-input-json file://tmp_task_v18.json --region {region} --no-cli-pager --output json'
        reg_res = subprocess.check_output(cmd_register, shell=True)
        new_arn = json.loads(reg_res.decode('utf-8'))['taskDefinition']['taskDefinitionArn']
        print(f"Registered new ARN: {new_arn}")
        
        # 5. Update service
        cmd_update = f'aws ecs update-service --cluster {cluster} --service {s["service_name"]} --task-definition {new_arn} --force-new-deployment --region {region} --no-cli-pager'
        subprocess.check_call(cmd_update, shell=True)
        print(f"Updated service {s['service_name']} successfully.\n")
except Exception as e:
    print(f"Error occurred: {e}")
