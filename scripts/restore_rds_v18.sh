#!/bin/bash
# Master Restore Script for V18
export PGPASSWORD='r00tPassword2026!'
HOST='budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com'
BACKUP_DIR='/tmp/restore'

echo "Creating Databases..."
psql -h $HOST -U budolpostgres -c "CREATE DATABASE budolid;" || true
psql -h $HOST -U budolpostgres -c "CREATE DATABASE budolpay;" || true
psql -h $HOST -U budolpostgres -c "CREATE DATABASE budolaccounting;" || true

echo "Restoring ID..."
psql -h $HOST -U budolpostgres -d budolid -f $BACKUP_DIR/budolID.sql

echo "Restoring Pay..."
psql -h $HOST -U budolpostgres -d budolpay -f $BACKUP_DIR/budolpay.sql

echo "Restoring Accounting..."
psql -h $HOST -U budolpostgres -d budolaccounting -f $BACKUP_DIR/budolAccounting.sql

echo "Restoring Shap..."
psql -h $HOST -U budolpostgres -d budolshap_1db -f $BACKUP_DIR/budolshap_1db.sql

echo "Restore Complete."
