# update-duckdns.ps1
# WHY: DuckDNS only supports A records. The ALB IP can rotate, so this
# script should be run periodically (or via scheduled task) to keep
# budolpay.duckdns.org pointing to a live ALB IP.
#
# SETUP: Set DUCKDNS_TOKEN environment variable before running.
# Run via Task Scheduler every 5 minutes for high-availability DNS.

$DUCKDNS_DOMAIN = "budolpay"
$ALB_DNS = "budolEcosystem-ALB-production-1846183833.ap-southeast-1.elb.amazonaws.com"
$TOKEN = $env:DUCKDNS_TOKEN

if (-not $TOKEN) {
    Write-Host "[ERROR] DUCKDNS_TOKEN environment variable is not set." -ForegroundColor Red
    Write-Host "Set it with: `$env:DUCKDNS_TOKEN = 'your-token-here'" -ForegroundColor Yellow
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
        Write-Host "DuckDNS updated: $DUCKDNS_DOMAIN.duckdns.org -> $ip" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] DuckDNS returned: $($result.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] DuckDNS update failed: $($_.Exception.Message)" -ForegroundColor Red
}
