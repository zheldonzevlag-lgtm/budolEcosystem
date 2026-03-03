#Requires -Version 5.1
<#
.SYNOPSIS
    ECS Deployment Script for budolEcosystem Backend Services (Windows)
.DESCRIPTION
    This PowerShell script deploys ECS services to AWS using AWS CLI.
    It handles building/pushing Docker images, registering task definitions,
    and deploying/updating ECS services.
.PARAMETER Environment
    The deployment environment (default: production)
.PARAMETER Action
    The deployment action to perform: build, register, create, deploy, status, wait, all
.PARAMETER Service
    Optional specific service to deploy (e.g., budolid)
.PARAMETER ImageTag
    Docker image tag (default: latest)
.EXAMPLE
    .\ecs-deploy-windows.ps1 -Environment production -Action all
.EXAMPLE
    .\ecs-deploy-windows.ps1 -Environment production -Action build
.EXAMPLE
    .\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolid
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('production', 'staging', 'development')]
    [string]$Environment = 'production',

    [Parameter(Mandatory=$false)]
    [ValidateSet('build', 'register', 'create', 'deploy', 'status', 'wait', 'all')]
    [string]$Action = 'all',

    [Parameter(Mandatory=$false)]
    [string]$Service = '',

    [Parameter(Mandatory=$false)]
    [string]$ImageTag = 'latest'
)

# ============================================================================
# Configuration
# ============================================================================

$script:AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-southeast-1" }
$script:CLUSTER_NAME = "budolEcosystem-$Environment"
$script:ECR_REPO_PREFIX = ""

# Color codes for output
$script:RED = "`e[0;31m"
$script:GREEN = "`e[0;32m"
$script:YELLOW = "`e[1;33m"
$script:BLUE = "`e[0;34m"
$script:NC = "`e[0m" # No Color

# Services configuration
$script:Services = @{
    "budolID" = @{
        "taskFamily" = "budolID"
        "port" = 8000
        "targetGroup" = "budolID-tg"
        "desiredCount" = 2
    }
    "budolAccounting" = @{
        "taskFamily" = "budolAccounting"
        "port" = 8005
        "targetGroup" = "budolAccounting-tg"
        "desiredCount" = 2
    }
    "budolPayGateway" = @{
        "taskFamily" = "budolPayGateway"
        "port" = 8080
        "targetGroup" = "budolPayGateway-tg"
        "desiredCount" = 2
    }
    "budolPayAuth" = @{
        "taskFamily" = "budolPayAuth"
        "port" = 8001
        "targetGroup" = "budolPayAuth-tg"
        "desiredCount" = 2
    }
    "budolPayWallet" = @{
        "taskFamily" = "budolPayWallet"
        "port" = 8002
        "targetGroup" = "budolPayWallet-tg"
        "desiredCount" = 2
    }
    "budolPayTransaction" = @{
        "taskFamily" = "budolPayTransaction"
        "port" = 8003
        "targetGroup" = "budolPayTransaction-tg"
        "desiredCount" = 2
    }
    "budolPayPayment" = @{
        "taskFamily" = "budolPayPayment"
        "port" = 8004
        "targetGroup" = "budolPayPayment-tg"
        "desiredCount" = 2
    }
    "budolPayKYC" = @{
        "taskFamily" = "budolPayKYC"
        "port" = 8006
        "targetGroup" = "budolPayKYC-tg"
        "desiredCount" = 2
    }
    "budolPaySettlement" = @{
        "taskFamily" = "budolPaySettlement"
        "port" = 8007
        "targetGroup" = "budolPaySettlement-tg"
        "desiredCount" = 2
    }
}

# ============================================================================
# Helper Functions
# ============================================================================

function Write-LogInfo {
    param([string]$Message)
    Write-Host "$script:GREEN[INFO]$script:NC $Message" -NoNewline
    Write-Host ""
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "$script:YELLOW[WARN]$script:NC $Message" -NoNewline
    Write-Host ""
}

function Write-LogError {
    param([string]$Message)
    Write-Host "$script:RED[ERROR]$script:NC $Message" -NoNewline
    Write-Host ""
}

