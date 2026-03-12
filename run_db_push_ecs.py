import boto3
import json
import os

def run_push():
    ecs = boto3.client('ecs', region_name='ap-southeast-1')
    
    cluster = 'budol-ecosystem-cluster'
    task_definition = 'budol-shap-task'
    subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
    security_groups = ["sg-0ce5df1ba5bd90a2c"]
    
    # Read the local schema
    schema_path = r"d:\IT Projects\clone\budolEcosystem\budolshap-0.1.0\prisma\schema.prisma"
    with open(schema_path, 'r') as f:
        schema_content = f.read()

    # Escape schema for shell
    # We'll base64 encode it to avoid shell escaping issues
    import base64
    encoded_schema = base64.b64encode(schema_content.encode('utf-8')).decode('utf-8')
    
    push_command = f"echo {encoded_schema} | base64 -d > /tmp/schema.prisma && npx prisma@6 db push --accept-data-loss --schema=/tmp/schema.prisma"
    
    response = ecs.run_task(
        cluster=cluster,
        taskDefinition=task_definition,
        launchType='FARGATE',
        networkConfiguration={
            'awsvpcConfiguration': {
                'subnets': subnets,
                'securityGroups': security_groups,
                'assignPublicIp': 'ENABLED'
            }
        },
        overrides={
            'containerOverrides': [
                {
                    'name': 'budol-shap',
                    'command': ['sh', '-c', push_command]
                }
            ]
        }
    )
    
    task_arn = response['tasks'][0]['taskArn']
    print(f"Push task started: {task_arn}")
    return task_arn

if __name__ == "__main__":
    run_push()
