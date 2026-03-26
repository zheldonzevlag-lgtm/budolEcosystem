# Restore Script for AWS RDS (v22 Mirror)
# This script restores the local budolshap_1db schemas directly to production RDS.

$RDS_HOST = "budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com"
$RDS_USER = "budolpostgres"
$PG_BIN = "D:\PostgreSQL\18\bin" # As provided in screenshot
$BACKUP_FILE = "d:\IT Projects\clone\budolEcosystem\backup-db\db-2026-03-24\budolshap_full.bak"

Write-Host "--- Step 1: Initiating Restore to AWS RDS ---" -ForegroundColor Yellow
$env:PGPASSWORD = "r00tPassword2026!"

# Check if file exists
if (!(Test-Path $BACKUP_FILE)) {
    Write-Host "[ERROR] Backup file not found: $BACKUP_FILE" -ForegroundColor Red
    exit 1
}

# Run pg_restore
& "$PG_BIN\pg_restore.exe" --host $RDS_HOST --port 5432 --username $RDS_USER --dbname budolshap_1db --verbose --no-owner --no-privileges --clean $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Data Restoration Complete!" -ForegroundColor Green
    Write-Host "Please refresh https://budolshap-010-zeta.vercel.app to verify products." -ForegroundColor Cyan
} else {
    Write-Host "[!] Restoration Finished with some warnings/errors. Please check details." -ForegroundColor Yellow
}
