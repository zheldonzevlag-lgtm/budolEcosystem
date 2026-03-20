import subprocess

try:
    print("Force rebuilding budolshap Docker completely from scratch (--no-cache)...")
    subprocess.check_call("docker build --no-cache -t budolshap:v18 ./budolshap-0.1.0", shell=True)

    print("Pushing freshly generated image to ECR...")
    subprocess.check_call("docker tag budolshap:v18 194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v18", shell=True)
    subprocess.check_call("docker push 194442925745.dkr.ecr.ap-southeast-1.amazonaws.com/budol-shap:v18", shell=True)

    print("Forcing ECS Deployment Reboot to kill the old corrupted tasks...")
    subprocess.check_call("aws ecs update-service --cluster budol-ecosystem-cluster --service budol-shap-service --force-new-deployment --region ap-southeast-1 --no-cli-pager", shell=True)

    print("Success!")
except Exception as e:
    print(f"Error: {e}")
