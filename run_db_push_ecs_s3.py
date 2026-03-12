import boto3
import json

def run_push_s3():
    ecs = boto3.client('ecs', region_name='ap-southeast-1')
    
    cluster = 'budol-ecosystem-cluster'
    task_definition = 'budol-shap-task'
    subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
    security_groups = ["sg-0ce5df1ba5bd90a2c"]
    
    s3_client = boto3.client('s3', region_name='ap-southeast-1')
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': 'budol-restore-staging-v14', 'Key': 'temp/schema.prisma'},
            ExpiresIn=3600
        )
    except Exception as e:
        print("Failed to generate URL:", e)
        url = ""

    # Download from S3 using wget and push
    push_command = f"wget -qO /tmp/schema.prisma '{url}' && npx prisma@6 db push --accept-data-loss --schema=/tmp/schema.prisma"
    
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
    print(f"Push task (S3) started: {task_arn}")
    return task_arn

if __name__ == "__main__":
    run_push_s3()
