#!/bin/bash
export PGPASSWORD="r00tPassword2026!"
HOST="budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com"
USER="budolpostgres"

echo "=== CLEANING UP TEMP ==="
rm -rf /tmp/db-restore
mkdir -p /tmp/db-restore

echo "=== DOWNLOADING FROM S3 ==="
aws s3 cp s3://budol-ecosystem-backups/db-backup/2026-03-20/ /tmp/db-restore/ --recursive --region ap-southeast-1

echo "=== CREATING DATABASES ==="
psql -h $HOST -U $USER -d postgres -c "CREATE DATABASE budolAccounting;"
psql -h $HOST -U $USER -d postgres -c "CREATE DATABASE budolID;"
psql -h $HOST -U $USER -d postgres -c "CREATE DATABASE budolpay;"
psql -h $HOST -U $USER -d postgres -c "CREATE DATABASE budolshap_1db;"

echo "=== RESTORING budolAccounting ==="
psql -h $HOST -U $USER -d budolAccounting < /tmp/db-restore/budolAccounting.sql
echo "=== RESTORING budolID ==="
psql -h $HOST -U $USER -d budolID < /tmp/db-restore/budolID.sql
echo "=== RESTORING budolpay ==="
psql -h $HOST -U $USER -d budolpay < /tmp/db-restore/budolpay.sql
echo "=== RESTORING budolshap_1db ==="
psql -h $HOST -U $USER -d budolshap_1db < /tmp/db-restore/budolshap_1db.sql
