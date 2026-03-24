cd "D:\IT Projects\clone\budolEcosystem"
$base = '194442925745.dkr.ecr.ap-southeast-1.amazonaws.com'
# Retag
docker tag $base/budol-shap:latest $base/budol-shap:v23
docker tag $base/budol-id:latest $base/budolid:latest
docker tag $base/budol-pay:latest $base/budolpay-payment:latest
docker tag $base/budol-ws:latest $base/budolpay-websocket:latest

# Build Mobile
cd budolPayMobile
docker build -t $base/budolpay-mobile:latest . > ..\mobile-build.log 2>&1
cd ..

# Push explicitly
$images = @(
  "$base/budol-accounting:latest",
  "$base/budolid:latest",
  "$base/budol-shap:v23",
  "$base/budolpay-admin:latest",
  "$base/budolpay-auth:latest",
  "$base/budolpay-gateway:latest",
  "$base/budolpay-kyc:latest",
  "$base/budolpay-payment:latest",
  "$base/budolpay-mobile:latest",
  "$base/budolpay-settlement:latest",
  "$base/budolpay-transaction:latest",
  "$base/budolpay-wallet:latest",
  "$base/budolpay-websocket:latest"
)

foreach ($img in $images) {
    "Starting push for $img" | Out-File push-log.txt -Append
    docker push $img | Out-File push-log.txt -Append
}