function Write-LogStep {
    param([string]$Message)
    Write-Host "$script:BLUE[STEP]$script:NC $Message" -NoNewline
    Write-Host ""
}

function Get-AWSAccountId {
    $result = aws sts get-caller-identity --query 'Account' --output text 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-LogError "Failed to get AWS account ID. Please check AWS credentials."
        exit 1
    }
    return $result
}

function Test-CommandExists {
    param([string]$Command)
    $exists = $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
    return $exists
}

function Get-SSMParameter {
    param(
        [string]$ParamName,
        [string]$DefaultValue = ""
    )
    
    $paramPath = "/budolEcosystem/$Environment/$ParamName"
    $value = aws ssm get-parameter --name $paramPath --region $script:AWS_REGION --query 'Parameter.Value' --output text 2>$null
    
    if ($value) {
        return $value
    }
    return $DefaultValue
}

function Get-SecretValue {
    param([string]$SecretName)
    
    $secretId = "budolEcosystem/$Environment/$SecretName"
    $value = aws secretsmanager get-secret-value --secret-id $secretId --region $script:AWS_REGION --query 'SecretString' --output text 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $value) {
        return $value
    }
    return ""
}

# ============================================================================
# Prerequisite Checks
# ============================================================================

function Test-Prerequisites {
    Write-LogStep "Checking prerequisites..."
    
    # Check AWS CLI
    if (-not (Test-CommandExists "aws")) {
        Write-LogError "AWS CLI is not installed"
        Write-Host "Please install AWS CLI: https://aws.amazon.com/cli/"
        exit 1
    }
    Write-LogInfo "AWS CLI found"
    
    # Check Docker
    if (-not (Test-CommandExists "docker")) {
        Write-LogError "Docker is not installed"
        Write-Host "Please install Docker: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    Write-LogInfo "Docker found"
    
    # Verify AWS credentials
    $script:AWS_ACCOUNT_ID = Get-AWSAccountId
    $script:ECR_REPO_PREFIX = "$script:AWS_ACCOUNT_ID.dkr.ecr.$script:AWS_REGION.amazonaws.com/budolecosystem"
    Write-LogInfo "AWS Account ID: $script:AWS_ACCOUNT_ID"
    
    # Check ECS cluster exists
    $clusterStatus = aws ecs describe-clusters --clusters $script:CLUSTER_NAME --region $script:AWS_REGION --query 'clusters[0].status' --output text 2>$null
    
    if ($clusterStatus -ne "ACTIVE") {
        Write-LogWarn "ECS cluster $script:CLUSTER_NAME does not exist or is not active"
        Write-LogInfo "Please deploy the CloudFormation stack first using AWS Console or AWS CLI"
    } else {
        Write-LogInfo "ECS cluster $script:CLUSTER_NAME is ACTIVE"
    }
    
    Write-LogInfo "Prerequisites check passed"
}

# ============================================================================
# Build and Push Docker Images
# ============================================================================

function Build-AndPushImages {
    Write-LogStep "Building and pushing Docker images..."
    
    # Login to ECR
    Write-LogInfo "Logging into ECR..."
    $ecrLogin = aws ecr get-login-password --region $script:AWS_REGION
    if ($LASTEXITCODE -ne 0) {
        Write-LogError "Failed to get ECR login password"
        exit 1
    }
    
    # Docker login to ECR
    $ecrLogin | docker login --username AWS --password-stdin $script:ECR_REPO_PREFIX 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-LogWarn "ECR login may have failed, continuing anyway..."
    }
    Write-LogInfo "ECR login successful"
    
    # Get VPC and Subnet info for task networking
    $vpcId = Get-SSMParameter "ECS_VPC_ID" ""
    $subnet1 = Get-SSMParameter "ECS_SUBNET_PUBLIC_1" ""
    $subnet2 = Get-SSMParameter "ECS_SUBNET_PUBLIC_2" ""
    
    # Build all services using Dockerfile.backend (multi-stage build)
    Write-LogInfo "Building all services using Dockerfile.backend..."
    
    # Build stages mapping
    $buildStages = @{
        "budolid" = "budol-id"
        "budolaccounting" = "budol-accounting"
        "budolpay-gateway" = "budol-gateway"
        "budolpay-auth" = "budol-auth"
        "budolpay-wallet" = "budol-wallet"
        "budolpay-transaction" = "budol-tx"
        "budolpay-payment" = "budol-payment"
        "budolpay-kyc" = "budol-kyc"
        "budolpay-settlement" = "budol-settlement"
    }
    
    $jobs = @()
    
    if (Test-Path "Dockerfile.backend") {
        Write-LogInfo "Building all services with Dockerfile.backend..."
        
        # Build all stages
        docker build -f Dockerfile.backend -t budol-build:latest . 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-LogInfo "Multi-stage build successful, tagging images..."
            
            foreach ($svc in $buildStages.Keys) {
                $stageName = $buildStages[$svc]
                $imageName = "$script:ECR_REPO_PREFIX/$svc"
                
                # Tag the image from the build stage
                docker tag budol-build:$stageName "${imageName}:${ImageTag}" 2>$null
                docker tag budol-build:$stageName "${imageName}:latest" 2>$null
                
                Write-LogInfo "Pushing $svc to ECR..."
                
                # Push images in background jobs
                $job1 = Start-Job -ScriptBlock {
                    param($img, $tag)
                    docker push "${img}:${tag}"
                } -ArgumentList $imageName, $ImageTag
                
                $job2 = Start-Job -ScriptBlock {
                    param($img)
                    docker push "${img}:latest"
                } -ArgumentList $imageName
                
                $jobs += $job1
                $jobs += $job2
                
                Write-LogInfo "$svc built and push initiated"
            }
            
            # Clean up build image
            docker rmi budol-build:latest 2>$null
        } else {
            Write-LogWarn "Docker build failed, trying individual services..."
            
            # Fallback: try individual Dockerfiles if they exist
            $serviceNames = @("budolid", "budolaccounting", "budolpay-gateway", "budolpay-auth", "budolpay-wallet", "budolpay-transaction", "budolpay-payment", "budolpay-kyc", "budolpay-settlement")
            
            foreach ($svc in $serviceNames) {
                $imageName = "$script:ECR_REPO_PREFIX/$svc"
                $dockerfileName = $svc -replace '-', '_'
                $dockerfilePath = "Dockerfile.$dockerfileName"
                
                if (Test-Path $dockerfilePath) {
                    docker build -t "${imageName}:${ImageTag}" -t "${imageName}:latest" -f $dockerfilePath . 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        $job1 = Start-Job -ScriptBlock {
                            param($img, $tag)
                            docker push "${img}:${tag}"
                        } -ArgumentList $imageName, $ImageTag
                        
                        $job2 = Start-Job -ScriptBlock {
                            param($img)
                            docker push "${img}:latest"
                        } -ArgumentList $imageName
                        
                        $jobs += $job1
                        $jobs += $job2
                        Write-LogInfo "$svc built and push initiated"
                    }
                }
            }
        }
    } else {
        Write-LogWarn "Dockerfile.backend not found, cannot build images"
    }
    
    # Wait for all push jobs to complete
    if ($jobs.Count -gt 0) {
        Write-LogInfo "Waiting for image pushes to complete..."
        $jobs | Wait-Job | Receive-Job
        $jobs | Remove-Job
    }
    
    Write-LogInfo "All images built and pushed successfully"
}

