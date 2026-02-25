#!/bin/bash

# ============================================
# BudolShap Deployment Script for Vercel
# ============================================
# This script automates the deployment process to Vercel with Postgres
# Author: Antigravity AI
# Last Updated: 2025-11-30

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_step() { echo -e "\n${MAGENTA}📝 $1${NC}"; }

# Parse arguments
SKIP_CHECKS=false
SKIP_MIGRATION=false
PRODUCTION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-checks) SKIP_CHECKS=true; shift ;;
        --skip-migration) SKIP_MIGRATION=true; shift ;;
        --production) PRODUCTION=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Banner
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🚀 BudolShap Vercel Deployment Script 🚀   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# Pre-deployment Checks
# ============================================
if [ "$SKIP_CHECKS" = false ]; then
    print_step "Running Pre-deployment Checks..."
    
    # Check if Node.js is installed
    print_info "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js version: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    print_info "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm version: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if Vercel CLI is installed
    print_info "Checking Vercel CLI installation..."
    if command -v vercel &> /dev/null; then
        VERCEL_VERSION=$(vercel --version)
        print_success "Vercel CLI version: $VERCEL_VERSION"
    else
        print_warning "Vercel CLI is not installed. Installing..."
        npm install -g vercel
        if [ $? -ne 0 ]; then
            print_error "Failed to install Vercel CLI."
            exit 1
        fi
        print_success "Vercel CLI installed successfully"
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    print_success "package.json found"
    
    # Check if prisma schema exists
    if [ ! -f "prisma/schema.prisma" ]; then
        print_error "Prisma schema not found at prisma/schema.prisma"
        exit 1
    fi
    print_success "Prisma schema found"
fi

# ============================================
# Vercel Authentication
# ============================================
print_step "Checking Vercel Authentication..."
if vercel whoami &> /dev/null; then
    print_success "Logged in to Vercel"
else
    print_warning "Not logged in to Vercel. Please log in..."
    vercel login
    if [ $? -ne 0 ]; then
        print_error "Failed to log in to Vercel."
        exit 1
    fi
fi

# ============================================
# Project Linking
# ============================================
print_step "Linking Vercel Project..."
if [ ! -d ".vercel" ]; then
    print_info "No existing Vercel project link found. Linking now..."
    vercel link
    if [ $? -ne 0 ]; then
        print_error "Failed to link project."
        exit 1
    fi
else
    print_success "Project already linked"
fi

# ============================================
# Environment Variables Check
# ============================================
print_step "Environment Variables Setup..."
print_info "Required environment variables for production:"
echo -e "  ${NC}- DATABASE_PROVIDER (postgresql)"
echo -e "  ${NC}- POSTGRES_PRISMA_URL"
echo -e "  ${NC}- POSTGRES_URL_NON_POOLING"
echo -e "  ${NC}- JWT_SECRET"
echo -e "  ${NC}- NEXT_PUBLIC_BASE_URL"
echo -e "  ${NC}- CLOUDINARY_API_KEY"
echo -e "  ${NC}- CLOUDINARY_API_SECRET"
echo -e "  ${NC}- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
echo -e "  ${NC}- PAYMONGO_SECRET_KEY (sk_live_...)"
echo -e "  ${NC}- PAYMONGO_PUBLIC_KEY (pk_live_...)"
echo -e "  ${NC}- LALAMOVE_API_KEY"
echo -e "  ${NC}- LALAMOVE_API_SECRET"
echo -e "  ${NC}- LALAMOVE_ENVIRONMENT (production)"
echo -e "  ${NC}- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD"
echo ""

read -p "Have you set all required environment variables in Vercel Dashboard? (y/n) " ENV_CONFIRM
if [ "$ENV_CONFIRM" != "y" ]; then
    print_warning "Please set environment variables first:"
    print_info "1. Go to https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables"
    print_info "2. Add all required variables for Production environment"
    print_info "3. Run this script again"
    exit 0
fi

# ============================================
# Pull Environment Variables
# ============================================
print_step "Pulling Environment Variables..."
if [ -f ".env.production" ]; then
    read -p ".env.production already exists. Overwrite? (y/n) " OVERWRITE
    if [ "$OVERWRITE" = "y" ]; then
        rm .env.production
        vercel env pull .env.production
    fi
else
    vercel env pull .env.production
fi

if [ $? -eq 0 ]; then
    print_success "Environment variables pulled successfully"
else
    print_warning "Could not pull environment variables. Continuing anyway..."
fi

# ============================================
# Install Dependencies
# ============================================
print_step "Installing Dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies."
    exit 1
