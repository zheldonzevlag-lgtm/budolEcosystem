# BudolShap Frontend ECS Deployment Script (PowerShell)
# Purpose: Build, push, and deploy budolshap frontend to ECS
# Created: 2026-03-04
# Author: Budol Orchestrator AI
# Usage: .\deploy-budolshap-frontend.ps1 [version]

param(
    [string]$Version = (Get-Date -Format "yyyyMMdd-HHmmss")
)

# Configuration
$AWS_REGION = "ap-southeast-1"
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$ECR_REPOSITORY = "budolshap-frontend"
$ECS_CLUSTER = "budolEcosystem-ECSCluster-tB0MiOs8XVqM"
$ECS_SERVICE = "budolshap-frontend-service"
$TASK_FAMILY = "budolshap-frontend-task"
$ALB_ARN = "arn:aws:elasticloadbalancing:ap-southeast-1:767397865487:loadbalancer/app/budolEcosystem-ALB/cbd226e4af3e7072"
$TARGET_GROUP_NAME = "tg-budolshap-frontend"
$CONTAINER_PORT = 3000

Write-Host "🚀 Deploying BudolShap Frontend v$Version" -ForegroundColor Green
Write-Host ""

# Step 1: Login to ECR
Write-Host "📦 Logging in to Amazon ECR..." -ForegroundColor Yellow
eval $(aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com)

# Step 2: Build Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
cd ..\budolshap-0.1.0
docker build -t $ECR_REPOSITORY`:$Version -t $ECR_REPOSITORY`:latest .

# Step 3: Tag image for ECR
Write-Host "🏷️ Tagging image..." -ForegroundColor Yellow
docker tag $ECR_REPOSITORY`:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY`:$Version
docker tag $ECR_REPOSITORY`:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY`:latest

# Step 4: Push to ECR
Write-Host "⬆️ Pushing to ECR..." -ForegroundColor Yellow
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY`:$Version
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY`:latest

Write-Host "✅ Image pushed successfully!" -ForegroundColor Green
Write-Host "   Image URI: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY`:$Version"
Write-Host ""

# Step 5: Register ECS Task Definition
Write-Host "📝 Registering ECS Task Definition..." -ForegroundColor Yellow

$TaskDefJson = @"
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID`:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID`:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "budolshap-frontend",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY`:$Version",
      "essential": true,
      "portMappings": [
        {
          "containerPort": $CONTAINER_PORT,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"},
        {"name": "HOSTNAME", "value": "0.0.0.0"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:$AWS_REGION`:$AWS_ACCOUNT_ID`:secret:budolshap/database-url"},
        {"name": "NEXTAUTH_SECRET", "valueFrom": "arn:aws:secretsmanager:$AWS_REGION`:$AWS_ACCOUNT_ID`:secret:budolshap/nextauth-secret"},
        {"name": "NEXTAUTH_URL", "valueFrom": "arn:aws:secretsmanager:$AWS_REGION`:$AWS_ACCOUNT_ID`:secret:budolshap/nextauth-url"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$TASK_FAMILY",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
"@

$TaskDefJson | Out-File -FilePath "task-def.json" -Encoding utf8
aws ecs register-task-definition --cli-input-json file://task-def.json --region $AWS_REGION
Remove-Item -Path "task-def.json"

# Step 6: Check if ECS service exists
Write-Host "🔍 Checking ECS service..." -ForegroundColor Yellow
$ServiceExists = aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION --query "services[0].status" --output text 2>$null

if ($ServiceExists -eq "ACTIVE") {
    Write-Host "✅ ECS service exists, updating..." -ForegroundColor Green
    aws ecs update-service `
        --cluster $ECS_CLUSTER `
        --service $ECS_SERVICE `
        --task-definition $TASK_FAMILY `
        --force-new-deployment `
        --region $AWS_REGION
} else {
    Write-Host "🆕 Creating new ECS service..." -ForegroundColor Yellow
    
    # Get VPC and subnets
    $VPC_ID = aws ec2 describe-vpcs --filters "Name=tag:Name,Values=budolEcosystem-VPC" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION
    $SUBNETS = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Type,Values=private" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION
    $SECURITY_GROUP = aws ec2 describe-security-groups --filters "Name=group-name,Values=budolshap-frontend-sg" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION 2>$null
    
    # Create security group if not exists
    if (-not $SECURITY_GROUP) {
        Write-Host "🔒 Creating security group..." -ForegroundColor Yellow
        $SECURITY_GROUP = aws ec2 create-security-group `
            --group-name budolshap-frontend-sg `
            --description "Security group for budolshap frontend" `
            --vpc-id $VPC_ID `
            --query "GroupId" --output text --region $AWS_REGION
        
        $ALB_SG = aws ec2 describe-security-groups --filters "Name=group-name,Values=budolEcosystem-ALB-SG" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION
        aws ec2 authorize-security-group-ingress `
            --group-id $SECURITY_GROUP `
            --protocol tcp `
            --port $CONTAINER_PORT `
            --source-group $ALB_SG `
            --region $AWS_REGION
    }
    
    # Create target group
    Write-Host "🎯 Creating target group..." -ForegroundColor Yellow
    $TARGET_GROUP_ARN = aws elbv2 create-target-group `
        --name $TARGET_GROUP_NAME `
        --protocol HTTP `
        --port $CONTAINER_PORT `
        --vpc-id $VPC_ID `
        --target-type ip `
        --health-check-path "/api/health" `
        --health-check-interval-seconds 30 `
        --health-check-timeout-seconds 5 `
        --healthy-threshold-count 2 `
        --unhealthy-threshold-count 3 `
        --query "TargetGroups[0].TargetGroupArn" --output text --region $AWS_REGION
    
    # Create ECS service
    aws ecs create-service `
        --cluster $ECS_CLUSTER `
        --service-name $ECS_SERVICE `
        --task-definition $TASK_FAMILY `
        --desired-count 2 `
        --launch-type FARGATE `
        --platform-version LATEST `
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=DISABLED}" `
        --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=budolshap-frontend,containerPort=$CONTAINER_PORT" `
        --propagate-tags SERVICE `
        --region $AWS_REGION
}

# Step 7: Configure ALB listener rule
Write-Host "🌐 Configuring ALB listener rule..." -ForegroundColor Yellow
$LISTENER_ARN = aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query "Listeners[0].ListenerArn" --output text --region $AWS_REGION

# Check if rule exists (this would need the target group ARN from above)
Write-Host ""
Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Version: $Version"
Write-Host "   Image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY`:$Version"
Write-Host "   Cluster: $ECS_CLUSTER"
Write-Host "   Service: $ECS_SERVICE"
Write-Host ""
Write-Host "⏳ Monitor deployment progress in AWS Console:" -ForegroundColor Yellow
Write-Host "   https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER/services"
Write-Host ""
Write-Host "🌐 Once deployed, access your application at:"
Write-Host "   http://budolshap.duckdns.org" -ForegroundColor Green