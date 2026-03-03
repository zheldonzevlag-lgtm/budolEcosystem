#!/bin/bash

# ECS Deployment Script for budolEcosystem Backend Services
# Usage: ./scripts/ecs-deploy.sh [environment] [action] [service]
# Examples: 
#   ./scripts/ecs-deploy.sh production all           # Full deployment
#   ./scripts/ecs-deploy.sh production build          # Build and push images
#   ./scripts/ecs-deploy.sh production register       # Register task definitions
#   ./scripts/ecs-deploy.sh production deploy        # Deploy services
#   ./scripts/ecs-deploy.sh production deploy budolid  # Deploy specific service
#   ./scripts/ecs-deploy.sh production create-services # Create ECS services (first time)

set -e

# Configuration
ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-ap-southeast-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
ECR_REPO_PREFIX="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/budolEcosystem"
IMAGE_TAG=${IMAGE_TAG:-latest}
CLUSTER_NAME="budolEcosystem-${ENVIRONMENT}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    # Check if ECS cluster exists
    if ! aws ecs describe-clusters --clusters ${CLUSTER_NAME} --region ${AWS_REGION} --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
        log_warn "ECS cluster ${CLUSTER_NAME} does not exist or is not active"
        log_info "Please deploy the CloudFormation stack first"
    fi
    
    log_info "Prerequisites check passed"
}

# Get SSM Parameter from Parameter Store
get_ssm_param() {
    local param_name=$1
    local default_value=$2
    
    local value=$(aws ssm get-parameter --name "/budolEcosystem/${ENVIRONMENT}/${param_name}" --region ${AWS_REGION} --query 'Parameter.Value' --output text 2>/dev/null)
    
    if [ -n "$value" ]; then
        echo "$value"
    else
        echo "$default_value"
    fi
}

# Get secret from Secrets Manager
get_secret() {
    local secret_name=$1
    
    aws secretsmanager get-secret-value --secret-id "budolEcosystem/production/${secret_name}" --region ${AWS_REGION} --query 'SecretString' --output text 2>/dev/null | jq -r '.' 2>/dev/null || echo ""
}

