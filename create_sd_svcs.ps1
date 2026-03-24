$ns = "ns-w425pzsclhvvu2ch"
$svcs = @("budol-auth", "budol-id", "budol-pay", "budolpay-gateway", "budol-shap", "budolpay-wallet", "budol-accounting", "budolpay-transaction", "budolpay-mobile", "budolpay-kyc", "budolpay-settlement", "budolpay-admin", "budolpay-websocket")

foreach ($s in $svcs) {
    Write-Host "Creating Service Discovery for $s..."
    aws servicediscovery create-service --name $s --dns-config "NamespaceId=$ns,RoutingPolicy=MULTIVALUE,DnsRecords=[{Type=A,TTL=60}]" --no-cli-pager --output json
}
