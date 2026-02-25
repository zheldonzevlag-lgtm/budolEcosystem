# PostgreSQL Database Backup Script for Budolshap
# This script creates both SQL dumps and JSON data backups

param(
    [string]$BackupType = "both" # Options: sql, json, both
)

Write-Host "Budolshap Database Backup Utility" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env file
function Load-EnvFile {
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                # Remove quotes if present
                if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
        Write-Host "Environment variables loaded from .env" -ForegroundColor Green
    }
    else {
        Write-Host ".env file not found" -ForegroundColor Yellow
    }
}

# Create backup directory
function Create-BackupDirectory {
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupsRoot = Join-Path (Get-Location) "backups"
    $backupDir = Join-Path $backupsRoot $timestamp
    
    if (-not (Test-Path $backupsRoot)) {
        New-Item -ItemType Directory -Path $backupsRoot | Out-Null
    }
    
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
    Write-Host ""
    
    return $backupDir
}

# Parse PostgreSQL connection string
function Parse-PostgresUrl {
    param([string]$url)
    
    # Remove postgres:// or postgresql:// prefix
    $url = $url -replace '^postgres(ql)?://', ''
    
    # Parse: user:password@host:port/database
    if ($url -match '^([^:]+):([^@]+)@([^:]+):(\d+)/([^\?]+)') {
        return @{
            User     = $matches[1]
            Password = $matches[2]
            Host     = $matches[3]
            Port     = $matches[4]
            Database = $matches[5]
        }
    }
    
    return $null
}

