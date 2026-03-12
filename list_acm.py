import boto3
import json

client = boto3.client('acm', region_name='ap-southeast-1')
paginator = client.get_paginator('list_certificates')
certs = []
for page in paginator.paginate():
    for cert in page.get('CertificateSummaryList', []):
        certs.append(cert)

print(json.dumps(certs, indent=2))
