# Recreate missing Secrets Manager entries for budolEcosystem
$region = "ap-southeast-1"
$dbUrl = "postgres://6887eba7728406a3794c8b9157f83d05715b0bbe9f2ed925192dc173b6bd5302:sk_YA0EnXuIb5pbjW6uW-jma@db.prisma.io:5432/postgres?sslmode=require"
$jwtSecret = "GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc="
$redisPass = "xoR3b+R0fzznHipWz/X47JCG/KlMchTSwF83jAcV32c="

$secrets = @{
    "budolEcosystem/BUDOLACCOUNTING_DATABASE_URL" = $dbUrl
    "budolEcosystem/BUDOLID_DATABASE_URL"         = "$dbUrl&search_path=budolid"
    "budolEcosystem/BUDOLSHAP_DATABASE_URL"       = $dbUrl
    "budolEcosystem/JWT_SECRET"                   = $jwtSecret
    "budolEcosystem/REDIS_PASSWORD"               = $redisPass
    "budolEcosystem/DATABASE_URL"                 = $dbUrl
}

# Add service-specific database URLs (most use the main DB URL)
$services = @("budolPayAuth", "budolPayGateway", "budolPayKYC", "budolPayPayment", "budolPaySettlement", "budolPayTransaction", "budolPayWallet")
foreach ($svc in $services) {
    $name = "budolEcosystem/$($svc.ToUpper())_DATABASE_URL"
    $secrets[$name] = $dbUrl
}

foreach ($name in $secrets.Keys) {
    Write-Host "Creating secret: $name"
    $val = $secrets[$name]
    aws secretsmanager create-secret --name $name --secret-string $val --region $region 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Secret may already exist, attempting update..."
        aws secretsmanager put-secret-value --secret-id $name --secret-string $val --region $region
    }
}

Write-Host "All secrets processed!"
