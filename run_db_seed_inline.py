import boto3
import json

def run_seed():
    ecs = boto3.client('ecs', region_name='ap-southeast-1')
    
    cluster = 'budol-ecosystem-cluster'
    task_definition = 'budol-shap-task'
    subnets = ["subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12"]
    security_groups = ["sg-0ce5df1ba5bd90a2c"]
    
    # Generate client in /tmp and then use it
    seed_command = "npx prisma@6 generate --output /tmp/prisma-client && node -e \"const { PrismaClient } = require('/tmp/prisma-client'); const prisma = new PrismaClient(); async function main() { const userId = '8b23b71b-c27e-4964-a15a-ead0b563ea8d'; try { console.log('--- SEEDING START ---'); let user = await prisma.user.findUnique({ where: { id: userId } }); if (!user) { user = await prisma.user.create({ data: { id: userId, name: 'Reynaldo Galvez', email: 'reynaldomgalvez@gmail.com', password: 'hashed_password_here', image: 'https://via.placeholder.com/150', isAdmin: true, accountType: 'ADMIN' } }); console.log('User created:', user.id); } let settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } }); if (!settings) { settings = await prisma.systemSetting.create({ data: { id: 'default', realtimeProvider: 'POLLING', cacheProvider: 'MEMORY', marketingAdsEnabled: false } }); console.log('SystemSetting created'); } let category = await prisma.category.findUnique({ where: { slug: 'socks' } }); if (!category) { category = await prisma.category.create({ data: { name: 'Socks', slug: 'socks', icon: 'Footprints', level: 1, isActive: true } }); console.log('Category created:', category.id); } let store = await prisma.store.findUnique({ where: { userId: userId } }); if (!store) { store = await prisma.store.create({ data: { userId: userId, name: 'Budol Official Store', username: 'budol_official', description: 'The primary store for Budol Ecosystem', address: 'Manila, Philippines', logo: 'https://budolshap.duckdns.org/logo.png', email: 'admin@budol.org', contact: '09123456789', status: 'APPROVED', isActive: true } }); console.log('Store created:', store.id); } const product = await prisma.product.create({ data: { storeId: store.id, name: 'Budol Premium Socks', description: 'High-quality cotton socks for everyday use', mrp: 500.00, price: 299.00, images: ['https://images.unsplash.com/photo-1582966298636-a1d08e19997b?auto=format&fit=crop&q=80&w=300'], category: 'Socks', categoryId: category.id, inStock: true } }); console.log('Product created:', product.id); console.log('--- SEEDING SUCCESS ---'); } catch (err) { console.error('Seeding Failed:', err.message); process.exit(1); } finally { await prisma.$disconnect(); } } main();\""
    
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
                    'command': ['sh', '-c', seed_command]
                }
            ]
        }
    )
    
    task_arn = response['tasks'][0]['taskArn']
    print(f"Seed task started: {task_arn}")
    return task_arn

if __name__ == "__main__":
    run_seed()
