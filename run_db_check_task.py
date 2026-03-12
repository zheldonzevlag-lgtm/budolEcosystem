import boto3
import json

def run_check():
    ecs = boto3.client('ecs', region_name='ap-southeast-1')
    
    cluster = 'budol-ecosystem-cluster'
    task_definition = 'budol-shap-task'
    subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
    security_groups = ["sg-0ce5df1ba5bd90a2c"]
    
    # Simple node script to check counts
    # Using require because it's broadly compatible in standalone Next.js environments
    check_script = """
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function main() {
        try {
            const userCount = await prisma.user.count();
            const productCount = await prisma.product.count();
            const storeCount = await prisma.store.count();
            console.log('--- DATABASE CHECK START ---');
            console.log('Users: ' + userCount);
            console.log('Products: ' + productCount);
            console.log('Stores: ' + storeCount);
            console.log('--- DATABASE CHECK END ---');
        } catch (err) {
            console.error('DB Check Failed:', err.message);
            process.exit(1);
        }
    }
    main();
    """
    
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
                    'command': ['node', '-e', check_script]
                }
            ]
        }
    )
    
    task_arn = response['tasks'][0]['taskArn']
    print(f"Task started: {task_arn}")
    return task_arn

if __name__ == "__main__":
    run_check()
