import json
import sys

with open('task_def_clean.json', 'r') as f:
    task_def = json.load(f)

# Fields allowed in register-task-definition
allowed_fields = [
    'family', 'taskRoleArn', 'executionRoleArn', 'networkMode', 
    'containerDefinitions', 'volumes', 'placementConstraints', 
    'requiresCompatibilities', 'cpu', 'memory', 'runtimePlatform',
    'ipcMode', 'pidMode', 'proxyConfiguration', 'inferenceAccelerators',
    'ephemeralStorage'
]

new_task_def = {k: v for k, v in task_def.items() if k in allowed_fields}

# Update image
for container in new_task_def['containerDefinitions']:
    if 'budol-shap' in container['image']:
        container['image'] = '194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v17'

with open('task_def_v17_final.json', 'w') as f:
    json.dump(new_task_def, f, indent=4)
