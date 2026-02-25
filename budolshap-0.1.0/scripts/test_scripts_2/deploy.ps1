# ============================================
# BudolShap Deployment Script for Vercel
# ============================================
# This script automates the deployment process to Vercel with Postgres
# Author: Antigravity AI
# Last Updated: 2025-11-30

param(
    [switch]$SkipChecks,
    [switch]$SkipMigration,
    [switch]$Production
)

# Color functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Step { param($msg) Write-Host "`n📝 $msg" -ForegroundColor Magenta }

# Banner
Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 BudolShap Vercel Deployment Script 🚀   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Pre-deployment Checks
# ============================================
if (-not $SkipChecks) {
    Write-Step "Running Pre-deployment Checks..."
    
    # Check if Node.js is installed
    Write-Info "Checking Node.js installation..."
    try {
        $nodeVersion = node --version
        Write-Success "Node.js version: $nodeVersion"
    } catch {
        Write-Error "Node.js is not installed. Please install Node.js first."
        exit 1
    }
    
    # Check if npm is installed
    Write-Info "Checking npm installation..."
    try {
        $npmVersion = npm --version
        Write-Success "npm version: $npmVersion"
    } catch {
        Write-Error "npm is not installed. Please install npm first."
        exit 1
    }
    
    # Check if Vercel CLI is installed
    Write-Info "Checking Vercel CLI installation..."
    try {
        $vercelVersion = vercel --version
        Write-Success "Vercel CLI version: $vercelVersion"
    } catch {
        Write-Warning "Vercel CLI is not installed. Installing..."
        npm install -g vercel
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install Vercel CLI."
            exit 1
        }
        Write-Success "Vercel CLI installed successfully"
    }
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Are you in the project root?"
        exit 1
    }
    Write-Success "package.json found"
    
    # Check if prisma schema exists
    if (-not (Test-Path "prisma/schema.prisma")) {
        Write-Error "Prisma schema not found at prisma/schema.prisma"
        exit 1
    }
    Write-Success "Prisma schema found"
}

# ============================================
# Vercel Authentication
# ============================================
Write-Step "Checking Vercel Authentication..."
vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Not logged in to Vercel. Please log in..."
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to log in to Vercel."
        exit 1
    }
}
Write-Success "Logged in to Vercel"

# ============================================
# Project Linking
# ============================================
Write-Step "Linking Vercel Project..."
if (-not (Test-Path ".vercel")) {
    Write-Info "No existing Vercel project link found. Linking now..."
    vercel link
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to link project."
        exit 1
    }
} else {
    Write-Success "Project already linked"
}

# ============================================
# Environment Variables Check
# ============================================
Write-Step "Environment Variables Setup..."
Write-Info "Required environment variables for production:"
Write-Host "  - DATABASE_PROVIDER (postgresql)" -ForegroundColor Gray
Write-Host "  - POSTGRES_PRISMA_URL" -ForegroundColor Gray
Write-Host "  - POSTGRES_URL_NON_POOLING" -ForegroundColor Gray
Write-Host "  - JWT_SECRET" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_BASE_URL" -ForegroundColor Gray
Write-Host "  - CLOUDINARY_API_KEY" -ForegroundColor Gray
Write-Host "  - CLOUDINARY_API_SECRET" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" -ForegroundColor Gray
Write-Host "  - PAYMONGO_SECRET_KEY (sk_live_...)" -ForegroundColor Gray
Write-Host "  - PAYMONGO_PUBLIC_KEY (pk_live_...)" -ForegroundColor Gray
Write-Host "  - LALAMOVE_API_KEY" -ForegroundColor Gray
Write-Host "  - LALAMOVE_API_SECRET" -ForegroundColor Gray
Write-Host "  - LALAMOVE_ENVIRONMENT (production)" -ForegroundColor Gray
Write-Host "  - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD" -ForegroundColor Gray
Write-Host ""

$envConfirm = Read-Host "Have you set all required environment variables in Vercel Dashboard? (y/n)"
if ($envConfirm -ne "y") {
    Write-Warning "Please set environment variables first:"
    Write-Info "1. Go to https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables"
    Write-Info "2. Add all required variables for Production environment"
    Write-Info "3. Run this script again"
    exit 0
}

# ============================================
# Pull Environment Variables
# ============================================
Write-Step "Pulling Environment Variables..."
if (Test-Path ".env.production") {
    $overwrite = Read-Host ".env.production already exists. Overwrite? (y/n)"
    if ($overwrite -eq "y") {
        Remove-Item ".env.production"
        vercel env pull .env.production
    }
} else {
    vercel env pull .env.production
}
if ($LASTEXITCODE -eq 0) {
    Write-Success "Environment variables pulled successfully"
} else {
    Write-Warning "Could not pull environment variables. Continuing anyway..."
}

