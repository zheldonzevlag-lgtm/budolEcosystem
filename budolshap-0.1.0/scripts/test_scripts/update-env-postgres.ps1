# Quick PostgreSQL Environment Setup
# Updates .env with PostgreSQL connection string

$dbUser = "postgres"
$dbPassword = "r00t"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "budolshap_db"

# Build connection string
$connectionString = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Environment Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $dbName" -ForegroundColor Yellow
Write-Host "Connection: $connectionString" -ForegroundColor Green
Write-Host ""

# Update .env file
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
        Write-Host "Updated existing DATABASE_URL in .env" -ForegroundColor Green
    } else {
        # Add DATABASE_URL
        $envContent += "`r`nDATABASE_URL=`"$connectionString`"`r`n"
        Write-Host "Added DATABASE_URL to .env" -ForegroundColor Green
    }
    
    # Write back to .env
    Set-Content -Path $envPath -Value $envContent -NoNewline
    Write-Host ".env file updated successfully!" -ForegroundColor Green
} else {
    # Create new .env file
    Set-Content -Path $envPath -Value "DATABASE_URL=`"$connectionString`"`r`n"
    Write-Host ".env file created successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Verifying Database Connection" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Set password for psql
$env:PGPASSWORD = $dbPassword

# Check if database exists
Write-Host "Checking if database '$dbName' exists..." -ForegroundColor Yellow
try {
    $checkQuery = "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
    $dbExists = psql -U $dbUser -h $dbHost -p $dbPort -d postgres -t -c $checkQuery 2>&1
    
    if ($dbExists -match "1") {
        Write-Host "Database '$dbName' exists!" -ForegroundColor Green
    } else {
        Write-Host "Database '$dbName' does not exist. Creating it..." -ForegroundColor Yellow
        $createQuery = "CREATE DATABASE $dbName;"
        psql -U $dbUser -h $dbHost -p $dbPort -d postgres -c $createQuery 2>&1
        Write-Host "Database '$dbName' created successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not verify database. Error: $_" -ForegroundColor Red
    Write-Host "You may need to create the database manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run migrations: npx prisma migrate dev --name init" -ForegroundColor Yellow
Write-Host "2. Start dev server: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
