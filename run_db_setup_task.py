import boto3
import json

def run_setup():
    ecs = boto3.client('ecs', region_name='ap-southeast-1')
    
    cluster = 'budol-ecosystem-cluster'
    task_definition = 'budol-shap-task'
    subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
    security_groups = ["sg-0ce5df1ba5bd90a2c"]
    
    # 1. Push Schema
    # 2. Seed Admin and Test users
    # We use prisma@6 to match the project dependency and avoid v7 breaking changes
    setup_script = 'npx prisma@6 db push --accept-data-loss && node scripts/seed-test-data.cjs'
    
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
                    'command': ['sh', '-c', setup_script]
                }
            ]
        }
    )
    
    task_arn = response['tasks'][0]['taskArn']
    print(f"Setup task started: {task_arn}")
    return task_arn

if __name__ == "__main__":
    run_setup()
