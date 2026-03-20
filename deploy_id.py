import subprocess
import sys

try:
    print("Logging into ECR...")
    subprocess.check_call("aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 194442925745.dkr.ecr.ap-southeast-1.amazonaws.com", shell=True)

    print("Building budol-id Docker...")
    subprocess.check_call("docker build -t budol-id:v18 ./budolid-0.1.0", shell=True)

    print("Pushing to ECR...")
    subprocess.check_call("docker tag budol-id:v18 194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-id:v18", shell=True)
    subprocess.check_call("docker push 194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-id:v18", shell=True)

    print("Forcing ECS Deployment Reboot...")
    subprocess.check_call("aws ecs update-service --cluster budol-ecosystem-cluster --service budol-id-service --force-new-deployment --region ap-southeast-1 --no-cli-pager", shell=True)

    print("Success!")
except Exception as e:
    print(f"Error: {e}")
