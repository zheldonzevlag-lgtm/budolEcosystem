# BudolShap Frontend ECS Deployment Guide

**Version:** v14  
**Date:** 2026-03-03  
**Author:** Budol Orchestrator AI  
**Status:** Ready for Deployment

---

## 📋 Executive Summary

This guide documents the migration of the BudolShap frontend from AWS Amplify static hosting to AWS ECS Fargate. This migration resolves the 404 errors caused by Next.js SSR incompatibility with static hosting.

---

## 🎯 Problem Statement

### Issue
AWS Amplify static hosting cannot execute Next.js SSR (Server-Side Rendering) applications.

### Evidence
- ✅ Build: Successful (170 pages generated)
- ✅ Deployment: Successful (artifacts uploaded)
- ❌ Runtime: 404 errors on all routes (`/`, `/login`, `/admin`, etc.)

### Root Cause
Amplify static hosting serves files from S3/CloudFront without a Node.js runtime. Next.js SSR requires server-side execution for:
- Server-side rendering of pages
- API route handling
- Dynamic content generation

---

## ✅ Solution: ECS Deployment

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              budolshap.duckdns.org                      │
│              (DuckDNS → ALB)                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           AWS Application Load Balancer                 │
│  ┌────────────────┬──────────────────────────────────┐  │
│  │ Host: budolshap│.duckdns.org                       │  │
│  │ → ECS Service: │budolshap-frontend (Fargate)       │  │
│  ├────────────────┼──────────────────────────────────┤  │
│  │ Path: /api/*   │→ ECS Microservices                │  │
│  │ Path: /admin/* │→ Admin Service                    │  │
│  └────────────────┴──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Benefits

| Aspect | Benefit |
|--------|---------|
| **SSR Support** | Full Next.js SSR with Node.js runtime |
| **API Routes** | Work natively without CORS issues |
| **Single Domain** | Unified SSL certificate and DNS |
| **Consistency** | Same deployment model as microservices |
| **Monitoring** | CloudWatch logs in one place |
| **Scalability** | Auto-scaling with Fargate |

---

## 📁 Files Created/Modified

| File | Purpose | Location |
|------|---------|----------|
| `Dockerfile` | Multi-stage Docker build | `budolshap-0.1.0/` |
| `.dockerignore` | Optimize build context | `budolshap-0.1.0/` |
| `next.config.mjs` | Added `output: 'standalone'` | `budolshap-0.1.0/` |
| `deploy-budolshap-frontend.sh` | Automated deployment script | `scripts/` |
| `schema.prisma` | Database schema for Prisma | `budolshap-0.1.0/prisma/` |
| `amplify.yml` | Build configuration | Repository root |

---

## 🚀 Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Docker installed and running
3. Access to AWS Console for verification

### Step 1: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name budolshap-frontend \
  --region ap-southeast-1
```

### Step 2: Create Secrets in AWS Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name budolshap/database-url \
  --secret-string "postgresql://username:password@host:port/database"

# NextAuth Secret
aws secretsmanager create-secret \
  --name budolshap/nextauth-secret \
  --secret-string "your-nextauth-secret"

# NextAuth URL
aws secretsmanager create-secret \
  --name budolshap/nextauth-url \
  --secret-string "http://budolshap.duckdns.org"
```

### Step 3: Run Deployment Script

```bash
cd scripts
chmod +x deploy-budolshap-frontend.sh
./deploy-budolshap-frontend.sh [optional-version-tag]
```

The script will:
1. Build Docker image
2. Push to ECR
3. Create/update ECS task definition
4. Create/update ECS service
5. Configure ALB listener rule
6. Wait for service stabilization

### Step 4: Configure Custom Domain

1. **DuckDNS Configuration:**
   ```bash
   curl "https://www.duckdns.org/update?domains=budolshap&token=YOUR_TOKEN&ip=YOUR_ALB_IP"
   ```

2. **Route 53 (if using):**
   - Create A record pointing to ALB
   - Enable alias targeting

### Step 5: Configure SSL Certificate

1. **AWS Certificate Manager:**
   ```bash
   aws acm request-certificate \
     --domain-name budolshap.duckdns.org \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Update ALB Listener:**
   - Add HTTPS listener on port 443
   - Attach SSL certificate
   - Forward to target group

---

## 📊 Resource Specifications

### ECS Task Definition

| Resource | Value |
|----------|-------|
| CPU | 1024 (1 vCPU) |
| Memory | 2048 MB (2 GB) |
| Network Mode | awsvpc |
| Launch Type | FARGATE |
| Desired Count | 2 |

### Health Check Configuration

```json
{
  "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

### Auto-scaling (Recommended)

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/budolEcosystem-ECSCluster-tB0MiOs8XVqM/budolshap-frontend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-auto-scaling \
  --service-namespace ecs \
  --resource-id service/budolEcosystem-ECSCluster-tB0MiOs8XVqM/budolshap-frontend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## 🔧 Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** Target group health checks failing
**Solution:**
```bash
# Check service logs
aws logs tail /ecs/budolshap-frontend-task --follow

# Verify container is healthy
aws ecs describe-services \
  --cluster budolEcosystem-ECSCluster-tB0MiOs8XVqM \
  --services budolshap-frontend-service
```

### Issue: Container fails to start

**Cause:** Missing environment variables or secrets
**Solution:**
```bash
# Verify secrets exist
aws secretsmanager list-secrets --filter Key="name",Values="budolshap"

# Check task definition
aws ecs describe-task-definition --task-definition budolshap-frontend-task
```

### Issue: Domain not resolving

**Cause:** DNS propagation or configuration
**Solution:**
```bash
# Check DNS resolution
nslookup budolshap.duckdns.org

# Verify ALB DNS
aws elbv2 describe-load-balancers \
  --names budolEcosystem-ALB \
  --query "LoadBalancers[0].DNSName"
```

---

## 📈 Monitoring

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name budolshap-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=budolEcosystem-ECSCluster-tB0MiOs8XVqM Name=ServiceName,Value=budolshap-frontend-service \
  --evaluation-periods 2
```

### Log Groups

- ECS Task Logs: `/ecs/budolshap-frontend-task`
- ALB Access Logs: Configured on ALB

---

## 🔄 Rollback Procedure

If deployment fails:

```bash
# Update service to previous task definition
aws ecs update-service \
  --cluster budolEcosystem-ECSCluster-tB0MiOs8XVqM \
  --service budolshap-frontend-service \
  --task-definition budolshap-frontend-task:PREVIOUS_REVISION \
  --force-new-deployment
```

---

## 📝 Post-Deployment Checklist

- [ ] Application accessible at `http://budolshap.duckdns.org`
- [ ] HTTPS configured and working
- [ ] All routes responding correctly (`/`, `/login`, `/admin`)
- [ ] API routes functional (`/api/*`)
- [ ] Health checks passing
- [ ] CloudWatch logs showing no errors
- [ ] Auto-scaling configured (optional)
- [ ] SSL certificate renewed (if using ACM)

---

## 🔗 References

- [ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [BudolEcosystem Architecture](../system_architecture.md)

---

**Next Steps:**
1. Execute deployment script
2. Verify application accessibility
3. Configure SSL certificate
4. Set up monitoring and alerts
5. Apply same solution to budolAdmin

**Questions?** Refer to the troubleshooting section or check CloudWatch logs for detailed error messages.