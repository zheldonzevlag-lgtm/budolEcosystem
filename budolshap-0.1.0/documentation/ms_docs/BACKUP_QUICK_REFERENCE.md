# Budolshap Database Backup - Quick Reference

## 📦 What Was Created

### 1. PowerShell Backup Script
**Location:** `scripts/backup-postgres.ps1`

This script automates database backups with support for:
- **SQL Dumps** - Using PostgreSQL's `pg_dump` utility
- **JSON Exports** - Using Prisma to export data as JSON files
- **Automatic Directory Management** - Creates timestamped backup folders
- **Environment Variable Loading** - Reads database credentials from `.env`

### 2. HTML Backup Guide
**Location:** `DATABASE_BACKUP_GUIDE.html`

A comprehensive, beautifully designed guide covering:
- Backup methods comparison
- Step-by-step instructions
- Restore procedures
- Automation setup
- Best practices
- Troubleshooting

## 🚀 Quick Start

### Run a Full Backup (SQL + JSON)
```powershell
.\scripts\backup-postgres.ps1
```

### Run SQL Backup Only
```powershell
.\scripts\backup-postgres.ps1 -BackupType sql
```

### Run JSON Backup Only
```powershell
.\scripts\backup-postgres.ps1 -BackupType json
```

### Using npm Scripts
```powershell
# JSON backup only
npm run db:backup
```

## 📁 Backup Structure

After running a backup, you'll find:

```
backups/
└── 2025-11-24_16-15-36/
    ├── database-backup.sql      # Plain SQL dump
    ├── database-backup.dump     # Compressed custom format
    ├── json-data/               # JSON exports
    │   ├── users.json
    │   ├── stores.json
    │   ├── products.json
    │   ├── orders.json
    │   ├── addresses.json
    │   ├── ratings.json
    │   ├── carts.json
    │   ├── wallets.json
    │   ├── coupons.json
    │   ├── chats.json
    │   ├── returns.json
    │   ├── payout-requests.json
    │   └── metadata.json
    └── README.md                # Backup summary
```

## 🔄 Restore Instructions

### From SQL Dump
```powershell
# Set password
$env:PGPASSWORD = "your_password"

# Restore from plain SQL
psql -h host -p 5432 -U user -d database -f database-backup.sql

# OR restore from custom dump
pg_restore -h host -p 5432 -U user -d database -F c database-backup.dump

# Clear password
Remove-Item Env:\PGPASSWORD
```

### From JSON Backup
```powershell
npm run db:restore
```

## ⚙️ Prerequisites

### For SQL Backups
- PostgreSQL client tools (`pg_dump`, `pg_restore`)
- Download from: https://www.postgresql.org/download/windows/

### For JSON Backups
- Node.js
- Prisma (already installed in your project)

### Environment Variables
Ensure your `.env` file contains:
```env
POSTGRES_URL="postgres://user:password@host:5432/database"
# or
DATABASE_URL="postgres://user:password@host:5432/database"
```

## ⏰ Automation

### Windows Task Scheduler
1. Open Task Scheduler (`Win + R` → `taskschd.msc`)
2. Create Basic Task: "Budolshap Database Backup"
3. Set trigger: Daily at 2:00 AM
4. Set action:
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\wamp64\www\budolshap\scripts\backup-postgres.ps1"`
   - Start in: `C:\wamp64\www\budolshap`

### PowerShell Scheduled Job
```powershell
$trigger = New-JobTrigger -Daily -At "2:00 AM"
$scriptPath = "C:\wamp64\www\budolshap\scripts\backup-postgres.ps1"

Register-ScheduledJob -Name "BudolshapBackup" `
    -Trigger $trigger `
    -FilePath $scriptPath `
    -MaxResultCount 10
```

## ✅ Best Practices

1. **Frequency**
   - Production: Daily automated backups
   - Before deployments: Always backup
   - Before migrations: Mandatory backup

2. **Storage**
   - Keep multiple backup versions
   - Store backups off-site (cloud storage)
   - Implement retention policy (7 daily, 4 weekly, 12 monthly)

3. **Security**
   - Never commit backups to version control
   - Encrypt sensitive backup data
   - Store backups in secure locations

4. **Testing**
   - Regularly test restore procedures
   - Verify backup integrity
   - Practice disaster recovery scenarios

## 🔧 Troubleshooting

### pg_dump not found
```powershell
# Add PostgreSQL to PATH temporarily
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### Connection refused
- Verify database is running
- Check connection string in `.env`
- For Vercel Postgres, check IP whitelist

### Authentication failed
- Verify username and password in `.env`
- Check for special characters in password
- Ensure database user has necessary permissions

### Out of memory
```powershell
# Increase Node.js memory for JSON backups
node --max-old-space-size=4096 scripts/backup-database.js
```

## 📚 Additional Resources

- **HTML Guide:** Open `DATABASE_BACKUP_GUIDE.html` in your browser for the complete guide
- **pg_dump Documentation:** https://www.postgresql.org/docs/current/app-pgdump.html
- **Prisma Documentation:** https://www.prisma.io/docs
- **Vercel Postgres:** https://vercel.com/docs/storage/vercel-postgres

## 📝 Notes

- The PowerShell script automatically detects your database configuration from `.env`
- Both SQL and JSON backups are created by default
- Each backup includes a README.md with restore instructions
- Backups are timestamped for easy identification
- The JSON backup includes metadata about record counts

---

**Last Updated:** November 24, 2025
**Version:** 1.0
