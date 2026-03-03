#!/bin/bash
# BudolShap Frontend ECS Deployment Script
# Purpose: Build, push, and deploy budolshap frontend to ECS
# Created: 2026-03-03
# Author: Budol Orchestrator AI
# Usage: ./deploy-budolshap-frontend.sh [version]

set -e

# Configuration
AWS_REGION="ap-southeast-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="budolshap-frontend"
ECS_CLUSTER="budolEcosystem-ECSCluster-tB0MiOs8XVqM"
ECS_SERVICE="budolshap-frontend-service"
TASK_FAMILY="budolshap-frontend-task"
ALB_ARN="arn:aws:elasticloadbalancing:ap-southeast-1:767397865487:loadbalancer/app/budolEcosystem-ALB/cbd226e4af3e7072"
TARGET_GROUP_NAME="tg-budolshap-frontend"
CONTAINER_PORT=3000

# Version tag
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}
echo "🚀 Deploying BudolShap Frontend v$VERSION"

# Step 1: Login to ECR
echo "📦 Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 2: Build Docker image
echo "🔨 Building Docker image..."
cd ../budolshap-0.1.0
docker build -t $ECR_REPOSITORY:$VERSION -t $ECR_REPOSITORY:latest .

# Step 3: Tag image for ECR
echo "🏷️ Tagging image..."
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Step 4: Push to ECR
echo "⬆️ Pushing to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo "✅ Image pushed successfully!"
echo "   Image URI: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION"

# Step 5: Create or update ECS Task Definition
echo "📝 Creating ECS Task Definition..."
TASK_DEF_JSON=$(cat <<EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "budolshap-frontend",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION",
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
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:budolshap/database-url"},
        {"name": "NEXTAUTH_SECRET", "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:budolshap/nextauth-secret"},
        {"name": "NEXTAUTH_URL", "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:budolshap/nextauth-url"}
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
EOF
)

# Register task definition
aws ecs register-task-definition --cli-input-json "$TASK_DEF_JSON" --region $AWS_REGION

# Step 6: Check if ECS service exists, create if not
echo "🔍 Checking ECS service..."
if aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION --query "services[0].status" --output text 2>/dev/null | grep -q "ACTIVE"; then
  echo "✅ ECS service exists, updating..."
  aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --task-definition $TASK_FAMILY \
    --force-new-deployment \
    --region $AWS_REGION
else
  echo "🆕 Creating new ECS service..."
  
  # Get VPC and subnets
  VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=budolEcosystem-VPC" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
  SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Type,Values=private" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION)
  SECURITY_GROUP=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=budolshap-frontend-sg" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION 2>/dev/null || echo "")
  
  # Create security group if not exists
  if [ -z "$SECURITY_GROUP" ]; then
    echo "🔒 Creating security group..."
    SECURITY_GROUP=$(aws ec2 create-security-group \
      --group-name budolshap-frontend-sg \
      --description "Security group for budolshap frontend" \
      --vpc-id $VPC_ID \
      --query "GroupId" --output text --region $AWS_REGION)
    
    # Allow inbound traffic from ALB
    aws ec2 authorize-security-group-ingress \
      --group-id $SECURITY_GROUP \
      --protocol tcp \
      --port $CONTAINER_PORT \
      --source-group $(aws ec2 describe-security-groups --filters "Name=group-name,Values=budolEcosystem-ALB-SG" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION) \
      --region $AWS_REGION
  fi
  
  # Create target group
  echo "🎯 Creating target group..."
  TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name $TARGET_GROUP_NAME \
    --protocol HTTP \
    --port $CONTAINER_PORT \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path "/api/health" \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query "TargetGroups[0].TargetGroupArn" --output text --region $AWS_REGION)
  
  # Create ECS service
  aws ecs create-service \
    --cluster $ECS_CLUSTER \
    --service-name $ECS_SERVICE \
    --task-definition $TASK_FAMILY \
    --desired-count 2 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=DISABLED}" \
    --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=budolshap-frontend,containerPort=$CONTAINER_PORT" \
    --propagate-tags SERVICE \
    --region $AWS_REGION
fi

# Step 7: Create ALB listener rule for host-based routing
echo "🌐 Configuring ALB listener rule..."
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query "Listeners[0].ListenerArn" --output text --region $AWS_REGION)

# Check if rule exists
RULE_ARN=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN --query "Rules[?Actions[0].TargetGroupArn=='$TARGET_GROUP_ARN'].RuleArn" --output text --region $AWS_REGION)

if [ -z "$RULE_ARN" ]; then
  echo "📝 Creating ALB listener rule..."
  aws elbv2 create-rule \
    --listener-arn $LISTENER_ARN \
    --conditions "Field=host-header,Values=budolshap.duckdns.org" \
    --priority 10 \
    --actions "Type=forward,TargetGroupArn=$TARGET_GROUP_ARN" \
    --region $AWS_REGION
else
  echo "✅ ALB listener rule already exists"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Summary:"
echo "   Version: $VERSION"
echo "   Image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION"
echo "   Cluster: $ECS_CLUSTER"
echo "   Service: $ECS_SERVICE"
echo "   Target Group: $TARGET_GROUP_ARN"
echo ""
echo "⏳ Waiting for service to stabilize..."
aws ecs wait services-stable --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION

echo "✅ Service is stable and running!"
echo ""
echo "🌐 Access your application at:"
echo "   http://budolshap.duckdns.org"
echo "   https://budolshap.duckdns.org (after SSL setup)"