import boto3
import sys

logs = boto3.client('logs', region_name='ap-southeast-1')
response = logs.get_log_events(
    logGroupName='/ecs/budol-shap',
    logStreamName='ecs/budol-shap/d4aca2637a6442b28ac72d877dc858f4',
    startFromHead=False,
    limit=500
)

for event in response['events']:
    msg = event['message']
    if 'OTP' in msg or '=========' in msg or 'Code' in msg or 'Validity' in msg or 'To: ' in msg:
        print(f"[{event['timestamp']}] {msg}")
