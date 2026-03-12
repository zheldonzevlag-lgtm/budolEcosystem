import json
import os

input_file = 'task_def_fixed.json'
output_file = 'task_def_v17_final.json'

with open(input_file, 'r', encoding='utf-8-sig') as f:
    task_def = json.load(f)

allowed_fields = [
    'family', 'taskRoleArn', 'executionRoleArn', 'networkMode', 
    'containerDefinitions', 'volumes', 'placementConstraints', 
    'requiresCompatibilities', 'cpu', 'memory', 'runtimePlatform'
]

new_task_def = {k: v for k, v in task_def.items() if k in allowed_fields}

for container in new_task_def['containerDefinitions']:
    if 'budol-shap' in container['image']:
        container['image'] = '194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v17'

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(new_task_def, f, indent=4)
