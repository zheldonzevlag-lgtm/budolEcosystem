#!/bin/bash

# ECS Service Verification Script for budolEcosystem
# Verifies service health, target group health, DNS resolution, and ALB endpoints

set -e

# Configuration
ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-ap-southeast-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
CLUSTER_NAME="budolEcosystem-${ENVIRONMENT}"
HOSTED_ZONE_NAME="budol.internal"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Print section header
section() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
}

# Check ECS Service Health
check_ecs_service_health() {
    section "ECS Service Health Check"
    
    local services=("budolID" "budolAccounting" "budolPayGateway" "budolPayAuth" "budolPayWallet" "budolPayTransaction" "budolPayPayment" "budolPayKYC" "budolPaySettlement")
    
    printf "%-20s %-12s %-10s %-10s %-12s\n" "Service" "Desired" "Running" "Pending" "Status"
    echo "----------------------------------------------------------------------"
    
    for service in "${services[@]}"; do
        local status=$(aws ecs describe-services \
            --cluster ${CLUSTER_NAME} \
            --services ${service} \
            --region ${AWS_REGION} \
            --query 'services[0]{desired:desiredCount,running:runningCount,pending:pendingCount,status:status}' \
            --output json 2>/dev/null || echo '{"status":"NOT_FOUND","desired":0,"running":0,"pending":0}')
        
        local desired=$(echo $status | jq -r '.desired // 0')
        local running=$(echo $status | jq -r '.running // 0')
        local pending=$(echo $status | jq -r '.pending // 0')
        local service_status=$(echo $status | jq -r '.status // "NOT_FOUND"')
        
        printf "%-20s %-12s %-10s %-10s %-12s\n" "$service" "$desired" "$running" "$pending" "$service_status"
        
        if [ "$service_status" == "ACTIVE" ] && [ "$running" == "$desired" ] && [ "$desired" -gt 0 ]; then
            log_pass "Service ${service} is healthy"
        elif [ "$service_status" == "NOT_FOUND" ]; then
            log_warn "Service ${service} not found"
        else
            log_fail "Service ${service} is not healthy"
        fi
    done
}

# Check Target Group Health
check_target_group_health() {
    section "Target Group Health Check"
    
    local target_groups=(
        "budolID-tg"
        "budolAccounting-tg"
        "budolPayGateway-tg"
        "budolPayAuth-tg"
        "budolPayWallet-tg"
        "budolPayTransaction-tg"
        "budolPayPayment-tg"
        "budolPayKYC-tg"
        "budolPaySettlement-tg"
    )
    
    printf "%-25s %-12s %-12s %-12s %-12s\n" "Target Group" "Healthy" "Unhealthy" "Total" "Health %
"
    echo "----------------------------------------------------------------------"
    
    for tg in "${target_groups[@]}"; do
        local health=$(aws elbv2 describe-target-health \
            --target-group-arn $(aws elbv2 describe-target-groups --names ${tg} --region ${AWS_REGION} --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null) \
            --region ${AWS_REGION} \
            --output json 2>/dev/null || echo '{"TargetHealthDescriptions":[]}')
        
        local total=$(echo $health | jq '.TargetHealthDescriptions | length')
        local healthy=$(echo $health | jq '[.TargetHealthDescriptions[] | select(.TargetHealth.State == "healthy")] | length')
        local unhealthy=$(echo $health | jq '[.TargetHealthDescriptions[] | select(.TargetHealth.State == "unhealthy")] | length')
        
        if [ "$total" == "0" ]; then
            printf "%-25s %-12s %-12s %-12s %-12s\n" "$tg" "N/A" "N/A" "0" "N/A"
            log_warn "Target group ${tg} has no targets"
        else
            local health_pct=0
            if [ "$total" -gt 0 ]; then
                health_pct=$((healthy * 100 / total))
            fi
            printf "%-25s %-12s %-12s %-12s %-12s%%\n" "$tg" "$healthy" "$unhealthy" "$total" "$health_pct"
            
            if [ "$healthy" -gt 0 ]; then
                log_pass "Target group ${tg} has ${healthy} healthy targets"
            else
                log_fail "Target group ${tg} has no healthy targets"
            fi
        fi
    done
}

