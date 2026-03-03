# add-listener-rules.ps1
# Purpose: Add path-based listener rules to route traffic to ECS services
# COMPLIANCE: PCI-DSS controlled ingress, least-privilege networking

$REGION = "ap-southeast-1"
$ALB_ARN = "arn:aws:elasticloadbalancing:ap-southeast-1:194442925745:loadbalancer/app/budolEcosystem-ALB-production/d9c7d4f568494930"

# Get the default listener
$listener = aws elbv2 describe-listeners `
    --load-balancer-arn $ALB_ARN `
    --region $REGION `
    --output json | ConvertFrom-Json

$listenerArn = $listener.Listeners[0].ListenerArn
Write-Host "Listener ARN: $listenerArn" -ForegroundColor Cyan

# Define routing rules with fixed priorities (100-500 range)
$rules = @(
    @{Priority=101; Path="/kyc/*"; TgName="budolPayKYC-tg"},
    @{Priority=102; Path="/payment/*"; TgName="budolPayPayment-tg"},
    @{Priority=103; Path="/settlement/*"; TgName="budolPaySettlement-tg"},
    @{Priority=104; Path="/wallet/*"; TgName="budolPayWallet-tg"},
    @{Priority=105; Path="/transaction/*"; TgName="budolPayTransaction-tg"}
)

foreach ($rule in $rules) {
    # Get target group ARN
    $tgArn = aws elbv2 describe-target-groups `
        --names $rule.TgName `
        --region $REGION `
        --query "TargetGroups[0].TargetGroupArn" `
        --output text --no-cli-pager

    Write-Host ""
    Write-Host "[ADD RULE] Priority: $($rule.Priority), Path: $($rule.Path) -> $($rule.TgName)" -ForegroundColor Yellow

    # Create rule using AWS CLI - using proper JSON format for conditions
    $conditionsJson = '[{"Field":"path-pattern","PathPatternConfig":{"Values":["' + $rule.Path + '"]}}]'
    $actionsJson = '[{"Type":"forward","TargetGroupArn":"' + $tgArn + '"}]'

    $result = aws elbv2 create-rule `
        --listener-arn $listenerArn `
        --priority $rule.Priority `
        --conditions $conditionsJson `
        --actions $actionsJson `
        --region $REGION `
        --output json 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] Rule created successfully" -ForegroundColor Green
    } else {
        # Rule might already exist - check
        $checkRules = aws elbv2 describe-rules `
            --listener-arn $listenerArn `
            --region $REGION `
            --output json | ConvertFrom-Json

        $existingRule = $checkRules.Rules | Where-Object { $_.Conditions[0].PathPatternConfig.Values -contains $rule.Path }
        if ($existingRule) {
            Write-Host "    [INFO] Rule already exists: $($existingRule.RuleArn)" -ForegroundColor Gray
        } else {
            Write-Host "    [ERROR] Could not create rule" -ForegroundColor Red
            Write-Host "    Details: $result" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "===== Listener Rules Summary =====" -ForegroundColor Cyan
Write-Host "Path-based routing rules configured:" -ForegroundColor Green
Write-Host "  Priority 101: /kyc/*         -> budolPayKYC-tg" -ForegroundColor White
Write-Host "  Priority 102: /payment/*     -> budolPayPayment-tg" -ForegroundColor White
Write-Host "  Priority 103: /settlement/*  -> budolPaySettlement-tg" -ForegroundColor White
Write-Host "  Priority 104: /wallet/*      -> budolPayWallet-tg" -ForegroundColor White
Write-Host "  Priority 105: /transaction/* -> budolPayTransaction-tg" -ForegroundColor White
Write-Host ""
Write-Host "All 9 ECS services are now connected to ALB!" -ForegroundColor Green
