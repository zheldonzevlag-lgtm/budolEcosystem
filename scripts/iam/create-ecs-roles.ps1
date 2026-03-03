# Create ECS Task Roles for all services
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

$trustPolicy | Out-File -FilePath "$env:TEMP\ecs-trust-policy.json" -Encoding utf8

$roles = @(
    "budolIDTaskRole",
    "budolPayAuthTaskRole",
    "budolPayWalletTaskRole",
    "budolPayTransactionTaskRole",
    "budolPayPaymentTaskRole",
    "budolPayKYCTaskRole",
    "budolPaySettlementTaskRole"
)

foreach ($role in $roles) {
    Write-Host "Checking/Creating role: $role"
    $check = aws iam get-role --role-name $role 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Role does not exist. Creating..."
        aws iam create-role --role-name $role --assume-role-policy-document file://scripts/iam/ecs-task-trust-policy.json --description "Task role for $role ECS service"
        aws iam attach-role-policy --role-name $role --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
        Write-Host "  Role created and policy attached."
    } else {
        Write-Host "  Role already exists."
    }
}

Write-Host "All roles created successfully!"