fi
print_success "Dependencies installed"

# ============================================
# Generate Prisma Client
# ============================================
print_step "Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client."
    exit 1
fi
print_success "Prisma client generated"

# ============================================
# Database Migration
# ============================================
if [ "$SKIP_MIGRATION" = false ]; then
    print_step "Database Migration..."
    print_warning "This will apply migrations to your production database!"
    read -p "Continue with migration? (y/n) " MIGRATE_CONFIRM
    
    if [ "$MIGRATE_CONFIRM" = "y" ]; then
        # Check if dotenv-cli is installed
        if ! npm list -g dotenv-cli &> /dev/null; then
            print_info "Installing dotenv-cli..."
            npm install -g dotenv-cli
        fi
        
        # Run migration
        print_info "Running Prisma migration..."
        if [ -f ".env.production" ]; then
            npx dotenv -e .env.production -- npx prisma migrate deploy
        else
            npx prisma migrate deploy
        fi
        
        if [ $? -eq 0 ]; then
            print_success "Database migration completed"
        else
            print_error "Migration failed. Check the error above."
            read -p "Continue with deployment anyway? (y/n) " CONTINUE_ANYWAY
            if [ "$CONTINUE_ANYWAY" != "y" ]; then
                exit 1
            fi
        fi
    else
        print_warning "Skipping migration. Make sure your database is up to date!"
    fi
else
    print_warning "Migration skipped (--skip-migration flag)"
fi

# ============================================
# Build Test (Optional)
# ============================================
print_step "Build Verification..."
read -p "Run a local build test before deploying? (y/n) " BUILD_TEST
if [ "$BUILD_TEST" = "y" ]; then
    print_info "Running build test..."
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Build failed. Please fix errors before deploying."
        exit 1
    fi
    print_success "Build test passed"
fi

# ============================================
# Git Status Check
# ============================================
print_step "Checking Git Status..."
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    print_warning "You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Commit changes now? (y/n) " COMMIT_NOW
    if [ "$COMMIT_NOW" = "y" ]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        
        read -p "Push to GitHub? (y/n) " PUSH_NOW
        if [ "$PUSH_NOW" = "y" ]; then
            git push
            if [ $? -eq 0 ]; then
                print_success "Changes pushed to GitHub"
            else
                print_warning "Failed to push. Continuing with deployment..."
            fi
        fi
    fi
else
    print_success "No uncommitted changes"
fi

# ============================================
# Deployment
# ============================================
print_step "Deploying to Vercel..."
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║           READY TO DEPLOY TO VERCEL           ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$PRODUCTION" = true ]; then
    print_warning "Deploying to PRODUCTION environment"
else
    print_info "Deploying to PREVIEW environment (use --production flag for production)"
fi

read -p "Proceed with deployment? (y/n) " DEPLOY_CONFIRM
if [ "$DEPLOY_CONFIRM" = "y" ]; then
    if [ "$PRODUCTION" = true ]; then
        vercel --prod
    else
        vercel
    fi
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║          🎉 DEPLOYMENT SUCCESSFUL! 🎉         ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
        echo ""
        print_success "Your application is now live!"
        print_info "View your deployment: https://vercel.com/derflanoj2s-projects/budolshap"
        print_info "View logs: vercel logs"
        echo ""
    else
        echo ""
        echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║            ❌ DEPLOYMENT FAILED ❌            ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
        echo ""
        print_error "Deployment failed. Check the error messages above."
        print_info "View logs: vercel logs"
        exit 1
    fi
else
    print_warning "Deployment cancelled by user."
    print_info "You can deploy manually with: vercel --prod"
    exit 0
fi

# ============================================
# Post-deployment Verification
# ============================================
print_step "Post-deployment Checklist..."
echo ""
echo -e "${CYAN}Please verify the following:${NC}"
echo -e "  ${NC}[ ] Application loads without errors"
echo -e "  ${NC}[ ] User registration/login works"
echo -e "  ${NC}[ ] Product listings display correctly"
echo -e "  ${NC}[ ] Cart functionality works"
echo -e "  ${NC}[ ] Checkout process completes"
echo -e "  ${NC}[ ] Admin panel is accessible"
echo -e "  ${NC}[ ] PayMongo payments work (test mode)"
echo -e "  ${NC}[ ] Lalamove integration works"
echo -e "  ${NC}[ ] Email notifications are sent"
echo -e "  ${NC}[ ] Images load from Cloudinary"
echo ""

echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              DEPLOYMENT COMPLETE!              ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""
