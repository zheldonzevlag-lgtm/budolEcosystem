import boto3
import time

cluster_name = "budol-ecosystem-cluster"
task_role_arn = "arn:aws:iam::194442925745:role/BudolECSExecutionRole"
execution_role_arn = "arn:aws:iam::194442925745:role/BudolECSExecutionRole"

subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
security_groups = ["sg-0ce5df1ba5bd90a2c"]
db_url = "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolid"
s3_backup_path = "s3://budol-restore-staging-v14/backup/budolshap_1db.backup"

ecs_client = boto3.client('ecs', region_name='ap-southeast-1')
logs_client = boto3.client('logs', region_name='ap-southeast-1')

def register_restore_task():
    # We use a postgres:16 image (debian based). 
    # It has pg_restore but not aws-cli. We install awscli via apt-get, download the dump, and run pg_restore.
    # Note: For pg_restore, we can use --clean to drop existing objects before restoring,
    # or just let it restore over. We'll add --clean --if-exists.
    presigned_url = "https://budol-restore-staging-v14.s3.ap-southeast-1.amazonaws.com/backup/budolshap_1db.backup?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS2RNTS2Y3JWVUMNV%2F20260310%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20260310T120744Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=261b48a4fcfbf7d00f97964f905099b91593cf0056fe868b8436f2230c7caa5f"
    command = [
        "bash", "-c",
        f"apt-get update && apt-get install -y curl && curl -o /tmp/db.backup '{presigned_url}' && pg_restore -d '{db_url}' --clean --if-exists --no-owner --no-privileges /tmp/db.backup"
    ]

    response = ecs_client.register_task_definition(
        family="budolshap-db-restore-task",
        networkMode="awsvpc",
        requiresCompatibilities=["FARGATE"],
        cpu="1024",
        memory="2048",
        taskRoleArn=task_role_arn,
        executionRoleArn=execution_role_arn,
        containerDefinitions=[
            {
                "name": "pg-restore-container",
                "image": "postgres:17",
                "essential": True,
                "command": command,
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": "/ecs/budolshap-db-restore",
                        "awslogs-region": "ap-southeast-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }
        ]
    )
    return response['taskDefinition']['taskDefinitionArn']

def create_log_group():
    try:
        logs_client.create_log_group(logGroupName="/ecs/budolshap-db-restore")
    except logs_client.exceptions.ResourceAlreadyExistsException:
        pass

def run_task(task_def_arn):
    response = ecs_client.run_task(
        cluster=cluster_name,
        taskDefinition=task_def_arn,
        launchType="FARGATE",
        networkConfiguration={
            "awsvpcConfiguration": {
                "subnets": subnets,
                "securityGroups": security_groups,
                "assignPublicIp": "ENABLED"
            }
        }
    )
    task_arn = response['tasks'][0]['taskArn']
    print(f"Task started: {task_arn}")
    return task_arn

def main():
    print("Creating CloudWatch log group...")
    create_log_group()
    
    print("Registering Task Definition...")
    task_def_arn = register_restore_task()
    print(f"Registered Task Def: {task_def_arn}")
    
    print("Running Restore Task...")
    task_arn = run_task(task_def_arn)
    
if __name__ == "__main__":
    main()
