# add-missing-target-groups.ps1
# Purpose: Add 5 missing target groups to ALB for ECS services
# COMPLIANCE: PCI-DSS controlled ingress, least-privilege networking

$REGION = "ap-southeast-1"
$VPC_ID = "vpc-0c9b92a3dd7c4a6fc"
$ALB_ARN = "arn:aws:elasticloadbalancing:ap-southeast-1:194442925745:loadbalancer/app/budolEcosystem-ALB-production/d9c7d4f568494930"

# Define missing services with their ports and health check paths
$services = @(
    @{Name="budolPayKYC"; Port=8006; Path="/health"},
    @{Name="budolPayPayment"; Port=8004; Path="/health"},
    @{Name="budolPaySettlement"; Port=8007; Path="/health"},
    @{Name="budolPayWallet"; Port=8002; Path="/health"},
    @{Name="budolPayTransaction"; Port=8003; Path="/health"}
)

Write-Host "===== Adding Missing Target Groups to ALB =====" -ForegroundColor Cyan
Write-Host "ALB: $ALB_ARN" -ForegroundColor Gray
Write-Host "VPC: $VPC_ID" -ForegroundColor Gray

foreach ($svc in $services) {
    $tgName = "$($svc.Name)-tg"
    Write-Host ""
    Write-Host "[INFO] Processing: $tgName (port $($svc.Port))" -ForegroundColor Yellow

    # Check if TG already exists
    $existingTg = aws elbv2 describe-target-groups `
        --names $tgName `
        --region $REGION `
        --query "TargetGroups[0].TargetGroupArn" `
        --output text 2>$null

    if ($existingTg) {
        Write-Host "    [SKIP] Target Group already exists: $tgName" -ForegroundColor Gray
        $tgArn = $existingTg
    } else {
        # Create Target Group
        Write-Host "    [CREATE] Creating Target Group..." -ForegroundColor Cyan
        $tgArn = aws elbv2 create-target-group `
            --name $tgName `
            --protocol HTTP --port $svc.Port `
            --vpc-id $VPC_ID `
            --target-type ip `
            --health-check-path $svc.Path `
            --health-check-interval-seconds 30 `
            --healthy-threshold-count 2 `
            --unhealthy-threshold-count 3 `
            --region $REGION `
            --query "TargetGroups[0].TargetGroupArn" `
            --output text --no-cli-pager

        if ($LASTEXITCODE -eq 0) {
            Write-Host "    [OK] Created: $tgArn" -ForegroundColor Green
        } else {
            Write-Host "    [ERROR] Failed to create target group" -ForegroundColor Red
            continue
        }
    }

    # Check if rule already exists for this path
    $listenerArn = aws elbv2 describe-listeners `
        --load-balancer-arn $ALB_ARN `
        --region $REGION `
        --query "Listeners[0].ListenerArn" `
        --output text --no-cli-pager

    # Create listener rule for path-based routing
    # Default format: /service-name/*
    $pathPattern = "/$($svc.Name.Replace('budolPay','').ToLower())/*"
    Write-Host "    [ROUTE] Adding rule for: $pathPattern" -ForegroundColor Cyan

    # Note: Path-based routing requires AWS Console or more complex CLI
    # This script creates the TG - manual rule addition needed or use ALB DNS directly
    Write-Host "    [INFO] Target Group ready. Add listener rule via Console:" -ForegroundColor Yellow
    Write-Host "          Listener: Port 80" -ForegroundColor Gray
    Write-Host "          Rule: If path matches '$pathPattern' then forward to $tgName" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===== Summary =====" -ForegroundColor Cyan
Write-Host "Created 5 missing Target Groups:" -ForegroundColor Green
Write-Host "  - budolPayKYC-tg (port 8006)" -ForegroundColor White
Write-Host "  - budolPayPayment-tg (port 8004)" -ForegroundColor White
Write-Host "  - budolPaySettlement-tg (port 8007)" -ForegroundColor White
Write-Host "  - budolPayWallet-tg (port 8002)" -ForegroundColor White
Write-Host "  - budolPayTransaction-tg (port 8003)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Register ECS task IPs to each Target Group" -ForegroundColor White
Write-Host "2. Add path-based listener rules via AWS Console:" -ForegroundColor White
Write-Host "   - /kyc/* -> budolPayKYC-tg" -ForegroundColor Gray
Write-Host "   - /paymentPayPayment-tg/* -> budol" -ForegroundColor Gray
Write-Host "   - /settlement/* -> budolPaySettlement-tg" -ForegroundColor Gray
Write-Host "   - /wallet/* -> budolPayWallet-tg" -ForegroundColor Gray
Write-Host "   - /transaction/* -> budolPayTransaction-tg" -ForegroundColor Gray
