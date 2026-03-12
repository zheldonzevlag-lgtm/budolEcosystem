import boto3
import zlib
import base64

def run_push_compact():
    ecs = boto3.client('ecs', region_name='ap-southeast-1')
    
    cluster = 'budol-ecosystem-cluster'
    task_definition = 'budol-shap-task'
    subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
    security_groups = ["sg-0ce5df1ba5bd90a2c"]
    
    # Read and compress schema
    schema_path = r"d:\IT Projects\clone\budolEcosystem\budolshap-0.1.0\prisma\schema.prisma"
    with open(schema_path, 'r') as f:
        schema_content = f.read()
    
    compressed_schema = base64.b64encode(zlib.compress(schema_content.encode())).decode()
    
    # Node.js script to decompress and run prisma
    node_command = f"""
    const zlib = require('zlib');
    const fs = require('fs');
    const b64 = '{compressed_schema}';
    const compressed = Buffer.from(b64, 'base64');
    const decompressed = zlib.inflateSync(compressed);
    fs.writeFileSync('/tmp/schema.prisma', decompressed);
    console.log('Schema decompressed to /tmp/schema.prisma');
    """
    
    full_command = f"node -e \"{node_command}\" && npx prisma@6 db push --accept-data-loss --schema=/tmp/schema.prisma"
    
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
                    'command': ['sh', '-c', full_command]
                }
            ]
        }
    )
    
    task_arn = response['tasks'][0]['taskArn']
    print(f"Compact Push task started: {{task_arn}}")
    return task_arn

if __name__ == "__main__":
    run_push_compact()
