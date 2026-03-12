import boto3
import time

cluster_name = "budol-ecosystem-cluster"
task_role_arn = "arn:aws:iam::194442925745:role/BudolECSExecutionRole"
execution_role_arn = "arn:aws:iam::194442925745:role/BudolECSExecutionRole"
subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
security_groups = ["sg-0ce5df1ba5bd90a2c"]
db_url = "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolid"

ecs_client = boto3.client('ecs', region_name='ap-southeast-1')
logs_client = boto3.client('logs', region_name='ap-southeast-1')

def register_sql_task():
    sql_script = "UPDATE \\\"Address\\\" SET \\\"barangay\\\" = 'Unknown' WHERE \\\"barangay\\\" IS NULL; UPDATE \\\"AuditLog\\\" SET \\\"userId\\\" = 'system' WHERE \\\"userId\\\" IS NULL;"
    
    command = [
        "bash", "-c",
        f"psql '{db_url}' -c \"{sql_script}\""
    ]

    response = ecs_client.register_task_definition(
        family="budolshap-sql-task",
        networkMode="awsvpc",
        requiresCompatibilities=["FARGATE"],
        cpu="256",
        memory="512",
        taskRoleArn=task_role_arn,
        executionRoleArn=execution_role_arn,
        containerDefinitions=[
            {
                "name": "psql-container",
                "image": "postgres:17",
                "essential": True,
                "command": command,
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": "/ecs/budolshap-sql",
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
        logs_client.create_log_group(logGroupName="/ecs/budolshap-sql")
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
    task_def_arn = register_sql_task()
    print(f"Registered Task Def: {task_def_arn}")
    
    print("Running SQL Task...")
    task_arn = run_task(task_def_arn)
    
if __name__ == "__main__":
    main()
