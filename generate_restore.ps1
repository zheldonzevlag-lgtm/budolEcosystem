$env:AWS_PAGER=""
$u1 = aws s3 presign s3://budol-ecosystem-backups/budol_restore.sql --expires-in 3600 --region ap-southeast-1
$u2 = aws s3 presign s3://budol-ecosystem-backups/budolaccounting.sql --expires-in 3600 --region ap-southeast-1
$u3 = aws s3 presign s3://budol-ecosystem-backups/budolid.sql --expires-in 3600 --region ap-southeast-1
$u4 = aws s3 presign s3://budol-ecosystem-backups/budolpay.sql --expires-in 3600 --region ap-southeast-1

$json = @"
{
  `"family`": `"db-restore`",
  `"executionRoleArn`": `"arn:aws:iam::194442925745:role/BudolECSExecutionRole`",
  `"networkMode`": `"awsvpc`",
  `"containerDefinitions`": [
    {
      `"name`": `"restore`",
      `"image`": `"postgres:15-alpine`",
      `"essential`": true,
      `"command`": [
        `"sh`", `"-c`", `"wget -O /tmp/budol_restore.sql '$u1' && wget -O /tmp/budolaccounting.sql '$u2' && wget -O /tmp/budolid.sql '$u3' && wget -O /tmp/budolpay.sql '$u4' && export PGPASSWORD='r00tPassword2026!' && psql -h budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com -U budolpostgres -d postgres -c 'CREATE DATABASE budolshap_1db;' ; psql -h budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com -U budolpostgres -d postgres -c 'CREATE DATABASE budolaccounting;' ; psql -h budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com -U budolpostgres -d postgres -c 'CREATE DATABASE budolid;' ; psql -h budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com -U budolpostgres -d postgres -c 'CREATE DATABASE budolpay;' ; psql -h budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com -U budolpostgres -d budolshap_1db -f /tmp/budol_restore.sql && psql -h budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com -U budolpostgres -d budolaccounting -f /tmp/budolaccounting.sql && psql -h budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com -U budolpostgres -d budolid -f /tmp/budolid.sql && psql -h budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com -U budolpostgres -d budolpay -f /tmp/budolpay.sql`"
      ],
      `"logConfiguration`": {
        `"logDriver`": `"awslogs`",
        `"options`": {
          `"awslogs-group`": `"/ecs/db-restore`",
          `"awslogs-region`": `"ap-southeast-1`",
          `"awslogs-stream-prefix`": `"ecs`"
        }
      }
    }
  ],
  `"requiresCompatibilities`": [`"FARGATE`"],
  `"cpu`": `"256`",
  `"memory`": `"512`"
}
"@

Set-Content -Path "d:\IT Projects\clone\budolEcosystem\db-restore.json" -Value $json
aws ecs register-task-definition --cli-input-json file://db-restore.json --region ap-southeast-1 | Out-Null
aws ecs run-task --cluster budol-ecosystem-cluster --task-definition db-restore --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-0dff713a9f3776f78,subnet-09034f591a2e8ef12],securityGroups=[sg-0ce5df1ba5bd90a2c],assignPublicIp=ENABLED}" --region ap-southeast-1 --query "tasks[0].taskArn" --output text | Out-File "task_final_run.txt"