# Build and push Docker images
build_and_push_images() {
    log_step "Building and pushing Docker images..."
    
    # Login to ECR
    log_info "Logging into ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO_PREFIX} 2>/dev/null || true
    
    # Get VPC and Subnet info for task networking
    local vpc_id=$(get_ssm_param "ECS_VPC_ID" "")
    local subnet_1=$(get_ssm_param "ECS_SUBNET_PUBLIC_1" "")
    local subnet_2=$(get_ssm_param "ECS_SUBNET_PUBLIC_2" "")
    
    # Services to build
    SERVICES=("budolid" "budolaccounting" "budolpay-gateway" "budolpay-auth" "budolpay-wallet" "budolpay-transaction" "budolpay-payment" "budolpay-kyc" "budolpay-settlement")
    
    for service in "${SERVICES[@]}"; do
        log_info "Building ${service}..."
        
        # Build the Docker image
        docker build \
            --target ${service//-/_} \
            -t ${ECR_REPO_PREFIX}/${service}:${IMAGE_TAG} \
            -t ${ECR_REPO_PREFIX}/${service}:latest \
            . 2>/dev/null || {
                log_warn "Failed to build ${service} as multi-stage, trying alternative..."
                docker build \
                    -t ${ECR_REPO_PREFIX}/${service}:${IMAGE_TAG} \
                    -t ${ECR_REPO_PREFIX}/${service}:latest \
                    -f Dockerfile.backend \
                    --build-arg SERVICE=${service} \
                    . 2>/dev/null || {
                        log_warn "Using generic build for ${service}..."
                        docker build \
                            -t ${ECR_REPO_PREFIX}/${service}:${IMAGE_TAG} \
                            -t ${ECR_REPO_PREFIX}/${service}:latest \
                            .
                    }
            }
        
        log_info "Pushing ${service} to ECR..."
        docker push ${ECR_REPO_PREFIX}/${service}:${IMAGE_TAG} &
        docker push ${ECR_REPO_PREFIX}/${service}:latest &
    done
    
    # Wait for all pushes to complete
    wait
    
    log_info "All images built and pushed successfully"
}

# Register ECS task definitions
register_task_definitions() {
    log_step "Registering ECS task definitions..."
    
    # Task definitions mapping (task def family -> JSON file)
    declare -A TASK_DEFS=(
        ["budolID"]="budolid"
        ["budolAccounting"]="budolaccounting"
        ["budolPayGateway"]="budolpay-gateway"
        ["budolPayAuth"]="budolpay-auth"
        ["budolPayWallet"]="budolpay-wallet"
        ["budolPayTransaction"]="budolpay-transaction"
        ["budolPayPayment"]="budolpay-payment"
        ["budolPayKYC"]="budolpay-kyc"
        ["budolPaySettlement"]="budolpay-settlement"
    )
    
    for task_family in "${!TASK_DEFS[@]}"; do
        local task_def_file="${TASK_DEFS[$task_family]}"
        log_info "Registering ${task_family} task definition..."
        
        if [ ! -f "ecs/task-definitions/${task_def_file}.json" ]; then
            log_error "Task definition file not found: ecs/task-definitions/${task_def_file}.json"
            continue
        fi
        
        # Replace placeholders in JSON
        sed -e "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" \
            -e "s/\${AWS_REGION}/${AWS_REGION}/g" \
            -e "s/\${IMAGE_TAG}/${IMAGE_TAG}/g" \
            "ecs/task-definitions/${task_def_file}.json" > "/tmp/${task_def_file}-${IMAGE_TAG}.json"
        
        aws ecs register-task-definition \
            --cli-input-json file:///tmp/${task_def_file}-${IMAGE_TAG}.json \
            --region ${AWS_REGION}
        
        log_info "${task_family} task definition registered"
    done
    
    log_info "All task definitions registered successfully"
}

# Get latest task definition ARN
get_latest_task_def() {
    local family=$1
    
    aws ecs list-task-definitions \
        --family-prefix ${family} \
        --status ACTIVE \
        --sort DESC \
        --max-items 1 \
        --region ${AWS_REGION} \
        --query 'taskDefinitionArns[0]' \
        --output text
}

# Create ECS services (first time setup)
create_services() {
    log_step "Creating ECS services..."
    
    # Get VPC and subnet info
    local vpc_id=$(get_ssm_param "ECS_VPC_ID" "")
    local subnet_1=$(get_ssm_param "ECS_SUBNET_PUBLIC_1" "")
    local subnet_2=$(get_ssm_param "ECS_SUBNET_PUBLIC_2" "")
    local internal_alb_arn=$(aws elbv2 describe-loadBalancers --names budolEcosystem-InternalALB-${ENVIRONMENT} --region ${AWS_REGION} --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "")
    local external_alb_arn=$(aws elbv2 describe-loadBalancers --names budolEcosystem-ALB-${ENVIRONMENT} --region ${AWS_REGION} --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "")
    
    # Service configurations: family, port, target group, desired count
    declare -A SERVICES_CONFIG=(
        ["budolID,8000,budolID-tg,2"]="budolid"
        ["budolAccounting,8005,budolAccounting-tg,2"]="budolaccounting"
        ["budolPayGateway,8080,budolPayGateway-tg,2"]="budolpay-gateway"
        ["budolPayAuth,8001,budolPayAuth-tg,2"]="budolpay-auth"
        ["budolPayWallet,8002,budolPayWallet-tg,2"]="budolpay-wallet"
        ["budolPayTransaction,8003,budolPayTransaction-tg,2"]="budolpay-transaction"
        ["budolPayPayment,8004,budolPayPayment-tg,2"]="budolpay-payment"
        ["budolPayKYC,8006,budolPayKYC-tg,2"]="budolpay-kyc"
        ["budolPaySettlement,8007,budolPaySettlement-tg,2"]="budolpay-settlement"
    )
    
    # Get security group for ECS tasks
    local ecs_sg=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=budolEcosystem-ECS-SG-${ENVIRONMENT}" --region ${AWS_REGION} --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
    
    for config in "${!SERVICES_CONFIG[@]}"; do
        IFS=',' read -r family port target_group desired_count <<< "$config"
        local service_name=$family
        
        log_info "Creating service ${service_name}..."
        
        # Check if service already exists
        if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${service_name} --region ${AWS_REGION} --query 'services[0].serviceName' --output text 2>/dev/null | grep -q "${service_name}"; then
            log_warn "Service ${service_name} already exists, skipping creation"
            continue
        fi
        
        # Get latest task definition
        local task_def_arn=$(get_latest_task_def ${family})
        
        if [ -z "$task_def_arn" ]; then
            log_error "No task definition found for ${family}, please register task definitions first"
            continue
        fi
        
        # Get target group ARN
        local target_group_arn=$(aws elbv2 describe-target-groups --names ${target_group} --region ${AWS_REGION} --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")
        
        if [ -z "$target_group_arn" ]; then
            log_warn "Target group ${target_group} not found, creating service without load balancer"
            # Create service without load balancer
            aws ecs create-service \
                --cluster ${CLUSTER_NAME} \
                --service-name ${service_name} \
                --task-definition ${task_def_arn} \
                --desired-count ${desired_count} \
                --launch-type FARGATE \
                --network-configuration "awsvpcConfiguration={subnets=[${subnet_1},${subnet_2}],securityGroups=[${ecs_sg}],assignPublicIp=ENABLED}" \
                --region ${AWS_REGION}
        else
            # Create service with load balancer
            aws ecs create-service \
                --cluster ${CLUSTER_NAME} \
                --service-name ${service_name} \
                --task-definition ${task_def_arn} \
                --desired-count ${desired_count} \
                --launch-type FARGATE \
                --network-configuration "awsvpcConfiguration={subnets=[${subnet_1},${subnet_2}],securityGroups=[${ecs_sg}],assignPublicIp=ENABLED}" \
                --loadBalancers "[{targetGroupArn=${target_group_arn},containerName=${SERVICES_CONFIG[$config]},containerPort=${port}}]" \
                --region ${AWS_REGION}
        fi
        
        log_info "Service ${service_name} created"
    done
    
    log_info "All ECS services created successfully"
}

# Deploy ECS services
deploy_services() {
    log_step "Deploying ECS services..."
    
    local service_filter=$2
    
    # Service family mapping
    declare -A SERVICES=(
        ["budolID"]="budolid"
        ["budolAccounting"]="budolaccounting"
        ["budolPayGateway"]="budolpay-gateway"
        ["budolPayAuth"]="budolpay-auth"
        ["budolPayWallet"]="budolpay-wallet"
        ["budolPayTransaction"]="budolpay-transaction"
        ["budolPayPayment"]="budolpay-payment"
        ["budolPayKYC"]="budolpay-kyc"
        ["budolPaySettlement"]="budolpay-settlement"
    )
    
    for family in "${!SERVICES[@]}"; do
        # Filter by specific service if provided
        if [ -n "$service_filter" ] && [[ "${SERVICES[$family]}" != "$service_filter" ]]; then
            continue
        fi
        
        log_info "Deploying ${family}..."
        
        # Get latest task definition ARN
        local task_def_arn=$(get_latest_task_def ${family})
        
        if [ -z "$task_def_arn" ]; then
            log_error "No task definition found for ${family}"
            continue
        fi
        
        # Update service
        aws ecs update-service \
            --cluster ${CLUSTER_NAME} \
            --service ${family} \
            --task-definition ${task_def_arn} \
            --region ${AWS_REGION} \
            --force-new-deployment
        
        log_info "${family} deployment initiated"
    done
    
    log_info "All services deployment initiated"
}

# Wait for deployment to complete
wait_for_deployment() {
    log_step "Waiting for deployment to complete..."
    
    local services=("$@")
    local max_wait=600  # 10 minutes max
    local elapsed=0
    
    for service in "${services[@]}"; do
        log_info "Waiting for ${service}..."
        
        while [ $elapsed -lt $max_wait ]; do
            local status=$(aws ecs describe-services \
                --cluster ${CLUSTER_NAME} \
                --services ${service} \
                --region ${AWS_REGION} \
                --query 'services[0].runningCount' \
                --output text)
            
            local desired=$(aws ecs describe-services \
                --cluster ${CLUSTER_NAME} \
                --services ${service} \
                --region ${AWS_REGION} \
                --query 'services[0].desiredCount' \
                --output text)
            
            if [ "$status" == "$desired" ]; then
                log_info "${service} is running (${status}/${desired})"
                break
            fi
            
            log_info "Waiting for ${service}... (${status}/${desired})"
            sleep 10
            elapsed=$((elapsed + 10))
        done
        
        if [ $elapsed -ge $max_wait ]; then
            log_warn "Timeout waiting for ${service}"
        fi
    done
    
    log_info "Deployment wait complete"
}

# Show service status
show_status() {
    log_step "Service Status:"
    
    local services=("budolID" "budolAccounting" "budolPayGateway" "budolPayAuth" "budolPayWallet" "budolPayTransaction" "budolPayPayment" "budolPayKYC" "budolPaySettlement")
    
    printf "%-20s %-10s %-10s %-10s %-15s\n" "Service" "Desired" "Running" "Pending" "Status"
    echo "----------------------------------------------------------------------"
    
    for service in "${services[@]}"; do
        local status=$(aws ecs describe-services \
            --cluster ${CLUSTER_NAME} \
            --services ${service} \
            --region ${AWS_REGION} \
            --query 'services[0]{desired:desiredCount,running:runningCount,pending:pendingCount,status:status}' \
            --output json 2>/dev/null || echo '{"status":"NOT_FOUND"}')
        
        local desired=$(echo $status | jq -r '.desired // 0')
        local running=$(echo $status | jq -r '.running // 0')
        local pending=$(echo $status | jq -r '.pending // 0')
        local service_status=$(echo $status | jq -r '.status // "NOT_FOUND"')
        
        printf "%-20s %-10s %-10s %-10s %-15s\n" "$service" "$desired" "$running" "$pending" "$service_status"
    done
}

# Main deployment flow
main() {
    local action=${2:-all}
    local service_filter=${3:-}
    
    log_info "========================================"
    log_info "ECS Deployment for budolEcosystem"
    log_info "========================================"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "AWS Region: ${AWS_REGION}"
    log_info "Cluster: ${CLUSTER_NAME}"
    log_info "Image Tag: ${IMAGE_TAG}"
    log_info "Action: ${action}"
    [ -n "$service_filter" ] && log_info "Service Filter: ${service_filter}"
    log_info "========================================"
    
    check_prerequisites
    
    case "$action" in
        build)
            build_and_push_images
            ;;
        register)
            register_task_definitions
            ;;
        create-services|create)
            create_services
            ;;
        deploy)
            deploy_services "$action" "$service_filter"
            ;;
        status)
            show_status
            ;;
        wait)
            wait_for_deployment "budolID" "budolAccounting" "budolPayGateway" "budolPayAuth" "budolPayWallet" "budolPayTransaction" "budolPayPayment" "budolPayKYC" "budolPaySettlement"
            ;;
        all)
            build_and_push_images
            register_task_definitions
            deploy_services
            ;;
        *)
            log_error "Invalid action: $action"
            echo "Usage: $0 [environment] [action] [service]"
            echo ""
            echo "Actions:"
            echo "  build          - Build and push Docker images"
            echo "  register       - Register ECS task definitions"
            echo "  create         - Create ECS services (first time)"
            echo "  deploy         - Deploy/update ECS services"
            echo "  status         - Show service status"
            echo "  wait           - Wait for deployment to complete"
            echo "  all            - Full deployment (build, register, deploy)"
            echo ""
            echo "Examples:"
            echo "  $0 production all"
            echo "  $0 production build"
            echo "  $0 production deploy budolid"
            echo "  $0 production status"
            exit 1
            ;;
    esac
    
    log_info "ECS deployment completed!"
}

# Run main function
main "$@"
