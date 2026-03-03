# Create CloudWatch log groups for ECS services
$region = "ap-southeast-1"
$groups = @(
    "/ecs/budolAccounting",
    "/ecs/budolid",
    "/ecs/budolPayAuth",
    "/ecs/budolPayGateway",
    "/ecs/budolPayKYC",
    "/ecs/budolPayPayment",
    "/ecs/budolPaySettlement",
    "/ecs/budolPayTransaction",
    "/ecs/budolPayWallet"
)

foreach ($group in $groups) {
    Write-Host "Creating log group: $group"
    aws logs create-log-group --log-group-name $group --region $region 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Log group created."
    } else {
        Write-Host "  Log group may already exist."
    }
}

Write-Host "All log groups processed!"
