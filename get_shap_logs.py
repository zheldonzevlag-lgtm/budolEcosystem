import boto3
import json
import sys

def get_logs(log_group, stream_name):
    client = boto3.client('logs', region_name='ap-southeast-1')
    try:
        response = client.get_log_events(
            logGroupName=log_group,
            logStreamName=stream_name,
            limit=1000,
            startFromHead=True
        )
        for event in response['events']:
            print(f"{event['timestamp']}: {event['message']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    get_logs('/ecs/budol-shap', 'ecs/budol-shap/9b0eb69da0b747e7ba7bf05942d6d34a')
