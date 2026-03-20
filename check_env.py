import subprocess
import json

try:
    print("Fetching AWS ECS Task Definition...")
    out = subprocess.check_output("aws ecs describe-task-definition --task-definition budol-shap-task:10 --region ap-southeast-1", shell=True)
    data = json.loads(out)
    env = data['taskDefinition']['containerDefinitions'][0].get('environment', [])
    for e in env:
        print(f"{e['name']}: {e['value']}")
except Exception as err:
    print("Error:", err)
