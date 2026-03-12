import json
import os

def clean_task_def():
    input_file = 'task_def_clean.json'
    output_file = 'task_def_v17_final.json'
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found")
        return

    # Try to read with utf-16-le first (PS default for >) or utf-8
    try:
        with open(input_file, 'r', encoding='utf-16-le') as f:
            content = f.read()
            if not content.strip().startswith('{'):
                raise ValueError("Not JSON")
            task_def = json.loads(content)
    except:
        with open(input_file, 'r', encoding='utf-8') as f:
            task_def = json.load(f)

    allowed_fields = [
        'family', 'taskRoleArn', 'executionRoleArn', 'networkMode', 
        'containerDefinitions', 'volumes', 'placementConstraints', 
        'requiresCompatibilities', 'cpu', 'memory', 'runtimePlatform',
        'ipcMode', 'pidMode', 'proxyConfiguration', 'inferenceAccelerators',
        'ephemeralStorage'
    ]

    new_task_def = {k: v for k, v in task_def.items() if k in allowed_fields}

    for container in new_task_def['containerDefinitions']:
        if 'budol-shap' in container['image']:
            container['image'] = '194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v17'

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_task_def, f, indent=4)
    print(f"Created {output_file}")

if __name__ == "__main__":
    clean_task_def()
