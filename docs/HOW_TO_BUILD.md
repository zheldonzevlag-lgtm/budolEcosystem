# How to Build and Push Docker Images

This guide explains how to build and push Docker images for the budolEcosystem services.

---

## Prerequisites

Before you begin, make sure you have the following installed on your computer:

| Requirement | Description |
|-------------|-------------|
| **Docker Desktop** | Container runtime - [Download here](https://www.docker.com/products/docker-desktop) |
| **AWS CLI** | Amazon Web Services command line tool - [Download here](https://aws.amazon.com/cli/) |
| **AWS Credentials** | Configured AWS access key with ECR permissions |

---

## Step 1: Enable and Start Docker Desktop

### On Windows:

1. **Search for Docker Desktop** in the Start menu
2. **Click to launch** Docker Desktop
3. Wait for Docker to start (the whale icon in the system tray will stop animating)

![Docker Desktop Icon](https://docs.docker.com/desktop/images/tray-icon.png)

### Verify Docker is Running:

Open PowerShell or Command Prompt and run:

```powershell
docker --version
```

Expected output:
```
Docker version 24.x.x
```

Then run:

```powershell
docker info
```

If Docker is running, you'll see detailed information about your Docker installation. If not, you'll see an error.

---

## Step 2: Configure AWS Credentials

If you haven't already configured AWS credentials, run:

```powershell
aws configure
```

Enter your:
- **AWS Access Key ID**
- **AWS Secret Access Key**
- **Default region name** (e.g., `ap-southeast-1`)
- **Default output format** (e.g., `json`)

### Verify AWS Credentials:

```powershell
aws sts get-caller-identity
```

You should see your AWS account information.

---

## Step 3: Navigate to the Project

Open PowerShell or Command Prompt and navigate to the project root:

```powershell
cd d:\IT Projects\budolEcosystem
```

---

## Step 4: Run the Build Script

### Option A: Build and Push ALL Services

To build and push all services at once:

```powershell
.\scripts\build-and-push.ps1 -Action all -ImageTag v1.0.0
```

### Option B: Build and Push a Single Service

To build and push a specific service:

```powershell
.\scripts\build-and-push.ps1 -Service budolid -ImageTag v1.0.0
```

### Option C: Build Only (No Push)

```powershell
.\scripts\build-and-push.ps1 -Action build -ImageTag v1.0.0
```

### Option D: Push Only (Already Built)

```powershell
.\scripts\build-and-push.ps1 -Action push -ImageTag v1.0.0
```

---

## What to Expect

When you run the script, you'll see output similar to:

```
========================================
  budolEcosystem Docker Build Script
========================================

[INFO] Checking prerequisites...
[INFO] Docker: Docker version 24.0.0
[INFO] AWS CLI: aws-cli/2.15.0
[INFO] AWS Account: 123456789012
[INFO] AWS Region: ap-southeast-1
[INFO] Image Tag: v1.0.0
[INFO] Logging into ECR...
[INFO] ECR login successful
[INFO] Building all service images...
[INFO] Building budolid (target: budol-id)...
[INFO] budolid built successfully
[INFO] Building budolaccounting (target: budol-accounting)...
[INFO] budolaccounting built successfully
... (more services)
[INFO] All images built successfully
[INFO] Pushing all service images to ECR...
[INFO] Pushing budolid to ECR...
[INFO] budolid pushed successfully
... (more services)
[INFO] All images pushed successfully
[INFO] Docker build and push completed!
[INFO] Image Tag: v1.0.0
```

---

## How to Verify It Worked

### Option 1: Check ECR Console

1. Go to [Amazon ECR Console](https://console.aws.amazon.com/ecr/)
2. Select your region
3. You should see repositories like:
   - `budolEcosystem/budolid`
   - `budolEcosystem/budolaccounting`
   - `budolEcosystem/budolpay-gateway`
   - etc.

### Option 2: List Images via AWS CLI

```powershell
aws ecr list-images --repository-name budolEcosystem/budolid --region ap-southeast-1
```

You should see image manifests with your tag (e.g., `v1.0.0` or `latest`).

### Option 3: List Local Docker Images

```powershell
docker images
```

You should see images like:
```
REPOSITORY                              TAG       IMAGE ID       CREATED
123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/budolEcosystem/budolid   latest    abc123def456   2 minutes ago
```

---

## Available Services

The following services can be built:

| Service | Description |
|---------|-------------|
| `budolid` | SSO/Identity Service |
| `budolaccounting` | Accounting Service |
| `budolpay-gateway` | API Gateway |
| `budolpay-auth` | Authentication Service |
| `budolpay-wallet` | Wallet Service |
| `budolpay-transaction` | Transaction Service |
| `budolpay-payment` | Payment Gateway Service |
| `budolpay-kyc` | KYC/Verification Service |
| `budolpay-settlement` | Settlement Service |

---

## Troubleshooting

### Docker Not Running

If you see "Docker is not running", make sure Docker Desktop is started and the Docker service is running.

### AWS Credentials Error

If you see "AWS credentials not configured", run:
```powershell
aws configure
```

### Build Fails

Check that you're in the project root directory and all source files are present.

### ECR Login Fails

Make sure your AWS user has permission to push to ECR.

---

## Quick Reference

```powershell
# Build and push everything
.\scripts\build-and-push.ps1 -Action all -ImageTag v1.0.0

# Build just one service
.\scripts\build-and-push.ps1 -Service budolid -ImageTag v1.0.0

# See available services
.\scripts\build-and-push.ps1 -Action list
```