# ============================================================================
# Register ECS Task Definitions
# ============================================================================

function Register-TaskDefinitions {
    Write-LogStep "Registering ECS task definitions..."
    
    $taskDefMapping = @{
        "budolID" = "budolid"
        "budolAccounting" = "budolaccounting"
        "budolPayGateway" = "budolpay-gateway"
        "budolPayAuth" = "budolpay-auth"
        "budolPayWallet" = "budolpay-wallet"
        "budolPayTransaction" = "budolpay-transaction"
        "budolPayPayment" = "budolpay-payment"
        "budolPayKYC" = "budolpay-kyc"
        "budolPaySettlement" = "budolpay-settlement"
    }
    
    foreach ($taskFamily in $taskDefMapping.Keys) {
        $taskDefFile = $taskDefMapping[$taskFamily]
        Write-LogInfo "Registering $taskFamily task definition..."
        
        $taskDefPath = "ecs/task-definitions/$taskDefFile.json"
        
        if (-not (Test-Path $taskDefPath)) {
            Write-LogError "Task definition file not found: $taskDefPath"
            continue
        }
        
        # Read and replace placeholders in JSON
        $taskDefJson = Get-Content $taskDefPath -Raw
        $taskDefJson = $taskDefJson -replace '\${AWS_ACCOUNT_ID}', $script:AWS_ACCOUNT_ID
        $taskDefJson = $taskDefJson -replace '\${AWS_REGION}', $script:AWS_REGION
        $taskDefJson = $taskDefJson -replace '\${IMAGE_TAG}', $ImageTag
        
        # Create temp file with replaced values (use UTF-8 without BOM)
        $tempFile = "$env:TEMP\$taskDefFile-$ImageTag.json"
        [System.IO.File]::WriteAllText($tempFile, $taskDefJson, [System.Text.UTF8Encoding]::new($false))
        
        # Register task definition using cmd.exe to avoid PowerShell encoding issues
        $result = cmd /c "aws ecs register-task-definition --cli-input-json file://$tempFile --region $script:AWS_REGION --output json" 2>&1
        
        if ($LASTEXITCODE -eq 0 -or $result -like "*taskDefinition*") {
            Write-LogInfo "$taskFamily task definition registered"
        } else {
            Write-LogError "Failed to register $taskFamily task definition. Result: $result"
        }
        
        # Clean up temp file
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
    
    Write-LogInfo "All task definitions registered successfully"
}

# ============================================================================
# Get Latest Task Definition ARN
# ============================================================================

function Get-LatestTaskDefArn {
    param([string]$Family)
    
    $arn = aws ecs list-task-definitions `
        --family-prefix $Family `
        --status ACTIVE `
        --sort DESC `
        --max-items 1 `
        --region $script:AWS_REGION `
        --query 'taskDefinitionArns[0]' `
        --output text 2>$null
    
    return $arn
}

# ============================================================================
# Create ECS Services
# ============================================================================

function Create-Services {
    Write-LogStep "Creating ECS services..."
    
    # Get VPC and subnet info
    $vpcId = Get-SSMParameter "ECS_VPC_ID" ""
    $subnet1 = Get-SSMParameter "ECS_SUBNET_PUBLIC_1" ""
    $subnet2 = Get-SSMParameter "ECS_SUBNET_PUBLIC_2" ""
    
    # Get ALB ARNs
    $internalAlbArn = ""
    $externalAlbArn = ""
    
    try {
        $internalAlbArn = aws elbv2 describe-loadBalancers --names "budolEcosystem-InternalALB-$Environment" --region $script:AWS_REGION --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>$null
    } catch {}
    
    try {
        $externalAlbArn = aws elbv2 describe-loadBalancers --names "budolEcosystem-ALB-$Environment" --region $script:AWS_REGION --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>$null
    } catch {}
    
    # Get ECS security group
    $ecsSg = ""
    try {
        $ecsSg = aws ec2 describe-security-groups --filters "Name=group-name,Values=budolEcosystem-ECS-SG-$Environment" --region $script:AWS_REGION --query 'SecurityGroups[0].GroupId' --output text 2>$null
    } catch {}
    
    foreach ($serviceName in $script:Services.Keys) {
        $config = $script:Services[$serviceName]
        
        Write-LogInfo "Creating service $serviceName..."
        
        # Check if service already exists
        $existingService = aws ecs describe-services `
            --cluster $script:CLUSTER_NAME `
            --services $serviceName `
            --region $script:AWS_REGION `
            --query 'services[0].serviceName' `
            --output text 2>$null
        
        if ($existingService) {
            Write-LogWarn "Service $serviceName already exists, skipping creation"
            continue
        }
        
        # Get latest task definition
        $taskDefArn = Get-LatestTaskDefArn $config.taskFamily
        
        if (-not $taskDefArn) {
            Write-LogError "No task definition found for $($config.taskFamily), please register task definitions first"
            continue
        }
        
        # Get target group ARN
        $targetGroupArn = ""
        try {
            $targetGroupArn = aws elbv2 describe-target-groups `
                --names $config.targetGroup `
                --region $script:AWS_REGION `
                --query 'TargetGroups[0].TargetGroupArn' `
                --output text 2>$null
        } catch {}
        
        # Build network configuration
        $networkConfig = "awsvpcConfiguration={subnets=[$subnet1,$subnet2]"
        if ($ecsSg) {
            $networkConfig += ",securityGroups=[$ecsSg]"
        }
        $networkConfig += ",assignPublicIp=ENABLED}"
        
        if ($targetGroupArn) {
            # Create service with load balancer
            $lbConfig = "[{targetGroupArn=$targetGroupArn,containerName=$serviceName,containerPort=$($config.port)}]"
            
            aws ecs create-service `
                --cluster $script:CLUSTER_NAME `
                --service-name $serviceName `
                --task-definition $taskDefArn `
                --desired-count $config.desiredCount `
                --launch-type FARGATE `
                --network-configuration $networkConfig `
                --loadBalancers $lbConfig `
                --region $script:AWS_REGION
            
            if ($LASTEXITCODE -eq 0) {
                Write-LogInfo "Service $serviceName created with load balancer"
            } else {
                Write-LogError "Failed to create service $serviceName"
            }
        } else {
            # Create service without load balancer
            aws ecs create-service `
                --cluster $script:CLUSTER_NAME `
                --service-name $serviceName `
                --task-definition $taskDefArn `
                --desired-count $config.desiredCount `
                --launch-type FARGATE `
                --network-configuration $networkConfig `
                --region $script:AWS_REGION
            
            if ($LASTEXITCODE -eq 0) {
                Write-LogInfo "Service $serviceName created"
            } else {
                Write-LogError "Failed to create service $serviceName"
            }
        }
    }
    
    Write-LogInfo "All ECS services created successfully"
}

# ============================================================================
# Deploy ECS Services
# ============================================================================

function Deploy-Services {
    Write-LogStep "Deploying ECS services..."
    
    $serviceFilter = $Service
    
    foreach ($serviceName in $script:Services.Keys) {
        # Filter by specific service if provided
        if ($serviceFilter -and $serviceName -ne $serviceFilter) {
            continue
        }
        
        $config = $script:Services[$serviceName]
        
        Write-LogInfo "Deploying $serviceName..."
        
        # Get latest task definition ARN
        $taskDefArn = Get-LatestTaskDefArn $config.taskFamily
        
        if (-not $taskDefArn) {
            Write-LogError "No task definition found for $($config.taskFamily)"
            continue
        }
        
        # Update service
        aws ecs update-service `
            --cluster $script:CLUSTER_NAME `
            --service $serviceName `
            --task-definition $taskDefArn `
            --region $script:AWS_REGION `
            --force-new-deployment
        
        if ($LASTEXITCODE -eq 0) {
            Write-LogInfo "$serviceName deployment initiated"
        } else {
            Write-LogError "Failed to deploy $serviceName"
        }
    }
    
    Write-LogInfo "All services deployment initiated"
}

# ============================================================================
# Wait for Deployment
# ============================================================================

function Wait-ForDeployment {
    Write-LogStep "Waiting for deployment to complete..."
    
    $services = @("budolID", "budolAccounting", "budolPayGateway", "budolPayAuth", "budolPayWallet", "budolPayTransaction", "budolPayPayment", "budolPayKYC", "budolPaySettlement")
    $maxWait = 600  # 10 minutes max
    $elapsed = 0
    
    foreach ($service in $services) {
        Write-LogInfo "Waiting for $service..."
        
        $running = $false
        
        while ($elapsed -lt $maxWait) {
            $runningCount = aws ecs describe-services `
                --cluster $script:CLUSTER_NAME `
                --services $service `
                --region $script:AWS_REGION `
                --query 'services[0].runningCount' `
                --output text 2>$null
            
            $desiredCount = aws ecs describe-services `
                --cluster $script:CLUSTER_NAME `
                --services $service `
                --region $script:AWS_REGION `
                --query 'services[0].desiredCount' `
                --output text 2>$null
            
            if ($runningCount -eq $desiredCount -and $runningCount -gt 0) {
                Write-LogInfo "$service is running ($runningCount/$desiredCount)"
                $running = $true
                break
            }
            
            Write-Info "Waiting for $service... ($runningCount/$desiredCount)"
            Start-Sleep -Seconds 10
            $elapsed += 10
        }
        
        if (-not $running) {
            Write-LogWarn "Timeout waiting for $service"
        }
    }
    
    Write-LogInfo "Deployment wait complete"
}

# ============================================================================
# Show Service Status
# ============================================================================

function Show-Status {
    Write-LogStep "Service Status:"
    
    Write-Host ""
    Write-Host ("{0,-20} {1,-10} {2,-10} {3,-10} {4,-15}" -f "Service", "Desired", "Running", "Pending", "Status")
    Write-Host ("-" * 70)
    
    foreach ($serviceName in $script:Services.Keys) {
        $statusJson = aws ecs describe-services `
            --cluster $script:CLUSTER_NAME `
            --services $serviceName `
            --region $script:AWS_REGION `
            --query 'services[0]' `
            --output json 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $statusJson) {
            $status = $statusJson | ConvertFrom-Json
            $desired = $status.desiredCount
            $running = $status.runningCount
            $pending = $status.pendingCount
            $serviceStatus = $status.status
        } else {
            $desired = 0
            $running = 0
            $pending = 0
            $serviceStatus = "NOT_FOUND"
        }
        
        Write-Host ("{0,-20} {1,-10} {2,-10} {3,-10} {4,-15}" -f $serviceName, $desired, $running, $pending, $serviceStatus)
    }
    
    Write-Host ""
}

# ============================================================================
# Main
# ============================================================================

function Main {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ECS Deployment for budolEcosystem" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Environment: $Environment"
    Write-Host "AWS Region: $script:AWS_REGION"
    Write-Host "Cluster: $script:CLUSTER_NAME"
    Write-Host "Image Tag: $ImageTag"
    Write-Host "Action: $Action"
    if ($Service) { Write-Host "Service Filter: $Service" }
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Run prerequisite checks
    Test-Prerequisites
    
    # Execute the requested action
    switch ($Action) {
        "build" {
            Build-AndPushImages
        }
        "register" {
            Register-TaskDefinitions
        }
        "create" {
            Create-Services
        }
        "deploy" {
            Deploy-Services
        }
        "status" {
            Show-Status
        }
        "wait" {
            Wait-ForDeployment
        }
        "all" {
            Build-AndPushImages
            Register-TaskDefinitions
            Deploy-Services
        }
        default {
            Write-LogError "Invalid action: $Action"
            Write-Host ""
            Write-Host "Usage: .\ecs-deploy-windows.ps1 [-Environment <env>] [-Action <action>] [-Service <service>] [-ImageTag <tag>]"
            Write-Host ""
            Write-Host "Actions:"
            Write-Host "  build          - Build and push Docker images"
            Write-Host "  register       - Register ECS task definitions"
            Write-Host "  create         - Create ECS services (first time)"
            Write-Host "  deploy         - Deploy/update ECS services"
            Write-Host "  status         - Show service status"
            Write-Host "  wait           - Wait for deployment to complete"
            Write-Host "  all            - Full deployment (build, register, deploy)"
            Write-Host ""
            Write-Host "Examples:"
            Write-Host "  .\ecs-deploy-windows.ps1 -Environment production -Action all"
            Write-Host "  .\ecs-deploy-windows.ps1 -Environment production -Action build"
            Write-Host "  .\ecs-deploy-windows.ps1 -Environment production -Action deploy -Service budolid"
            Write-Host "  .\ecs-deploy-windows.ps1 -Environment production -Action status"
            exit 1
        }
    }
    
    Write-LogInfo "ECS deployment completed!"
}

# Run main function
Main
