import boto3
import json
import sys

filename = sys.argv[1] if len(sys.argv) > 1 else "budol-shap-task-18-lalamove.json"
print(f"Loading task definition from {filename}...")

with open(filename, "r", encoding="utf-8") as f:
    task_def = json.load(f)

ecs = boto3.client('ecs', region_name='ap-southeast-1')

# Build registration params, only include optional keys when they have valid values
params = {
    'family': task_def['family'],
    'executionRoleArn': task_def.get('executionRoleArn'),
    'networkMode': task_def.get('networkMode'),
    'containerDefinitions': task_def['containerDefinitions'],
    'volumes': task_def.get('volumes', []),
    'placementConstraints': task_def.get('placementConstraints', []),
    'requiresCompatibilities': task_def.get('requiresCompatibilities', []),
    'cpu': task_def.get('cpu'),
    'memory': task_def.get('memory'),
}

# Only include taskRoleArn if it's not None
if task_def.get('taskRoleArn'):
    params['taskRoleArn'] = task_def['taskRoleArn']

# Only include ephemeralStorage if sizeInGiB is set
ephemeral = task_def.get('ephemeralStorage', {})
if ephemeral and ephemeral.get('sizeInGiB'):
    params['ephemeralStorage'] = ephemeral

print("Registering task definition...")
response = ecs.register_task_definition(**params)

new_arn = response['taskDefinition']['taskDefinitionArn']
print(f"Registered new ARN: {new_arn}")

print("Updating ECS service...")
ecs.update_service(
    cluster='budol-ecosystem-cluster',
    service='budol-shap-service',
    taskDefinition=new_arn,
    forceNewDeployment=True
)
print("ECS service updated successfully. Deployment triggered.")

