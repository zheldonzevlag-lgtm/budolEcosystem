import subprocess
import json

try:
    print("Fetching AWS ECS Task Definition...")
    out = subprocess.check_output("aws ecs describe-task-definition --task-definition budol-shap-task:10 --region ap-southeast-1", shell=True)
    data = json.loads(out)
    secrets = data['taskDefinition']['containerDefinitions'][0].get('secrets', [])
    for s in secrets:
        print(f"Secret Name: {s['name']}, ValueFrom: {s['valueFrom']}")
except Exception as err:
    print("Error:", err)
