# Budol Ecosystem v18 Deployment Script
# Purpose: Build and Push Docker images for all services to AWS ECR

$AWS_ACCOUNT_ID = "194442925745"
$AWS_REGION = "ap-southeast-1"
$IMAGE_TAG = "v18"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# 1. BudolShap
echo "Building BudolShap..."
docker build -t "budolecosystem/budolshap:$IMAGE_TAG" ./budolshap-0.1.0
docker tag "budolecosystem/budolshap:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolshap:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolshap:$IMAGE_TAG"

# 2. BudolID
echo "Building BudolID..."
docker build -t "budolecosystem/budolid:$IMAGE_TAG" ./budolID-0.1.0
docker tag "budolecosystem/budolid:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolid:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolid:$IMAGE_TAG"

# 3. BudolAccounting
echo "Building BudolAccounting..."
docker build -t "budolecosystem/budolaccounting:$IMAGE_TAG" -f ./budolAccounting-0.1.0/Dockerfile .
docker tag "budolecosystem/budolaccounting:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolaccounting:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolaccounting:$IMAGE_TAG"

# 4. BudolWS
echo "Building BudolWS..."
docker build -t "budolecosystem/budolws:$IMAGE_TAG" ./websocket-server
docker tag "budolecosystem/budolws:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolws:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolws:$IMAGE_TAG"

# 5. BudolPay (Multi-service)
$services = @("gateway", "auth", "wallet", "transaction")
foreach ($service in $services) {
    echo "Building BudolPay $service..."
    docker build --target $service -t "budolecosystem/budolpay-${service}:$IMAGE_TAG" ./budolpay-0.1.0
    docker tag "budolecosystem/budolpay-${service}:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolpay-${service}:$IMAGE_TAG"
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budolecosystem/budolpay-${service}:$IMAGE_TAG"
}

echo "All images pushed successfully!"
