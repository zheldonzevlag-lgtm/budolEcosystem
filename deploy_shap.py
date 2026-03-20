import subprocess
import sys

try:
    print("Building budolshap Docker...")
    subprocess.check_call("docker build -t budolshap:v18 ./budolshap-0.1.0", shell=True)

    print("Pushing to ECR...")
    subprocess.check_call("docker tag budolshap:v18 194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v18", shell=True)
    subprocess.check_call("docker push 194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v18", shell=True)

    print("Forcing ECS Deployment Reboot...")
    subprocess.check_call("aws ecs update-service --cluster budol-ecosystem-cluster --service budol-shap-service --force-new-deployment --region ap-southeast-1 --no-cli-pager", shell=True)

    print("Success!")
except Exception as e:
    print(f"Error: {e}")
