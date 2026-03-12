import boto3
import zlib
import base64

def run_seed_compact():
    ecs = boto3.client('ecs', region_name='ap-southeast-1')
    
    cluster = 'budol-ecosystem-cluster'
    task_definition = 'budol-shap-task'
    subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
    security_groups = ["sg-0ce5df1ba5bd90a2c"]
    
    # Read and modify schema to have output in generator
    schema_path = r"d:\IT Projects\clone\budolEcosystem\budolshap-0.1.0\prisma\schema.prisma"
    with open(schema_path, 'r') as f:
        schema_content = f.read()
    
    # Inject output path into the generator block
    if 'output =' not in schema_content:
        schema_content = schema_content.replace(
            'provider = "prisma-client-js"',
            'provider = "prisma-client-js"\n  output   = "/tmp/prisma-client"'
        )
    
    compressed_schema = base64.b64encode(zlib.compress(schema_content.encode())).decode()
    
    seed_script = """
const { PrismaClient } = require('/tmp/prisma-client');
const prisma = new PrismaClient();
async function main() {
    const userId = '8b23b71b-c27e-4964-a15a-ead0b563ea8d'; 
    try {
        console.log('--- SEEDING START ---');
        let user = await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, name: 'Reynaldo Galvez', email: 'reynaldomgalvez@gmail.com', password: 'hashed', image: 'https://via.placeholder.com/150', isAdmin: true, accountType: 'ADMIN' }
        });
        await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: {},
            create: { id: 'default', realtimeProvider: 'POLLING', cacheProvider: 'MEMORY' }
        });
        let category = await prisma.category.upsert({
            where: { slug: 'socks' },
            update: {},
            create: { name: 'Socks', slug: 'socks', icon: 'Footprints', isActive: true }
        });
        let store = await prisma.store.upsert({
            where: { userId: userId },
            update: {},
            create: { userId: userId, name: 'Budol Store', username: 'budol_off', description: 'Desc', address: 'Manila', logo: 'logo.png', email: 'admin@budol.org', contact: '0912', status: 'APPROVED', isActive: true }
        });
        await prisma.product.create({
            data: { storeId: store.id, name: 'Budol Premium Socks', description: 'Cotton socks', mrp: 500, price: 299, images: ['https://images.unsplash.com/photo-1582966298636-a1d08e19997b?auto=format&fit=crop&q=80&w=300'], category: 'Socks', categoryId: category.id, inStock: true }
        });
        console.log('--- SEEDING SUCCESS ---');
    } catch (err) { console.error('Seeding Failed:', err.message); console.error(err); process.exit(1); }
    finally { await prisma.$disconnect(); }
}
main();
"""
    
    compressed_seed = base64.b64encode(zlib.compress(seed_script.encode())).decode()
    
    setup_node = f"const z=require('zlib'),fs=require('fs');fs.writeFileSync('/tmp/s.prisma',z.inflateSync(Buffer.from('{compressed_schema}','base64')));"
    
    # We remove --output from CLI as it's now in the schema
    full_command = f"node -e \"{setup_node}\" && npx prisma@6 generate --schema=/tmp/s.prisma && node -e \"const z=require('zlib');z.inflate(Buffer.from('{compressed_seed}','base64'),(e,r)=>eval(r.toString()))\""

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
    print(f"Compact Seed task started: {task_arn}")
    return task_arn

if __name__ == "__main__":
    run_seed_compact()
