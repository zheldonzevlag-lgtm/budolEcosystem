#!/bin/bash

# ECR Repository Creation Script for budolEcosystem
# Creates all required ECR repositories for the 9 backend services

set -e

# Configuration
AWS_REGION=${AWS_REGION:-ap-southeast-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
ECR_REPO_PREFIX="budolEcosystem"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
    log_info "AWS Account ID: ${AWS_ACCOUNT_ID}"
    log_info "AWS Region: ${AWS_REGION}"
}

# List of all services requiring ECR repositories
SERVICES=(
    "budolid"
    "budolaccounting"
    "budolpay-gateway"
    "budolpay-auth"
    "budolpay-wallet"
    "budolpay-transaction"
    "budolpay-payment"
    "budolpay-kyc"
    "budolpay-settlement"
)

# Create ECR repository
create_ecr_repository() {
    local service=$1
    local repo_name="${ECR_REPO_PREFIX}/${service}"
    local repo_uri="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${repo_name}"
    
    log_info "Checking repository: ${repo_name}..."
    
    # Check if repository exists
    if aws ecr describe-repositories --repository-names ${repo_name} --region ${AWS_REGION} &> /dev/null; then
        log_info "Repository ${repo_name} already exists"
    else
        log_info "Creating repository: ${repo_name}..."
        aws ecr create-repository \
            --repository-name ${repo_name} \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=kms \
            --region ${AWS_REGION}
        
        log_info "Repository ${repo_name} created successfully"
    fi
    
    # Configure lifecycle policy for image retention
    local lifecycle_policy='{"rules":[{"rulePriority":1,"description":"Expire untagged images older than 14 days","selection":{"tagStatus":"untagged","countType":"sinceImagePushedCount","countUnit":"days","countNumber":14},"action":{"type":"expire"}}]}'
    
    aws ecr put-lifecycle-policy \
        --repository-name ${repo_name} \
        --lifecycle-policy-text "${lifecycle_policy}" \
        --region ${AWS_REGION} 2>/dev/null || log_warn "Lifecycle policy already exists for ${repo_name}"
}

# Configure repository access policy
configure_repository_policy() {
    local repo_name=$1
    
    # Set repository policy to allow cross-account access if needed
    local policy='{"Version":"2008-10-17","Statement":[{"Sid":"AllowCrossAccountPull","Effect":"Allow","Principal":"*","Action":["ecr:DescribeImages","ecr:DescribeRepositories","ecr:BatchCheckLayerAvailability","ecr:BatchGetImage","ecr:GetDownloadUrlForLayer"]}]}'
    
    aws ecr set-repository-policy \
        --repository-name ${repo_name} \
        --policy-text "${policy}" \
        --region ${AWS_REGION} 2>/dev/null || log_warn "Repository policy already configured for ${repo_name}"
}

# Display repository information
display_repositories() {
    log_info "ECR Repository Information:"
    echo "================================"
    
    for service in "${SERVICES[@]}"; do
        local repo_name="${ECR_REPO_PREFIX}/${service}"
        local repo_uri="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${repo_name}"
        
        echo "Service: ${service}"
        echo "  Repository URI: ${repo_uri}"
        echo "  Image URL: ${repo_uri}:latest"
        echo ""
    done
}

# Main function
main() {
    log_info "Starting ECR Repository Creation for budolEcosystem"
    log_info "===================================================="
    
    check_prerequisites
    
    # Create repositories for all services
    for service in "${SERVICES[@]}"; do
        create_ecr_repository ${service}
    done
    
    log_info "All ECR repositories created successfully!"
    
    # Display repository information
    display_repositories
    
    log_info "To login to ECR, run:"
    echo "  aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
}

# Parse command line arguments
case "$1" in
    list)
        check_prerequisites
        display_repositories
        ;;
    *)
        main
        ;;
esac