# ============================================
# Install Dependencies
# ============================================
Write-Step "Installing Dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies."
    exit 1
}
Write-Success "Dependencies installed"

# ============================================
# Generate Prisma Client
# ============================================
Write-Step "Generating Prisma Client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate Prisma client."
    exit 1
}
Write-Success "Prisma client generated"

# ============================================
# Database Migration
# ============================================
if (-not $SkipMigration) {
    Write-Step "Database Migration..."
    Write-Warning "This will apply migrations to your production database!"
    $migrateConfirm = Read-Host "Continue with migration? (y/n)"
    
    if ($migrateConfirm -eq "y") {
        # Check if dotenv-cli is installed
        npm list -g dotenv-cli 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Installing dotenv-cli..."
            npm install -g dotenv-cli
        }
        
        # Run migration
        Write-Info "Running Prisma migration..."
        if (Test-Path ".env.production") {
            npx dotenv -e .env.production -- npx prisma migrate deploy
        } else {
            npx prisma migrate deploy
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database migration completed"
        } else {
            Write-Error "Migration failed. Check the error above."
            $continueAnyway = Read-Host "Continue with deployment anyway? (y/n)"
            if ($continueAnyway -ne "y") {
                exit 1
            }
        }
    } else {
        Write-Warning "Skipping migration. Make sure your database is up to date!"
    }
} else {
    Write-Warning "Migration skipped (--SkipMigration flag)"
}

# ============================================
# Build Test (Optional)
# ============================================
Write-Step "Build Verification..."
$buildTest = Read-Host "Run a local build test before deploying? (y/n)"
if ($buildTest -eq "y") {
    Write-Info "Running build test..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed. Please fix errors before deploying."
        exit 1
    }
    Write-Success "Build test passed"
}

# ============================================
# Git Status Check
# ============================================
Write-Step "Checking Git Status..."
$gitStatus = git status --porcelain 2>$null
if ($gitStatus) {
    Write-Warning "You have uncommitted changes:"
    git status --short
    Write-Host ""
    $commitNow = Read-Host "Commit changes now? (y/n)"
    if ($commitNow -eq "y") {
        $commitMsg = Read-Host "Enter commit message"
        git add .
        git commit -m "$commitMsg"
        
        $pushNow = Read-Host "Push to GitHub? (y/n)"
        if ($pushNow -eq "y") {
            git push
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Changes pushed to GitHub"
            } else {
                Write-Warning "Failed to push. Continuing with deployment..."
            }
        }
    }
} else {
    Write-Success "No uncommitted changes"
}

# ============================================
# Deployment
# ============================================
Write-Step "Deploying to Vercel..."
Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║           READY TO DEPLOY TO VERCEL           ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

if ($Production) {
    Write-Warning "Deploying to PRODUCTION environment"
} else {
    Write-Info "Deploying to PREVIEW environment (use -Production flag for production)"
}

$deployConfirm = Read-Host "Proceed with deployment? (y/n)"
if ($deployConfirm -eq "y") {
    if ($Production) {
        vercel --prod
    } else {
        vercel
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║          🎉 DEPLOYMENT SUCCESSFUL! 🎉         ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Success "Your application is now live!"
        Write-Info "View your deployment: https://vercel.com/derflanoj2s-projects/budolshap"
        Write-Info "View logs: vercel logs"
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║            ❌ DEPLOYMENT FAILED ❌            ║" -ForegroundColor Red
        Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Red
        Write-Host ""
        Write-Error "Deployment failed. Check the error messages above."
        Write-Info "View logs: vercel logs"
        exit 1
    }
} else {
    Write-Warning "Deployment cancelled by user."
    Write-Info "You can deploy manually with: vercel --prod"
    exit 0
}

# ============================================
# Post-deployment Verification
# ============================================
Write-Step "Post-deployment Checklist..."
Write-Host ""
Write-Host "Please verify the following:" -ForegroundColor Cyan
Write-Host "  [ ] Application loads without errors" -ForegroundColor Gray
Write-Host "  [ ] User registration/login works" -ForegroundColor Gray
Write-Host "  [ ] Product listings display correctly" -ForegroundColor Gray
Write-Host "  [ ] Cart functionality works" -ForegroundColor Gray
Write-Host "  [ ] Checkout process completes" -ForegroundColor Gray
Write-Host "  [ ] Admin panel is accessible" -ForegroundColor Gray
Write-Host "  [ ] PayMongo payments work (test mode)" -ForegroundColor Gray
Write-Host "  [ ] Lalamove integration works" -ForegroundColor Gray
Write-Host "  [ ] Email notifications are sent" -ForegroundColor Gray
Write-Host "  [ ] Images load from Cloudinary" -ForegroundColor Gray
Write-Host ""

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              DEPLOYMENT COMPLETE!              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
