# apply-all-rules.ps1
# Purpose: Apply all ALB listener rules using JSON files
# COMPLIANCE: PCI-DSS controlled ingress, least-privilege networking

$REGION = "ap-southeast-1"

$rules = @(
    "scripts/create-rule-kyc.json",
    "scripts/create-rule-payment.json",
    "scripts/create-rule-settlement.json",
    "scripts/create-rule-wallet.json",
    "scripts/create-rule-transaction.json"
)

Write-Host "===== Applying ALB Listener Rules =====" -ForegroundColor Cyan

foreach ($ruleFile in $rules) {
    if (Test-Path $ruleFile) {
        $ruleJson = Get-Content $ruleFile -Raw | ConvertFrom-Json
        
        $priority = $ruleJson.Priority
        $path = $ruleJson.Conditions[0].PathPatternConfig.Values[0]
        $tgName = $ruleJson.Actions[0].TargetGroupArn -split '/' | Select-Object -Last 1
        
        Write-Host ""
        Write-Host "[APPLY] Priority: $priority, Path: $path" -ForegroundColor Yellow
        
        # Apply the rule using AWS CLI
        $result = aws elbv2 create-rule `
            --cli-input-json "file://$ruleFile" `
            --region $REGION `
            --output json 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "    [OK] Rule created successfully" -ForegroundColor Green
        } else {
            # Check if it already exists
            if ($result -like "*RuleAlreadyExists*") {
                Write-Host "    [INFO] Rule already exists" -ForegroundColor Gray
            } elseif ($result -like "*PriorityInUse*") {
                Write-Host "    [WARN] Priority in use, trying next..." -ForegroundColor Yellow
            } else {
                Write-Host "    [ERROR] $result" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "[SKIP] File not found: $ruleFile" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "===== ALB Listener Rules Applied =====" -ForegroundColor Cyan
Write-Host "Run 'aws elbv2 describe-rules --listener-arn <listener-arn>' to verify" -ForegroundColor White
