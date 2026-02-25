# PostgreSQL Local Setup Script
# This script helps you set up PostgreSQL for local development

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Local Setup for Budolshap" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>&1
    Write-Host "PostgreSQL is installed: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Database Connection Information" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for database credentials
$dbUser = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$dbPassword = Read-Host "Enter PostgreSQL password (leave empty if no password)"

$dbHost = Read-Host "Enter PostgreSQL host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    $dbHost = "localhost"
}

$dbPort = Read-Host "Enter PostgreSQL port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "5432"
}

$dbName = Read-Host "Enter database name (default: budolshap)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "budolshap"
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Creating Database" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Build connection string
if ([string]::IsNullOrWhiteSpace($dbPassword)) {
    $connectionString = "postgresql://${dbUser}@${dbHost}:${dbPort}/${dbName}"
} else {
    $connectionString = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}"
}

# Try to create the database
Write-Host "Attempting to create database '$dbName'..." -ForegroundColor Yellow

if (![string]::IsNullOrWhiteSpace($dbPassword)) {
    $env:PGPASSWORD = $dbPassword
}

try {
    # Check if database exists
    $checkQuery = "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
    $dbExists = psql -U $dbUser -h $dbHost -p $dbPort -d postgres -t -c $checkQuery 2>&1
    
    if ($dbExists -match "1") {
        Write-Host "Database '$dbName' already exists" -ForegroundColor Green
    } else {
        # Create database
        $createQuery = "CREATE DATABASE $dbName;"
        psql -U $dbUser -h $dbHost -p $dbPort -d postgres -c $createQuery 2>&1
        Write-Host "Database '$dbName' created successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to create database: $_" -ForegroundColor Red
    Write-Host "You may need to create it manually using pgAdmin or psql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Environment Configuration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Add this to your .env file:" -ForegroundColor Yellow
Write-Host ""
Write-Host "DATABASE_URL=`"$connectionString`"" -ForegroundColor Green
Write-Host ""

# Ask if user wants to update .env file
$updateEnv = Read-Host "Do you want to update .env file automatically? (y/n)"
if ($updateEnv -eq "y" -or $updateEnv -eq "Y") {
    $envPath = ".env"
    
    if (Test-Path $envPath) {
        # Read existing .env
        $envContent = Get-Content $envPath -Raw
        
        # Check if DATABASE_URL exists
        if ($envContent -match "DATABASE_URL=") {
            # Replace existing DATABASE_URL
            $envContent = $envContent -replace 'DATABASE_URL="[^"]*"', "DATABASE_URL=`"$connectionString`""
            $envContent = $envContent -replace "DATABASE_URL='[^']*'", "DATABASE_URL=`"$connectionString`""
            $envContent = $envContent -replace 'DATABASE_URL=[^\r\n]*', "DATABASE_URL=`"$connectionString`""
        } else {
            # Add DATABASE_URL
            $envContent += "`r`nDATABASE_URL=`"$connectionString`"`r`n"
        }
        
        # Write back to .env
        Set-Content -Path $envPath -Value $envContent -NoNewline
        Write-Host ".env file updated successfully" -ForegroundColor Green
    } else {
        # Create new .env file
        Set-Content -Path $envPath -Value "DATABASE_URL=`"$connectionString`"`r`n"
        Write-Host ".env file created successfully" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verify .env file contains DATABASE_URL" -ForegroundColor Yellow
Write-Host "2. Run: npx prisma migrate dev --name init" -ForegroundColor Yellow
Write-Host "3. Run: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
