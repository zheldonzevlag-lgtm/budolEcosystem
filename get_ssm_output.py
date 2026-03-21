import boto3
import sys

try:
    with open('ssm_id2.txt', encoding='utf-16-le') as f:
        cmd_id = f.read().strip().replace('\ufeff', '')
    
    ssm = boto3.client('ssm', region_name='ap-southeast-1')
    response = ssm.get_command_invocation(
        CommandId=cmd_id,
        InstanceId='i-0335b8c303baaaee0'
    )
    print("STATUS:", response['Status'])
    print("OUTPUT:\n", response.get('StandardOutputContent', ''))
    print("ERROR:\n", response.get('StandardErrorContent', ''))
except Exception as e:
    print("Failed:", e)
