import json

with open('shap_task_def.json', 'r', encoding='utf-16') as f:
    data = json.load(f)

# Update image
data['containerDefinitions'][0]['image'] = "194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v15"

# Clean up fields not allowed in register-task-definition
allowed_keys = [
    'family', 'taskRoleArn', 'executionRoleArn', 'networkMode', 
    'containerDefinitions', 'volumes', 'placementConstraints', 
    'requiresCompatibilities', 'cpu', 'memory', 'proxyConfiguration', 
    'inferenceAccelerators', 'runtimePlatform', 'ipcMode', 'pidMode', 
    'ephemeralStorage'
]

new_def = {k: v for k, v in data.items() if k in allowed_keys}

with open('new_shap_task_def.json', 'w') as f:
    json.dump(new_def, f, indent=4)
