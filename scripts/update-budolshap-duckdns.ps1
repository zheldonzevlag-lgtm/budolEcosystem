# update-budolshap-duckdns.ps1
# Purpose: Update budolshap.duckdns.org to point to the ECS ALB
# Usage: Set DUCKDNS_TOKEN environment variable before running

$DUCKDNS_DOMAIN = "budolshap"
$ALB_DNS = "budol-ecs-alb-1870015523.eu-central-1.elb.amazonaws.com"
$TOKEN = $env:DUCKDNS_TOKEN

if (-not $TOKEN) {
    Write-Host "[ERROR] DUCKDNS_TOKEN environment variable is not set." -ForegroundColor Red
    Write-Host "Set it with: `$env:DUCKDNS_TOKEN = 'your-token-here'" -ForegroundColor Yellow
    Write-Host "Get your token from: https://www.duckdns.org/" -ForegroundColor Cyan
    exit 1
}

# Resolve current ALB IP
Write-Host "Resolving ALB: $ALB_DNS" -ForegroundColor Cyan
try {
    $ips = [System.Net.Dns]::GetHostAddresses($ALB_DNS) |
        Where-Object { $_.AddressFamily -eq "InterNetwork" } |
        ForEach-Object { $_.IPAddressToString }
    $ip = $ips[0]
    Write-Host "ALB IP resolved: $ip" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Could not resolve ALB DNS. ALB may be provisioning." -ForegroundColor Red
    exit 1
}

# Update DuckDNS
$url = "https://www.duckdns.org/update?domains=$DUCKDNS_DOMAIN&token=$TOKEN&ip=$ip"
try {
    $result = Invoke-WebRequest -Uri $url -UseBasicParsing
    if ($result.Content -eq "OK") {
        Write-Host "✅ DuckDNS updated: $DUCKDNS_DOMAIN.duckdns.org -> $ip" -ForegroundColor Green
        Write-Host "   URL: http://$DUCKDNS_DOMAIN.duckdns.org" -ForegroundColor Cyan
    } else {
        Write-Host "[ERROR] DuckDNS returned: $($result.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] DuckDNS update failed: $($_.Exception.Message)" -ForegroundColor Red
}