# Backup using pg_dump (SQL format)
function Backup-PostgresSQL {
    param(
        [string]$backupDir,
        [hashtable]$dbConfig
    )
    
    Write-Host "Creating SQL dump backup..." -ForegroundColor Cyan
    
    $sqlFile = Join-Path $backupDir "database-backup.sql"
    $customFile = Join-Path $backupDir "database-backup.dump"
    
    # Set password environment variable for pg_dump
    $env:PGPASSWORD = $dbConfig.Password
    
    try {
        # Create plain SQL dump
        Write-Host "  Creating plain SQL dump..." -ForegroundColor Gray
        $pgDumpArgs = @(
            "-h", $dbConfig.Host,
            "-p", $dbConfig.Port,
            "-U", $dbConfig.User,
            "-d", $dbConfig.Database,
            "-f", $sqlFile,
            "--no-owner",
            "--no-acl",
            "--clean",
            "--if-exists"
        )
        
        $process = Start-Process -FilePath "pg_dump" -ArgumentList $pgDumpArgs -NoNewWindow -Wait -PassThru
        
        if ($process.ExitCode -eq 0) {
            $size = (Get-Item $sqlFile).Length / 1KB
            Write-Host "  SQL dump created: $([math]::Round($size, 2)) KB" -ForegroundColor Green
        }
        else {
            Write-Host "  SQL dump failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        }
        
        # Create custom format dump (compressed, for pg_restore)
        Write-Host "  Creating custom format dump..." -ForegroundColor Gray
        $pgDumpCustomArgs = @(
            "-h", $dbConfig.Host,
            "-p", $dbConfig.Port,
            "-U", $dbConfig.User,
            "-d", $dbConfig.Database,
            "-f", $customFile,
            "-F", "c",
            "--no-owner",
            "--no-acl"
        )
        
        $process = Start-Process -FilePath "pg_dump" -ArgumentList $pgDumpCustomArgs -NoNewWindow -Wait -PassThru
        
        if ($process.ExitCode -eq 0) {
            $size = (Get-Item $customFile).Length / 1KB
            Write-Host "  Custom dump created: $([math]::Round($size, 2)) KB" -ForegroundColor Green
        }
        else {
            Write-Host "  Custom dump failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        }
        
    }
    catch {
        Write-Host "  Error during SQL backup: $_" -ForegroundColor Red
        Write-Host "  Make sure PostgreSQL client tools (pg_dump) are installed" -ForegroundColor Yellow
        Write-Host "  Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    }
    finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Backup using Prisma (JSON format)
function Backup-PostgresJSON {
    param([string]$backupDir)
    
    Write-Host ""
    Write-Host "Creating JSON data backup..." -ForegroundColor Cyan
    
    try {
        # Run the existing Node.js backup script
        $originalBackupDir = Join-Path (Get-Location) "backups"
        
        node scripts/backup-database.js
        
        # Find the most recent backup directory
        $latestBackup = Get-ChildItem $originalBackupDir -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        if ($latestBackup) {
            # Copy JSON files to our backup directory
            $jsonDir = Join-Path $backupDir "json-data"
            New-Item -ItemType Directory -Path $jsonDir | Out-Null
            
            Copy-Item -Path "$($latestBackup.FullName)\*" -Destination $jsonDir -Recurse
            
            # Remove the temporary backup directory
            Remove-Item -Path $latestBackup.FullName -Recurse -Force
            
            Write-Host "  JSON backup completed" -ForegroundColor Green
        }
        
    }
    catch {
        Write-Host "  Error during JSON backup: $_" -ForegroundColor Red
    }
}

# Create backup summary
function Create-BackupSummary {
    param(
        [string]$backupDir,
        [hashtable]$dbConfig
    )
    
    $summary = @"
# Budolshap Database Backup Summary

**Backup Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Database:** $($dbConfig.Database)
**Host:** $($dbConfig.Host):$($dbConfig.Port)

## Backup Contents

"@
    
    $files = Get-ChildItem $backupDir -Recurse -File
    foreach ($file in $files) {
        $size = [math]::Round($file.Length / 1KB, 2)
        $relativePath = $file.FullName.Replace($backupDir, "").TrimStart("\")
        $summary += "- **$relativePath** - $size KB`n"
    }
    
    $summary += @"

## Restore Instructions

### Restore from SQL Dump
``````powershell
# Using plain SQL dump
psql -h HOST -p PORT -U USER -d DATABASE -f database-backup.sql

# Using custom dump
pg_restore -h HOST -p PORT -U USER -d DATABASE -F c database-backup.dump
``````

### Restore from JSON Data
``````powershell
npm run db:restore
``````

## Notes
- Always test backups in a non-production environment first
- Ensure you have the correct PostgreSQL version compatibility
- Keep backups in a secure location
- Consider encrypting sensitive backup data
"@
    
    $summaryFile = Join-Path $backupDir "README.md"
    $summary | Out-File -FilePath $summaryFile -Encoding UTF8
    
    Write-Host ""
    Write-Host "Backup summary created: README.md" -ForegroundColor Green
}

# Main execution
try {
    Load-EnvFile
    
    # Get database URL from environment
    $dbUrl = $env:POSTGRES_URL
    if (-not $dbUrl) {
        $dbUrl = $env:DATABASE_URL
    }
    
    if (-not $dbUrl) {
        Write-Host "Database URL not found in environment variables" -ForegroundColor Red
        Write-Host "Please ensure POSTGRES_URL or DATABASE_URL is set in .env" -ForegroundColor Yellow
        exit 1
    }
    
    # Parse database configuration
    $dbConfig = Parse-PostgresUrl $dbUrl
    if (-not $dbConfig) {
        Write-Host "Failed to parse database URL" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Database: $($dbConfig.Database)" -ForegroundColor Cyan
    Write-Host "Host: $($dbConfig.Host):$($dbConfig.Port)" -ForegroundColor Cyan
    Write-Host ""
    
    # Create backup directory
    $backupDir = Create-BackupDirectory
    
    # Perform backups based on type
    if ($BackupType -eq "sql" -or $BackupType -eq "both") {
        Backup-PostgresSQL -backupDir $backupDir -dbConfig $dbConfig
    }
    
    if ($BackupType -eq "json" -or $BackupType -eq "both") {
        Backup-PostgresJSON -backupDir $backupDir
    }
    
    # Create summary
    Create-BackupSummary -backupDir $backupDir -dbConfig $dbConfig
    
    Write-Host ""
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "Backup location: $backupDir" -ForegroundColor Cyan
    Write-Host ""
    
}
catch {
    Write-Host ""
    Write-Host "Backup failed: $_" -ForegroundColor Red
    exit 1
}
