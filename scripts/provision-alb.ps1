# provision-alb.ps1
# WHY: CloudFormation stack was stuck in REVIEW_IN_PROGRESS. No ALB exists.
# DuckDNS pointed to NAT Gateway (3.0.109.211 = outbound-only IP).
# This script provisions an internet-facing ALB so external traffic can reach the cluster.
# COMPLIANCE: PCI-DSS controlled ingress, least-privilege security groups.

$REGION  = "ap-southeast-1"
$VPC_ID  = "vpc-0c9b92a3dd7c4a6fc"
$CLUSTER = "budolEcosystem-production"
$ENV     = "production"

# Public subnets in budolEcosystem-VPC - confirmed different AZs (1a + 1b)
$SUBNET_A = "subnet-0104f13b4ce618289"
$SUBNET_B = "subnet-0cc3fd60ecb72128d"

Write-Host "===== budolEcosystem ALB Provisioning =====" -ForegroundColor Cyan

# ------------------------------------------------------------------
# STEP 1: Create ALB Security Group
# ------------------------------------------------------------------
Write-Host ""
Write-Host "[1/7] Creating ALB Security Group..." -ForegroundColor Cyan

$albSgId = aws ec2 create-security-group `
    --group-name "budolEcosystem-ALB-SG-$ENV" `
    --description "ALB SG for budolEcosystem - allows HTTP HTTPS from internet" `
    --vpc-id $VPC_ID `
    --region $REGION `
    --query "GroupId" --output text --no-cli-pager 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "    [WARN] SG may exist, looking up..." -ForegroundColor Yellow
    $albSgId = aws ec2 describe-security-groups `
        --filters "Name=group-name,Values=budolEcosystem-ALB-SG-$ENV" `
                  "Name=vpc-id,Values=$VPC_ID" `
        --region $REGION `
        --query "SecurityGroups[0].GroupId" --output text --no-cli-pager
}

Write-Host "    ALB SG: $albSgId" -ForegroundColor Green

aws ec2 authorize-security-group-ingress `
    --group-id $albSgId --protocol tcp --port 80 `
    --cidr "0.0.0.0/0" --region $REGION --no-cli-pager 2>$null
aws ec2 authorize-security-group-ingress `
    --group-id $albSgId --protocol tcp --port 443 `
    --cidr "0.0.0.0/0" --region $REGION --no-cli-pager 2>$null

Write-Host "    Allowed ports 80 and 443 from 0.0.0.0/0" -ForegroundColor Green

# ------------------------------------------------------------------
# STEP 2: Create ECS Security Group
# ------------------------------------------------------------------
Write-Host ""
Write-Host "[2/7] Creating ECS Task Security Group..." -ForegroundColor Cyan

$ecsSgId = aws ec2 create-security-group `
    --group-name "budolEcosystem-ECS-SG-$ENV" `
    --description "ECS SG for budolEcosystem tasks - allows traffic from ALB only" `
    --vpc-id $VPC_ID `
    --region $REGION `
    --query "GroupId" --output text --no-cli-pager 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "    [WARN] SG may exist, looking up..." -ForegroundColor Yellow
    $ecsSgId = aws ec2 describe-security-groups `
        --filters "Name=group-name,Values=budolEcosystem-ECS-SG-$ENV" `
                  "Name=vpc-id,Values=$VPC_ID" `
        --region $REGION `
        --query "SecurityGroups[0].GroupId" --output text --no-cli-pager
}

Write-Host "    ECS SG: $ecsSgId" -ForegroundColor Green

# Allow gateway port from ALB only (least-privilege)
foreach ($port in @(8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8080)) {
    aws ec2 authorize-security-group-ingress `
        --group-id $ecsSgId --protocol tcp --port $port `
        --source-group $albSgId --region $REGION --no-cli-pager 2>$null
}

Write-Host "    Allowed ports 8000-8007 and 8080 from ALB SG" -ForegroundColor Green

