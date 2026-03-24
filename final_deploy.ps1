cd "D:\IT Projects\clone\budolEcosystem"
$base = "194442925745.dkr.ecr.ap-southeast-1.amazonaws.com"
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin $base

# Build each stage from Dockerfile.backend and push
$stages = @{
    "budol-auth" = "budolpay-auth";
    "budol-gateway" = "budolpay-gateway";
    "budol-wallet" = "budolpay-wallet";
    "budol-tx" = "budolpay-transaction";
    "budol-payment" = "budolpay-payment";
    "budol-kyc" = "budolpay-kyc";
    "budol-settlement" = "budolpay-settlement";
    "budol-admin" = "budolpay-admin"
}

foreach ($stage in $stages.Keys) {
    $repo = $stages[$stage]
    Write-Host "--- Rebuilding and Pushing $repo (Stage: $stage) ---"
    docker build --target $stage -f Dockerfile.backend -t "$base/$repo:latest" .
    docker push "$base/$repo:latest"
}

# Also push websocket-server (separate folder, but was in svcs list)
Write-Host "--- Rebuilding and Pushing budolpay-websocket ---"
cd websocket-server
docker build -t "$base/budolpay-websocket:latest" .
docker push "$base/budolpay-websocket:latest"
cd ..

# Run sync script to register updated task definitions and force redeploy
python budol_v21_master_sync.py
