import boto3

ec2 = boto3.client('ec2', region_name='ap-southeast-1')
res = ec2.describe_instances()

for r in res.get('Reservations', []):
    for i in r.get('Instances', []):
        state = i['State']['Name']
        ip = i.get('PrivateIpAddress')
        tags = {t['Key']: t['Value'] for t in i.get('Tags', [])}
        name = tags.get('Name', 'NoName')
        print(f"ID: {i['InstanceId']} | State: {state} | IP: {ip} | Name: {name}")
