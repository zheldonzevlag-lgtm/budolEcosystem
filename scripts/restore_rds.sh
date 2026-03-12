#!/bin/bash
sudo dnf remove -y postgresql15
sudo dnf install -y postgresql17
mkdir -p /home/ec2-user/backups
aws s3 cp s3://budol-restore-staging-v14/ /home/ec2-user/backups/ --recursive
export PGPASSWORD='r00tPassword2026!'
HOST='budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com'

echo "Restoring Accounting..."
pg_restore -h $HOST -U budolpostgres -d budolaccounting /home/ec2-user/backups/budolaccounting.backup --no-owner --no-acl

echo "Restoring ID..."
pg_restore -h $HOST -U budolpostgres -d budolid /home/ec2-user/backups/budolid.backup --no-owner --no-acl

echo "Restoring Pay..."
pg_restore -h $HOST -U budolpostgres -d budolpay /home/ec2-user/backups/budolpay.backup --no-owner --no-acl

echo "Restoring Shap..."
pg_restore -h $HOST -U budolpostgres -d budolshap /home/ec2-user/backups/budolshap_1db.backup --no-owner --no-acl

echo "Restoration Complete."