# Check Internal DNS Resolution
check_internal_dns() {
    section "Internal DNS Resolution Check"
    
    local hostnames=(
        "budolid.budol.internal"
        "budolaccounting.budol.internal"
        "budolpay-gateway.budol.internal"
        "budolpay-auth.budol.internal"
        "budolpay-wallet.budol.internal"
        "budolpay-transaction.budol.internal"
        "budolpay-payment.budol.internal"
        "budolpay-kyc.budol.internal"
        "budolpay-settlement.budol.internal"
    )
    
    # Get internal ALB DNS name
    local internal_alb_dns=$(aws elbv2 describe-loadBalancers \
        --names budolEcosystem-InternalALB-${ENVIRONMENT} \
        --region ${AWS_REGION} \
        --query 'LoadBalancers[0].DNSName' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$internal_alb_dns" ]; then
        log_warn "Internal ALB not found, skipping DNS checks"
        return
    fi
    
    for hostname in "${hostnames[@]}"; do
        # Try to resolve using AWS Route 53
        local ip=$(aws route53 list-resource-record-sets \
            --hosted-zone-name ${HOSTED_ZONE_NAME}. \
            --query "ResourceRecordSets[?Name=='${hostname}.'].ResourceRecords[0].Value" \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$ip" ]; then
            log_pass "DNS resolved: ${hostname} -> ${ip}"
        else
            # Try using dig/nslookup through bastion or instance
            log_fail "DNS not resolved: ${hostname}"
        fi
    done
}

# Check ALB Endpoints
check_alb_endpoints() {
    section "ALB Endpoint Health Check"
    
    # Get external ALB DNS
    local external_alb_dns=$(aws elbv2 describe-loadBalancers \
        --names budolEcosystem-ALB-${ENVIRONMENT} \
        --region ${AWS_REGION} \
        --query 'LoadBalancers[0].DNSName' \
        --output text 2>/dev/null || echo "")
    
    # Get internal ALB DNS
    local internal_alb_dns=$(aws elbv2 describe-loadBalancers \
        --names budolEcosystem-InternalALB-${ENVIRONMENT} \
        --region ${AWS_REGION} \
        --query 'LoadBalancers[0].DNSName' \
        --output text 2>/dev/null || echo "")
    
    echo "External ALB DNS: ${external_alb_dns:-Not Found}"
    echo "Internal ALB DNS: ${internal_alb_dns:-Not Found}"
    echo ""
    
    # Test health endpoints via ALB
    local endpoints=(
        "budolid:/budolid/health"
        "budolaccounting:/accounting/health"
        "budolpay-gateway:/api/health"
    )
    
    # Note: These tests require network access to the ALB
    log_warn "ALB endpoint testing requires network access from current location"
    log_info "To test ALB endpoints manually:"
    echo "  curl -k https://${external_alb_dns}/budolid/health"
    echo "  curl -k https://${external_alb_dns}/accounting/health"
    echo "  curl -k https://${external_alb_dns}/api/health"
    
    # Check if we can reach the ALB (if we're in the same VPC or have access)
    if [ -n "$external_alb_dns" ]; then
        if curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" "http://${external_alb_dns}" 2>/dev/null | grep -q "301\|302\|404\|200"; then
            log_pass "External ALB is reachable"
        else
            log_warn "External ALB is not reachable from current location (this may be expected)"
        fi
    fi
}

# Check CloudWatch Logs
check_cloudwatch_logs() {
    section "CloudWatch Logs Check"
    
    local services=(
        "budolID"
        "budolAccounting"
        "budolPayGateway"
        "budolPayAuth"
        "budolPayWallet"
        "budolPayTransaction"
        "budolPayPayment"
        "budolPayKYC"
        "budolPaySettlement"
    )
    
    for service in "${services[@]}"; do
        local log_group="/ecs/${service}"
        
        # Check if log group exists
        if aws logs describe-log-groups --log-group-name-prefix ${log_group} --region ${AWS_REGION} --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "${log_group}"; then
            log_pass "Log group exists: ${log_group}"
        else
            log_warn "Log group not found: ${log_group}"
        fi
    done
}

# Check ECS Task Status
check_ecs_tasks() {
    section "ECS Task Status"
    
    local services=("budolID" "budolAccounting" "budolPayGateway" "budolPayAuth" "budolPayWallet" "budolPayTransaction" "budolPayPayment" "budolPayKYC" "budolPaySettlement")
    
    for service in "${services[@]}"; do
        local tasks=$(aws ecs list-tasks \
            --cluster ${CLUSTER_NAME} \
            --service-name ${service} \
            --region ${AWS_REGION} \
            --query 'taskArns' \
            --output json 2>/dev/null || echo "[]")
        
        local task_count=$(echo $tasks | jq 'length')
        
        if [ "$task_count" -gt 0 ]; then
            log_pass "Service ${service} has ${task_count} task(s) running"
            
            # Get task details
            local task_arns=$(echo $tasks | jq -r '.[]')
            for task_arn in $task_arns; do
                local task_status=$(aws ecs describe-tasks \
                    --cluster ${CLUSTER_NAME} \
                    --tasks ${task_arn} \
                    --region ${AWS_REGION} \
                    --query 'tasks[0].lastStatus' \
                    --output text 2>/dev/null || echo "UNKNOWN")
                
                log_info "  Task ${task_arn##*:} status: ${task_status}"
            done
        else
            log_warn "Service ${service} has no running tasks"
        fi
    done
}

# Check SSM Parameters
check_ssm_parameters() {
    section "SSM Parameter Store Check"
    
    local params=(
        "/budolEcosystem/${ENVIRONMENT}/ALB_EXTERNAL_DNS_NAME"
        "/budolEcosystem/${ENVIRONMENT}/ALB_INTERNAL_DNS_NAME"
        "/budolEcosystem/${ENVIRONMENT}/DATABASE_HOST"
        "/budolEcosystem/${ENVIRONMENT}/REDIS_HOST"
        "/budolEcosystem/${ENVIRONMENT}/ECS_CLUSTER_NAME"
    )
    
    for param in "${params[@]}"; do
        local value=$(aws ssm get-parameter --name "${param}" --region ${AWS_REGION} --query 'Parameter.Value' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$value" != "NOT_FOUND" ]; then
            log_pass "Parameter ${param} = ${value}"
        else
            log_warn "Parameter not found: ${param}"
        fi
    done
}

# Check Secrets
check_secrets() {
    section "Secrets Manager Check"
    
    local secrets=(
        "budolEcosystem/production/DATABASE_URL"
        "budolEcosystem/production/JWT_SECRET"
        "budolEcosystem/production/REDIS_PASSWORD"
    )
    
    for secret in "${secrets[@]}"; do
        if aws secretsmanager describe-secret --secret-id "${secret}" --region ${AWS_REGION} --query 'Name' --output text &>/dev/null; then
            log_pass "Secret exists: ${secret}"
        else
            log_warn "Secret not found: ${secret}"
        fi
    done
}

# Print summary
print_summary() {
    section "Verification Summary"
    
    echo -e "Passed: ${GREEN}${PASSED}${NC}"
    echo -e "Failed: ${RED}${FAILED}${NC}"
    echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
    
    if [ $FAILED -eq 0 ]; then
        echo ""
        log_pass "All critical checks passed!"
        return 0
    else
        echo ""
        log_fail "Some checks failed. Please review the output above."
        return 1
    fi
}

# Main function
main() {
    echo "========================================"
    echo "ECS Verification for budolEcosystem"
    echo "========================================"
    echo "Environment: ${ENVIRONMENT}"
    echo "AWS Region: ${AWS_REGION}"
    echo "Cluster: ${CLUSTER_NAME}"
    echo "========================================"
    
    # Run all checks
    check_ecs_service_health
    check_ecs_tasks
    check_target_group_health
    check_internal_dns
    check_alb_endpoints
    check_cloudwatch_logs
    check_ssm_parameters
    check_secrets
    
    # Print summary
    print_summary
}

# Parse command line arguments
case "$1" in
    services)
        check_ecs_service_health
        check_ecs_tasks
        ;;
    targets)
        check_target_group_health
        ;;
    dns)
        check_internal_dns
        ;;
    alb)
        check_alb_endpoints
        ;;
    logs)
        check_cloudwatch_logs
        ;;
    ssm)
        check_ssm_parameters
        ;;
    secrets)
        check_secrets
        ;;
    all|"")
        main
        ;;
    *)
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  services  - Check ECS service and task health"
        echo "  targets   - Check target group health"
        echo "  dns       - Check internal DNS resolution"
        echo "  alb       - Check ALB endpoints"
        echo "  logs      - Check CloudWatch logs"
        echo "  ssm       - Check SSM parameters"
        echo "  secrets   - Check Secrets Manager"
        echo "  all       - Run all checks (default)"
        exit 1
        ;;
esac
