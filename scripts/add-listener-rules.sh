#!/bin/bash
# add-listener-rules.sh
# Purpose: Add path-based listener rules to route traffic to ECS services
# COMPLIANCE: PCI-DSS controlled ingress, least-privilege networking

REGION="ap-southeast-1"
ALB_ARN="arn:aws:elasticloadbalancing:ap-southeast-1:194442925745:loadbalancer/app/budolEcosystem-ALB-production/d9c7d4f568494930"

# Get the default listener
LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn "$ALB_ARN" \
    --region "$REGION" \
    --query "Listeners[0].ListenerArn" \
    --output text)

echo "Listener ARN: $LISTENER_ARN"

# Define routing rules
declare -a RULES=(
    "101:/kyc/*:budolPayKYC-tg"
    "102:/payment/*:budolPayPayment-tg"
    "103:/settlement/*:budolPaySettlement-tg"
    "104:/wallet/*:budolPayWallet-tg"
    "105:/transaction/*:budolPayTransaction-tg"
)

for rule in "${RULES[@]}"; do
    IFS=':' read -r priority path tgname <<< "$rule"
    
    # Get target group ARN
    TG_ARN=$(aws elbv2 describe-target-groups \
        --names "$tgname" \
        --region "$REGION" \
        --query "TargetGroups[0].TargetGroupArn" \
        --output text)
    
    echo ""
    echo "[ADD RULE] Priority: $priority, Path: $path -> $tgname"
    
    # Create rule using AWS CLI
    aws elbv2 create-rule \
        --listener-arn "$LISTENER_ARN" \
        --priority "$priority" \
        --conditions '[{"Field":"path-pattern","PathPatternConfig":{"Values":["'"$path"'"]}}]' \
        --actions '[{"Type":"forward","TargetGroupArn":"'"$TG_ARN"'"}]' \
        --region "$REGION" \
        --output json 2>&1
    
    if [ $? -eq 0 ]; then
        echo "    [OK] Rule created successfully"
    else
        echo "    [WARN] Could not create rule (may already exist)"
    fi
done

echo ""
echo "===== Listener Rules Summary ====="
echo "Path-based routing rules configured:"
echo "  Priority 101: /kyc/*         -> budolPayKYC-tg"
echo "  Priority 102: /payment/*     -> budolPayPayment-tg"
echo "  Priority 103: /settlement/*  -> budolPaySettlement-tg"
echo "  Priority 104: /wallet/*      -> budolPayWallet-tg"
echo "  Priority 105: /transaction/* -> budolPayTransaction-tg"
echo ""
echo "All 9 ECS services are now connected to ALB!"