# ------------------------------------------------------------------
# STEP 3: Create Internet-Facing ALB
# ------------------------------------------------------------------
Write-Host ""
Write-Host "[3/7] Creating internet-facing ALB..." -ForegroundColor Cyan

$existingAlbArn = aws elbv2 describe-load-balancers `
    --names "budolEcosystem-ALB-$ENV" `
    --region $REGION `
    --query "LoadBalancers[0].LoadBalancerArn" --output text --no-cli-pager 2>$null

if ($existingAlbArn -and $existingAlbArn -ne "None") {
    $albArn = $existingAlbArn
    $albDns = aws elbv2 describe-load-balancers `
        --load-balancer-arns $albArn `
        --region $REGION `
        --query "LoadBalancers[0].DNSName" --output text --no-cli-pager
    Write-Host "    Using existing ALB: $albDns" -ForegroundColor Yellow
} else {
    $albOutput = aws elbv2 create-load-balancer `
        --name "budolEcosystem-ALB-$ENV" `
        --subnets $SUBNET_A $SUBNET_B `
        --security-groups $albSgId `
        --scheme internet-facing `
        --type application `
        --ip-address-type ipv4 `
        --region $REGION `
        --query "LoadBalancers[0].[LoadBalancerArn,DNSName]" `
        --output json --no-cli-pager

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] ALB creation failed. Check subnets must be in 2 different AZs." -ForegroundColor Red
        Write-Host "Subnets: $SUBNET_A (1b), $SUBNET_B (1a)" -ForegroundColor Yellow
        exit 1
    }

    $albData = $albOutput | ConvertFrom-Json
    $albArn  = $albData[0]
    $albDns  = $albData[1]
    Write-Host "    ALB created: $albDns" -ForegroundColor Green
}

# ------------------------------------------------------------------
# STEP 4: Create Target Group for budolPayGateway (port 8080)
# ------------------------------------------------------------------
Write-Host ""
Write-Host "[4/7] Creating Target Group (budolPayGateway, port 8080)..." -ForegroundColor Cyan

$tgOutput = aws elbv2 create-target-group `
    --name "budolPayGateway-tg" `
    --protocol HTTP --port 8080 `
    --vpc-id $VPC_ID `
    --target-type ip `
    --health-check-path "/health" `
    --health-check-interval-seconds 30 `
    --healthy-threshold-count 2 `
    --unhealthy-threshold-count 3 `
    --region $REGION `
    --query "TargetGroups[0].TargetGroupArn" --output text --no-cli-pager 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "    [WARN] TG may exist, looking up..." -ForegroundColor Yellow
    $tgArn = aws elbv2 describe-target-groups `
        --names "budolPayGateway-tg" `
        --region $REGION `
        --query "TargetGroups[0].TargetGroupArn" --output text --no-cli-pager
} else {
    $tgArn = $tgOutput
}

Write-Host "    Target Group ARN: $tgArn" -ForegroundColor Green

# ------------------------------------------------------------------
# STEP 5: Create HTTP Listener
# ------------------------------------------------------------------
Write-Host ""
Write-Host "[5/7] Creating HTTP listener on port 80..." -ForegroundColor Cyan

