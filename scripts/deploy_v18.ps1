# Budol Ecosystem v18 Deployment Script
# Purpose: Build and Push Docker images for all services to AWS ECR

$AWS_ACCOUNT_ID = "194442925745"
$AWS_REGION = "ap-southeast-1"
$IMAGE_TAG = "v18"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# 1. BudolShap
echo "Building BudolShap..."
docker build -t "budol-shap:$IMAGE_TAG" ./budolshap-0.1.0
docker tag "budol-shap:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budol-shap:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budol-shap:$IMAGE_TAG"

# 2. BudolID
echo "Building BudolID..."
docker build -t "budol-id:$IMAGE_TAG" ./budolID-0.1.0
docker tag "budol-id:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budol-id:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budol-id:$IMAGE_TAG"

# 3. BudolAccounting
echo "Building BudolAccounting..."
docker build -t "budol-accounting:$IMAGE_TAG" -f ./budolAccounting-0.1.0/Dockerfile .
docker tag "budol-accounting:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budol-accounting:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budol-accounting:$IMAGE_TAG"

# 4. BudolWS
echo "Building BudolWS..."
docker build -t "budol-ws:$IMAGE_TAG" ./websocket-server
docker tag "budol-ws:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budol-ws:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/budol-ws:$IMAGE_TAG"

# 5. BudolPay (Multi-service)
$services = @("gateway", "auth", "wallet", "transaction")
foreach ($service in $services) {
    $ecrRepo = if ($service -eq "auth") { "budol-auth-service" } else { "budolpay-${service}" }
    echo "Building BudolPay $service..."
    docker build --target $service -t "budolpay-${service}:$IMAGE_TAG" ./budolpay-0.1.0
    docker tag "budolpay-${service}:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ecrRepo}:$IMAGE_TAG"
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ecrRepo}:$IMAGE_TAG"
}

echo "All images pushed successfully!"