$listenerArn = aws elbv2 create-listener `
    --load-balancer-arn $albArn `
    --protocol HTTP --port 80 `
    --default-actions "Type=forward,TargetGroupArn=$tgArn" `
    --region $REGION `
    --query "Listeners[0].ListenerArn" --output text --no-cli-pager 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "    Listener ARN: $listenerArn" -ForegroundColor Green
} else {
    Write-Host "    [WARN] Listener may already exist" -ForegroundColor Yellow
}

# ------------------------------------------------------------------
# STEP 6: Register ECS task IPs in Target Group
# ------------------------------------------------------------------
Write-Host ""
Write-Host "[6/7] Registering ECS task IPs into Target Group..." -ForegroundColor Cyan

$taskList = aws ecs list-tasks `
    --cluster $CLUSTER --service budolPayGateway `
    --region $REGION --query "taskArns" --output json --no-cli-pager | ConvertFrom-Json

if ($taskList -and $taskList.Count -gt 0) {
    $taskDetail = aws ecs describe-tasks `
        --cluster $CLUSTER --tasks ($taskList -join " ") `
        --region $REGION --output json --no-cli-pager | ConvertFrom-Json

    $registerArgs = @()
    foreach ($t in $taskDetail.tasks) {
        foreach ($att in $t.attachments) {
            foreach ($d in $att.details) {
                if ($d.name -eq "privateIPv4Address") {
                    Write-Host "    Task IP: $($d.value)" -ForegroundColor Green
                    $registerArgs += "Id=$($d.value),Port=8080"
                }
            }
        }
    }

    if ($registerArgs.Count -gt 0) {
        aws elbv2 register-targets `
            --target-group-arn $tgArn `
            --targets $registerArgs `
            --region $REGION --no-cli-pager
        Write-Host "    Registered $($registerArgs.Count) target(s)" -ForegroundColor Green
    }
} else {
    Write-Host "    [WARN] No running tasks found for budolPayGateway" -ForegroundColor Yellow
}

# ------------------------------------------------------------------
# STEP 7: DuckDNS instructions
# ------------------------------------------------------------------
Write-Host ""
Write-Host "[7/7] DNS Update - DuckDNS Configuration" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ALB DNS Name: $albDns" -ForegroundColor Yellow
Write-Host ""
Write-Host "  IMPORTANT: DuckDNS only supports A records (IP addresses), not CNAMEs." -ForegroundColor Red
Write-Host "  ALB IP addresses are dynamic and will change over time." -ForegroundColor Red
Write-Host ""

try {
    $albIps = [System.Net.Dns]::GetHostAddresses($albDns) |
        Where-Object { $_.AddressFamily -eq "InterNetwork" } |
        ForEach-Object { $_.IPAddressToString }
    Write-Host "  Current ALB IPs (may rotate): $($albIps -join ', ')" -ForegroundColor Yellow

    $dnsToken = $env:DUCKDNS_TOKEN
    if ($dnsToken) {
        $ip0 = $albIps[0]
        $url = "https://www.duckdns.org/update?domains=budolpay&token=$dnsToken&ip=$ip0"
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing
        Write-Host "  DuckDNS update result: $($r.Content)" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "  To update DuckDNS, set the DUCKDNS_TOKEN env var and re-run this script." -ForegroundColor Yellow
        if ($albIps) {
            $ip0 = $albIps[0]
            Write-Host "  Or run:" -ForegroundColor White
            Write-Host "    curl 'https://www.duckdns.org/update?domains=budolpay&token=<YOUR_TOKEN>&ip=$ip0'" -ForegroundColor White
        }
    }
} catch {
    Write-Host "  Could not resolve ALB IPs yet (ALB may still be provisioning)." -ForegroundColor Yellow
    Write-Host "  Try again in 2-3 minutes: nslookup $albDns" -ForegroundColor White
}

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  ALB PROVISIONING COMPLETE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  ALB DNS:      $albDns" -ForegroundColor Green
Write-Host "  ALB SG:       $albSgId" -ForegroundColor Green
Write-Host "  ECS SG:       $ecsSgId" -ForegroundColor Green
Write-Host "  Target Group: $tgArn" -ForegroundColor Green
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Update DuckDNS with one of the ALB IPs above." -ForegroundColor Yellow
Write-Host "  2. Update each ECS service to use SG: $ecsSgId" -ForegroundColor Yellow
Write-Host "  3. Wait ~2 min for health checks to pass, then test https://budolpay.duckdns.org" -ForegroundColor Yellow
Write-Host ""
